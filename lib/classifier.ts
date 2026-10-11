import { getGeminiClient, GEMINI_MODEL_TEXT } from "./gemini";
import {
  classifierOutputSchema,
  DETERMINISTIC_KINDS,
  type ClassifierOutput,
  type DiffChange,
} from "./schemas";

export function deterministicClassification(change: DiffChange): ClassifierOutput {
  return {
    change_kind: change.change_kind,
    severity: change.severity,
    summary: change.summary,
    confidence: change.confidence,
    reasoning: change.ai_reasoning || "Deterministic rule-based classification.",
  };
}

function buildPrompt(
  change: DiffChange,
  oldText: string,
  newText: string,
): string {
  return `You are a regulatory air-permit clause change classifier for a compliance system.
You receive a baseline clause, a revised clause, and a pre-computed deterministic comparison.

Rules:
- "No evidence, no claim": every classification must be justified by quoted text from the clauses below.
- NEVER compute or invent numeric values. Numeric deltas were already computed by deterministic code and are provided for context only.
- change_kind must be one of: method, applicability, reporting, administrative, new, removed.
  You must NOT return numeric_limit, frequency, averaging_period, or record_retention.
- severity must be one of: critical | moderate | low | administrative.
  administrative = signature/role/title/date-routing changes with no facility equipment impact.
  critical = requirement removal or a shift that could cause immediate non-compliance.
  moderate = operational procedure changes requiring work impact.
  low = wording or reporting-method refinements with minimal operational impact.
- summary: one grounded sentence, max 25 words, no invented numbers.
- confidence: number between 0 and 1.
- reasoning: one or two sentences citing specific clause text.

Return ONLY JSON matching:
{"change_kind":"...","severity":"...","summary":"...","confidence":0.0,"reasoning":"..."}

Deterministic pre-classification (do not contradict it without textual evidence): kind=${change.change_kind}, severity=${change.severity}
Deterministic delta description: ${change.delta_description}

Baseline clause:
"""${oldText.slice(0, 3000)}"""

Revised clause:
"""${newText.slice(0, 3000)}"""`;
}

/**
 * Classifies a non-numeric clause change with the Gemini flash model.
 * Always returns a schema-valid result: on any API, schema, or JSON failure
 * it falls back to the deterministic classification, and it rejects any LLM
 * attempt to claim a deterministic kind (numeric/cadence/averaging/retention).
 */
export async function classifyClauseChange(
  change: DiffChange,
  oldText: string,
  newText: string,
): Promise<ClassifierOutput> {
  const fallback = deterministicClassification(change);
  if (DETERMINISTIC_KINDS.has(change.change_kind)) return fallback;

  const ai = getGeminiClient();
  if (!ai) return fallback;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: buildPrompt(change, oldText, newText),
      config: {
        responseMimeType: "application/json",
        temperature: 0,
      },
    });
    const text = response.text;
    if (!text) return fallback;
    const parsed = classifierOutputSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      console.warn("Classifier schema violation, using fallback:", parsed.error.issues[0]);
      return fallback;
    }
    const output = parsed.data;
    if (DETERMINISTIC_KINDS.has(output.change_kind)) {
      console.warn(
        `Classifier attempted deterministic kind "${output.change_kind}", using fallback`,
      );
      return fallback;
    }
    return output;
  } catch (err) {
    console.warn("Gemini classifier error, using deterministic fallback:", err);
    return fallback;
  }
}
