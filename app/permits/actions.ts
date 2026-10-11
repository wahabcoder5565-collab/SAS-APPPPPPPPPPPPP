"use server";

import { createClient } from "@/lib/supabase/server";
import { getGeminiClient, GEMINI_MODEL_TEXT, getEmbedding } from "@/lib/gemini";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { extractText } from "unpdf";
import {
  extractedClauseSchema,
  type DiffChange,
  type ExtractedClause,
} from "@/lib/schemas";
import { diffRequirements, isDeterministicKind } from "@/lib/diff";
import { classifyClauseChange } from "@/lib/classifier";
import { resolveFacilityImpact, persistConflicts } from "@/lib/conflicts";

const MAX_PDF_BYTES = 20 * 1024 * 1024;

export async function createPermitAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const title = formData.get("title") as string;
  const permitNumber = formData.get("permitNumber") as string;
  const agency = formData.get("agency") as string;
  const type = (formData.get("type") as "current" | "revised") || "revised";
  const effectiveDate = formData.get("effectiveDate") as string;
  const rawText = formData.get("rawText") as string;

  if (!title?.trim() || !permitNumber?.trim() || !agency?.trim()) {
    throw new Error("Title, permit number, and agency are required");
  }
  if (!rawText?.trim()) {
    throw new Error("Provide permit text to extract obligations from");
  }

  const { data: permit, error } = await supabase
    .from("pi_permits")
    .insert({
      title,
      permit_number: permitNumber,
      agency,
      type,
      effective_date: effectiveDate || null,
      raw_text: rawText,
      status: "parsing",
      created_by: user.id,
    })
    .select()
    .single();

  if (error || !permit) {
    throw new Error(error?.message || "Failed to create permit");
  }

  await extractPermitObligations(permit.id, rawText);

  await supabase
    .from("pi_permits")
    .update({ status: "parsed" })
    .eq("id", permit.id);

  revalidatePath("/permits");
  revalidatePath("/dashboard");
  redirect(`/permits/${permit.id}`);
}

export async function uploadPermitPdfAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const title = String(formData.get("title") ?? "").trim();
  const permitNumber = String(formData.get("permitNumber") ?? "").trim();
  const agency = String(formData.get("agency") ?? "").trim();
  const type =
    (formData.get("type") as "current" | "revised") === "current"
      ? "current"
      : "revised";
  const effectiveDate = String(formData.get("effectiveDate") ?? "").trim();

  if (!title || !permitNumber || !agency) {
    throw new Error("Title, permit number, and agency are required");
  }

  const file = formData.get("pdfFile");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Select a PDF file to upload");
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error("PDF exceeds the 20 MB size limit");
  }
  if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
    throw new Error("Only PDF files are supported");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { text } = await extractText(bytes, { mergePages: true });
  const rawText = (text ?? "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (rawText.length < 40) {
    throw new Error(
      "Could not extract text from this PDF (scanned image PDFs require OCR)",
    );
  }

  const { data: permit, error } = await supabase
    .from("pi_permits")
    .insert({
      title,
      permit_number: permitNumber,
      agency,
      type,
      effective_date: effectiveDate || null,
      raw_text: rawText,
      status: "parsing",
      created_by: user.id,
    })
    .select()
    .single();

  if (error || !permit) {
    throw new Error(error?.message || "Failed to create permit from PDF");
  }

  const safeName =
    file.name.replace(/[^\w.\-]+/g, "_").replace(/^_+/, "") || "permit.pdf";
  const path = `${permit.id}/${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from("pi-documents")
    .upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (uploadError) {
    throw new Error(`PDF storage upload failed: ${uploadError.message}`);
  }
  await supabase
    .from("pi_permits")
    .update({ file_url: path })
    .eq("id", permit.id);

  await extractPermitObligations(permit.id, rawText);

  await supabase
    .from("pi_permits")
    .update({ status: "parsed" })
    .eq("id", permit.id);

  revalidatePath("/permits");
  revalidatePath("/dashboard");
  redirect(`/permits/${permit.id}`);
}

export async function runComparisonAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const currentId = String(formData.get("currentId") ?? "");
  const revisedId = String(formData.get("revisedId") ?? "");
  if (!currentId || !revisedId) {
    throw new Error("Select both a current and a revised permit");
  }
  if (currentId === revisedId) {
    throw new Error("Current and revised permits must be different");
  }

  const [{ data: oldRows, error: oldErr }, { data: newRows, error: newErr }] =
    await Promise.all([
      supabase.from("pi_permit_requirements").select("*").eq("permit_id", currentId),
      supabase.from("pi_permit_requirements").select("*").eq("permit_id", revisedId),
    ]);
  if (oldErr || newErr) {
    throw new Error(oldErr?.message || newErr?.message || "Failed to load requirements");
  }
  if (!oldRows?.length || !newRows?.length) {
    throw new Error("Both permits need extracted requirements before comparison");
  }

  const { changes } = diffRequirements(oldRows, newRows);

  let { data: comparison } = await supabase
    .from("pi_comparisons")
    .select("*")
    .eq("current_permit_id", currentId)
    .eq("revised_permit_id", revisedId)
    .maybeSingle();

  if (!comparison) {
    const { data: created, error: createErr } = await supabase
      .from("pi_comparisons")
      .insert({
        current_permit_id: currentId,
        revised_permit_id: revisedId,
        status: "completed",
        created_by: user.id,
      })
      .select("*")
      .single();
    if (createErr || !created) {
      throw new Error(createErr?.message || "Failed to create comparison");
    }
    comparison = created;
  } else if (comparison.status !== "completed") {
    await supabase
      .from("pi_comparisons")
      .update({ status: "completed" })
      .eq("id", comparison.id);
  }

  const { data: existing, error: existingErr } = await supabase
    .from("pi_permit_changes")
    .select("id, old_requirement_id, new_requirement_id, old_value, new_value")
    .eq("comparison_id", comparison.id);
  if (existingErr) throw new Error(existingErr.message);

  const byPair = new Map(
    (existing ?? []).map((r) => [
      `${r.old_requirement_id}|${r.new_requirement_id}`,
      r,
    ]),
  );

  let inserted = 0;
  let updated = 0;
  for (const change of changes) {
    const key = `${change.old_requirement_id}|${change.new_requirement_id}`;
    const match = byPair.get(key);
    if (match) {
      if (
        numericMismatch(
          match.old_value,
          match.new_value,
          change.old_value,
          change.new_value,
        )
      ) {
        const { error: updErr } = await supabase
          .from("pi_permit_changes")
          .update({
            old_value: change.old_value,
            new_value: change.new_value,
            delta_description: change.delta_description,
            change_kind: change.change_kind,
            confidence: change.confidence,
            ai_reasoning: change.ai_reasoning,
          })
          .eq("id", match.id);
        if (updErr) throw new Error(updErr.message);
        updated += 1;
      }
      continue;
    }

    const payload = await buildInsertPayload(supabase, change, oldRows, newRows, comparison.id);
    const { error: insErr } = await supabase
      .from("pi_permit_changes")
      .insert(payload);
    if (insErr) throw new Error(insErr.message);
    inserted += 1;
  }

  console.log(
    `[runComparisonAction] comparison=${comparison.id} inserted=${inserted} updated=${updated} unchanged=${changes.length === 0 ? 0 : "n/a"}`,
  );

  revalidatePath("/delta");
  redirect("/delta");
}

function firstNumber(v?: string | null): number | null {
  if (!v) return null;
  const m = v.match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

function numericMismatch(
  storedOld: string | null,
  storedNew: string | null,
  engineOld: string | null,
  engineNew: string | null,
): boolean {
  const pairs: Array<[number | null, number | null]> = [
    [firstNumber(storedOld), firstNumber(engineOld)],
    [firstNumber(storedNew), firstNumber(engineNew)],
  ];
  for (const [stored, engine] of pairs) {
    if (stored !== null && engine !== null && Math.abs(stored - engine) > 1e-9) {
      return true;
    }
  }
  return false;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function buildInsertPayload(
  supabase: any,
  change: DiffChange,
  oldRows: any[],
  newRows: any[],
  comparisonId: string,
): Promise<Record<string, unknown>> {
  let final: DiffChange = change;
  if (!isDeterministicKind(change.change_kind)) {
    const oldText =
      oldRows.find((r) => r.id === change.old_requirement_id)?.raw_text ?? "";
    const newText =
      newRows.find((r) => r.id === change.new_requirement_id)?.raw_text ?? "";
    const classified = await classifyClauseChange(change, oldText, newText);
    final = { ...change, ...classified };
  }
  return {
    comparison_id: comparisonId,
    change_type: final.change_type,
    change_kind: final.change_kind,
    severity: final.severity,
    old_requirement_id: final.old_requirement_id,
    new_requirement_id: final.new_requirement_id,
    summary: final.summary,
    delta_description: final.delta_description,
    old_value: final.old_value,
    new_value: final.new_value,
    confidence: final.confidence,
    ai_reasoning: final.ai_reasoning,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function extractPollutant(parameter?: string | null): string | null {
  if (!parameter) return null;
  if (/NOx|Nitrogen Oxide/i.test(parameter)) return "NOx";
  if (/VOC|Volatile Organic/i.test(parameter)) return "VOC";
  if (/SO2|Sulfur Dioxide/i.test(parameter)) return "SO2";
  if (/PM|Particulate/i.test(parameter)) return "PM";
  if (/CO|Carbon Monoxide/i.test(parameter)) return "CO";
  if (/NHV|Heating Value/i.test(parameter)) return "NHV";
  return null;
}

function buildFallbackItems(text: string): unknown[] {
  const items: unknown[] = [];
  const lines = text.split("\n").filter((l) => l.trim().length > 10);
  lines.forEach((line, index) => {
    let category = "monitoring";
    if (/limit|exceed|maximum|lb\/MMBtu|ppm|ton/i.test(line)) {
      category = "emission_limit";
    } else if (/record|log|retain/i.test(line)) {
      category = "recordkeeping";
    } else if (/report|submit|annual|semiannual/i.test(line)) {
      category = "reporting";
    }

    const numMatch = line.match(/(\d+\.?\d*)\s*(lb\/MMBtu|ppmw|ppm|Btu\/scf|gpm|%)/i);

    items.push({
      category,
      citation: `Section General.${index + 1}`,
      requirement_text: line.trim(),
      parameter: /NOx|nitrogen/i.test(line)
        ? "Nitrogen Oxides (NOx)"
        : /VOC/i.test(line)
          ? "VOC"
          : "Air Contaminant",
      limit_value: numMatch ? parseFloat(numMatch[1]) : null,
      limit_unit: numMatch ? numMatch[2] : null,
      averaging_period: /24-hour|rolling/i.test(line) ? "24-hour rolling" : null,
      frequency: /continuous|cems/i.test(line)
        ? "Continuous"
        : /weekly/i.test(line)
          ? "Weekly"
          : /monthly/i.test(line)
            ? "Monthly"
            : null,
      applicability: /boiler|b-07/i.test(line)
        ? "Boiler B-07"
        : /cooling tower|ct-4/i.test(line)
          ? "Cooling Tower CT-4"
          : "Facility-Wide",
    });
  });
  return items;
}

async function extractPermitObligations(permitId: string, text: string) {
  const supabase = await createClient();
  const ai = getGeminiClient();

  const rawItems: unknown[] = [];

  if (ai) {
    try {
      const prompt = `Extract all regulatory air permit obligations from the following permit text.
Return a JSON array of objects conforming to this schema:
[
  {
    "category": "emission_limit" | "monitoring" | "recordkeeping" | "reporting" | "work_practice",
    "citation": "Section and regulatory rule citation",
    "requirement_text": "Exact text of the requirement",
    "parameter": "Pollutant or parameter name",
    "limit_value": numeric value or null,
    "limit_unit": "e.g. lb/MMBtu, ppm, gpm" or null,
    "averaging_period": "e.g. 24-hour rolling, 1-hour block" or null,
    "frequency": "e.g. Continuous, Weekly, Monthly" or null,
    "applicability": "Target equipment or emission unit" or null
  }
]

Permit Text:
${text.slice(0, 8000)}`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      if (response.text) {
        const parsed: unknown = JSON.parse(response.text);
        if (Array.isArray(parsed)) rawItems.push(...parsed);
      }
    } catch (err) {
      console.warn("Gemini extraction error, using deterministic fallback parser:", err);
    }
  }

  if (rawItems.length === 0) {
    rawItems.push(...buildFallbackItems(text));
  }

  const extractedItems: ExtractedClause[] = [];
  for (const raw of rawItems) {
    const result = extractedClauseSchema.safeParse(raw);
    if (result.success) {
      extractedItems.push(result.data);
    } else {
      console.warn("Dropping invalid extracted clause:", result.error.issues[0]?.message);
    }
  }

  for (const item of extractedItems) {
    const embedding = await getEmbedding(item.requirement_text);
    await supabase.from("pi_permit_requirements").insert({
      permit_id: permitId,
      category: item.category,
      normalized_type: item.category,
      citation: item.citation,
      raw_text: item.requirement_text,
      parameter: item.parameter,
      pollutant: extractPollutant(item.parameter),
      limit_value: item.limit_value,
      unit: item.limit_unit,
      averaging_period: item.averaging_period,
      frequency: item.frequency,
      applicability: item.applicability,
      confidence: 0.7,
      embedding: embedding,
    });
  }
}

export async function resolveComparisonImpactsAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const comparisonId = String(formData.get("comparison_id") ?? "");
  if (!comparisonId) redirect("/impacts");

  const { data: changes, error } = await supabase
    .from("pi_permit_changes")
    .select("id")
    .eq("comparison_id", comparisonId);
  if (error) throw new Error(error.message);

  let resolved = 0;
  let conflictCount = 0;
  for (const row of changes ?? []) {
    const resolution = await resolveFacilityImpact(supabase, row.id);
    if (!resolution) continue;
    await persistConflicts(supabase, row.id, resolution.findings);
    resolved += 1;
    conflictCount += resolution.findings.length;
  }

  console.log(
    `[resolveComparisonImpactsAction] comparison=${comparisonId} resolved=${resolved} conflicts=${conflictCount}`,
  );

  revalidatePath("/impacts");
  redirect("/impacts");
}
