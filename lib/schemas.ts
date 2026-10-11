import { z } from "zod";

export const CLAUSE_CATEGORIES = [
  "emission_limit",
  "monitoring",
  "recordkeeping",
  "reporting",
  "work_practice",
] as const;

export const CHANGE_KINDS = [
  "numeric_limit",
  "frequency",
  "averaging_period",
  "record_retention",
  "method",
  "applicability",
  "reporting",
  "administrative",
  "new",
  "removed",
  "unchanged",
] as const;

export const SEVERITIES = ["critical", "moderate", "low", "administrative"] as const;

export const STRUCTURAL_CHANGE_TYPES = ["new", "modified", "removed", "unchanged"] as const;

/**
 * Kinds computed by explicit deterministic code (numeric delta, cadence,
 * averaging, retention duration). The LLM classifier is never allowed to
 * produce or override these — per spec section 11 the language model must
 * not perform numeric delta, unit conversion, or date arithmetic.
 */
export const DETERMINISTIC_KINDS: ReadonlySet<string> = new Set([
  "numeric_limit",
  "frequency",
  "averaging_period",
  "record_retention",
]);

const strOrNull = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (typeof v === "string" && v.trim().length > 0 ? v.trim() : null));

const numOrNull = z.preprocess((v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}, z.number().nullable());

const confidence01 = z.preprocess((v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  const scaled = n > 1 ? n / 100 : n;
  return Math.min(1, Math.max(0, scaled));
}, z.number().min(0).max(1));

export const extractedClauseSchema = z.object({
  category: z.enum(CLAUSE_CATEGORIES),
  citation: strOrNull.transform((v) => v ?? "Section General"),
  requirement_text: z.string().min(1),
  parameter: strOrNull,
  limit_value: numOrNull,
  limit_unit: strOrNull,
  averaging_period: strOrNull,
  frequency: strOrNull,
  applicability: strOrNull,
});
export type ExtractedClause = z.infer<typeof extractedClauseSchema>;

export const extractionResultSchema = z.array(extractedClauseSchema);

export const normalizedClauseSchema = z.object({
  id: z.string().min(1),
  category: z.enum(CLAUSE_CATEGORIES),
  section: strOrNull,
  page: z.number().nullable(),
  citation: strOrNull,
  raw_text: z.string().min(1),
  parameter: strOrNull,
  pollutant: strOrNull,
  limit_value: z.number().nullable(),
  unit: strOrNull,
  averaging_period: strOrNull,
  averaging_class: strOrNull,
  frequency: strOrNull,
  interval_days: z.number().nullable(),
  is_minimum: z.boolean(),
  applicability: strOrNull,
  confidence: z.number(),
});
export type NormalizedClause = z.infer<typeof normalizedClauseSchema>;

export const diffChangeSchema = z.object({
  change_type: z.enum(STRUCTURAL_CHANGE_TYPES),
  change_kind: z.enum(CHANGE_KINDS),
  severity: z.enum(SEVERITIES),
  old_requirement_id: strOrNull,
  new_requirement_id: strOrNull,
  summary: z.string().min(1),
  delta_description: z.string().min(1),
  old_value: strOrNull,
  new_value: strOrNull,
  delta_pct: z.number().nullable(),
  confidence: z.number().min(0).max(1),
  ai_reasoning: strOrNull,
});
export type DiffChange = z.infer<typeof diffChangeSchema>;

export const classifierOutputSchema = z.object({
  change_kind: z.enum(CHANGE_KINDS),
  severity: z.enum(SEVERITIES),
  summary: z.string().min(1).max(400),
  confidence: confidence01,
  reasoning: z.string().min(1),
});
export type ClassifierOutput = z.infer<typeof classifierOutputSchema>;
