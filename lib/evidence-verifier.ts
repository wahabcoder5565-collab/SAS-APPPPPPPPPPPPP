import { z } from "zod";
import { getGeminiClient, GEMINI_MODEL_TEXT } from "./gemini";

export const evidenceVerdictSchema = z.object({
  status: z.enum(["compliant", "incomplete", "inconclusive"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export type EvidenceVerdict = z.infer<typeof evidenceVerdictSchema>;

export interface ExpectedParameter {
  parameter: string | null;
  limit_value: string | number | null;
  unit: string | null;
  pollutant: string | null;
}

export interface EvidenceCheckInput {
  documentTitle: string;
  documentType: string;
  content: string;
  expected: ExpectedParameter | null;
  actionDescription: string;
}

export function describeExpected(expected: ExpectedParameter | null): string {
  if (!expected) return "No specific change parameter captured for this action.";
  const parts: string[] = [];
  if (expected.parameter) parts.push(String(expected.parameter));
  if (expected.limit_value != null && expected.limit_value !== "") {
    parts.push(String(expected.limit_value) + (expected.unit ? ` ${expected.unit}` : ""));
  } else if (expected.unit && expected.parameter) {
    parts.push(String(expected.unit));
  }
  if (parts.length === 0) return "No specific change parameter captured for this action.";
  return parts.join(" · ");
}

function buildPrompt(input: EvidenceCheckInput): string {
  const expectedText = describeExpected(input.expected);
  return `You are the evidence completeness engine for an air-permit compliance system.
A remediation action must prove it addresses the revised permit parameters with attached documents.
You check whether the submitted document text actually reflects the required parameter value(s).

Action: ${input.actionDescription}
Document: ${input.documentTitle} (${input.documentType})
Required parameter(s) that must appear in the document: ${expectedText}

Submitted document text:
"""${input.content.slice(0, 3500)}"""

Rules:
- "No evidence, no claim": only mark compliant when the required value(s) literally appear with the correct meaning in the text.
- If any required value is missing from the text, the status is incomplete.
- If the document is unrelated or cannot be judged, or no required parameter is defined, the status is inconclusive.
- confidence: number between 0 and 1.
- reasoning: 1-2 sentences citing what the text contains or is missing. Never approve an action — you only assess evidence.

Return ONLY JSON matching:
{"status":"compliant|incomplete|inconclusive","confidence":0.0,"reasoning":"..."}`;
}

export function deterministicEvidenceCheck(input: EvidenceCheckInput): EvidenceVerdict {
  const text = (input.content || "").toLowerCase();
  const expected = input.expected;
  if (!expected) {
    return {
      status: "inconclusive",
      confidence: 0.55,
      reasoning: "No explicit change parameter was supplied; manual reviewer judgement recommended.",
    };
  }
  const checks: string[] = [];
  if (expected.parameter) checks.push(String(expected.parameter).toLowerCase());
  if (expected.limit_value != null && expected.limit_value !== "") {
    checks.push(String(expected.limit_value).toLowerCase());
  }
  if (expected.pollutant) checks.push(String(expected.pollutant).toLowerCase());
  if (checks.length === 0) {
    return {
      status: "inconclusive",
      confidence: 0.55,
      reasoning: "No comparable value could be derived from the change parameter; manual review recommended.",
    };
  }
  const missing = checks.filter((c) => !text.includes(c));
  if (missing.length === 0) {
    return {
      status: "compliant",
      confidence: 0.85,
      reasoning: `Document text references the required value(s): ${checks.join(", ")}.`,
    };
  }
  return {
    status: "incomplete",
    confidence: 0.78,
    reasoning: `Document text does not mention required value(s): ${missing.join(", ")}. Reviewer attention required.`,
  };
}

/**
 * Runs the Gemini evidence completeness check. Always returns a schema-valid
 * verdict: any API, schema, or JSON failure falls back to the deterministic
 * keyword check. Never changes action state itself.
 */
export async function verifyEvidence(input: EvidenceCheckInput): Promise<EvidenceVerdict> {
  const fallback = deterministicEvidenceCheck(input);
  const ai = getGeminiClient();
  if (!ai) return fallback;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: buildPrompt(input),
      config: {
        responseMimeType: "application/json",
        temperature: 0,
      },
    });
    const text = response.text;
    if (!text) return fallback;
    const parsed = evidenceVerdictSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      console.warn("Evidence verifier schema violation, using fallback:", parsed.error.issues[0]);
      return fallback;
    }
    return parsed.data;
  } catch (err) {
    console.warn("Gemini evidence verifier error, using deterministic fallback:", err);
    return fallback;
  }
}