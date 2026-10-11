"use client";

import { useState } from "react";
import Link from "next/link";
import { verifyImpactAction } from "@/app/impacts/actions";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Wrench,
  CheckSquare,
  Sparkles,
  Filter,
} from "lucide-react";

interface ImpactsClientListProps {
  initialMappings: any[];
}

export default function ImpactsClientList({ initialMappings }: ImpactsClientListProps) {
  const [mappings, setMappings] = useState(initialMappings);
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredMappings = mappings.filter((m) => {
    if (filterRisk !== "all" && m.risk_level !== filterRisk) return false;
    return true;
  });

  async function handleToggleVerify(mappingId: string, currentStatus: boolean) {
    try {
      setUpdatingId(mappingId);
      await verifyImpactAction(mappingId, !currentStatus);
      setMappings((prev) =>
        prev.map((m) => (m.id === mappingId ? { ...m, human_verified: !currentStatus } : m))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update verification status");
    } finally {
      setUpdatingId(null);
    }
  }

  const riskBadges: Record<string, string> = {
    high: "bg-rose-950/80 text-rose-400 border-rose-800/80",
    medium: "bg-amber-950/80 text-amber-400 border-amber-800/80",
    low: "bg-emerald-950/80 text-emerald-400 border-emerald-800/80",
  };

  const impactTypeLabels: Record<string, string> = {
    exceedance_risk: "Emission Exceedance Risk",
    monitoring_gap: "Monitoring & Sampling Gap",
    operational_constraint: "Operational Constraint",
    reporting_change: "Reporting Procedure Modification",
  };

  return (
    <div className="space-y-6">
      {/* Risk Filter */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-slate-300 font-medium">Filter Severity:</span>
        <div className="flex gap-1.5">
          {["all", "high", "medium", "low"].map((risk) => (
            <button
              key={risk}
              onClick={() => setFilterRisk(risk)}
              className={`px-3 py-1 rounded-lg capitalize font-mono transition-all cursor-pointer ${
                filterRisk === risk
                  ? "bg-cyan-600 text-white font-semibold"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {risk} Risk
            </button>
          ))}
        </div>
      </div>

      {/* Mappings */}
      <div className="space-y-6">
        {filteredMappings.map((m) => {
          const isHigh = m.risk_level === "high";
          const asset = m.asset;
          const isUpdating = updatingId === m.id;

          return (
            <div
              key={m.id}
              className={`glass-panel p-6 rounded-2xl border-slate-800 space-y-4 transition-all ${
                isHigh ? "border-l-4 border-l-rose-500" : "border-l-4 border-l-amber-500"
              }`}
            >
              {/* Asset Header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-bold text-sm text-cyan-400">
                    {asset?.asset_code}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-foreground">{asset?.name}</h2>
                      {asset?.is_bottleneck && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800/80 text-rose-400 font-semibold">
                          CRITICAL BOTTLENECK
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {asset?.area} · {asset?.asset_type} ({asset?.capacity})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase tracking-wider font-bold border ${
                      riskBadges[m.risk_level] || riskBadges.low
                    }`}
                  >
                    {m.risk_level} Risk: {impactTypeLabels[m.impact_type] || m.impact_type}
                  </span>

                  {/* Human Verification Action Button */}
                  <button
                    onClick={() => handleToggleVerify(m.id, m.human_verified)}
                    disabled={isUpdating}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                      m.human_verified
                        ? "bg-emerald-950/80 border-emerald-800 text-emerald-300"
                        : "bg-slate-900 border-slate-800 text-amber-300 hover:border-amber-500/50"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {m.human_verified ? "Engineer Verified" : "Awaiting Verification"}
                  </button>
                </div>
              </div>

              {/* Technical Analysis Box */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    Automated Technical Engineering Analysis
                  </span>
                  <span className="text-cyan-400 font-mono text-[11px]">
                    Confidence: {Math.round((m.confidence_score || 0.9) * 100)}%
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {m.technical_analysis}
                </p>
              </div>

              {/* Equipment Context & Operating Envelope */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                  <span className="text-[10px] uppercase text-slate-500 block mb-1">
                    Installed Air Pollution Controls
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Array.isArray(asset?.installed_controls) ? (
                      asset.installed_controls.map((ctrl: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[11px]"
                        >
                          {ctrl}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500">None specified</span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                  <span className="text-[10px] uppercase text-slate-500 block mb-1">
                    Monitoring & Instrumentation Systems
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Array.isArray(asset?.monitoring_systems) ? (
                      asset.monitoring_systems.map((mon: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[11px]"
                        >
                          {mon}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500">None specified</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Implementation Action Items Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <Wrench className="w-4 h-4 text-cyan-400" />
                  <span>
                    Linked Action Items:{" "}
                    <strong className="text-slate-200">
                      {m.actions?.length || 0} Remediation Steps
                    </strong>
                  </span>
                </div>

                <Link
                  href="/actions"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1.5"
                >
                  Manage Implementation Action Plan
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
