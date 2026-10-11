import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Layers,
  CheckSquare,
  ArrowRight,
  FileSearch,
} from "lucide-react";
import ImpactsClientList from "./impacts-client-list";
import { resolveComparisonImpactsAction } from "@/app/permits/actions";

const CONFLICT_BADGES: Record<string, { label: string; className: string }> = {
  sop_parameter_mismatch: {
    label: "SOP conflict",
    className: "bg-amber-950/70 border-amber-800/60 text-amber-300",
  },
  alarm_setpoint_mismatch: {
    label: "DCS alarm conflict",
    className: "bg-rose-950/70 border-rose-800/60 text-rose-300",
  },
  cadence_mismatch: {
    label: "Cadence conflict",
    className: "bg-sky-950/70 border-sky-800/60 text-sky-300",
  },
  historical_excursion: {
    label: "Historical excursion",
    className: "bg-orange-950/70 border-orange-800/60 text-orange-300",
  },
};

export default async function ImpactsPage() {
  const supabase = await createClient();

  const { data: mappings } = await supabase
    .from("pi_impact_mappings")
    .select(`
      *,
      asset:pi_facility_assets (*),
      change:pi_permit_changes (*),
      actions:pi_implementation_actions (*)
    `)
    .order("risk_level", { ascending: true }); // High risks first

  const { data: comparison } = await supabase
    .from("pi_comparisons")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: conflictCount } = await supabase
    .from("pi_conflicts")
    .select("id", { count: "exact", head: true });

  const { data: conflicts } = await supabase
    .from("pi_conflicts")
    .select(
      "id, conflict_type, summary, permit_value, control_value, confidence, citation, change:pi_permit_changes(summary)"
    )
    .order("created_at", { ascending: false })
    .limit(24);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/50 text-cyan-400 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" /> Facility Context Engine
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Refinery Asset Impact Matrix
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-references regulatory permit deltas with physical equipment specs, installed controls, and operating envelopes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <form action={resolveComparisonImpactsAction}>
            <input type="hidden" name="comparison_id" value={comparison?.id ?? ""} />
            <button
              type="submit"
              disabled={!comparison}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-600/60 text-slate-200 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileSearch className="w-3.5 h-3.5" />
              Run Facility Impact Resolution
            </button>
          </form>
          <Link
            href="/actions"
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40 transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" />
            Proceed to Implementation Plan
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Downstream Conflicts (Phase 5 engine output) */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Layers className="w-4 h-4 text-cyan-400" />
            Downstream Conflicts
          </div>
          <span className="text-xs text-slate-400">
            {conflictCount ?? 0} detected · metadata-filtered retrieval + deterministic checks
          </span>
        </div>
        {(conflicts ?? []).length === 0 ? (
          <p className="px-5 py-6 text-xs text-slate-500">
            No conflicts resolved yet. Run facility impact resolution to compare the
            revised permit limits against SOPs, DCS alarm setpoints, schedules, and
            historical monitoring.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800/70">
            {(conflicts ?? []).map((c) => {
              const badge = CONFLICT_BADGES[c.conflict_type] ?? {
                label: c.conflict_type,
                className: "bg-slate-800 border-slate-700 text-slate-300",
              };
              const citation = c.citation as { document_title?: string; page_or_section?: string } | null;
              const change = Array.isArray(c.change)
                ? (c.change as { summary: string }[])[0]
                : (c.change as { summary: string } | null);
              return (
                <li key={c.id} className="px-5 py-3.5 space-y-1.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <p className="text-xs text-slate-200 truncate">
                        {change?.summary ?? ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-500 tabular-nums">
                      {(Number(c.confidence) * 100).toFixed(0)}% conf
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{c.summary}</p>
                  <p className="text-[11px] text-slate-500">
                    Evidence: {citation?.document_title ?? "—"}
                    {citation?.page_or_section ? ` · ${citation.page_or_section}` : ""}
                    {c.permit_value && c.control_value
                      ? ` · permit ${c.permit_value} vs internal ${c.control_value}`
                      : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Interactive List */}
      <ImpactsClientList initialMappings={mappings || []} />
    </div>
  );
}
