import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CheckSquare, Shield, Sparkles } from "lucide-react";
import RegisterView from "./register-view";
import type { MappingOption, RegisterAction } from "./types";
import type { ActionStatus } from "@/app/actions/workflow";

type RawAction = {
  id: string;
  title: string;
  description: string;
  department: string;
  action_type: string;
  status: ActionStatus;
  estimated_cost: string | number | null;
  estimated_days: number | null;
  lead_time_weeks: number | null;
  due_date: string | null;
  required_evidence: string | null;
  owner_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewer_note: string | null;
  mapping: {
    id: string;
    risk_level: string | null;
    asset: { asset_code: string; name: string | null } | null;
    change: {
      id: string;
      summary: string | null;
      new_requirement: {
        parameter: string | null;
        limit_value: string | number | null;
        unit: string | null;
        pollutant: string | null;
      } | null;
    } | null;
  } | null;
  owner: { id: string; full_name: string; title: string | null; department: string | null } | null;
};

function castRows<T>(rows: unknown): T[] {
  return rows as T[];
}

export default async function ActionsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("pi_implementation_actions")
    .select(`
      id,
      title,
      description,
      department,
      action_type,
      status,
      estimated_cost,
      estimated_days,
      lead_time_weeks,
      due_date,
      required_evidence,
      owner_id,
      reviewed_by,
      reviewed_at,
      reviewer_note,
      mapping:pi_impact_mappings (
        id,
        risk_level,
        asset:pi_facility_assets (asset_code, name),
        change:pi_permit_changes (
          id,
          summary,
          new_requirement:pi_permit_requirements!new_requirement_id (
            parameter, limit_value, unit, pollutant
          )
        )
      ),
      owner:pi_users!owner_id (id, full_name, title, department)
    `)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  const { data: rawEvidence } = await supabase
    .from("pi_evidence")
    .select(
      "id, action_id, file_url, title, document_type, ai_check_status, ai_confidence, ai_check_reason, uploaded_by_name, created_at"
    )
    .order("created_at", { ascending: true });

  const { data: rawOwners } = await supabase
    .from("pi_users")
    .select("id, full_name, title, department, role")
    .order("full_name", { ascending: true });

  const { data: rawMappings } = await supabase
    .from("pi_impact_mappings")
    .select(`
      id,
      risk_level,
      asset:pi_facility_assets (asset_code, name)
    `);

  const actions: RegisterAction[] = castRows<RawAction>(data).map((a) => ({
    ...a,
    estimated_cost: a.estimated_cost,
    status: a.status,
  }));

  const evidence = castRows<import("./types").EvidenceRow>(rawEvidence);

  const owners = castRows<{ id: string; full_name: string; title: string | null; department: string | null; role: string }>(
    rawOwners
  );

  const mappings: MappingOption[] = castRows<MappingOption>(rawMappings);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/50 text-cyan-400 text-xs font-semibold mb-2">
            <CheckSquare className="w-3.5 h-3.5" /> Implementation Register
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Compliance Action & Task Lifecycle
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full-lifecycle remediation tracker — owners, deadlines, budgets, and the Propose ➔ Approve workflow.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/audit"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-2"
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            Inspect Audit Trail
          </Link>
        </div>
      </div>

      <div className="flex items-start gap-2 p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-300">
        <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <p>
          Tasks are auto-proposed from detected permit conflicts via the Impact Mapping engine. Every transition
          along Propose ➔ In Review ➔ In Progress ➔ Evidence Submitted ➔ Approved / Rejected is persisted to the
          audit trail; only a human reviewer can approve closure.
        </p>
      </div>

      <RegisterView actions={actions} owners={owners} mappings={mappings} evidence={evidence} />
    </div>
  );
}