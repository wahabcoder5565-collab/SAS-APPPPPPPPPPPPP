"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  canTransition,
  ACTION_STATUS_LABELS,
  type ActionStatus,
} from "./workflow";

export async function updateActionStatus(actionId: string, newStatus: ActionStatus) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentAction } = await supabase
    .from("pi_implementation_actions")
    .select("*")
    .eq("id", actionId)
    .single();

  if (!currentAction) {
    throw new Error("Action not found");
  }

  if (!canTransition(currentAction.status as ActionStatus, newStatus)) {
    throw new Error(
      `Invalid workflow transition: ${ACTION_STATUS_LABELS[currentAction.status as ActionStatus]} → ${ACTION_STATUS_LABELS[newStatus]}`
    );
  }

  if (newStatus === "approved") {
    throw new Error(
      "Approval requires human sign-off through the reviewer panel (AI can never approve an action)."
    );
  }

  if (currentAction.status === "evidence_submitted") {
    throw new Error(
      "Evidence Submitted is a locked state — decision requires the reviewer sign-off panel (Approved / Rejected with a note)."
    );
  }

  if (newStatus === "evidence_submitted") {
    const { data: evidence } = await supabase
      .from("pi_evidence")
      .select("id")
      .eq("action_id", actionId)
      .limit(1);
    if (!evidence || evidence.length === 0) {
      throw new Error("Attach at least one evidence document before marking an action Evidence Submitted.");
    }
  }

  const { error } = await supabase
    .from("pi_implementation_actions")
    .update({ status: newStatus })
    .eq("id", actionId);

  if (error) {
    throw new Error(error.message);
  }

  // Audit log entry
  await supabase.from("pi_audit_log").insert({
    entity_type: "pi_implementation_actions",
    entity_id: actionId,
    action: `ACTION_STATUS_${newStatus.toUpperCase()}`,
    previous_state: { status: currentAction.status },
    new_state: { status: newStatus },
    performed_by: user?.id || null,
    notes: `Action item status transitioned from ${ACTION_STATUS_LABELS[currentAction.status as ActionStatus]} to ${ACTION_STATUS_LABELS[newStatus]}.`,
  });

  revalidatePath("/actions");
  revalidatePath("/dashboard");
  revalidatePath("/audit");
}

export interface UpdateActionFields {
  ownerId?: string | null;
  dueDate?: string | null;
  description?: string;
}

export async function updateAction(actionId: string, fields: UpdateActionFields) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentAction } = await supabase
    .from("pi_implementation_actions")
    .select("*")
    .eq("id", actionId)
    .single();

  if (!currentAction) {
    throw new Error("Action not found");
  }

  const patch: Record<string, unknown> = {};
  const changes: string[] = [];

  if (fields.ownerId !== undefined && fields.ownerId !== currentAction.owner_id) {
    patch.owner_id = fields.ownerId || null;
    changes.push(`owner ${currentAction.owner_id || "unassigned"} → ${fields.ownerId || "unassigned"}`);
  }
  if (fields.dueDate !== undefined && fields.dueDate !== currentAction.due_date) {
    patch.due_date = fields.dueDate || null;
    changes.push(`deadline ${currentAction.due_date || "none"} → ${fields.dueDate || "none"}`);
  }
  if (
    fields.description !== undefined &&
    fields.description.trim() !== (currentAction.description || "")
  ) {
    patch.description = fields.description.trim();
    changes.push("mitigation steps updated");
  }

  if (Object.keys(patch).length === 0) {
    return;
  }

  const { error } = await supabase
    .from("pi_implementation_actions")
    .update(patch)
    .eq("id", actionId);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("pi_audit_log").insert({
    entity_type: "pi_implementation_actions",
    entity_id: actionId,
    action: "ACTION_UPDATED",
    previous_state: {
      owner_id: currentAction.owner_id,
      due_date: currentAction.due_date,
      description: currentAction.description,
    },
    new_state: patch,
    performed_by: user?.id || null,
    notes: `Action edited: ${changes.join(", ")}.`,
  });

  revalidatePath("/actions");
  revalidatePath("/dashboard");
  revalidatePath("/audit");
}

export async function createNewActionItem(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const mappingId = formData.get("mappingId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const department = formData.get("department") as "operations" | "environmental" | "instrumentation" | "maintenance" | "safety";
  const actionType = formData.get("actionType") as "procedural" | "hardware" | "calibration" | "monitoring" | "permit_revision";
  const estimatedCost = parseFloat(formData.get("estimatedCost") as string) || 0;
  const estimatedDays = parseInt(formData.get("estimatedDays") as string) || 1;
  const leadTimeWeeks = parseInt(formData.get("leadTimeWeeks") as string) || 1;

  const { data: mapping } = await supabase
    .from("pi_impact_mappings")
    .select("change_id")
    .eq("id", mappingId)
    .single();

  const { data: newAction, error } = await supabase
    .from("pi_implementation_actions")
    .insert({
      mapping_id: mappingId,
      change_id: mapping?.change_id || null,
      title,
      description,
      department,
      action_type: actionType,
      estimated_cost: estimatedCost,
      estimated_days: estimatedDays,
      lead_time_weeks: leadTimeWeeks,
      status: "proposed",
      owner_id: user?.id || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Audit log
  await supabase.from("pi_audit_log").insert({
    entity_type: "pi_implementation_actions",
    entity_id: newAction.id,
    action: "ACTION_CREATED",
    new_state: newAction,
    performed_by: user?.id || null,
    notes: `Manual action item created: ${title}`,
  });

  revalidatePath("/actions");
  revalidatePath("/dashboard");
  revalidatePath("/audit");
}
