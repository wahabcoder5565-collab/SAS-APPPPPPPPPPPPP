"use client";

import { useState } from "react";
import {
  Flame,
  CheckCircle2,
  ChevronRight,
  FileText,
  AlertTriangle,
  Layers,
  ArrowRight,
  Sliders,
  Check,
} from "lucide-react";
import Link from "next/link";

interface Scenario {
  id: string;
  tag: string;
  asset: string;
  category: string;
  severity: "critical" | "warning" | "info";
  severityLabel: string;
  baselineClause: string;
  baselineLimit: string;
  revisedClause: string;
  revisedLimit: string;
  deltaBadge: string;
  cemsFinding: string;
  facilityImpact: string;
  affectedRecords: { code: string; title: string; issue: string }[];
  evidenceSource: string;
  suggestedAction: string;
}

const scenarios: Scenario[] = [
  {
    id: "boiler-b07",
    tag: "B-07",
    asset: "Utility Boiler #7 (250 MMBtu/hr)",
    category: "Combustion Unit · NOx Emissions · Continuous CEMS",
    severity: "critical",
    severityLabel: "Critical Limit Tightening",
    baselineClause: "Condition 12.A (Permit T-V-2021-R2)",
    baselineLimit: "0.080 lb/MMBtu (24-hr rolling avg)",
    revisedClause: "Draft Section 4.2.1 (T-V-2024-REV, p. 114)",
    revisedLimit: "0.050 lb/MMBtu (24-hr rolling avg)",
    deltaBadge: "-37.5% Reduction",
    cemsFinding: "Historical 6-month log recorded 3 periods between 0.051 and 0.074 lb/MMBtu.",
    facilityImpact:
      "Facility operates under existing DCS alarm setpoint at 0.075 lb/MMBtu. Operating procedure SOP-44 references the obsolete 0.080 threshold. If adopted without burner FGR re-tuning, normal operating swings will trigger exceedance events.",
    affectedRecords: [
      { code: "SOP-44", title: "Boiler Firing Rate Controls", issue: "Cites obsolete 0.080 limit" },
      { code: "TAG-NOX-B07", title: "DCS Alarm Setpoint", issue: "Alarm configured to 0.075 lb/MMBtu" },
      { code: "CEMS-QA-B07", title: "Span & Calibration Register", issue: "Requires re-certification for 0.050 span" },
    ],
    evidenceSource: "Draft Permit Section 4.2.1, Table 4-1, Page 114 · Cross-referenced with Condition 12.A",
    suggestedAction:
      "Vendor FGR O2 trim re-tuning ($18k), update SOP-44 operating envelopes, and recalibrate DCS alarm setpoint to 0.045 lb/MMBtu warning.",
  },
  {
    id: "tower-ct4",
    tag: "CT-4",
    asset: "Process Cooling Tower #4 (45,000 gpm)",
    category: "Heat Exchange Complex · VOC Stripping · Modified El Paso",
    severity: "warning",
    severityLabel: "Monitoring Cadence Shift",
    baselineClause: "Condition 7.B (Permit T-V-2021-R2)",
    baselineLimit: "Monthly sampling via Modified El Paso Method",
    revisedClause: "Draft Condition 8.C (T-V-2024-REV, p. 48)",
    revisedLimit: "Every 14 calendar days (2x Cadence)",
    deltaBadge: "Frequency Doubled",
    cemsFinding: "Existing analytical laboratory contract is structured on a 30-day turnaround interval.",
    facilityImpact:
      "Internal environmental inspection calendar, field sampling SOP-31, and external courier contract only provide monthly sampling. Facility will fall out of compliance within 2 weeks of permit issuance without updated contract terms.",
    affectedRecords: [
      { code: "SOP-31", title: "Cooling Tower Field Stripping", issue: "Specifies 30-day sampling interval" },
      { code: "LAB-CONTR-81", title: "Analytical Courier Schedule", issue: "Pickup scheduled once per calendar month" },
      { code: "ENV-CAL-2024", title: "Master Environmental Calendar", issue: "Lacks bi-weekly recurring trigger" },
    ],
    evidenceSource: "Draft Permit Condition 8.C, Page 48 · Baseline Permit Condition 7.B, Page 32",
    suggestedAction:
      "Amend third-party analytical lab courier schedule to bi-weekly pickup; revise SOP-31 and environmental master schedule.",
  },
  {
    id: "flare-f101",
    tag: "F-101",
    asset: "Primary Elevated Flare Header",
    category: "Control Device · 40 CFR 60 Subpart Ja · Net Heating Value",
    severity: "info",
    severityLabel: "Operating Envelope Check",
    baselineClause: "Condition 19.D (Permit T-V-2021-R2)",
    baselineLimit: "Net Heating Value (NHVcz) ≥ 270 Btu/sc",
    revisedClause: "Draft Condition 21.A (T-V-2024-REV, p. 86)",
    revisedLimit: "NHVcz ≥ 270 Btu/sc + Supplemental Gas Automation",
    deltaBadge: "Automation Mandate",
    cemsFinding: "Calorimeter signal currently relies on manual operator trim assist.",
    facilityImpact:
      "Draft permit mandates automated supplemental fuel gas injection whenever combustion zone net heating value dips below 300 Btu/sc buffer. Automatic DCS cascade trim valve loop is uncommissioned.",
    affectedRecords: [
      { code: "LOOP-FIC-881", title: "DCS Supplemental Fuel Control", issue: "Currently set to manual operator assist" },
      { code: "FMP-REV-4", title: "Flare Management Plan", issue: "Requires automated sweep gas logic update" },
      { code: "OPER-LOG-FLR", title: "Daily Shift Inspection Sheet", issue: "Requires calorimeter verification checklist" },
    ],
    evidenceSource: "Draft Permit Condition 21.A, Page 86 · Flare Subpart Ja Compliance Appendix",
    suggestedAction:
      "Commission automated cascade control loop on trim valve FIC-881; complete 72-hour validation run prior to effective date.",
  },
];

export default function HeroInspectionCard() {
  const [activeTab, setActiveTab] = useState(scenarios[0].id);
  const active = scenarios.find((s) => s.id === activeTab) || scenarios[0];

  const severityStyles = {
    critical: {
      badge: "bg-[#0F172A] text-white border-[#1E293B]",
      dot: "bg-[#DC2626]",
      accent: "text-[#B91C1C]",
    },
    warning: {
      badge: "bg-[#F8FAFC] text-[#92400E] border-[#FDE68A]",
      dot: "bg-[#D97706]",
      accent: "text-[#B45309]",
    },
    info: {
      badge: "bg-[#F8FAFC] text-[#1E40AF] border-[#BFDBFE]",
      dot: "bg-[#1D4ED8]",
      accent: "text-[#1D4ED8]",
    },
  }[active.severity];

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl bg-white border border-[#CBD5E1] shadow-[0_12px_40px_-10px_rgba(15,23,42,0.08),0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden text-left">
      {/* Top Terminal Header Bar */}
      <div className="bg-[#0F172A] px-4 sm:px-6 py-3 border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-3 text-xs text-white">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block" />
          </div>
          <span className="text-[#475569] font-mono text-[11px] hidden sm:inline">|</span>
          <span className="font-semibold text-white flex items-center gap-1.5 text-[11px] sm:text-xs">
            <Flame className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>NorthRiver Refining · Complex #1 Command Layer</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-2.5 py-0.5 rounded-full bg-[#1E293B] text-[#94A3B8] font-mono font-medium border border-white/10">
            T-V-2021-R2 ➔ T-V-2024-REV
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#1D4ED8] text-white font-semibold border border-white/10 hidden md:inline">
            Facility Topological Mapping
          </span>
        </div>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-3 sm:px-6 pt-2.5 flex gap-2 overflow-x-auto no-scrollbar">
        {scenarios.map((s) => {
          const isActive = s.id === activeTab;
          return (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap flex items-center gap-2 border-t border-x cursor-pointer ${
                isActive
                  ? "bg-white border-[#CBD5E1] text-[#0F172A] shadow-xs border-t-2 border-t-[#1D4ED8] font-bold"
                  : "bg-transparent border-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-white/60"
              }`}
            >
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  isActive ? "bg-[#EFF6FF] text-[#1D4ED8]" : "bg-[#E2E8F0] text-[#475569]"
                }`}
              >
                {s.tag}
              </span>
              <span>{s.asset.split(" (")[0]}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Review Content Body */}
      <div className="p-5 sm:p-7 space-y-5 bg-white">
        {/* Unit & Delta Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9]">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base sm:text-lg font-bold text-[#0F172A]">{active.asset}</h4>
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${severityStyles.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${severityStyles.dot}`} />
                {active.severityLabel}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-1">{active.category}</p>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#047857] bg-[#ECFDF5] px-2.5 py-1 rounded-lg border border-[#A7F3D0] shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
              Evidence Anchored · Condition Verified
            </span>
          </div>
        </div>

        {/* Side-by-Side Clause Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Baseline Condition */}
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              <span>Baseline Operating Permit</span>
              <span className="font-mono text-[10px] text-[#94A3B8]">{active.baselineClause.split(" (")[0]}</span>
            </div>
            <div className="text-xs font-semibold text-[#0F172A] bg-white p-3 rounded-lg border border-[#E2E8F0] font-mono shadow-xs">
              {active.baselineLimit}
            </div>
            <p className="text-[11px] text-[#64748B]">Facility historical compliance baseline.</p>
          </div>

          {/* Revised Draft Condition */}
          <div className="rounded-xl border border-[#93C5FD] bg-[#EFF6FF]/70 p-3.5 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#1E40AF] uppercase tracking-wider">
              <span>Proposed Revised Permit</span>
              <span className="px-1.5 py-0.5 text-[9px] rounded bg-[#DBEAFE] text-[#1E40AF] font-mono font-bold">
                {active.deltaBadge}
              </span>
            </div>
            <div className="text-xs font-bold text-[#1E3A8A] bg-white p-3 rounded-lg border border-[#60A5FA] font-mono shadow-xs">
              {active.revisedLimit}
            </div>
            <p className="text-[11px] text-[#1D4ED8] font-medium">{active.cemsFinding}</p>
          </div>
        </div>

        {/* Facility Context Correlation Matrix */}
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4.5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
              <Layers className="w-4 h-4 text-[#1D4ED8]" />
              <span>Facility Operational Context & Conflict Screening</span>
            </div>
            <span className="text-[10px] font-mono text-[#475569] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
              Real Facility Assets
            </span>
          </div>

          <p className="text-xs text-[#334155] leading-relaxed bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-xs">
            {active.facilityImpact}
          </p>

          <div>
            <div className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">
              Cross-Referenced Internal Operating Records & Controls
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {active.affectedRecords.map((rec, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] text-[11px] space-y-1 shadow-xs hover:border-[#93C5FD] transition-colors"
                >
                  <div className="flex items-center gap-1.5 font-mono font-bold text-[#1D4ED8]">
                    <FileText className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
                    <span>{rec.code}</span>
                  </div>
                  <div className="text-[#0F172A] font-semibold leading-tight">{rec.title}</div>
                  <div className="text-[10px] text-[#B45309] font-medium">{rec.issue}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-[11px] text-[#334155] flex items-start sm:items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0 mt-0.5 sm:mt-0" />
              <span>
                Recommended Implementation: <strong className="text-[#0F172A]">{active.suggestedAction}</strong>
              </span>
            </div>

            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#92400E] bg-[#FEF3C7] px-2.5 py-1 rounded-full border border-[#FDE68A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                Awaiting Engineering Sign-Off
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Banner Inside Card */}
      <div className="bg-[#F8FAFC] px-5 sm:px-7 py-3.5 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-[11px] text-[#64748B]">
          Source Citation: <span className="font-mono text-[#0F172A] font-semibold">{active.evidenceSource}</span>
        </div>

        <Link
          href="/demo"
          className="text-[#1D4ED8] hover:text-[#1E40AF] font-bold text-xs inline-flex items-center gap-1.5 transition-colors group"
        >
          <span>Open Full NorthRiver Refining Workspace</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
