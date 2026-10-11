"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function splitLines(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function pickAssetInput(formData: FormData) {
  return {
    asset_code: (formData.get("assetCode") as string)?.trim().toUpperCase(),
    name: (formData.get("name") as string)?.trim(),
    area: (formData.get("area") as string)?.trim(),
    asset_type: (formData.get("assetType") as string)?.trim(),
    capacity: (formData.get("capacity") as string)?.trim() || null,
    is_bottleneck: formData.get("isBottleneck") === "on",
    installed_controls: splitLines((formData.get("installedControls") as string) || ""),
    monitoring_systems: splitLines((formData.get("monitoringSystems") as string) || ""),
  };
}

export type AssetActionResult = { ok: true } | { ok: false; error: string };

export async function createAssetAction(formData: FormData): Promise<AssetActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const input = pickAssetInput(formData);

  if (!input.asset_code || !input.name || !input.area || !input.asset_type) {
    return { ok: false, error: "asset_code, name, area, and type are required." };
  }

  const { data: newAsset, error } = await supabase
    .from("pi_facility_assets")
    .insert(input)
    .select()
    .single();

  if (error) {
    if (String(error.code) === "23505") {
      return { ok: false, error: `Asset code ${input.asset_code} already exists.` };
    }
    return { ok: false, error: error.message };
  }

  await supabase.from("pi_audit_log").insert({
    entity_type: "pi_facility_assets",
    entity_id: newAsset.id,
    action: "ASSET_CREATED",
    new_state: newAsset,
    performed_by: user?.id || null,
    notes: `Asset created: ${newAsset.asset_code} (${newAsset.name}).`,
  });

  revalidatePath("/assets");
  revalidatePath("/dashboard");
  revalidatePath("/audit");
  return { ok: true };
}

export async function updateAssetAction(formData: FormData): Promise<AssetActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const id = formData.get("id") as string;
  const input = pickAssetInput(formData);

  if (!input.asset_code || !input.name || !input.area || !input.asset_type) {
    return { ok: false, error: "asset_code, name, area, and type are required." };
  }

  const { data: current } = await supabase
    .from("pi_facility_assets")
    .select("*")
    .eq("id", id)
    .single();
  if (!current) {
    return { ok: false, error: "Asset not found." };
  }

  const { data: updated, error } = await supabase
    .from("pi_facility_assets")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (String(error.code) === "23505") {
      return { ok: false, error: `Asset code ${input.asset_code} already exists.` };
    }
    return { ok: false, error: error.message };
  }

  const diffs: string[] = [];
  for (const key of ["asset_code", "name", "area", "asset_type", "capacity", "is_bottleneck"] as const) {
    if (String(current[key]) !== String(input[key])) diffs.push(key);
  }
  for (const key of ["installed_controls", "monitoring_systems"] as const) {
    if (JSON.stringify(current[key]) !== JSON.stringify(input[key])) diffs.push(key);
  }

  await supabase.from("pi_audit_log").insert({
    entity_type: "pi_facility_assets",
    entity_id: id,
    action: "ASSET_UPDATED",
    previous_state: { ...current },
    new_state: { ...updated },
    performed_by: user?.id || null,
    notes: diffs.length > 0 ? `Asset edited: ${diffs.join(", ")}.` : "Asset edited (no tracked field changed).",
  });

  revalidatePath("/assets");
  revalidatePath("/dashboard");
  revalidatePath("/audit");
  return { ok: true };
}

export async function deleteAssetAction(formData: FormData): Promise<AssetActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const id = formData.get("id") as string;

  const { data: current } = await supabase
    .from("pi_facility_assets")
    .select("asset_code, name")
    .eq("id", id)
    .single();
  if (!current) {
    return { ok: false, error: "Asset not found." };
  }

  const { error } = await supabase.from("pi_facility_assets").delete().eq("id", id);
  if (error) {
    if (String(error.code) === "23503") {
      return {
        ok: false,
        error: `Cannot delete ${current.asset_code} — it is referenced by impacts, controls, or conflicts. Remove those links first.`,
      };
    }
    return { ok: false, error: error.message };
  }

  await supabase.from("pi_audit_log").insert({
    entity_type: "pi_facility_assets",
    entity_id: id,
    action: "ASSET_DELETED",
    previous_state: { asset_code: current.asset_code, name: current.name },
    new_state: null,
    performed_by: user?.id || null,
    notes: `Asset deleted: ${current.asset_code} (${current.name}).`,
  });

  revalidatePath("/assets");
  revalidatePath("/dashboard");
  revalidatePath("/audit");
  return { ok: true };
}