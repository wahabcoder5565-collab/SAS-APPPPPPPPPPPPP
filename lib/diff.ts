import {
  DETERMINISTIC_KINDS,
  type DiffChange,
  type NormalizedClause,
} from "./schemas";
import { normalizeClause, type RequirementRowInput } from "./normalize";

export interface ClausePair {
  key: string;
  old: NormalizedClause | null;
  new: NormalizedClause | null;
  change: DiffChange;
}

export interface DiffResult {
  pairs: ClausePair[];
  changes: DiffChange[];
}

export function isDeterministicKind(kind: string): boolean {
  return DETERMINISTIC_KINDS.has(kind);
}

const DURATION_UNITS = /^(years?|months?|weeks?|days?)$/i;

const ENGINE_REASONING =
  "Computed by the deterministic diff engine from structured permit requirement fields; no language model involved in numeric or cadence arithmetic.";

const TEXT_REASONING =
  "Classified by deterministic text comparison of the two clause versions; the Gemini classifier may refine severity and summary when this change is persisted.";

function normWs(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function keyParam(c: NormalizedClause): string {
  return c.parameter || c.pollutant || c.raw_text.slice(0, 40);
}

function pairKey(c: NormalizedClause): string {
  const section = (c.section ?? "GENERAL").toUpperCase();
  const param = normWs(keyParam(c))
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
  return `${section}|${c.category}|${param}`;
}

function fmtNum(n: number): string {
  return String(n);
}

function unitSuffix(unit?: string | null): string {
  return unit ? ` ${unit}` : "";
}

function firstLabel(c: NormalizedClause): string {
  return c.parameter || c.pollutant || normWs(c.raw_text).slice(0, 60);
}

function unitsCompatible(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return true;
  return a.toLowerCase() === b.toLowerCase();
}

function clauseDisplay(c: NormalizedClause): string | null {
  if (c.limit_value !== null) return `${fmtNum(c.limit_value)}${unitSuffix(c.unit)}`;
  return c.frequency;
}

function pushGroup(
  map: Map<string, NormalizedClause[]>,
  key: string,
  clause: NormalizedClause,
): void {
  const arr = map.get(key);
  if (arr) arr.push(clause);
  else map.set(key, [clause]);
}

export function pairClauses(
  oldClauses: NormalizedClause[],
  newClauses: NormalizedClause[],
): Array<{ key: string; old: NormalizedClause | null; new: NormalizedClause | null }> {
  const sorter = (a: NormalizedClause, b: NormalizedClause) =>
    (a.page ?? 0) - (b.page ?? 0) || a.raw_text.localeCompare(b.raw_text);
  const oldGroups = new Map<string, NormalizedClause[]>();
  const newGroups = new Map<string, NormalizedClause[]>();
  for (const c of oldClauses) pushGroup(oldGroups, pairKey(c), c);
  for (const c of newClauses) pushGroup(newGroups, pairKey(c), c);

  const keys = [...new Set([...oldGroups.keys(), ...newGroups.keys()])].sort();
  const out: Array<{
    key: string;
    old: NormalizedClause | null;
    new: NormalizedClause | null;
  }> = [];
  for (const key of keys) {
    const o = (oldGroups.get(key) ?? []).slice().sort(sorter);
    const n = (newGroups.get(key) ?? []).slice().sort(sorter);
    const len = Math.max(o.length, n.length);
    for (let i = 0; i < len; i++) {
      out.push({ key, old: o[i] ?? null, new: n[i] ?? null });
    }
  }
  return out;
}

function unchangedChange(o: NormalizedClause, n: NormalizedClause): DiffChange {
  return {
    change_type: "unchanged",
    change_kind: "unchanged",
    severity: "low",
    old_requirement_id: o.id,
    new_requirement_id: n.id,
    summary: `No change: ${firstLabel(o)}`,
    delta_description:
      "No difference detected by deterministic comparison of raw text, limits, cadence, averaging, and applicability.",
    old_value: clauseDisplay(o),
    new_value: clauseDisplay(n),
    delta_pct: null,
    confidence: 1,
    ai_reasoning:
      "Deterministic equality check across raw text, limit values, cadence, averaging class, and applicability.",
  };
}

function addedChange(n: NormalizedClause): DiffChange {
  return {
    change_type: "new",
    change_kind: "new",
    severity: "moderate",
    old_requirement_id: null,
    new_requirement_id: n.id,
    summary: `New requirement: ${firstLabel(n)}`,
    delta_description: `New clause present only in the revised permit: "${normWs(n.raw_text).slice(0, 200)}"`,
    old_value: null,
    new_value: clauseDisplay(n),
    delta_pct: null,
    confidence: 0.9,
    ai_reasoning: TEXT_REASONING,
  };
}

function removedChange(o: NormalizedClause): DiffChange {
  return {
    change_type: "removed",
    change_kind: "removed",
    severity: "low",
    old_requirement_id: o.id,
    new_requirement_id: null,
    summary: `Requirement removed: ${firstLabel(o)}`,
    delta_description: `Clause present only in the baseline permit: "${normWs(o.raw_text).slice(0, 200)}"`,
    old_value: clauseDisplay(o),
    new_value: null,
    delta_pct: null,
    confidence: 0.9,
    ai_reasoning: TEXT_REASONING,
  };
}

function numericChange(
  o: NormalizedClause,
  n: NormalizedClause,
  pct: number | null,
): DiffChange {
  const increased = (n.limit_value as number) > (o.limit_value as number);
  const tightened = o.is_minimum ? increased : !increased;
  const pctText =
    pct === null ? "" : ` (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%)`;
  return {
    change_type: "modified",
    change_kind: "numeric_limit",
    severity:
      pct === null
        ? "moderate"
        : Math.abs(pct) > 25
          ? "critical"
          : Math.abs(pct) >= 5
            ? "moderate"
            : "low",
    old_requirement_id: o.id,
    new_requirement_id: n.id,
    summary: `${firstLabel(o)} limit ${tightened ? "tightened" : "relaxed"} from ${fmtNum(o.limit_value as number)}${unitSuffix(o.unit)} to ${fmtNum(n.limit_value as number)}${unitSuffix(n.unit)}`,
    delta_description: `Deterministic numeric delta: ${fmtNum(o.limit_value as number)}${unitSuffix(o.unit)} -> ${fmtNum(n.limit_value as number)}${unitSuffix(n.unit)}${pctText}${o.is_minimum ? " — minimum-type limit, so an increase is a tightening" : ""}.`,
    old_value: `${fmtNum(o.limit_value as number)}${unitSuffix(o.unit)}`,
    new_value: `${fmtNum(n.limit_value as number)}${unitSuffix(n.unit)}`,
    delta_pct: pct,
    confidence: 0.99,
    ai_reasoning: ENGINE_REASONING,
  };
}

function cadenceChange(
  o: NormalizedClause,
  n: NormalizedClause,
  pct: number,
): DiffChange {
  const shortened = (n.interval_days as number) < (o.interval_days as number);
  const label = `${o.frequency ?? "?"} -> ${n.frequency ?? "?"}`;
  if (o.category === "recordkeeping") {
    return {
      change_type: "modified",
      change_kind: "record_retention",
      severity: "low",
      old_requirement_id: o.id,
      new_requirement_id: n.id,
      summary: `Record retention changed from ${o.frequency} to ${n.frequency}`,
      delta_description: `Deterministic duration delta: retention ${label} — ${o.interval_days} days -> ${n.interval_days} days.`,
      old_value: o.frequency,
      new_value: n.frequency,
      delta_pct: pct,
      confidence: 0.99,
      ai_reasoning: ENGINE_REASONING,
    };
  }
  const severity =
    o.category === "monitoring"
      ? Math.abs(pct) >= 65
        ? "critical"
        : Math.abs(pct) >= 10
          ? "moderate"
          : "low"
      : "low";
  return {
    change_type: "modified",
    change_kind: "frequency",
    severity,
    old_requirement_id: o.id,
    new_requirement_id: n.id,
    summary: `${firstLabel(o)} frequency changed from ${o.frequency} to ${n.frequency}`,
    delta_description: `Deterministic cadence delta: ${label} — interval ${o.interval_days}d -> ${n.interval_days}d (${Math.abs(pct).toFixed(1)}% ${shortened ? "shorter (more frequent)" : "longer (less frequent)"}).`,
    old_value: o.frequency,
    new_value: n.frequency,
    delta_pct: pct,
    confidence: 0.99,
    ai_reasoning: ENGINE_REASONING,
  };
}

function textChange(
  o: NormalizedClause,
  n: NormalizedClause,
): DiffChange {
  const hay = `${o.raw_text} ${n.raw_text} ${o.parameter ?? ""} ${n.parameter ?? ""}`;
  const oldDisp = o.frequency ?? normWs(o.raw_text).slice(0, 100);
  const newDisp = n.frequency ?? normWs(n.raw_text).slice(0, 100);
  const shared = {
    change_type: "modified" as const,
    old_requirement_id: o.id,
    new_requirement_id: n.id,
    old_value: o.frequency ?? normWs(o.raw_text).slice(0, 100),
    new_value: n.frequency ?? normWs(n.raw_text).slice(0, 100),
    delta_pct: null,
    confidence: 0.9,
    ai_reasoning: TEXT_REASONING,
    delta_description: `Non-numeric clause change detected by deterministic text comparison. Baseline: "${normWs(o.raw_text).slice(0, 160)}" Revised: "${normWs(n.raw_text).slice(0, 160)}"`,
  };
  if (/responsible official|certif|signature|signed\b/i.test(hay)) {
    return {
      ...shared,
      change_kind: "administrative",
      severity: "administrative",
      summary:
        oldDisp !== newDisp
          ? `${firstLabel(o)} changed from ${oldDisp} to ${newDisp}`
          : `${firstLabel(o)} certification wording changed`,
    };
  }
  if (/due date|deadline|no later than|due on/i.test(hay)) {
    return {
      ...shared,
      change_kind: "reporting",
      severity: "administrative",
      summary:
        oldDisp !== newDisp
          ? `${firstLabel(o)} moved from ${oldDisp} to ${newDisp}`
          : `${firstLabel(o)} deadline wording changed`,
    };
  }
  if (/\bmethod\b|PS-\d|reference method|test procedure|\bCOMS\b/i.test(hay)) {
    return {
      ...shared,
      change_kind: "method",
      severity: "low",
      summary:
        oldDisp !== newDisp
          ? `${firstLabel(o)} method changed from ${oldDisp} to ${newDisp}`
          : `${firstLabel(o)} determination method changed`,
    };
  }
  if (o.category === "reporting") {
    return {
      ...shared,
      change_kind: "reporting",
      severity: "low",
      summary: `${firstLabel(o)} reporting clause wording changed`,
    };
  }
  return {
    ...shared,
    change_kind: "applicability",
    severity: "moderate",
    summary: `${firstLabel(o)} applicability wording changed`,
  };
}

export function comparePair(
  o: NormalizedClause | null,
  n: NormalizedClause | null,
): DiffChange {
  if (o && !n) return removedChange(o);
  if (!o && n) return addedChange(n);
  if (!o || !n) {
    throw new Error("comparePair received no clauses on either side");
  }

  const rawOld = normWs(o.raw_text);
  const rawNew = normWs(n.raw_text);
  const sameRaw = rawOld === rawNew;
  const sameLimit = (o.limit_value ?? null) === (n.limit_value ?? null);
  const sameFreq = (o.frequency ?? "") === (n.frequency ?? "");
  const sameAvg = (o.averaging_class ?? "") === (n.averaging_class ?? "");
  const sameApp = (o.applicability ?? "") === (n.applicability ?? "");
  if (sameRaw && sameLimit && sameFreq && sameAvg && sameApp) {
    return unchangedChange(o, n);
  }

  const durationLimited =
    DURATION_UNITS.test(o.unit ?? "") || DURATION_UNITS.test(n.unit ?? "");
  if (
    o.limit_value !== null &&
    n.limit_value !== null &&
    o.limit_value !== n.limit_value &&
    unitsCompatible(o.unit, n.unit) &&
    !durationLimited
  ) {
    const pct =
      o.limit_value === 0
        ? null
        : ((n.limit_value - o.limit_value) / o.limit_value) * 100;
    return numericChange(o, n, pct);
  }

  if (
    o.interval_days !== null &&
    n.interval_days !== null &&
    o.interval_days !== n.interval_days
  ) {
    const pct = ((o.interval_days - n.interval_days) / o.interval_days) * 100;
    return cadenceChange(o, n, pct);
  }

  if (o.averaging_class !== n.averaging_class) {
    return {
      change_type: "modified",
      change_kind: "averaging_period",
      severity: "moderate",
      old_requirement_id: o.id,
      new_requirement_id: n.id,
      summary: `${firstLabel(o)} averaging changed from ${o.averaging_period} to ${n.averaging_period}`,
      delta_description: `Deterministic averaging-class delta: ${o.averaging_period ?? "(none)"} -> ${n.averaging_period ?? "(none)"}.`,
      old_value: o.averaging_period,
      new_value: n.averaging_period,
      delta_pct: null,
      confidence: 0.99,
      ai_reasoning: ENGINE_REASONING,
    };
  }

  if (!sameApp) {
    return {
      change_type: "modified",
      change_kind: "applicability",
      severity: "moderate",
      old_requirement_id: o.id,
      new_requirement_id: n.id,
      summary: `${firstLabel(o)} applicability changed from ${o.applicability ?? "(none)"} to ${n.applicability ?? "(none)"}`,
      delta_description: `Deterministic applicability delta: "${o.applicability ?? "(none)"}" -> "${n.applicability ?? "(none)"}".`,
      old_value: o.applicability,
      new_value: n.applicability,
      delta_pct: null,
      confidence: 0.9,
      ai_reasoning: TEXT_REASONING,
    };
  }

  if (!sameRaw) {
    return textChange(o, n);
  }

  return unchangedChange(o, n);
}

export function diffRequirements(
  oldRows: RequirementRowInput[],
  newRows: RequirementRowInput[],
): DiffResult {
  const oldClauses = oldRows.map(normalizeClause);
  const newClauses = newRows.map(normalizeClause);
  const pairs: ClausePair[] = pairClauses(oldClauses, newClauses).map((p) => ({
    ...p,
    change: comparePair(p.old, p.new),
  }));
  return {
    pairs,
    changes: pairs
      .map((p) => p.change)
      .filter((c) => c.change_type !== "unchanged"),
  };
}
