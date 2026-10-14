import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import DemoLaunchButton from "@/components/demo-launch-button";
import { SYNTHETIC_DATA_DISCLOSURE } from "@/lib/site-config";
import {
  ArrowRight,
  FileText,
  GitCompare,
  Network,
  AlertTriangle,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  Quote,
  Database,
  Gauge,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Engineering Case Study | PermitImpact AI",
  description:
    "How a single revised permit clause (Boiler B-07 NOx, 0.08 → 0.05 lb/MMBtu) is detected, mapped to assets, checked for conflicts, turned into review actions, and recorded in a hash-chained audit log.",
};

const DATASET = [
  { label: "Permit requirements", value: "38" },
  { label: "Detected changes", value: "18" },
  { label: "Facility assets", value: "25" },
  { label: "Asset controls", value: "27" },
  { label: "Impact mappings", value: "12" },
  { label: "Detected conflicts", value: "7" },
  { label: "Implementation actions", value: "9" },
  { label: "Internal documents", value: "21" },
];

const CONFLICTS = [
  {
    type: "SOP parameter mismatch",
    confidence: "0.97",
    permit: "0.05 lb/MMBtu",
    control: "0.08 lb/MMBtu",
    summary:
      "SOP-44 NOx Operating Limit states 0.08 lb/MMBtu, superseded by the revised permit limit of 0.05 lb/MMBtu.",
    quote:
      "Section 4.2 Combustion Limits — The NOx emission rate from Utility Boiler B-07 shall not exceed 0.08 lb/MMBtu on a 24-hour rolling average while firing refinery fuel gas.",
    source: "SOP-44 §4.2",
  },
  {
    type: "DCS alarm setpoint mismatch",
    confidence: "0.97",
    permit: "0.05 lb/MMBtu",
    control: "0.075 lb/MMBtu",
    summary:
      "The B-07 NOx High Alarm Setpoint is 0.075 lb/MMBtu — above the revised permit limit, so the alarm would never warn before an exceedance.",
    quote: "The DCS high alarm is set at 0.075 lb/MMBtu.",
    source: "SOP-44 §5.1",
  },
  {
    type: "Historical excursion",
    confidence: "0.93",
    permit: "0.05 lb/MMBtu",
    control: "0.074, 0.063, 0.058, 0.052",
    summary:
      "The B-07 CEMS NOx daily-maxima log (Apr–Sep 2024) contains four recorded periods above the revised limit.",
    quote:
      "Period 1 — Jun 18–21 peak 0.063; Period 2 — Jul 09–16 peak 0.074 after low-NOx burner air-staging drift; Period 3 — Aug 27–29 peak 0.058 during a startup transient.",
    source: "B-07 CEMS NOx Daily Maxima Log",
  },
];

const ACTIONS = [
  {
    title: "Flue Gas Recirculation (FGR) O2 Trim Optimization & Tuning",
    department: "operations",
    type: "calibration",
    cost: "$18,000",
    due: "2026-12-27",
    status: "evidence_submitted",
  },
  {
    title: "CEMS NOx Analyzer Span & Calibration Verification",
    department: "instrumentation",
    type: "calibration",
    cost: "$12,000",
    due: "2027-01-05",
    status: "approved",
  },
  {
    title: "Update Title V Operating SOP (SOP-44)",
    department: "environmental",
    type: "procedural",
    cost: "$3,500",
    due: "2027-01-04",
    status: "approved",
  },
];

const STATUS_STYLE: Record<string, string> = {
  approved: "forge-badge-green",
  evidence_submitted: "forge-badge-blue",
  in_review: "forge-badge-amber",
  proposed: "forge-badge-amber",
  in_progress: "forge-badge-blue",
};

export default function CaseStudyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#334155]">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden forge-light-hero border-b border-[#E2E8F0]">
          <div className="forge-light-grid absolute inset-0" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8] mb-3">
              Engineering Case Study
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-[#0F172A] tracking-tight leading-tight">
              Tracing one permit change through an entire system
            </h1>
            <p className="mt-5 text-[15px] text-[#475569] leading-relaxed max-w-3xl">
              A revised Title V clause cuts the Boiler B-07 NOx limit from 0.08 to 0.05 lb/MMBtu. The
              interesting engineering problem is everything that has to happen after that sentence is read —
              reliably, traceably, and with a human in the loop.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <DemoLaunchButton label="See it in the live demo" />
              <Link
                href="/engineering"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white text-[#0F172A] border border-[#CBD5E1] text-[13px] font-semibold hover:border-[#1D4ED8] transition-colors"
              >
                Technical overview <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="mt-5 text-[11px] text-[#64748B]">{SYNTHETIC_DATA_DISCLOSURE}</p>
          </div>
        </section>

        {/* DATASET */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-5">
              <Database className="w-4 h-4 text-[#1D4ED8]" />
              <h2 className="text-[12px] font-mono font-bold uppercase tracking-widest text-[#334155]">
                The Dataset — a prepared benchmark
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {DATASET.map((d) => (
                <div key={d.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                  <div className="text-2xl font-extrabold text-[#0F172A] font-mono">{d.value}</div>
                  <div className="text-[11px] text-[#64748B] mt-1 leading-tight">{d.label}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[12px] text-[#64748B] max-w-3xl">
              All figures are read from the seeded database, not hard-coded into the marketing layer. The
              workspace shows the same rows a reviewer would query directly.
            </p>
          </div>
        </section>

        {/* DOCUMENT INTELLIGENCE */}
        <section id="document-intelligence" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <GitCompare className="w-4 h-4 text-[#1D4ED8]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8]">
                Document Intelligence
              </span>
            </div>
            <h2 className="text-2xl sm:text-[1.9rem] font-extrabold text-[#0F172A] tracking-tight">
              The diff is deterministic — never the model&apos;s guess
            </h2>
            <p className="mt-4 text-[14px] text-[#475569] leading-relaxed max-w-3xl">
              Permit text is parsed into normalized clauses, then compared field by field. Numbers, averaging
              periods, and cadence are compared in code. The language model is used only to classify clause
              intent, and every extraction is validated against a schema before it is stored.
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Baseline · T-V-2021-R2 · p.12
                  </span>
                </div>
                <p className="font-mono text-[12.5px] text-[#0F172A] bg-white border border-[#E2E8F0] rounded-lg p-3.5 leading-relaxed">
                  NOx emissions from Utility Boiler B-07 shall not exceed{" "}
                  <span className="font-bold text-[#991B1B]">0.08 lb/MMBtu</span> on a 24-hour rolling average,
                  demonstrated by CEMS.
                </p>
                <div className="mt-3 text-[11px] text-[#64748B] font-mono">
                  Section IV.B.1 / 40 CFR 60.44b(a)
                </div>
              </div>

              <div className="rounded-xl border border-[#93C5FD] bg-[#EFF6FF]/70 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E40AF]">
                    Revised · T-V-2024-REV · p.13
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] rounded bg-[#DBEAFE] text-[#1E40AF] font-mono font-bold">
                    −37.5%
                  </span>
                </div>
                <p className="font-mono text-[12.5px] text-[#1E3A8A] bg-white border border-[#60A5FA] rounded-lg p-3.5 leading-relaxed">
                  NOx emissions from Utility Boiler B-07 shall not exceed{" "}
                  <span className="font-bold text-[#1D4ED8]">0.05 lb/MMBtu</span> on a 24-hour rolling average,
                  demonstrated by CEMS.
                </p>
                <div className="mt-3 text-[11px] text-[#1D4ED8] font-mono">
                  Section IV.B.1 / 40 CFR 60.44b(a) &amp; SIP Rule 114
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-mono">
              {[
                ["pollutant", "NOx"],
                ["old_value", "0.08"],
                ["new_value", "0.05"],
                ["unit", "lb/MMBtu"],
                ["averaging_period", "24-hr rolling"],
                ["severity", "critical"],
                ["confidence", "0.98"],
              ].map(([k, v]) => (
                <span key={k} className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#334155]">
                  <span className="text-[#64748B]">{k}=</span>
                  <span className="font-bold text-[#0F172A]">{v}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* IMPACT MAPPING */}
        <section id="impact-mapping" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Network className="w-4 h-4 text-[#1D4ED8]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8]">
                Operational Data Mapping
              </span>
            </div>
            <h2 className="text-2xl sm:text-[1.9rem] font-extrabold text-[#0F172A] tracking-tight">
              Which physical asset does this clause actually govern?
            </h2>
            <p className="mt-4 text-[14px] text-[#475569] leading-relaxed max-w-3xl">
              Retrieval is metadata-first (asset tags, pollutant, equipment type) and only falls back to vector
              similarity when metadata is insufficient. Each mapping carries a confidence score and a mandatory
              human-review flag.
            </p>

            <div className="mt-8 forge-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9]">
                <div>
                  <div className="text-[15px] font-bold text-[#0F172A]">Utility Boiler #7 · B-07</div>
                  <div className="text-[12px] text-[#64748B]">Industrial Boiler · 250 MMBtu/hr</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="forge-badge forge-badge-red">High risk</span>
                  <span className="forge-badge forge-badge-blue">confidence 0.96</span>
                  <span className="forge-badge forge-badge-amber">human review required</span>
                </div>
              </div>
              <p className="mt-4 text-[13.5px] text-[#334155] leading-relaxed">
                Boiler B-07 24-hour rolling NOx maxima (Apr–Sep 2024) ranged from monthly means of
                0.041–0.047 lb/MMBtu up to excursion peaks of 0.074 lb/MMBtu. Against the revised
                0.05 lb/MMBtu limit, four recorded periods in the trailing six months already exceed the new
                limit.
              </p>
              <div className="mt-5">
                <div className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                  Controls attached to this asset
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {[
                    ["CEMS-NOX-B07", "Chemiluminescent analyzer", "0–50 ppm span"],
                    ["SOP-44", "NOx operating limit", "0.08 lb/MMBtu"],
                    ["DCS alarm", "High alarm setpoint", "0.075 lb/MMBtu"],
                    ["AIR-7", "NOx compliance report", "Quarterly"],
                    ["TR-12", "Boiler operator training", "Annual"],
                    ["Calculation", "Monthly NOx balance", "Daily avg ≤ 0.08"],
                  ].map(([code, title, value]) => (
                    <div key={code} className="p-3 rounded-lg bg-white border border-[#E2E8F0]">
                      <div className="font-mono text-[11px] font-bold text-[#1D4ED8]">{code}</div>
                      <div className="text-[12px] text-[#0F172A] font-semibold leading-tight mt-0.5">{title}</div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONFLICTS */}
        <section id="conflicts" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-[#92400E]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#92400E]">
                Conflict Detection
              </span>
            </div>
            <h2 className="text-2xl sm:text-[1.9rem] font-extrabold text-[#0F172A] tracking-tight">
              The change collides with what the facility already does
            </h2>
            <p className="mt-4 text-[14px] text-[#475569] leading-relaxed max-w-3xl">
              A tightened permit limit is only useful if the system notices where internal reality still
              disagrees with it. Each conflict below is anchored to a verbatim citation.
            </p>

            <div className="mt-8 space-y-4">
              {CONFLICTS.map((c) => (
                <div key={c.type} className="forge-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#92400E]">
                      {c.type}
                    </span>
                    <span className="forge-badge forge-badge-amber">confidence {c.confidence}</span>
                  </div>
                  <p className="mt-2.5 text-[13.5px] text-[#0F172A] font-medium">{c.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF]">
                      permit = {c.permit}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]">
                      control = {c.control}
                    </span>
                  </div>
                  <div className="mt-3.5 flex items-start gap-2.5 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                    <Quote className="w-3.5 h-3.5 text-[#64748B] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[12px] text-[#475569] italic leading-relaxed">{c.quote}</p>
                      <p className="mt-1 text-[10.5px] font-mono text-[#64748B]">{c.source}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WORKFLOW */}
        <section id="workflow" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="w-4 h-4 text-[#1D4ED8]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8]">
                Workflow Automation
              </span>
            </div>
            <h2 className="text-2xl sm:text-[1.9rem] font-extrabold text-[#0F172A] tracking-tight">
              Turning a finding into accountable work
            </h2>
            <p className="mt-4 text-[14px] text-[#475569] leading-relaxed max-w-3xl">
              The impact becomes concrete tasks. Each action carries an owner, a department, a budget, a due
              date, and required evidence — and moves through a six-state lifecycle behind an enforced
              sign-off gate.
            </p>

            <div className="mt-8 space-y-3">
              {ACTIONS.map((a) => (
                <div key={a.title} className="forge-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`forge-badge ${STATUS_STYLE[a.status] ?? "forge-badge-blue"}`}>
                        {a.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] font-mono text-[#64748B] uppercase">{a.department} · {a.type}</span>
                    </div>
                    <h3 className="mt-2 text-[14px] font-bold text-[#0F172A]">{a.title}</h3>
                  </div>
                  <div className="flex items-center gap-6 shrink-0 font-mono text-[12px]">
                    <div>
                      <div className="text-[10px] text-[#64748B] uppercase">Cost</div>
                      <div className="font-bold text-[#0F172A]">{a.cost}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#64748B] uppercase">Due</div>
                      <div className="font-bold text-[#0F172A]">{a.due}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-[#0F172A] text-white text-[13px] font-medium border border-[#1E293B]">
              No action can reach <span className="font-mono text-[#93C5FD]">approved</span> or{" "}
              <span className="font-mono text-[#93C5FD]">complete</span> without a human decision. The workflow
              state machine rejects illegal transitions at the server-action layer.
            </div>
          </div>
        </section>

        {/* AUDIT */}
        <section id="audit" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-[#047857]" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#047857]">
                  Governance &amp; Audit
                </span>
              </div>
              <h2 className="text-2xl sm:text-[1.9rem] font-extrabold text-[#0F172A] tracking-tight">
                An audit trail you can verify, not just trust
              </h2>
              <p className="mt-4 text-[14px] text-[#475569] leading-relaxed">
                Every state change writes an immutable event. Each event stores the SHA-256 hash of its own
                contents plus the previous event&apos;s hash, forming a chain. A Postgres function recomputes the
                chain end to end so tampering is detectable.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Append-only: updates and deletes are blocked by a database trigger.",
                  "Chain integrity verified by the verify_audit_chain() function.",
                  "Every action, review decision, and evidence submission is captured.",
                  "Verified end to end by the phase-10 test suite.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-[13px] text-[#334155]">
                    <span className="w-5 h-5 rounded-md bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] p-5 font-mono text-[11.5px] text-[#CBD5E1] overflow-hidden">
                <div className="flex items-center gap-2 mb-4 text-[#64748B]">
                  <Gauge className="w-3.5 h-3.5" />
                  <span>pi_audit_log</span>
                </div>
                {[
                  { seq: 1, action: "CHANGE_CREATED", hash: "9f2c…" },
                  { seq: 2, action: "IMPACT_MAPPED", hash: "4ab1…" },
                  { seq: 3, action: "CONFLICT_DETECTED", hash: "c77e…" },
                  { seq: 4, action: "ACTION_CREATED", hash: "1e90…" },
                  { seq: 5, action: "STATUS_CHANGED", hash: "77b3…" },
                  { seq: 6, action: "EVIDENCE_SUBMITTED", hash: "a0d4…" },
                ].map((e, i) => (
                  <div
                    key={e.seq}
                    className="flex items-center gap-3 py-2 border-t border-white/5 first:border-t-0"
                  >
                    <span className="text-[#475569] w-6">{String(e.seq).padStart(2, "0")}</span>
                    <span className="text-[#93C5FD] flex-1">{e.action}</span>
                    <span className="text-[#64748B]">{e.hash}</span>
                    <span className="text-[#047857]">prev→</span>
                  </div>
                ))}
                <div className="mt-4 pt-3 border-t border-white/10 text-[#047857] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  verify_audit_chain() → valid
                </div>
              </div>
              <p className="mt-3 text-[11px] text-[#64748B]">
                Illustrative chain excerpt. Hashes are truncated; the real chain is recomputed and validated in
                the workspace.
              </p>
            </div>
          </div>
        </section>

        {/* OUTCOME + CTA */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
          <div className="max-w-4xl mx-auto text-center">
            <FileText className="w-6 h-6 text-[#1D4ED8] mx-auto mb-4" />
            <h2 className="text-2xl sm:text-[1.9rem] font-extrabold text-[#0F172A] tracking-tight">
              From one sentence to a reviewed, costed, auditable plan
            </h2>
            <p className="mt-4 text-[14px] text-[#475569] leading-relaxed max-w-2xl mx-auto">
              The full path — clause comparison, asset mapping, three conflicts, three implementation actions
              worth $33,500, and a hash-chained audit record — is exactly what a reviewer walks through in the
              live workspace on the same synthetic data.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <DemoLaunchButton label="Open the live workspace" />
              <Link
                href="/engineering"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-[#0F172A] border border-[#CBD5E1] text-[13px] font-semibold hover:border-[#1D4ED8] transition-colors"
              >
                See how it&apos;s built <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
