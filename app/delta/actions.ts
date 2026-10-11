"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateChangeReviewStatus(
  changeId: string,
  newStatus: "accepted" | "rejected" | "modified",
  notes?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get current state
  const { data: currentChange } = await supabase
    .from("pi_permit_changes")
    .select("*")
    .eq("id", changeId)
    .single();

  if (!currentChange) {
    throw new Error("Change not found");
  }

  // Update change status
  const { error } = await supabase
    .from("pi_permit_changes")
    .update({
      review_status: newStatus,
      reviewed_by: user?.id || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", changeId);

  if (error) {
    throw new Error(error.message);
  }

  // Record the human decision as a review event (auditable history + reviewer note)
  const { error: eventError } = await supabase.from("pi_review_events").insert({
    entity_type: "permit_change",
    entity_id: changeId,
    reviewer_id: user?.id || null,
    decision: newStatus,
    note: notes || null,
  });
  if (eventError) {
    throw new Error(eventError.message);
  }

  // Log in pi_audit_log
  await supabase.from("pi_audit_log").insert({
    entity_type: "pi_permit_changes",
    entity_id: changeId,
    action: `CHANGE_${newStatus.toUpperCase()}`,
    previous_state: { review_status: currentChange.review_status },
    new_state: { review_status: newStatus },
    performed_by: user?.id || null,
    notes: notes || `Review status changed from ${currentChange.review_status} to ${newStatus}`,
  });

  revalidatePath("/delta");
  revalidatePath("/dashboard");
  revalidatePath("/audit");
  revalidatePath(`/delta/${changeId}`);
}
