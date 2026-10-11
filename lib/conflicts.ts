import type { SupabaseClient } from "@supabase/supabase-js";
import { parseFrequencyInterval, parseNumericLimit } from "@/lib/normalize";
import type {
  AssetMatch,
  ChangeContext,
  Citation,
  RequirementCtx,
  RetrievedChunk,
} from "@/lib/retrieve";
import { loadChangeContext, resolveAsset, retrieveForChange } from "@/lib/retrieve";

export type ConflictType =
  | "sop_parameter_mismatch"
  | "alarm_setpoint_mismatch"
  | "cadence_mismatch"
  | "historical_excursion";

export interface ConflictFinding {
  change_id: string;
  asset_id: string | null;
  control_id: string | null;
  document_id: string | null;
  conflict_type: ConflictType;
  summary: string;
  permit_value: string | null;
  control_value: string | null;
  unit: string | null;
  citation: Citation;
  confidence: number;
}

interface ControlRow {
  id: string;
  asset_id: string | null;
  control_type: string;
  name: string;
  value: string | null;
  unit: string | null;
  frequency: string | null;
  source_document_id: string | null;
}

export interface ImpactResolution {
  changeId: string;
  match: AssetMatch;
  chunks: RetrievedChunk[];
  findings: ConflictFinding[];
}

const NUMERIC_CONTROL_TYPES = new Set(["sop_parameter", "dcs_alarm"]);
const CADENCE_CONTROL_TYPES = new Set([
  "sop_parameter",
  "inspection",
  "monitoring",
  "reporting",
  "calculation",
]);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function nameKeywords(name: string): string[] {
  return (
    name.match(/\b[A-Z]{1,6}-\d{1,3}\b|\bNOx\b|\bSO2\b|\bVOC\b|\bH2S\b|\bNHV\b|\bCO\b|\bOpacity\b/gi) ?? []
  );
}

function sentenceContaining(text: string, needle: string): string | null {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.;])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const found = sentences.find((s) => s.toLowerCase().includes(needle.toLowerCase()));
  return found ? found.slice(0, 500) : null;
}

/**
 * Citation contract ("No evidence, no claim"): a control-level conflict is only
 * emitted when a retrieved chunk from an authoritative document is found that
 * contains both the control value/frequency and a control-name keyword.
 */
function citationForControl(
  control: ControlRow,
  needle: string,
  chunks: RetrievedChunk[]
): Citation | null {
  const keywords = nameKeywords(control.name);
  const sourcePool = control.source_document_id
    ? chunks.filter((c) => c.document_id === control.source_document_id)
    : [];
  // Evidence priority: control's source document → SOPs → everything else,
  // preserving similarity order within each tier.
  const ordered = [
    ...sourcePool,
    ...chunks.filter(
      (c) =>
        !sourcePool.includes(c) && c.metadata?.doc_type === "sop"
    ),
    ...chunks.filter(
      (c) =>
        !sourcePool.includes(c) && c.metadata?.doc_type !== "sop"
    ),
  ];
  const needleLc = needle.toLowerCase();
  for (const chunk of ordered) {
    const textLc = chunk.text.toLowerCase();
    if (!textLc.includes(needleLc)) continue;
    const hasKeyword = keywords.some((k) => textLc.includes(k.toLowerCase()));
    if (!hasKeyword) continue;
    const quote = sentenceContaining(chunk.text, needle);
    if (!quote) continue;
    return {
      document_id: chunk.document_id,
      document_title: chunk.document_title,
      page_or_section: chunk.page_or_section ?? "",
      quote,
    };
  }
  return null;
}

function unitMatches(controlUnit: string | null, permitUnit: string | null): boolean {
  if (!controlUnit || !permitUnit) return controlUnit === permitUnit;
  return controlUnit.trim().toLowerCase() === permitUnit.trim().toLowerCase();
}

export function detectNumericControlConflicts(
  ctx: ChangeContext,
  match: AssetMatch,
  controls: ControlRow[],
  chunks: RetrievedChunk[]
): ConflictFinding[] {
  const asset = match.asset;
  const req = ctx.new;
  if (!asset || !req || req.limit_value === null || !req.unit) return [];
  const newLimit = Number(req.limit_value);
  const permitUnit = req.unit;
  const findings: ConflictFinding[] = [];

  for (const control of controls) {
    if (control.asset_id !== asset.id) continue;
    if (!NUMERIC_CONTROL_TYPES.has(control.control_type)) continue;
    if (!unitMatches(control.unit, permitUnit)) continue;
    const parsed = parseNumericLimit(
      `${control.value ?? ""} ${control.unit ?? ""}`.trim()
    );
    if (!parsed || !Number.isFinite(parsed.value)) continue;
    if (parsed.value <= newLimit + 1e-12) continue;

    const citation = citationForControl(control, control.value ?? "", chunks);
    if (!citation) continue; // no evidence → no claim

    findings.push({
      change_id: ctx.id,
      asset_id: asset.id,
      control_id: control.id,
      document_id: null,
      conflict_type:
        control.control_type === "dcs_alarm"
          ? "alarm_setpoint_mismatch"
          : "sop_parameter_mismatch",
      summary:
        control.control_type === "dcs_alarm"
          ? `${control.name} is set to ${control.value} ${control.unit ?? ""}, above the revised permit limit of ${newLimit} ${permitUnit}.`
          : `${control.name} states ${control.value} ${control.unit ?? ""}, superseded by the revised permit limit of ${newLimit} ${permitUnit}.`,
      permit_value: `${newLimit} ${permitUnit}`,
      control_value: `${control.value}${control.unit ? ` ${control.unit}` : ""}`,
      unit: permitUnit,
      citation,
      confidence: match.tier === "high" ? 0.97 : 0.9,
    });
  }
  return findings;
}

const CADENCE_PHRASES: Array<[RegExp, number | ((m: RegExpMatchArray) => number)]> = [
  [/every\s+(\d+(?:\.\d+)?)\s*-?\s*days?/i, (m) => parseFloat(m[1])],
  [/(\d+(?:\.\d+)?)\s*events?\s*per\s*year/i, (m) => 365 / parseFloat(m[1])],
  [/\bmonthly\b|\bevery month\b/i, 30],
  [/\bweekly\b|\bevery week\b/i, 7],
  [/\bquarterly\b/i, 90],
  [/\bdaily\b/i, 1],
  [/\bannually\b|\bannual\b|\byearly\b/i, 365],
];

export function extractCadenceInterval(
  text: string
): { intervalDays: number; phrase: string } | null {
  for (const [re, days] of CADENCE_PHRASES) {
    const m = text.match(re);
    if (m) {
      const interval = typeof days === "function" ? days(m) : days;
      return { intervalDays: interval, phrase: m[0] };
    }
  }
  return null;
}

function frequencyContext(req: RequirementCtx | null): number | null {
  if (!req?.frequency) return null;
  return parseFrequencyInterval(req.frequency);
}

export function detectCadenceConflicts(
  ctx: ChangeContext,
  match: AssetMatch,
  controls: ControlRow[],
  chunks: RetrievedChunk[]
): ConflictFinding[] {
  const asset = match.asset;
  if (!asset) return [];
  const newInterval = frequencyContext(ctx.new);
  const oldInterval = frequencyContext(ctx.old);
  if (newInterval === null) return [];
  if (oldInterval === null || newInterval >= oldInterval) return [];
  const permitLabel = ctx.new?.frequency ?? `${newInterval}-day interval`;
  const findings: ConflictFinding[] = [];

  // 1) Internal controls whose cadence is less frequent than the permit requires.
  for (const control of controls) {
    if (control.asset_id !== asset.id) continue;
    if (!CADENCE_CONTROL_TYPES.has(control.control_type)) continue;
    const controlInterval = parseFrequencyInterval(control.frequency ?? control.value ?? "");
    if (controlInterval === null) continue;
    if (controlInterval <= newInterval + 1e-9) continue;

    const needle = control.frequency ?? control.value ?? "";
    const citation = citationForControl(control, needle, chunks);
    if (!citation) continue;

    findings.push({
      change_id: ctx.id,
      asset_id: asset.id,
      control_id: control.id,
      document_id: null,
      conflict_type: "cadence_mismatch",
      summary: `${control.name} runs ${control.frequency ?? control.value} (${Math.round(controlInterval)}-day interval), less frequent than the permit requirement of ${permitLabel} (${newInterval}-day interval).`,
      permit_value: `${permitLabel} (${newInterval}-day interval)`,
      control_value: `${control.frequency ?? control.value} (${Math.round(controlInterval)}-day interval)`,
      unit: "days",
      citation,
      confidence: 0.95,
    });
  }

  // 2) Scheduled documents (compliance calendars) still using the old cadence.
  for (const chunk of chunks) {
    if (chunk.metadata?.doc_type !== "calendar") continue;
    const cadence = extractCadenceInterval(chunk.text);
    if (!cadence) continue;
    if (cadence.intervalDays <= newInterval + 1e-9) continue;

    findings.push({
      change_id: ctx.id,
      asset_id: asset.id,
      control_id: null,
      document_id: chunk.document_id,
      conflict_type: "cadence_mismatch",
      summary: `${chunk.document_title} schedules "${cadence.phrase}" (${Math.round(cadence.intervalDays)}-day interval), less frequent than the permit requirement of ${permitLabel} (${newInterval}-day interval).`,
      permit_value: `${permitLabel} (${newInterval}-day interval)`,
      control_value: `${cadence.phrase} (${Math.round(cadence.intervalDays)}-day interval)`,
      unit: "days",
      citation: {
        document_id: chunk.document_id,
        document_title: chunk.document_title,
        page_or_section: chunk.page_or_section ?? "",
        quote: sentenceContaining(chunk.text, cadence.phrase) ?? chunk.text.slice(0, 300),
      },
      confidence: 0.94,
    });
  }

  return findings;
}

const NEGATIVE_CONTEXT_RE =
  /\bbelow\b|\bbaseline\b|\bpermit limit\b|\bsuperseded\b|\bold limit\b|\bproposed limit\b/i;
const POSITIVE_CONTEXT_RE = /\bpeak\b|\babove\b|\bexcursion\b/i;

export function detectHistoricalExcursions(
  ctx: ChangeContext,
  match: AssetMatch,
  chunks: RetrievedChunk[]
): ConflictFinding[] {
  const asset = match.asset;
  const req = ctx.new;
  if (!asset || !req || req.limit_value === null || !req.unit) return [];
  const newLimit = Number(req.limit_value);
  const unit = req.unit;
  const unitLc = unit.toLowerCase();
  const adjacentUnitRe = new RegExp(`(\\d+\\.\\d+)\\s*${escapeRegExp(unit)}`, "gi");
  const bareDecimalRe = /\b(\d+\.\d+)\b/g;

  interface DocAccum {
    chunkHits: Map<string, { chunk: RetrievedChunk; values: number[]; sentences: string[] }>;
  }
  const byDoc = new Map<string, DocAccum>();

  for (const chunk of chunks) {
    if (chunk.metadata?.doc_type !== "historical_monitoring") continue;
    const sentences = chunk.text
      .replace(/\s+/g, " ")
      .split(/(?<=[.;])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const sentence of sentences) {
      const negative = NEGATIVE_CONTEXT_RE.test(sentence);
      if (negative && !POSITIVE_CONTEXT_RE.test(sentence)) continue;
      const values: number[] = [];
      for (const m of sentence.matchAll(adjacentUnitRe)) {
        values.push(parseFloat(m[1]));
      }
      if (sentence.toLowerCase().includes(unitLc)) {
        for (const m of sentence.matchAll(bareDecimalRe)) {
          values.push(parseFloat(m[1]));
        }
      }
      const above = [
        ...new Set(values.filter((v) => Number.isFinite(v) && v > newLimit + 1e-12)),
      ];
      if (above.length === 0) continue;
      const acc = byDoc.get(chunk.document_id) ?? { chunkHits: new Map() };
      const hit = acc.chunkHits.get(chunk.id) ?? { chunk, values: [], sentences: [] };
      hit.values.push(...above);
      if (!hit.sentences.includes(sentence)) hit.sentences.push(sentence);
      acc.chunkHits.set(chunk.id, hit);
      byDoc.set(chunk.document_id, acc);
    }
  }

  const findings: ConflictFinding[] = [];
  for (const acc of byDoc.values()) {
    const hits = [...acc.chunkHits.values()];
    if (hits.length === 0) continue;
    // Primary chunk = the one contributing the most exceedances (deterministic).
    hits.sort((a, b) => b.values.length - a.values.length);
    const primary = hits[0];
    const allValues = hits.flatMap((h) => h.values);
    const allSentences = hits
      .flatMap((h) => h.sentences.map((s) => ({ s, max: Math.max(...h.values) })))
      .sort((a, b) => b.max - a.max)
      .map((x) => x.s);
    const highest = Math.max(...allValues);
    const docTitle = primary.chunk.document_title;
    findings.push({
      change_id: ctx.id,
      asset_id: asset.id,
      control_id: null,
      document_id: primary.chunk.document_id,
      conflict_type: "historical_excursion",
      summary: `${docTitle}: ${allValues.length} recorded value(s) exceed the revised ${newLimit} ${unit} limit (highest ${highest} ${unit}).`,
      permit_value: `${newLimit} ${unit}`,
      control_value: [...new Set(allValues)].sort((a, b) => b - a).join(", "),
      unit,
      citation: {
        document_id: primary.chunk.document_id,
        document_title: docTitle,
        page_or_section: primary.chunk.page_or_section ?? "",
        quote: allSentences.join(" ").slice(0, 700),
      },
      confidence: 0.93,
    });
  }
  return findings;
}

/**
 * Full pipeline for one change: hierarchical asset resolution → metadata-filtered
 * retrieval → deterministic conflict detection → citation enforcement.
 */
export async function resolveFacilityImpact(
  supabase: SupabaseClient,
  changeId: string
): Promise<ImpactResolution | null> {
  const ctx = await loadChangeContext(supabase, changeId);
  if (!ctx) return null;

  const match = await resolveAsset(supabase, ctx);
  const chunks = match.asset ? await retrieveForChange(supabase, ctx, match) : [];

  const { data: controlRows } = await supabase
    .from("pi_controls")
    .select("id, asset_id, control_type, name, value, unit, frequency, source_document_id")
    .eq("asset_id", match.asset?.id ?? "__none__");
  const controls = (controlRows ?? []) as unknown as ControlRow[];

  const findings = [
    ...detectNumericControlConflicts(ctx, match, controls, chunks),
    ...detectCadenceConflicts(ctx, match, controls, chunks),
    ...detectHistoricalExcursions(ctx, match, chunks),
  ];

  return { changeId, match, chunks, findings };
}

/** Idempotent persistence: replace this change's conflict rows with fresh findings. */
export async function persistConflicts(
  supabase: SupabaseClient,
  changeId: string,
  findings: ConflictFinding[]
): Promise<void> {
  await supabase.from("pi_conflicts").delete().eq("change_id", changeId);
  if (findings.length === 0) return;
  const rows = findings.map((f) => ({
    change_id: changeId,
    asset_id: f.asset_id,
    control_id: f.control_id,
    document_id: f.document_id,
    conflict_type: f.conflict_type,
    summary: f.summary,
    permit_value: f.permit_value,
    control_value: f.control_value,
    unit: f.unit,
    citation: f.citation,
    confidence: Math.max(0, Math.min(1, f.confidence)),
  }));
  const { error } = await supabase.from("pi_conflicts").insert(rows);
  if (error) throw new Error(`Failed to persist conflicts for ${changeId}: ${error.message}`);
}
