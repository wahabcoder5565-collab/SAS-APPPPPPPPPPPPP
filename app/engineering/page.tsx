import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import DemoLaunchButton from "@/components/demo-launch-button";
import {
  TECH_STACK,
  DATA_MODEL,
  VERIFICATION_COMMANDS,
  CHANGELOG,
  LIMITATIONS,
  ARCHITECTURE_PIPELINE,
  DEVELOPER,
} from "@/lib/site-config";
import {
  ArrowRight,
  Boxes,
  Database,
  FlaskConical,
  GitCommit,
  Terminal,
  Check,
  X,
  CircleDot,
  Cpu,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Technical Overview | PermitImpact AI",
  description:
    "Architecture, technology decisions, and the real database schema behind PermitImpact AI, plus the verification commands and honest limitations of the project.",
};

export default function EngineeringPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#334155]">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden forge-light-hero border-b border-[#E2E8F0]">
          <div className="forge-light-grid absolute inset-0" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8] mb-3">
              Technical Overview
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-[#0F172A] tracking-tight leading-tight">
              How PermitImpact AI is built
            </h1>
            <p className="mt-5 text-[15px] text-[#475569] leading-relaxed max-w-3xl">
              The architecture, the reasoning behind each technology choice, the real database schema, the tests
              that back the claims, and — just as important — what is only simulated.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <DemoLaunchButton label="Explore the live demo" />
              <Link
                href="/case-study"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white text-[#0F172A] border border-[#CBD5E1] text-[13px] font-semibold hover:border-[#1D4ED8] transition-colors"
              >
                Read the case study <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ARCHITECTURE */}
        <section id="architecture" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-[#1D4ED8]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8]">
                Architecture
              </span>
            </div>
            <h2 className="text-2xl sm:text-[1.9rem] font-extrabold text-[#0F172A] tracking-tight">
              A pipeline with explicit module boundaries
            </h2>
            <p className="mt-4 text-[14px] text-[#475569] leading-relaxed max-w-3xl">
              Each stage is a discrete module with a single responsibility, so the deterministic logic can be
              tested independently of the model and the UI.
            </p>

            <div className="mt-8 space-y-3">
              {ARCHITECTURE_PIPELINE.map((stage, i) => (
                <div key={stage.step} className="forge-card p-4 sm:p-5 flex items-start gap-4">
                  <span className="shrink-0 font-mono text-[12px] font-bold text-[#1D4ED8] bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg w-9 h-9 flex items-center justify-center">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                    <div>
                      <h3 className="text-[14px] font-bold text-[#0F172A]">{stage.step}</h3>
                      <p className="text-[12.5px] text-[#475569] mt-0.5">{stage.detail}</p>
                    </div>
                    <code className="font-mono text-[10.5px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-1 rounded shrink-0">
                      {stage.module}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TECHNOLOGY DECISIONS */}
        <section id="stack" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Boxes className="w-4 h-4 text-[#1D4ED8]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8]">
                Technology Decisions
              </span>
            </div>
            <h2 className="text-2xl sm:text-[1.9rem] font-extrabold text-[#0F172A] tracking-tight">
              What each technology is responsible for — and why
            </h2>

            <div className="mt-8 space-y-4">
              {TECH_STACK.map((t) => (
                <div key={t.name} className="forge-card p-5">
                  <h3 className="text-[14px] font-bold text-[#0F172A]">{t.name}</h3>
                  <p className="mt-2 text-[13px] text-[#475569] leading-relaxed">{t.role}</p>
                  <p className="mt-2.5 text-[12.5px] text-[#1D4ED8] leading-relaxed">
                    <span className="font-mono font-bold uppercase text-[10px] tracking-wider text-[#64748B]">
                      Why:{" "}
                    </span>
                    {t.why}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DATA MODEL */}
        <section id="data-model" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-[#1D4ED8]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8]">
                Data Model
              </span>
            </div>
            <h2 className="text-2xl sm:text-[1.9rem] font-extrabold text-[#0F172A] tracking-tight">
              The real schema, in a dedicated namespace
            </h2>
            <p className="mt-4 text-[14px] text-[#475569] leading-relaxed max-w-3xl">
              Sixteen related tables use a <code className="font-mono text-[12px] text-[#1D4ED8]">pi_</code>{" "}
              prefix and row-level security. Vector search over procedure text uses a 768-dimension pgvector
              column with an HNSW index.
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {DATA_MODEL.map((t) => (
                <div key={t.table} className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <CircleDot className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0 mt-1" />
                  <div>
                    <code className="font-mono text-[12px] font-bold text-[#0F172A]">{t.table}</code>
                    <p className="text-[12px] text-[#64748B] mt-0.5">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VERIFICATION */}
        <section id="verification" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="w-4 h-4 text-[#047857]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#047857]">
                Verification
              </span>
            </div>
            <h2 className="text-2xl sm:text-[1.9rem] font-extrabold text-[#0F172A] tracking-tight">
              Claims are backed by runnable tests
            </h2>
            <p className="mt-4 text-[14px] text-[#475569] leading-relaxed max-w-3xl">
              The deterministic engines and the audit chain have their own test scripts. They can be run against
              the seeded database to prove the behavior described on this site.
            </p>

            <div className="mt-8 space-y-3">
              {VERIFICATION_COMMANDS.map((c) => (
                <div key={c.command} className="forge-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <code className="font-mono text-[12.5px] font-bold text-[#0F172A] bg-[#0F172A]/5 px-2.5 py-1 rounded border border-[#E2E8F0] w-fit">
                    $ {c.command}
                  </code>
                  <p className="text-[12.5px] text-[#475569] flex-1 sm:text-right">{c.covers}</p>
                </div>
              ))}
            </div>

            <p className="mt-5 text-[12px] text-[#64748B]">
              A full end-to-end run requires the project environment variables (
              <code className="font-mono text-[11px]">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
              <code className="font-mono text-[11px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,{" "}
              <code className="font-mono text-[11px]">GEMINI_API_KEY</code>) to be set.
            </p>
          </div>
        </section>

        {/* CHANGELOG */}
        <section id="changelog" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <GitCommit className="w-4 h-4 text-[#1D4ED8]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8]">
                Build History
              </span>
            </div>
            <h2 className="text-2xl sm:text-[1.9rem] font-extrabold text-[#0F172A] tracking-tight">
              Reconstructed from migrations and the phase tracker
            </h2>

            <ol className="mt-8 relative border-l border-[#E2E8F0] ml-2 space-y-6">
              {CHANGELOG.map((e) => (
                <li key={e.title} className="ml-6">
                  <span className="absolute -left-[7px] w-3.5 h-3.5 rounded-full bg-[#1D4ED8] border-2 border-white ring-1 ring-[#BFDBFE]" />
                  <div className="font-mono text-[11px] text-[#64748B]">{e.date}</div>
                  <h3 className="text-[14px] font-bold text-[#0F172A]">{e.title}</h3>
                  <p className="text-[12.5px] text-[#475569] mt-0.5 leading-relaxed">{e.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* LIMITATIONS */}
        <section id="limitations" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4 text-[#334155]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#334155]">
                Honest Limitations
              </span>
            </div>
            <h2 className="text-2xl sm:text-[1.9rem] font-extrabold text-[#0F172A] tracking-tight">
              Implemented vs. simulated vs. planned
            </h2>
            <p className="mt-4 text-[14px] text-[#475569] leading-relaxed max-w-3xl">
              A portfolio project earns trust by being precise about its edges. Here is the boundary.
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="forge-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-md bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wide">Implemented</h3>
                </div>
                <ul className="space-y-2.5">
                  {LIMITATIONS.implemented.map((t) => (
                    <li key={t} className="text-[12.5px] text-[#475569] leading-relaxed flex gap-2">
                      <span className="text-[#047857] shrink-0">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="forge-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-md bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] flex items-center justify-center">
                    <CircleDot className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wide">Simulated</h3>
                </div>
                <ul className="space-y-2.5">
                  {LIMITATIONS.simulated.map((t) => (
                    <li key={t} className="text-[12.5px] text-[#475569] leading-relaxed flex gap-2">
                      <span className="text-[#92400E] shrink-0">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="forge-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[#334155] flex items-center justify-center">
                    <X className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wide">Planned</h3>
                </div>
                <ul className="space-y-2.5">
                  {LIMITATIONS.planned.map((t) => (
                    <li key={t} className="text-[12.5px] text-[#475569] leading-relaxed flex gap-2">
                      <span className="text-[#334155] shrink-0">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Prefer to just use it?
            </h2>
            <p className="mt-3 text-[14px] text-[#475569]">
              The demo signs you in as a guest — no account required.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <DemoLaunchButton label="Explore the live demo" />
              <a
                href={`mailto:${DEVELOPER.links.email}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-[#0F172A] border border-[#CBD5E1] text-[13px] font-semibold hover:border-[#1D4ED8] transition-colors"
              >
                Contact the developer <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
