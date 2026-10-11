"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function verifyImpactAction(mappingId: string, verified: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: mapping } = await supabase
    .from("pi_impact_mappings")
    .select("*")
    .eq("id", mappingId)
    .single();

  if (!mapping) {
    throw new Error("Mapping not found");
  }

  const { error } = await supabase
    .from("pi_impact_mappings")
    .update({
      human_verified: verified,
      verified_by: user?.id || null,
    })
    .eq("id", mappingId);

  if (error) {
    throw new Error(error.message);
  }

  // Audit log entry
  await supabase.from("pi_audit_log").insert({
    entity_type: "pi_impact_mappings",
    entity_id: mappingId,
    action: verified ? "IMPACT_VERIFIED" : "IMPACT_UNVERIFIED",
    previous_state: { human_verified: mapping.human_verified },
    new_state: { human_verified: verified },
    performed_by: user?.id || null,
    notes: `Impact mapping verification updated by human operator.`,
  });

  revalidatePath("/impacts");
  revalidatePath("/dashboard");
  revalidatePath("/audit");
}
