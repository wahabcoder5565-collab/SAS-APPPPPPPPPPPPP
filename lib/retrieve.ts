import type { SupabaseClient } from "@supabase/supabase-js";
import { getEmbedding } from "@/lib/gemini";

export type ConfidenceTier = "high" | "medium" | "low";

export interface Citation {
  document_id: string;
  document_title: string;
  page_or_section: string;
  quote: string;
}

export interface AssetRecord {
  id: string;
  asset_code: string;
  name: string;
  area: string;
  asset_type: string;
  tags: string[];
}

export interface AssetMatch {
  asset: AssetRecord | null;
  tier: ConfidenceTier;
  score: number;
  rationale: string;
  alternatives: AssetRecord[];
}

export interface RetrievedChunk {
  id: string;
  document_id: string;
  text: string;
  page_or_section: string | null;
  metadata: Record<string, unknown>;
  document_title: string;
  similarity: number;
}

export interface RequirementCtx {
  id: string;
  raw_text: string | null;
  parameter: string | null;
  pollutant: string | null;
  limit_value: number | null;
  unit: string | null;
  frequency: string | null;
  section: string | null;
  page: number | null;
  citation: string | null;
}

export interface ChangeContext {
  id: string;
  summary: string;
  delta_description: string;
  change_type: string;
  change_kind: string | null;
  severity: string;
  old: RequirementCtx | null;
  new: RequirementCtx | null;
}

const REQUIREMENT_COLUMNS =
  "id, raw_text, parameter, pollutant, limit_value, unit, frequency, section, page, citation";

export async function loadChangeContext(
  supabase: SupabaseClient,
  changeId: string
): Promise<ChangeContext | null> {
  const { data: change, error } = await supabase
    .from("pi_permit_changes")
    .select(
      `id, summary, delta_description, change_type, change_kind, severity,
       old:pi_permit_requirements!old_requirement_id (${REQUIREMENT_COLUMNS}),
       new:pi_permit_requirements!new_requirement_id (${REQUIREMENT_COLUMNS})`
    )
    .eq("id", changeId)
    .maybeSingle();
  if (error || !change) return null;
  return change as unknown as ChangeContext;
}

export async function loadAllAssets(supabase: SupabaseClient): Promise<AssetRecord[]> {
  const { data, error } = await supabase
    .from("pi_facility_assets")
    .select("id, asset_code, name, area, asset_type, tags")
    .order("asset_code");
  if (error || !data) return [];
  return data as unknown as AssetRecord[];
}

export function changeSearchText(ctx: ChangeContext): string {
  return [
    ctx.summary,
    ctx.delta_description,
    ctx.new?.raw_text ?? "",
    ctx.old?.raw_text ?? "",
  ]
    .filter(Boolean)
    .join(" \n ");
}

const ASSET_TAG_RE = /\b([A-Z]{1,6}-\d{1,3})\b/g;

const EQUIPMENT_KEYWORDS: Array<[RegExp, string]> = [
  [/\bboilers?\b/i, "boiler"],
  [/\bcooling towers?\b|\bct-?\d\b/i, "cooling tower"],
  [/\bflares?\b/i, "flare"],
  [/\bstorage tanks?\b|\btanks?\b/i, "tank"],
  [/\bcompressors?\b/i, "compressor"],
  [/\bhydrotreaters?\b/i, "hydrotreater"],
  [/\bcracking unit\b|\bfccu\b/i, "cracker"],
  [/\bdistillation\b|\bcdU?\b/i, "distillation"],
  [/\brecinerators?\b|\boxidizers?\b/i, "oxidizer"],
];

/**
 * Hierarchical asset resolution with explicit confidence tiers:
 *   high   — direct asset tag found in the change text (e.g. "B-07")
 *   medium — equipment-type and/or pollutant contextual match, no explicit tag
 *   low    — facility-wide / ambiguous; no authoritative mapping created
 */
export async function resolveAsset(
  supabase: SupabaseClient,
  ctx: ChangeContext
): Promise<AssetMatch> {
  const assets = await loadAllAssets(supabase);
  const text = changeSearchText(ctx);

  // Tier 1 (high): explicit asset code in the clause/change text.
  const codeSet = new Map(assets.map((a) => [a.asset_code.toUpperCase(), a]));
  const tags = text.match(ASSET_TAG_RE) ?? [];
  for (const raw of tags) {
    const hit = codeSet.get(raw.toUpperCase());
    if (hit) {
      return {
        asset: hit,
        tier: "high",
        score: 0.98,
        rationale: `Asset tag ${hit.asset_code} is explicitly referenced in the change text.`,
        alternatives: [],
      };
    }
  }

  // Tier 2 (medium): equipment type and/or pollutant contextual match.
  const lower = text.toLowerCase();
  const pollutant = ctx.new?.pollutant ?? ctx.old?.pollutant ?? null;
  const typeSignals = EQUIPMENT_KEYWORDS.filter(([re]) => re.test(lower)).map(
    ([, keyword]) => keyword
  );

  const typeCandidates =
    typeSignals.length > 0
      ? assets.filter((a) =>
          typeSignals.some(
            (k) =>
              a.asset_type.toLowerCase().includes(k) || a.name.toLowerCase().includes(k)
          )
        )
      : [];

  let pollutantCandidates: AssetRecord[] = [];
  if (pollutant) {
    const { data: controls } = await supabase
      .from("pi_controls")
      .select("asset_id, name")
      .ilike("name", `%${pollutant}%`);
    const ids = new Set((controls ?? []).map((c) => c.asset_id as string));
    pollutantCandidates = assets.filter((a) => ids.has(a.id));
  }

  const signals: string[] = [];
  if (pollutant && pollutantCandidates.length > 0) signals.push(`pollutant ${pollutant}`);
  if (typeSignals.length > 0) signals.push(`equipment type (${typeSignals.join(", ")})`);

  let candidates: AssetRecord[] = [];
  if (typeCandidates.length > 0 && pollutantCandidates.length > 0) {
    const both = typeCandidates.filter((t) =>
      pollutantCandidates.some((p) => p.id === t.id)
    );
    candidates = both.length > 0 ? both : typeCandidates;
  } else if (typeCandidates.length > 0) {
    candidates = typeCandidates;
  } else {
    candidates = pollutantCandidates;
  }

  if (candidates.length > 0) {
    const primary = candidates.length === 1 ? candidates[0] : null;
    return {
      asset: primary,
      tier: "medium",
      score: primary ? 0.78 : 0.65,
      rationale: primary
        ? `No explicit asset tag; contextual match on ${signals.join(" + ")} → ${primary.asset_code}.`
        : `No explicit asset tag; contextual match on ${signals.join(" + ")} yields ${candidates.length} candidates — reviewer must choose.`,
      alternatives: candidates,
    };
  }

  // Tier 3 (low): facility-wide / unresolved — never an authoritative mapping.
  return {
    asset: null,
    tier: "low",
    score: 0.3,
    rationale:
      "No explicit asset tag and no equipment/pollutant signal — facility-wide provision requiring reviewer resolution.",
    alternatives: [],
  };
}

export interface RetrieveOptions {
  assetCodes?: string[];
  pollutants?: string[];
  count?: number;
}

/**
 * Hierarchical retrieval: metadata filters (asset_code / pollutant / distractor)
 * are applied in SQL before vector ranking, so semantically similar SOPs from
 * other units (SOP-42/B-02, SOP-46/H-11, SOP-30/CT-1) are excluded before
 * similarity can surface them.
 */
export async function retrieveChunks(
  supabase: SupabaseClient,
  queryText: string,
  opts: RetrieveOptions = {}
): Promise<RetrievedChunk[]> {
  const embedding = await getEmbedding(queryText);
  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: JSON.stringify(embedding),
    match_count: opts.count ?? 8,
    filter_asset_codes: opts.assetCodes?.length ? opts.assetCodes : null,
    filter_pollutants: opts.pollutants?.length ? opts.pollutants : null,
    exclude_distractors: false,
  });
  if (error || !data) return [];
  return (data as unknown as RetrievedChunk[]) ?? [];
}

export async function retrieveForChange(
  supabase: SupabaseClient,
  ctx: ChangeContext,
  match: AssetMatch
): Promise<RetrievedChunk[]> {
  const queryText = [
    ctx.summary,
    ctx.delta_description,
    ctx.new?.pollutant ?? ctx.new?.parameter ?? "",
    match.asset ? `${match.asset.asset_code} ${match.asset.name}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return retrieveChunks(supabase, queryText, {
    assetCodes: match.asset ? [match.asset.asset_code] : undefined,
    count: 12,
  });
}
