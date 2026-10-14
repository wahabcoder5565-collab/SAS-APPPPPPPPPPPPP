"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface SeededAction {
  id: string;
  title: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  reviewer_note?: string;
}

/**
 * Seeded starting state for every implementation action, captured from the
 * original seed data. A guest can restore this deterministic starting point
 * after exploring the workflow. Kept in sync with the phase-3 seed migration.
 */
const SEEDED_ACTIONS: SeededAction[] = [
  { id: "b13e9c54-6325-4333-b3ed-579d84147211", title: "Amend Certified Analytical Laboratory Contract", status: "in_progress" },
  { id: "2c9893d0-4cd3-78dd-e2e4-6b86807cd58c", title: "Establish Monthly Tank Farm Leak Detection Route", status: "proposed" },
  { id: "49276cc8-1407-4f53-92a5-bb365cc4445b", title: "Flue Gas Recirculation (FGR) O2 Trim Optimization & Tuning", status: "evidence_submitted" },
  { id: "e21edba5-bc87-449b-b8de-9f851b06df47", title: "Procure Secondary El Paso Stripping Column & Canisters", status: "in_progress" },
  { id: "99c57f51-c6b8-2518-cbaf-6fe342c49344", title: "Retune FCCU-1 Regenerator Combustion & Revalidate CO Analyzer", status: "proposed" },
  { id: "6faf69ce-6252-a37a-1d03-0c83b8744e97", title: "Revise FL-1 Flare Pilot & Steam Assist Operating Envelope", status: "in_review" },
  { id: "f68f5dda-172e-0506-2ddf-5dd7d6a7bf91", title: "SRU-2 Tail Gas Catalyst Activity Check & Analyzer Re-Span", status: "in_review" },
  {
    id: "64b1f28a-11ba-48ed-b56c-9bcc3bea0bb1",
    title: "CEMS NOx Analyzer Span & Calibration Verification",
    status: "approved",
    reviewed_by: "b2222222-2222-4222-b222-222222222222",
    reviewed_at: "2026-10-07T09:49:10.995Z",
    reviewer_note: "Calibration log confirms analyzer span reflects the 0.05 lb/MMBtu requirement.",
  },
  {
    id: "bd082f04-0870-424c-b460-def3d878d48e",
    title: "Update Title V Operating SOP (SOP-44)",
    status: "approved",
    reviewed_by: "b2222222-2222-4222-b222-222222222222",
    reviewed_at: "2026-10-07T09:49:10.246Z",
    reviewer_note: "SOP revision materially aligns Boiler B-07 with the revised NOx limit.",
  },
];

const RESET_SENTINEL_ID = "00000000-0000-0000-0000-000000000000";

export type ResetDemoResult = { ok: boolean; reset?: number; error?: string };

export async function resetDemoWorkspace(): Promise<ResetDemoResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Not authenticated." };
  }

  let reset = 0;
  for (const action of SEEDED_ACTIONS) {
    const { error } = await supabase
      .from("pi_implementation_actions")
      .update({
        status: action.status,
        reviewed_by: action.reviewed_by ?? null,
        reviewed_at: action.reviewed_at ?? null,
        reviewer_note: action.reviewer_note ?? null,
      })
      .eq("id", action.id);
    if (!error) reset += 1;
  }

  // Record the reset itself as an audit event (hash chain is trigger-enforced).
  await supabase.from("pi_audit_log").insert({
    entity_type: "pi_implementation_actions",
    entity_id: RESET_SENTINEL_ID,
    action: "DEMO_RESET",
    previous_state: null,
    new_state: { reset_count: reset },
    performed_by: user.id,
    notes: `Guest reset the demo workspace: ${reset} implementation actions restored to their seeded statuses and review decisions.`,
  });

  revalidatePath("/actions");
  revalidatePath("/dashboard");
  revalidatePath("/audit");
  revalidatePath("/impacts");

  return { ok: true, reset };
}
