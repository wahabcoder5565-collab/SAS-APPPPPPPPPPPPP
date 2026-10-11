import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EvaluationScorecard from "./eval-scorecard";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckSquare,
  Cpu,
  FileText,
  Flame,
  FlaskConical,
  GitCompare,
  Layers,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

// Fetch count statistics
  const [
    { count: permitsCount },
    { count: changesCount },
    { count: assetsCount },
    { count: actionsCount },
    { count: conflictsCount },
    { count: criticalCount },
    { count: pendingSignoffsCount },
  ] = await Promise.all([
    supabase.from("pi_permits").select("*", { count: "exact", head: true }),
    supabase.from("pi_permit_changes").select("*", { count: "exact", head: true }),
    supabase.from("pi_facility_assets").select("*", { count: "exact", head: true }),
    supabase.from("pi_implementation_actions").select("*", { count: "exact", head: true }),
    supabase
      .from("pi_conflicts")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("pi_permit_changes")
      .select("*", { count: "exact", head: true })
      .eq("severity", "critical"),
    supabase
      .from("pi_implementation_actions")
      .select("*", { count: "exact", head: true })
      .in("status", ["evidence_submitted", "in_review"]),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden rounded-2xl p-7 glass-panel border-cyan-900/40 bg-gradient-to-r from-slate-900/90 via-white/90 to-slate-900/90">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/50 text-cyan-400 text-xs font-semibold mb-3">
              <Flame className="w-3.5 h-3.5" /> NorthRiver Refining · Refinery Complex #1
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Permit Compliance & Delta Command Center
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Real-time monitoring of Title V Air Operating Permit changes, automated gap detection on refinery equipment, and audit-ready remediation tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/permits"
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Ingest Revised Permit
            </Link>
            <Link
              href="/delta"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <GitCompare className="w-4 h-4" />
              View Active Delta
            </Link>
          </div>
        </div>
      </div>

      {/* Regulatory Review Banner */}
      <div className="rounded-2xl border border-amber-700/50 bg-gradient-to-r from-amber-950/40 via-amber-950/20 to-slate-950/20 p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-700/50 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-amber-300">
              Review Required — {(criticalCount || 0) + (conflictsCount || 0)} Regulatory Findings
            </div>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
              {(criticalCount || 0)} critical permit changes and {(conflictsCount || 0)} internal conflicts detected —
              incl. Boiler B-07 NOx limit tightening (0.080 → 0.050 lb/MMBtu) with outdated SOP-44 & DCS alarm (0.075).
              {pendingSignoffsCount ? ` ${pendingSignoffsCount} actions await human sign-off.` : ""}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <Link
                href="/delta"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-amber-600/15 border border-amber-700/60 text-amber-300 hover:bg-amber-600/25 transition-all"
              >
                Review Delta Register <ArrowUpRight className="w-3 h-3" />
              </Link>
              <Link
                href="/actions"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:border-slate-500 transition-all"
              >
                Open Sign-Off Queue <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Demo data notice */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-2.5 flex items-center gap-2 text-[11px] text-slate-500">
        <FlaskConical className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>
          Synthetic demo dataset (NorthRiver Refining prototype). Permit values & CEMS history are simulated — not real
          regulatory records.
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Permits */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Permit Baseline</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground font-mono">{permitsCount || 2}</span>
            <span className="text-xs text-slate-400">Title V Revisions</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Baseline: <strong className="text-slate-300">T-V-2021-R2</strong>
          </div>
        </div>

        {/* KPI 2: Identified Changes */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Delta Obligations</span>
            <GitCompare className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400 font-mono">{changesCount || 5}</span>
            <span className="text-xs text-slate-400">Total Modified</span>
          </div>
          <div className="mt-3 text-[11px] text-rose-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            {criticalCount || 0} Critical · {conflictsCount || 0} Conflicts Detected
          </div>
        </div>

        {/* KPI 3: Monitored Assets */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Mapped Units</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground font-mono">{assetsCount || 5}</span>
            <span className="text-xs text-slate-400">Refinery Assets</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span>Impacted: <strong className="text-slate-200">B-07 (Boiler) & CT-4 (Cooling)</strong></span>
          </div>
        </div>

        {/* KPI 4: Action Items */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Action Plan</span>
            <CheckSquare className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground font-mono">{actionsCount || 4}</span>
            <span className="text-xs text-slate-400">Remediation Steps</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span>Human Sign-off: <strong className="text-amber-400">Pending Review</strong></span>
          </div>
        </div>
      </div>

      {/* Critical Hero Alert Cases */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            High Priority Regulatory Impact Findings
          </h2>
          <span className="text-xs text-slate-400">Synthetic Scenario: NorthRiver Refining Baseline</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Hero Case 1: Boiler B-07 */}
          <div className="glass-panel rounded-2xl p-6 border-rose-900/50 bg-gradient-to-b from-rose-950/20 to-slate-900/60 relative group hover:border-rose-500/40 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-rose-400 font-bold font-mono">
                  B-07
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    Utility Boiler #7 · NOx Limit Reduction
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800 font-mono">
                      CRITICAL RISK
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Utilities / Steam Plant · 250 MMBtu/hr</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2 mb-4 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Current Permit Limit:</span>
                <span className="text-slate-200">0.080 lb/MMBtu (24-hr rolling)</span>
              </div>
              <div className="flex justify-between text-rose-400 font-semibold">
                <span>Revised Permit Limit:</span>
                <span>0.050 lb/MMBtu (24-hr rolling) (-37.5%)</span>
              </div>
              <div className="flex justify-between text-amber-400 pt-1 border-t border-slate-800">
                <span>Recorded CEMS Range (6-mo log):</span>
                <span>0.042–0.074 lb/MMBtu</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              <strong>Technical Assessment:</strong> Six-month CEMS log shows 3 operating periods between 0.051 and
              0.074 lb/MMBtu — repeated excursions under the new 0.050 limit. SOP-44 still cites the obsolete 0.080
              value and the DCS NOx alarm triggers at 0.075. Requires FGR O2 trim re-tuning, SOP-44 revision, and CEMS
              span/calibration verification.
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
              <div className="text-[11px] text-slate-400">
                Remediation Plan: <strong className="text-slate-200">$18,000 FGR tuning · $12,000 CEMS · $3,500 SOP</strong>
              </div>
              <Link
                href="/actions"
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 inline-flex items-center gap-1"
              >
                Inspect Work Plan <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Hero Case 2: Cooling Tower CT-4 */}
          <div className="glass-panel rounded-2xl p-6 border-amber-900/50 bg-gradient-to-b from-amber-950/20 to-slate-900/60 relative group hover:border-amber-500/40 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400 font-bold font-mono">
                  CT-4
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    Cooling Tower #4 · VOC Monitoring Gap
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 font-mono">
                      MODERATE GAP
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Process Cooling Complex · 45,000 gpm</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2 mb-4 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Current Sampling Cadence:</span>
                <span className="text-slate-200">Monthly El Paso Stripping Method</span>
              </div>
              <div className="flex justify-between text-amber-400 font-semibold">
                <span>Revised Sampling Cadence:</span>
                <span>Every 14 days El Paso Stripping Method (2x Freq)</span>
              </div>
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                <span>Existing Lab Contract:</span>
                <span>Monthly pickup schedule</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              <strong>Technical Assessment:</strong> SOP-31, the CT-4 VOC inspection form, and the 2024 environmental
              calendar all still schedule monthly (30-day) sampling — half the required frequency. Requires amending the
              certified analytical lab contract and updating the sampling SOP and calendar.
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
              <div className="text-[11px] text-slate-400">
                Remediation Plan: <strong className="text-slate-200">Lab contract amendment · SOP-31 & calendar update</strong>
              </div>
              <Link
                href="/impacts"
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
              >
                Inspect Asset Impact <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quantitative Evaluation Scorecard */}
      <EvaluationScorecard />

      {/* Workflow Navigation Quick Access */}
      <div>
        <h2 className="text-base font-bold text-foreground mb-4">End-to-End Workflow Stages</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/delta"
            className="glass-panel glass-panel-hover p-5 rounded-2xl border-slate-800 block group"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
              <GitCompare className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground group-hover:text-cyan-400 transition-colors">
              1. Obligation Delta Comparison
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Side-by-side comparison of permit clauses, numeric limit deltas, and semantic match scoring.
            </p>
          </Link>

          <Link
            href="/impacts"
            className="glass-panel glass-panel-hover p-5 rounded-2xl border-slate-800 block group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground group-hover:text-emerald-400 transition-colors">
              2. Facility Asset Impact Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Correlates changed obligations directly against refinery equipment specifications, controls, and operating limits.
            </p>
          </Link>

          <Link
            href="/actions"
            className="glass-panel glass-panel-hover p-5 rounded-2xl border-slate-800 block group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground group-hover:text-blue-400 transition-colors">
              3. Traceable Action Plan
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Department task assignments, cost estimates, timelines, and audit logs with human approval gates.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
