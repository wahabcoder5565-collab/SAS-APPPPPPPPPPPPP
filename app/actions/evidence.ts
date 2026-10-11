"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { verifyEvidence, type ExpectedParameter } from "@/lib/evidence-verifier";
import { canSignOff } from "./workflow";

async function getAuthUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function resolvePerson(supabase: Awaited<ReturnType<typeof createClient>>) {
  const user = await getAuthUser(supabase);
  let displayName = user?.email || "Unknown";
  let role: string | null = null;
  let piUserId: string | null = null;
  if (user?.email) {
    const { data } = await supabase
      .from("pi_users")
      .select("id, full_name, role")
      .eq("email", user.email)
      .maybeSingle();
    if (data) {
      displayName = data.full_name;
      role = data.role;
      piUserId = data.id;
    }
  }
  return { user, displayName, role, piUserId };
}

export interface SubmitEvidenceInput {
  actionId: string;
  documentType: string;
  title: string;
  content: string;
  fileName: string;
}

export async function submitEvidence(input: SubmitEvidenceInput): Promise<{ verdictStatus: string }> {
  const supabase = await createClient();
  const { user, displayName } = await resolvePerson(supabase);

  const { data: currentAction } = await supabase
    .from("pi_implementation_actions")
    .select("id, title, description, change_id, mapping_id")
    .eq("id", input.actionId)
    .single();

  if (!currentAction) throw new Error("Action not found");

  let expected: ExpectedParameter | null = null;
  if (currentAction.change_id) {
    const { data: req } = await supabase
      .from("pi_permit_changes")
      .select(`
        id,
        new_requirement:pi_permit_requirements!new_requirement_id (
          parameter, limit_value, unit, pollutant
        )
      `)
      .eq("id", currentAction.change_id)
      .maybeSingle();
    if (req) {
      const nr = req.new_requirement as unknown as {
        parameter: string | null;
        limit_value: string | number | null;
        unit: string | null;
        pollutant: string | null;
      } | null;
      if (nr) {
        expected = {
          parameter: nr.parameter,
          limit_value: nr.limit_value,
          unit: nr.unit,
          pollutant: nr.pollutant,
        };
      }
    }
  }

  const verdict = await verifyEvidence({
    documentTitle: input.title,
    documentType: input.documentType,
    content: input.content,
    expected,
    actionDescription: currentAction.description,
  });

  const { data: row, error } = await supabase
    .from("pi_evidence")
    .insert({
      action_id: input.actionId,
      file_url: input.fileName ? `sim://evidence/${input.fileName}` : null,
      title: input.title,
      document_type: input.documentType,
      content: input.content,
      ai_check_status: verdict.status,
      ai_confidence: verdict.confidence,
      ai_check_reason: verdict.reasoning,
      uploaded_by: user?.id || null,
      uploaded_by_name: displayName,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("pi_audit_log").insert({
    entity_type: "pi_implementation_actions",
    entity_id: input.actionId,
    action: `ACTION_EVIDENCE_UPLOADED_${verdict.status.toUpperCase()}`,
    new_state: { evidence_id: row.id, ai_check_status: verdict.status, ai_confidence: verdict.confidence },
    performed_by: user?.id || null,
    notes: `Evidence "${input.title}" attached and AI-checked as ${verdict.status} (confidence ${Math.round(verdict.confidence * 100)}%).`,
  });

  revalidatePath("/actions");
  revalidatePath("/audit");

  return { verdictStatus: verdict.status };
}

export interface ReviewActionInput {
  actionId: string;
  decision: "approved" | "rejected";
  note: string;
}

export async function reviewAction(input: ReviewActionInput): Promise<{ status: string }> {
  const supabase = await createClient();
  const { user, role, piUserId } = await resolvePerson(supabase);

  if (!canSignOff(role)) {
    throw new Error("Only a Certified Environmental Engineer, Compliance Manager, or reviewer can sign off.");
  }
  if (piUserId) {
    const { data: actor } = await supabase
      .from("pi_users")
      .select("full_name, title")
      .eq("id", piUserId)
      .maybeSingle();
    if (!actor) throw new Error("Reviewer profile not found.");
  }

  const note = (input.note || "").trim();
  if (note.length < 4) {
    throw new Error("A reviewer note is required (min 4 characters).");
  }

  const { data: currentAction } = await supabase
    .from("pi_implementation_actions")
    .select("id, title, status, change_id, mapping_id")
    .eq("id", input.actionId)
    .single();

  if (!currentAction) throw new Error("Action not found");
  if (currentAction.status !== "evidence_submitted") {
    throw new Error("Sign-off is only allowed on actions with submitted evidence.");
  }

  if (input.decision === "approved") {
    const { data: evidence } = await supabase
      .from("pi_evidence")
      .select("id")
      .eq("action_id", input.actionId)
      .eq("ai_check_status", "compliant");
    if (!evidence || evidence.length === 0) {
      throw new Error(
        "AI evidence check did not find compliant evidence for this action. Human approval requires at least one compliant attachment.",
      );
    }
  }

  const { error } = await supabase
    .from("pi_implementation_actions")
    .update({
      status: input.decision,
      reviewed_by: piUserId,
      reviewed_at: new Date().toISOString(),
      reviewer_note: note,
    })
    .eq("id", input.actionId);

  if (error) throw new Error(error.message);

  await supabase.from("pi_audit_log").insert({
    entity_type: "pi_implementation_actions",
    entity_id: input.actionId,
    action: input.decision === "approved" ? "ACTION_APPROVED" : "ACTION_REJECTED",
    new_state: {
      status: input.decision,
      reviewed_by: piUserId,
      reviewer_note: note,
    },
    performed_by: user?.id || null,
    notes: `Human sign-off ${input.decision} with note: "${note}".`,
  });

  revalidatePath("/actions");
  revalidatePath("/dashboard");
  revalidatePath("/audit");

  return { status: input.decision };
}