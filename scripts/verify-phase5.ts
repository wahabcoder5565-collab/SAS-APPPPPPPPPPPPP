/**
 * Phase 5 verification: Facility Impact Resolution & Conflict Detection Engine.
 *
 * Gates (gating = must PASS; failures exit 1):
 *   G1a  Hero asset resolution  → B-07, tier=high, score ≥ 0.98
 *   G1b  Seeded asset mapping   → ≥ 85% of 12 changes resolve to seeded asset
 *   G2a  Filtered retrieval     → top-5 all asset_code=B-07, includes SOP-44
 *        chunk, excludes 3 known distractors
 *   G2b  Relevance              → top similarity ≥ 0.5
 *   G2c  Hierarchy proven       → same query unfiltered surfaces ≥1 non-B-07 doc
 *   G3   Hero conflicts         → sop_parameter_mismatch (0.08) on SOP-44
 *        control + alarm_setpoint_mismatch (0.075) on DCS control; permit
 *        value 0.05 lb/MMBtu on both
 *   G4   Citation enforcement   → every hero finding has a full citation;
 *        SOP citation document=SOP-44 quote contains 0.08; alarm citation
 *        document=SOP-44 quote contains 0.075 (0 unsupported claims)
 *   G5   Historical correlation → CEMS log cited; peaks 0.063/0.074/0.058
 *        recorded; 0.08 baseline NOT flagged; page/section deterministic
 *   G6   CT-4 cadence           → SOP-31 control + inspection-form control +
 *        calendar document flagged; training control absent; all citable
 *   G7   Confidence tiers       → synthetic facility-wide text → low/null;
 *        pollutant+boiler text → medium with ≥1 alternative
 *   G8   Persist idempotency    → persist twice → stable count; rows readable
 *        under RLS with citations intact
 */
import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  loadChangeContext,
  resolveAsset,
  retrieveChunks,
  type ChangeContext,
} from "../lib/retrieve";
import {
  resolveFacilityImpact,
  persistConflicts,
} from "../lib/conflicts";

// ---------- env ----------
function loadEnv(): void {
  for (const file of [".env.local", ".env"]) {
    const p = path.resolve(__dirname, "..", file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / GEMINI_API_KEY in .env.local"
  );
  process.exit(1);
}

const DEMO_EMAIL = "demo.engineer@northriverrefining.com";
const DEMO_PASSWORD = "DemoPassword123!";

// ---------- ground truth ----------
const HERO = {
  change: "b2e1cf32-7efa-4a5b-926b-3682b5c72ed3",
  asset: "2cf8860a-5403-40b8-9882-049251550ac0", // B-07
  sopControl: "5cd8158e-551d-3831-bff9-03424167011b", // SOP-44 param 0.08
  alarmControl: "c6870bc9-c640-3868-26c1-b57f96a0d878", // DCS 0.075
  sopDoc: "311cddd7-7b4c-04a9-a3af-45b814d94241", // SOP-44
  cemsDoc: "b2a8bb75-12ba-2e16-357b-f69900caa7e5", // CEMS log
  distractorDocs: [
    "7b60d0f7-a1f5-48a0-65b8-a652a12f4b6a", // SOP-42 B-02
    "b0e222bb-55d3-4d79-6a26-43ba1e422bc0", // SOP-46 H-11
    "237f90be-b7d4-415e-96e8-4561cf81f7a4", // SOP-30 CT-1
  ],
};

const CT4 = {
  change: "4bdfe34d-0b88-4901-80e3-80951ae54fca",
  asset: "c62bb286-d09a-44d4-8c75-728106378112",
  sop31Control: "80197d5b-ae65-291c-0f48-7a38e09f323b",
  formControl: "d8e711b6-3635-382f-2326-9ff9f52333c4",
  calendarDoc: "7946b728-bbd1-b11e-f050-0bb3b5ee3a40",
  trainingControl: "a97ce9c8-2e06-82bb-a395-9d451f19c25a",
};

const SEEDED_ASSET_PAIRS_NOTE =
  "Ground truth for G1b is read from pi_impact_mappings (seeded asset mappings).";

// ---------- reporting ----------
let failures = 0;
function gate(id: string, name: string, ok: boolean, detail: string): void {
  console.log(`[${ok ? "PASS" : "FAIL"}] ${id} ${name}: ${detail}`);
  if (!ok) failures += 1;
}
function info(msg: string): void {
  console.log(`       ${msg}`);
}

// ---------- helpers ----------
function fakeCtx(id: string, summary: string, pollutant: string | null): ChangeContext {
  return {
    id,
    summary,
    delta_description: "",
    change_type: "modified",
    change_kind: null,
    severity: "moderate",
    old: null,
    new: {
      id: "req-new",
      raw_text: summary,
      parameter: pollutant ?? "summary",
      pollutant,
      limit_value: null,
      unit: null,
      frequency: null,
      section: null,
      page: null,
      citation: null,
    },
  };
}

async function countConflicts(supabase: SupabaseClient, changeId: string): Promise<number> {
  const { count, error } = await supabase
    .from("pi_conflicts")
    .select("id", { count: "exact", head: true })
    .eq("change_id", changeId);
  if (error) throw new Error(`count pi_conflicts: ${error.message}`);
  return count ?? 0;
}

// ---------- main ----------
async function loadSeededPairs(
  supabase: SupabaseClient
): Promise<Array<{ changeId: string; code: string }>> {
  const { data, error } = await supabase
    .from("pi_impact_mappings")
    .select("change_id, asset:pi_facility_assets(asset_code)")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`load mappings: ${error.message}`);
  return (data ?? []).map((row) => {
    const asset = Array.isArray(row.asset) ? row.asset[0] : row.asset;
    return { changeId: row.change_id as string, code: (asset as { asset_code: string }).asset_code };
  });
}

async function main(): Promise<void> {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: loginErr } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  if (loginErr) throw new Error(`login failed: ${loginErr.message}`);

  // --- G1a: hero asset resolution ---
  const heroCtx = await loadChangeContext(supabase, HERO.change);
  if (!heroCtx) throw new Error(`hero change ${HERO.change} not found`);
  const heroMatch = await resolveAsset(supabase, heroCtx);
  gate(
    "G1a",
    "hero asset resolution",
    heroMatch.asset?.id === HERO.asset &&
      heroMatch.tier === "high" &&
      heroMatch.score >= 0.98,
    `${heroMatch.asset?.asset_code ?? "null"} tier=${heroMatch.tier} score=${heroMatch.score} (${heroMatch.rationale})`
  );

  // --- G1b: seeded asset mapping ≥ 85% (ground truth from pi_impact_mappings) ---
  const seededPairs = await loadSeededPairs(supabase);
  if (seededPairs.length < 12) {
    gate("G1b", "seeded asset mapping ≥ 85%", false, `only ${seededPairs.length} seeded mappings found`);
  }
  let correct = 0;
  let altHits = 0;
  const misses: string[] = [];
  for (const { changeId, code } of seededPairs) {
    const ctx = await loadChangeContext(supabase, changeId);
    if (!ctx) {
      misses.push(`${changeId.slice(0, 8)}: change not found`);
      continue;
    }
    const m = await resolveAsset(supabase, ctx);
    if (m.asset?.asset_code === code) {
      correct += 1;
    } else if (m.alternatives.some((a) => a.asset_code === code)) {
      altHits += 1;
      misses.push(`${changeId.slice(0, 8)}: alternatives-only tier=${m.tier}`);
    } else {
      misses.push(
        `${changeId.slice(0, 8)}: want ${code}, got ${m.asset?.asset_code ?? "null"} tier=${m.tier}`
      );
    }
  }
  const rate = correct / seededPairs.length;
  gate(
    "G1b",
    "seeded asset mapping ≥ 85%",
    rate >= 0.85,
    `${correct}/${seededPairs.length} strict (${(rate * 100).toFixed(1)}%), ${altHits} via alternatives; misses: ${misses.join("; ") || "none"}`
  );
  info(SEEDED_ASSET_PAIRS_NOTE);

  // --- G2: hierarchical retrieval ---
  const queryText = [
    heroCtx.summary,
    heroCtx.delta_description,
    heroCtx.new?.pollutant ?? "",
    heroCtx.new?.unit ?? "",
    "Boiler B-07 utility boiler",
  ]
    .filter(Boolean)
    .join(" ");
  const filtered = await retrieveChunks(supabase, queryText, {
    assetCodes: ["B-07"],
    count: 5,
  });
  const unfiltered = await retrieveChunks(supabase, queryText, { count: 5 });

  const allB07 = filtered.every((c) => c.metadata?.asset_code === "B-07");
  const hasSop44 = filtered.some((c) => c.document_id === HERO.sopDoc);
  const hasDistractor = filtered.some((c) =>
    HERO.distractorDocs.includes(c.document_id)
  );
  gate(
    "G2a",
    "filtered retrieval (metadata-first)",
    filtered.length > 0 && allB07 && hasSop44 && !hasDistractor,
    `${filtered.length} chunks, all B-07=${allB07}, SOP-44 included=${hasSop44}, distractor excluded=${!hasDistractor}`
  );

  const topSim = filtered[0]?.similarity ?? 0;
  gate("G2b", "relevance (top similarity ≥ 0.5)", topSim >= 0.5, `top=${topSim.toFixed(4)}`);

  const unfilteredForeign = unfiltered.filter((c) => c.metadata?.asset_code !== "B-07");
  gate(
    "G2c",
    "hierarchy proven (unfiltered surfaces distractors)",
    unfilteredForeign.length >= 1,
    `${unfilteredForeign.length}/${unfiltered.length} non-B-07 in unfiltered top-${unfiltered.length}: ${unfilteredForeign
      .map((c) => `${c.metadata?.asset_code}/${(c.document_title ?? "").slice(0, 24)}`)
      .join(", ") || "none"}`
  );
  info(
    `unfiltered order: ${unfiltered
      .map((c) => `${c.metadata?.asset_code}:${(c.similarity ?? 0).toFixed(3)}`)
      .join(", ")}`
  );

  // --- Hero resolution + persist (G3, G4, G5, G8) ---
  const heroRes = await resolveFacilityImpact(supabase, HERO.change);
  if (!heroRes) throw new Error(`resolveFacilityImpact returned null for hero change ${HERO.change}`);
  const heroFindings = heroRes.findings;

  const sopFinding = heroFindings.find(
    (f) => f.conflict_type === "sop_parameter_mismatch" && f.control_id === HERO.sopControl
  );
  const alarmFinding = heroFindings.find(
    (f) => f.conflict_type === "alarm_setpoint_mismatch" && f.control_id === HERO.alarmControl
  );
  const sopOk =
    Boolean(sopFinding) &&
    (sopFinding?.control_value ?? "").includes("0.08") &&
    (sopFinding?.permit_value ?? "").includes("0.05");
  const alarmOk =
    Boolean(alarmFinding) &&
    (alarmFinding?.control_value ?? "").includes("0.075") &&
    (alarmFinding?.permit_value ?? "").includes("0.05");
  gate(
    "G3",
    "hero conflicts (SOP + DCS alarm)",
    sopOk && alarmOk,
    `sop=${sopFinding ? `${sopFinding.control_value} vs ${sopFinding.permit_value}` : "MISSING"}, alarm=${alarmFinding ? `${alarmFinding.control_value} vs ${alarmFinding.permit_value}` : "MISSING"}`
  );

  // --- G4: citation contract ---
  const missingCitation = heroFindings.filter(
    (f) =>
      !f.citation ||
      !f.citation.document_id ||
      !f.citation.document_title ||
      !f.citation.page_or_section ||
      !f.citation.quote
  );
  const sopCiteOk =
    sopFinding &&
    sopFinding.citation?.document_id === HERO.sopDoc &&
    sopFinding.citation.quote.includes("0.08");
  const alarmCiteOk =
    alarmFinding &&
    alarmFinding.citation?.document_id === HERO.sopDoc &&
    alarmFinding.citation.quote.includes("0.075");
  gate(
    "G4",
    "citation contract (no evidence, no claim)",
    missingCitation.length === 0 && Boolean(sopCiteOk) && Boolean(alarmCiteOk),
    `${heroFindings.length} findings, ${missingCitation.length} missing citations, sopCite=${sopCiteOk}, alarmCite=${alarmCiteOk}`
  );
  if (sopFinding) info(`SOP quote: "${sopFinding.citation?.quote}" (${sopFinding.citation?.page_or_section})`);
  if (alarmFinding) info(`Alarm quote: "${alarmFinding.citation?.quote}" (${alarmFinding.citation?.page_or_section})`);

  // --- G5: historical correlation ---
  const hist = heroFindings.filter((f) => f.conflict_type === "historical_excursion");
  const cems = hist.find((f) => f.document_id === HERO.cemsDoc);
  const values = cems?.control_value ?? "";
  const peaksOk = ["0.063", "0.074", "0.058"].every((v) => values.includes(v));
  const baselineNotFlagged = !values.includes("0.08");
  const pageOk =
    cems?.citation?.page_or_section === "Log excursions" ||
    cems?.citation?.page_or_section === "Log summary";
  const quoteHasPeak = Boolean(cems?.citation?.quote.includes("0.074"));
  gate(
    "G5",
    "historical monitoring correlation",
    Boolean(cems) && peaksOk && baselineNotFlagged && pageOk && quoteHasPeak,
    `found=${Boolean(cems)}, peaks=${peaksOk}, baseline-excluded=${baselineNotFlagged}, page="${cems?.citation?.page_or_section ?? "-"}", quotePeak=${quoteHasPeak}`
  );
  if (cems) info(`values="${values}"`);

  // --- G6: CT-4 cadence conflicts ---
  const ct4Res = await resolveFacilityImpact(supabase, CT4.change);
  if (!ct4Res) throw new Error(`resolveFacilityImpact returned null for CT-4 change ${CT4.change}`);
  const ct4Cadence = ct4Res.findings.filter((f) => f.conflict_type === "cadence_mismatch");
  const hasSop31 = ct4Cadence.some((f) => f.control_id === CT4.sop31Control);
  const hasForm = ct4Cadence.some((f) => f.control_id === CT4.formControl);
  const hasCalendar = ct4Cadence.some((f) => f.document_id === CT4.calendarDoc);
  const trainingFlagged = ct4Cadence.some((f) => f.control_id === CT4.trainingControl);
  const ct4Citable = ct4Cadence.every(
    (f) => f.citation?.document_id && f.citation.quote.length > 0
  );
  gate(
    "G6",
    "CT-4 cadence conflicts (training excluded)",
    hasSop31 && hasForm && hasCalendar && !trainingFlagged && ct4Citable,
    `sop31=${hasSop31}, form=${hasForm}, calendar=${hasCalendar}, trainingFlagged=${trainingFlagged}, citable=${ct4Citable}, total=${ct4Cadence.length}`
  );
  for (const f of ct4Cadence) {
    info(`cadence: ${f.summary} | cite=${f.citation?.page_or_section ?? "NONE"}`);
  }

  // --- G7: confidence tiers ---
  const lowMatch = await resolveAsset(
    supabase,
    fakeCtx(
      "synth-low",
      "Facility-wide recordkeeping language updated for administrative clarity",
      null
    )
  );
  const medMatch = await resolveAsset(
    supabase,
    fakeCtx(
      "synth-med",
      "Revised NOx emission limit applies to the utility boiler units",
      "NOx"
    )
  );
  gate(
    "G7",
    "confidence tiers (low → null, medium → alternatives)",
    lowMatch.tier === "low" &&
      !lowMatch.asset &&
      medMatch.tier === "medium" &&
      !medMatch.asset &&
      medMatch.alternatives.length >= 1,
    `low: tier=${lowMatch.tier} asset=${lowMatch.asset?.asset_code ?? "null"}; medium: tier=${medMatch.tier} alts=${medMatch.alternatives.map((a) => a.asset_code).join("|") || "none"}`
  );

  // --- G8: persistence idempotency + RLS readability ---
  await persistConflicts(supabase, HERO.change, heroFindings);
  const c1 = await countConflicts(supabase, HERO.change);
  await persistConflicts(supabase, HERO.change, heroFindings);
  const c2 = await countConflicts(supabase, HERO.change);
  const { data: rows, error: readErr } = await supabase
    .from("pi_conflicts")
    .select("conflict_type, citation, confidence")
    .eq("change_id", HERO.change);
  const rowsOk = !readErr && (rows?.length ?? 0) === heroFindings.length;
  const citableRows =
    rows?.every((r) => r.citation && r.citation.document_id) ?? false;
  await persistConflicts(supabase, CT4.change, ct4Res.findings);
  const ct4Count = await countConflicts(supabase, CT4.change);
  gate(
    "G8",
    "persist idempotency + RLS",
    c1 === c2 && c1 === heroFindings.length && rowsOk && citableRows && ct4Count === ct4Res.findings.length,
    `hero: persist1=${c1}, persist2=${c2}, engine=${heroFindings.length}, citable=${citableRows}; ct4: rows=${ct4Count}, engine=${ct4Res.findings.length}`
  );

  console.log(
    `\nPhase 5 verification: ${failures === 0 ? "ALL GATES PASS" : `${failures} GATE(S) FAILED`}`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("verify:phase5 crashed:", err);
  process.exit(1);
});
