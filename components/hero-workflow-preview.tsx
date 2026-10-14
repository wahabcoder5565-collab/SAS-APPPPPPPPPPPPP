import { EXAMPLE } from "@/lib/workflow";
import {
  FileText,
  GitCompareArrows,
  Network,
  ListChecks,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

/**
 * A compact, self-contained preview of the PermitImpact AI workflow for the hero.
 * It communicates a change (0.080 → 0.050), the affected asset, the connected
 * records, and the resulting review actions before any domain knowledge is needed.
 */
export default function HeroWorkflowPreview() {
  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl bg-white border border-[#CBD5E1] shadow-[0_12px_40px_-12px_rgba(15,23,42,0.14)] overflow-hidden text-left">
      {/* Window bar */}
      <div className="bg-[#0F172A] px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-white">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
          </div>
          <span className="text-[11px] sm:text-[12px] font-semibold">
            PermitImpact AI · Facility Impact Inspector
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#94A3B8] border border-white/10 bg-white/5 rounded-full px-2.5 py-0.5">
          Synthetic demonstration data
        </span>
      </div>

      <div className="p-4 sm:p-6 bg-white">
        {/* Document comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-stretch gap-3">
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
              <FileText className="w-3.5 h-3.5" />
              Original permit
            </div>
            <div className="mt-2 text-lg font-extrabold font-mono text-[#0F172A]">
              {EXAMPLE.oldLimit}
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">Condition 12.A · T-V-2021-R2</div>
          </div>

          <div className="flex sm:flex-col items-center justify-center gap-1.5">
            <ArrowRight className="w-4 h-4 text-[#94A3B8] rotate-90 sm:rotate-0" />
            <span className="text-[10px] font-mono font-bold text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] rounded-full px-2 py-0.5 whitespace-nowrap">
              {EXAMPLE.changeLabel}
            </span>
          </div>

          <div className="rounded-xl border border-[#93C5FD] bg-[#EFF6FF] p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#1E40AF]">
              <GitCompareArrows className="w-3.5 h-3.5" />
              Revised permit
            </div>
            <div className="mt-2 text-lg font-extrabold font-mono text-[#1D4ED8]">
              {EXAMPLE.newLimit}
            </div>
            <div className="text-[11px] text-[#1D4ED8] mt-0.5">Draft §4.2.1 · T-V-2024-REV</div>
          </div>
        </div>

        {/* Impact + records + result */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
              <Network className="w-3.5 h-3.5" />
              Affected asset
            </div>
            <div className="mt-2 text-[15px] font-bold text-[#0F172A]">{EXAMPLE.asset}</div>
            <div className="text-[11px] text-[#64748B]">{EXAMPLE.assetLong} · {EXAMPLE.pollutant}</div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] mb-2">
              Related records
            </div>
            <ul className="space-y-1.5">
              {[
                ["SOP-44", "Operating procedure"],
                ["DCS alarm", "Alarm setpoint"],
                ["Monitoring", "CEMS controls"],
              ].map(([code, label]) => (
                <li key={code} className="flex items-center gap-2 text-[11.5px]">
                  <span className="font-mono font-bold text-[#1D4ED8]">{code}</span>
                  <span className="text-[#64748B]">· {label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
              <ListChecks className="w-3.5 h-3.5" />
              Result
            </div>
            <p className="mt-2 text-[12px] text-[#334155] leading-relaxed">
              Review actions generated, each linked back to its source finding and evidence.
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              Human approval required
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
