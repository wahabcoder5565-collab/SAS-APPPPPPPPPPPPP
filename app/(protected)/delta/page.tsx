import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { runComparisonAction } from "@/app/permits/actions";
import {
  GitCompare,
  CheckCircle2,
  ArrowRight,
  Layers,
  Activity,
  CheckSquare,
  Gauge,
  Sparkles,
} from "lucide-react";
import DeltaClientList from "./delta-client-list";
import { KpiStats, ChangeRow, MappingLite, RequirementLite } from "./types";

function normalizeMapping(value: MappingLite[] | MappingLite | null): MappingLite | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function normalizeRequirement(value: RequirementLite[] | RequirementLite | null): RequirementLite | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export default async function DeltaPage() {
  const supabase = await createClient();

  // Fetch active comparison
  const { data: comparison } = await supabase
    .from("pi_comparisons")
    .select(`
      *,
      current_permit:pi_permits!current_permit_id (*),
      revised_permit:pi_permits!revised_permit_id (*)
    `)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch changes scoped to the active comparison (with requirements + impact mapping)
  const { data: rawChanges } = await supabase
    .from("pi_permit_changes")
    .select(`
      *,
      old_requirement:pi_permit_requirements!old_requirement_id (*),
      new_requirement:pi_permit_requirements!new_requirement_id (*),
      mapping:pi_impact_mappings (
        id,
        risk_level,
        confidence_score,
        technical_analysis,
        impact_type,
        asset:pi_facility_assets (asset_code, name, asset_type)
      )
    `)
    .eq(
      "comparison_id",
      comparison?.id ?? "00000000-0000-0000-0000-000000000000",
    )
    .order("severity", { ascending: true }); // 'critical' will be prioritized

  const changes: ChangeRow[] = (rawChanges ?? []).map((c) => ({
    id: c.id,
    summary: c.summary,
    delta_description: c.delta_description,
    change_type: c.change_type,
    change_kind: c.change_kind,
    severity: c.severity,
    old_value: c.old_value,
    new_value: c.new_value,
    confidence: c.confidence,
    ai_reasoning: c.ai_reasoning,
    review_status: c.review_status,
    reviewed_by: c.reviewed_by,
    reviewed_at: c.reviewed_at,
    created_at: c.created_at,
    comparison_id: c.comparison_id,
    old_requirement: normalizeRequirement(c.old_requirement),
    new_requirement: normalizeRequirement(c.new_requirement),
    mapping: normalizeMapping(c.mapping),
  }));

  // KPI: unresolved implementation actions (anything not approved/completed)
  const { count: unresolvedActions } = await supabase
    .from("pi_implementation_actions")
    .select("id", { count: "exact", head: true })
    .not("status", "in", "(approved,completed)");

  // KPI: severities, review statuses, confidence spread
  const bySeverity: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const confidences: number[] = [];
  for (const ch of changes) {
    bySeverity[ch.severity] = (bySeverity[ch.severity] ?? 0) + 1;
    byStatus[ch.review_status] = (byStatus[ch.review_status] ?? 0) + 1;
    if (ch.confidence !== null && ch.confidence !== undefined) {
      confidences.push(Number(ch.confidence));
    }
  }
  const avg =
    confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0;
  const kpi: KpiStats = {
    total: changes.length,
    bySeverity,
    byStatus,
    unresolvedActions: unresolvedActions ?? 0,
    confidence: {
      avg,
      min: confidences.length > 0 ? Math.min(...confidences) : 0,
      max: confidences.length > 0 ? Math.max(...confidences) : 0,
      high: confidences.filter((c) => c >= 0.95).length,
      mid: confidences.filter((c) => c >= 0.9 && c < 0.95).length,
      low: confidences.filter((c) => c < 0.9).length,
    },
  };

  // Permits available for running a new deterministic comparison
  const { data: permits } = await supabase
    .from("pi_permits")
    .select("id, permit_number, title, type")
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/50 text-cyan-400 text-xs font-semibold mb-2">
            <GitCompare className="w-3.5 h-3.5" /> Change Command Center
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Permit Change Register
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Every deterministic delta between the baseline and revised Title V permits, ranked
            for operational impact and ready for engineering review.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/impacts"
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            Asset Impact Matrix
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Run Deterministic Comparison */}
      <div className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/40">
        <form action={runComparisonAction} className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">
              Baseline Permit
            </label>
            <select
              name="currentId"
              defaultValue={
                comparison?.current_permit_id ?? permits?.[0]?.id ?? ""
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs font-mono text-slate-100 outline-none"
            >
              {(permits ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.permit_number} — {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">
              Revised Permit
            </label>
            <select
              name="revisedId"
              defaultValue={
                comparison?.revised_permit_id ?? permits?.[1]?.id ?? ""
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs font-mono text-slate-100 outline-none"
            >
              {(permits ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.permit_number} — {p.title}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <GitCompare className="w-3.5 h-3.5" />
            Run Deterministic Diff
          </button>
        </form>
        <p className="text-[11px] text-slate-500 mt-3">
          Numeric deltas, cadence changes, and averaging shifts are computed by
          deterministic TypeScript code; only non-numeric clause shifts are
          categorized by the Gemini flash classifier.
        </p>
      </div>

      {/* KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Total Changes</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground font-mono">{kpi.total}</span>
            <span className="text-xs text-slate-400">Delta Items</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Awaiting review: <strong className="text-amber-300">{kpi.byStatus.pending ?? 0}</strong>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Severity Breakdown</span>
            <Gauge className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl font-bold text-rose-400 font-mono">{kpi.bySeverity.critical ?? 0}</span>
            <span className="text-xs text-slate-400">critical</span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
            <span className="px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-400 border border-amber-800/80">{kpi.bySeverity.moderate ?? 0} moderate</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-400 border border-blue-800/80">{kpi.bySeverity.low ?? 0} low</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800">{kpi.bySeverity.administrative ?? 0} admin</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Unresolved Actions</span>
            <CheckSquare className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground font-mono">{kpi.unresolvedActions}</span>
            <span className="text-xs text-slate-400">Implementation Steps</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Not yet approved / completed
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">AI Confidence</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-400 font-mono">
              {kpi.confidence.avg > 0 ? Math.round(kpi.confidence.avg * 100) : 0}%
            </span>
            <span className="text-xs text-slate-400">
              avg · {Math.round(kpi.confidence.min * 100)}–{Math.round(kpi.confidence.max * 100)}%
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            {[
              ["≥95%", kpi.confidence.high, "bg-emerald-400"],
              ["90–94%", kpi.confidence.mid, "bg-cyan-400"],
              ["<90%", kpi.confidence.low, "bg-amber-400"],
            ].map(([label, count, color]) => (
              <div key={String(label)} className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-slate-500 w-10">{label}</span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{
                      width: `${kpi.total > 0 ? (Number(count) / kpi.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-slate-300 w-4 text-right">{String(count)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Comparison Meta Banner */}
      <div className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/40 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Baseline Permit</span>
          <span className="text-cyan-400 font-semibold">{comparison?.current_permit?.permit_number || "T-V-2021-R2"}</span>
          <span className="text-slate-400 block text-[11px] truncate">{comparison?.current_permit?.title || "Title V 2021"}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Revised Permit</span>
          <span className="text-amber-400 font-semibold">{comparison?.revised_permit?.permit_number || "T-V-2024-REV"}</span>
          <span className="text-slate-400 block text-[11px] truncate">{comparison?.revised_permit?.title || "Title V 2024 Renewal Draft"}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Delta Detection Status</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Deterministic Pass Complete
          </span>
          <span className="text-slate-400 block text-[11px]">{changes.length} Delta Items Detected</span>
        </div>
      </div>

      {/* Interactive Change Register */}
      <DeltaClientList initialChanges={changes} />
    </div>
  );
}