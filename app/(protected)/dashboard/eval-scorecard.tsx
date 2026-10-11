import { createClient } from "@/lib/supabase/server";
import { runEvaluation } from "@/lib/evaluation";
import { Gauge, CheckCircle2, XCircle } from "lucide-react";

export default async function EvaluationScorecard() {
  const supabase = await createClient();
  const report = await runEvaluation(supabase);

  return (
    <div className="glass-panel rounded-2xl p-6 border-slate-800">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div className="text-xs font-bold text-foreground flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <span>Quantitative Evaluation Scorecard</span>
        </div>
        <div
          className={`px-3 py-1 rounded-lg text-[11px] font-mono font-semibold border flex items-center gap-1.5 ${
            report.overallPass
              ? "bg-emerald-950/50 border-emerald-800/60 text-emerald-300"
              : "bg-rose-950/50 border-rose-800/60 text-rose-300"
          }`}
        >
          {report.overallPass ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" /> PROTOTYPE GATE: ALL KPI TARGETS MET
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5" /> KPI TARGET(S) MISSED
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {report.scorecard.map((kpi) => (
          <div
            key={kpi.key}
            className={`rounded-xl border p-4 bg-slate-950/80 ${
              kpi.pass ? "border-emerald-900/60" : "border-rose-900/60"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {kpi.label}
              </span>
              {kpi.pass ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className={`text-2xl font-bold font-mono ${kpi.pass ? "text-emerald-400" : "text-rose-400"}`}>
                {kpi.value}
              </span>
              <span className="text-xs text-slate-400 font-mono">{kpi.unit}</span>
              <span className="ml-auto text-[10px] text-slate-500 font-mono">
                {kpi.key === "unsupported_claim" ? `target ≤ ${kpi.target}` : `target ≥ ${kpi.target}`}
                {kpi.unit}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{kpi.detail}</p>
            <div className="text-[10px] font-mono text-slate-600 mt-2">
              expected {kpi.compared.expected} · found {kpi.compared.found}
            </div>
          </div>
        ))}
      </div>

      <div className="text-[11px] text-slate-500 font-mono mt-4 pt-3 border-t border-slate-800">
        Evaluation run {new Date(report.generatedAt).toLocaleString()} · ground truth fixtures in{" "}
        <code className="text-cyan-500">pi_eval_ground_truth</code> · quality gate only — does not substitute for
        regulatory sign-off.
      </div>
    </div>
  );
}