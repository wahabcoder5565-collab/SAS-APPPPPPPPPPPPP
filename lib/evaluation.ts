import type { SupabaseClient } from "@supabase/supabase-js";

export interface EvalKpi {
  key: string;
  label: string;
  value: number;
  unit: string;
  target: number;
  pass: boolean;
  detail: string;
  compared: {
    expected: number;
    found: number;
    mismatches: string[];
  };
}

export interface EvalReport {
  generatedAt: string;
  scorecard: EvalKpi[];
  overallPass: boolean;
}

function slugify(s: unknown): string {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function pct(num: number, den: number): number {
  return den === 0 ? 0 : Math.round((num / den) * 1000) / 10;
}

function first<T>(v: unknown): T | null {
  if (v == null) return null;
  return (Array.isArray(v) ? v[0] : v) as T | null;
}

interface GtRow {
  kpi: string;
  item_key: string;
  expected: Record<string, unknown>;
}

interface ChangeRow {
  summary: string;
  old_value: string | null;
  new_value: string | null;
  severity: string | null;
  ai_reasoning: string | null;
}

interface MappingRow {
  summary: string;
  asset_code: string;
}

interface ConflictRow {
  summary: string;
  asset_code: string;
  conflict_type: string;
}

function normalizeMappings(raw: unknown): MappingRow[] {
  return ((raw as Array<{ change?: unknown; asset?: unknown }>) ?? []).map((m) => ({
    summary: (first<{ summary: string | null }>(m.change)?.summary) ?? "",
    asset_code: (first<{ asset_code: string | null }>(m.asset)?.asset_code) ?? "",
  }));
}

function normalizeConflicts(raw: unknown): ConflictRow[] {
  return ((raw as Array<{ change?: unknown; asset?: unknown; conflict_type?: string | null }>) ?? []).map((c) => ({
    summary: (first<{ summary: string | null }>(c.change)?.summary) ?? "",
    asset_code: (first<{ asset_code: string | null }>(c.asset)?.asset_code) ?? "",
    conflict_type: c.conflict_type ?? "",
  }));
}

export async function runEvaluation(sb: SupabaseClient): Promise<EvalReport> {
  const { data: gtData } = await sb
    .from("pi_eval_ground_truth")
    .select("kpi, item_key, expected")
    .in("kpi", [
      "extraction_recall",
      "delta_accuracy",
      "mapping_precision",
      "conflict_recall",
      "unsupported_claim",
    ]);
  const gt = (gtData ?? []) as unknown as GtRow[];
  const byKpi = (kpi: string) => gt.filter((g) => g.kpi === kpi);

  const [changesRes, mappingsRes, conflictsRes] = await Promise.all([
    sb.from("pi_permit_changes").select("summary, old_value, new_value, severity, ai_reasoning"),
    sb
      .from("pi_impact_mappings")
      .select("change:pi_permit_changes!change_id(summary), asset:pi_facility_assets!asset_id(asset_code)"),
    sb
      .from("pi_conflicts")
      .select("change:pi_permit_changes!change_id(summary), asset:pi_facility_assets!asset_id(asset_code), conflict_type"),
  ]);

  const changes = changesRes.data as unknown as ChangeRow[] | null;
  const mappings = normalizeMappings(mappingsRes.data);
  const conflicts = normalizeConflicts(conflictsRes.data);

  const changeBySlug = new Map<string, ChangeRow>();
  for (const c of changes ?? []) changeBySlug.set(slugify(c.summary), c);

  const scorecard: EvalKpi[] = [];

  // 1) Requirement extraction recall (target >= 90%)
  {
    const ext = byKpi("extraction_recall");
    const expectedSlugs = ((ext[0]?.expected?.summaries as { s: string }[]) ?? []).map((e) => slugify(e.s));
    const producedSlugs = new Set<string>(changes?.map((c) => slugify(c.summary)) ?? []);
    const matched = expectedSlugs.filter((s) => producedSlugs.has(s)).length;
    const missing = expectedSlugs.filter((s) => !producedSlugs.has(s));
    scorecard.push({
      key: "extraction_recall",
      label: "Requirement Extraction Recall",
      value: pct(matched, expectedSlugs.length),
      unit: "%",
      target: 90,
      pass: matched / expectedSlugs.length >= 0.9,
      detail: `${matched} of ${expectedSlugs.length} caused clauses extracted from the revised permit comparison`,
      compared: { expected: expectedSlugs.length, found: producedSlugs.size, mismatches: missing },
    });
  }

  // 2) Numeric delta accuracy (target 100%)
  {
    const deltas = byKpi("delta_accuracy");
    const mismatches: string[] = [];
    let ok = 0;
    for (const d of deltas) {
      const exp = d.expected;
      const found = changeBySlug.get(slugify(exp.summary));
      if (!found) {
        mismatches.push(`${exp.summary}: change not found`);
        continue;
      }
      if (found.old_value === exp.old_value && found.new_value === exp.new_value) {
        ok += 1;
      } else {
        mismatches.push(
          `${exp.summary}: expected "${exp.old_value}" → "${exp.new_value}", found "${found.old_value}" → "${found.new_value}"`
        );
      }
    }
    scorecard.push({
      key: "delta_accuracy",
      label: "Numeric Delta Accuracy",
      value: pct(ok, deltas.length),
      unit: "%",
      target: 100,
      pass: ok === deltas.length,
      detail: `${ok} of ${deltas.length} numeric deltas exact (values + direction)`,
      compared: { expected: deltas.length, found: ok, mismatches },
    });
  }

  // 3) Hero-case asset mapping precision (target 100%)
  {
    const mapGt = byKpi("mapping_precision");
    const expectedPairs = mapGt.map((g) => ({
      change: slugify((g.expected.change_summary as string) ?? g.item_key),
      asset: slugify(g.expected.asset_code as string),
    }));
    const produced = new Set<string>(mappings.map((m) => `${slugify(m.summary)}::${slugify(m.asset_code)}`));
    const missing = expectedPairs.filter((p) => !produced.has(`${p.change}::${p.asset}`));
    const tp = expectedPairs.length - missing.length;
    const fp = produced.size - tp;
    const precision = pct(tp, tp + fp);
    const recall = pct(tp, expectedPairs.length);
    scorecard.push({
      key: "mapping_precision",
      label: "Hero Asset Mapping Precision",
      value: precision,
      unit: "%",
      target: 100,
      pass: precision === 100 && recall === 100,
      detail: `${tp} of ${expectedPairs.length} expected change→asset links precise (recall ${recall}%, ${fp} extra link${fp === 1 ? "" : "s"})`,
      compared: { expected: expectedPairs.length, found: produced.size, mismatches: missing.map((m) => `missing ${m.change}→${m.asset}`) },
    });
  }

  // 4) Seeded conflict detection (target >= 90%)
  {
    const confGt = byKpi("conflict_recall");
    type BucketKey = string;
    const expectedByBucket = new Map<BucketKey, number>();
    for (const g of confGt) {
      const key = `${slugify(g.expected.change_summary)}::${slugify(g.expected.conflict_type as string)}`;
      expectedByBucket.set(key, (expectedByBucket.get(key) ?? 0) + 1);
    }
    const actualByBucket = new Map<BucketKey, number>();
    for (const c of conflicts) {
      const key = `${slugify(c.summary)}::${slugify(c.conflict_type)}`;
      actualByBucket.set(key, (actualByBucket.get(key) ?? 0) + 1);
    }
    let matched = 0;
    const missingDetail: string[] = [];
    for (const [bucket, expCount] of expectedByBucket) {
      const actCount = actualByBucket.get(bucket) ?? 0;
      matched += Math.min(expCount, actCount);
      if (actCount < expCount) missingDetail.push(`bucket ${bucket}: expected ${expCount}, found ${actCount}`);
    }
    const recall = pct(matched, confGt.length);
    scorecard.push({
      key: "conflict_recall",
      label: "Seeded Conflict Detection Recall",
      value: recall,
      unit: "%",
      target: 90,
      pass: recall >= 90,
      detail: `${matched} of ${confGt.length} seeded internal conflicts detected`,
      compared: { expected: confGt.length, found: matched, mismatches: missingDetail },
    });
  }

  // 5) Unsupported claim rate on high-impact items (target 0%)
  {
    const crit = byKpi("unsupported_claim");
    const unsupported: string[] = [];
    for (const c of crit) {
      const tokens = (c.expected.required_tokens as string[]) ?? [];
      const change = changeBySlug.get(slugify(c.expected.summary));
      const claim = change?.ai_reasoning ?? "";
      const onRecord =
        change != null && change.old_value != null && change.new_value != null && claim.length > 0;
      const missingTokens = tokens.filter((t) => !claim.toLowerCase().includes(t.toLowerCase()));
      if (!onRecord || missingTokens.length > 0) {
        unsupported.push(
          `${c.expected.summary}: ${!change ? "change missing" : !onRecord ? "old/new values or reasoning absent on record" : `reasoning missing ${missingTokens.join(", ")}`}`
        );
      }
    }
    const rate = pct(unsupported.length, crit.length);
    scorecard.push({
      key: "unsupported_claim",
      label: "Unsupported Claim Rate (High-Impact)",
      value: rate,
      unit: "%",
      target: 0,
      pass: unsupported.length === 0,
      detail:
        unsupported.length === 0
          ? `all ${crit.length} high-impact claims backed by cited reasoning (no evidence, no claim)`
          : `unsupported claims: ${unsupported.join("; ")}`,
      compared: { expected: crit.length, found: crit.length - unsupported.length, mismatches: unsupported },
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    scorecard,
    overallPass: scorecard.every((k) => k.pass),
  };
}