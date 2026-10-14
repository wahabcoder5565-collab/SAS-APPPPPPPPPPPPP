import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import WorkflowExplorer from "@/components/workflow-explorer";
import HeroWorkflowPreview from "@/components/hero-workflow-preview";
import ContactForm from "@/components/contact-form";
import { DEVELOPER, SYNTHETIC_DATA_DISCLOSURE, FLAGSHIP } from "@/lib/site-config";
import {
  ArrowRight,
  Check,
  LayoutDashboard,
  Database,
  Sparkles,
  ShieldCheck,
  GitBranch,
  FileSearch,
  Briefcase,
  Mail,
  Code2,
  Boxes,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Wahab | Software Engineering — Full-Stack & AI Workflow Development",
  description:
    "Full-stack developer building practical applications that connect data, automate repetitive work, and turn complex business processes into clear, reviewable software. Featuring PermitImpact AI, an independent engineering demonstration.",
};

const ENGINEERING_PANELS = [
  {
    id: "fullstack",
    icon: LayoutDashboard,
    label: "Panel A",
    title: "Full-stack application development",
    core: "Designing interfaces and application logic that work together.",
    evidence: [
      "Next.js App Router with server components for data views",
      "React and TypeScript components",
      "Server-side data operations and mutations",
      "Forms, data views, validation and workflow states",
    ],
    href: "/engineering#architecture",
    linkLabel: "See the architecture",
  },
  {
    id: "data",
    icon: Database,
    label: "Panel B",
    title: "Data modeling and relationships",
    core: "Turning complex information into structured, connected data.",
    evidence: [
      "PostgreSQL data relationships",
      "Permits, requirements, equipment, findings, actions and audit records",
      "Relational queries across connected entities",
      "Structured, predictable access patterns",
    ],
    href: "/engineering#data-model",
    linkLabel: "View the data model",
  },
  {
    id: "ai",
    icon: Sparkles,
    label: "Panel C",
    title: "AI-assisted document workflows",
    core: "Applying AI selectively, alongside structured validation and deterministic logic.",
    evidence: [
      "Document text extraction",
      "Clause normalization and schema validation",
      "AI-assisted classification with a deterministic fallback",
      "Deterministic change calculations",
      "Source references and reviewable findings",
    ],
    href: "/case-study#document-intelligence",
    linkLabel: "See the B-07 diff",
  },
  {
    id: "integrity",
    icon: ShieldCheck,
    label: "Panel D",
    title: "Workflow integrity and traceability",
    core: "Making complex processes visible, reviewable and auditable.",
    evidence: [
      "Action lifecycle and state transitions",
      "Explicit review gates",
      "Append-only audit records",
      "Evidence relationships",
      "Error handling and role-scoped access",
    ],
    href: "/case-study#audit",
    linkLabel: "Inspect the audit chain",
  },
];

const CUSTOM_SOLUTIONS = [
  {
    icon: LayoutDashboard,
    title: "Business dashboards and data tools",
    body: "Applications that organize operational information and make records easier to navigate and act on.",
    connects: "Shaped like the impact register and asset views in PermitImpact AI.",
  },
  {
    icon: GitBranch,
    title: "Workflow and process applications",
    body: "Custom interfaces for tracking tasks, approvals and connected business processes.",
    connects: "Built on the same multi-state action lifecycle used in the demonstration.",
  },
  {
    icon: FileSearch,
    title: "AI-assisted document tools",
    body: "Applications that extract, organize, compare or review complex document information with structured validation.",
    connects: "Based on the deterministic document comparison and clause classification in the project.",
  },
];

const STACK = [
  "Next.js",
  "React",
  "TypeScript",
  "PostgreSQL",
  "Supabase",
  "Gemini",
  "Tailwind CSS",
  "Zod",
];

export default function HomePage() {
  const email = DEVELOPER.links.email;

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#334155]">
      <SiteHeader />

      <main className="flex-1">
        {/* ── HERO ── */}
        <section className="relative overflow-hidden forge-light-hero border-b border-[#E2E8F0] pt-14 sm:pt-20 pb-16 sm:pb-20">
          <div className="forge-light-grid absolute inset-0" />
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#F1F5F9] border border-[#CBD5E1] text-[#0F172A] text-[11px] font-mono font-bold tracking-wider uppercase mb-7">
              <span className="w-2 h-2 rounded-full bg-[#1D4ED8]" />
              Full-Stack Development · AI Workflows
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-[#090D16] tracking-tight leading-[1.1] max-w-4xl mx-auto">
              Complex workflows.{" "}
              <span className="text-[#1D4ED8]">Clear software solutions.</span>
            </h1>

            <p className="mt-6 text-[15px] sm:text-base text-[#334155] max-w-3xl mx-auto leading-relaxed">
              I design and build applications that organize complex information, connect systems, and turn
              manual processes into structured workflows.
            </p>
            <p className="mt-3 text-[14px] sm:text-[15px] text-[#475569] max-w-3xl mx-auto leading-relaxed">
              From document intelligence to operational dashboards, my focus is on software that solves
              practical business problems.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/demo"
                className="w-full sm:w-auto px-6 py-3 rounded-lg text-[13px] font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs inline-flex items-center justify-center gap-2 transition-all"
              >
                Explore the Working Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/engineering"
                className="w-full sm:w-auto px-6 py-3 rounded-lg text-[13px] font-semibold bg-white text-[#0F172A] border border-[#CBD5E1] hover:bg-[#F8FAFC] hover:border-[#94A3B8] shadow-xs inline-flex items-center justify-center gap-2 transition-all"
              >
                See the Engineering
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="mt-6 flex flex-col items-center gap-1.5">
              <p className="text-[12px] font-semibold text-[#0F172A]">
                {DEVELOPER.name} | {DEVELOPER.title}
              </p>
              <p className="text-[11.5px] text-[#64748B]">{DEVELOPER.availability}</p>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
            <HeroWorkflowPreview />
          </div>
        </section>

        {/* ── INTERACTIVE WORKFLOW ── */}
        <section id="workflow" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl">
              <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8] mb-3">
                How It Works
              </div>
              <h2 className="text-2xl sm:text-[2.25rem] font-extrabold text-[#090D16] tracking-tight leading-tight">
                One change. Every connected impact.
              </h2>
              <p className="mt-4 text-[15px] text-[#475569] leading-relaxed">
                See how one updated requirement becomes a traceable set of operational findings and review
                actions.
              </p>
            </div>

            <div className="mt-12">
              <WorkflowExplorer />
            </div>
          </div>
        </section>

        {/* ── WORKING APPLICATION ── */}
        <section id="work" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl">
              <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8] mb-3">
                Flagship Project
              </div>
              <h2 className="text-2xl sm:text-[2.25rem] font-extrabold text-[#090D16] tracking-tight leading-tight">
                Built to demonstrate complete workflows, not just screens.
              </h2>
              <p className="mt-5 text-[15px] font-bold text-[#0F172A]">PermitImpact AI</p>
              <p className="text-[13px] text-[#64748B]">Independent full-stack engineering demonstration</p>
              <p className="mt-4 text-[15px] text-[#475569] leading-relaxed">
                PermitImpact AI explores how a change in a regulatory document can be detected, connected to
                operational data, and translated into evidence-linked review actions.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-7">
                <ol className="space-y-3">
                  {FLAGSHIP.steps.map((s, i) => (
                    <li key={s.label} className="forge-card p-4 sm:p-5 flex items-start gap-4">
                      <span className="shrink-0 w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] flex items-center justify-center text-[12px] font-mono font-bold">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-[14px] font-bold text-[#0F172A]">{s.label}</h3>
                        <p className="mt-1 text-[12.5px] text-[#475569] leading-relaxed">{s.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-xl bg-[#0F172A] text-white border border-[#1E293B]">
                  <div className="text-[11px] font-mono text-[#94A3B8]">Core question it answers</div>
                  <div className="mt-1.5 text-[15px] font-bold text-[#93C5FD] font-mono leading-relaxed">
                    &ldquo;What does this change affect inside the system?&rdquo;
                  </div>
                </div>
                <div className="forge-card p-5">
                  <h3 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wide mb-3">
                    What a visitor can do
                  </h3>
                  <ul className="space-y-2.5">
                    {[
                      "Compare two document revisions and see the detected change",
                      "Trace the change to affected equipment and records",
                      "Follow findings into assigned, reviewable actions",
                      "Verify how approval and audit are recorded",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-[12.5px] text-[#334155]">
                        <span className="w-5 h-5 rounded-md bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3" />
                        </span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/demo"
                    className="flex-1 px-5 py-3 rounded-lg text-[13px] font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-center inline-flex items-center justify-center gap-2 transition-all"
                  >
                    Open Interactive Demo
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/case-study"
                    className="flex-1 px-5 py-3 rounded-lg text-[13px] font-semibold bg-white text-[#0F172A] border border-[#CBD5E1] hover:border-[#94A3B8] text-center inline-flex items-center justify-center gap-2 transition-all"
                  >
                    Explore Case Study
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── ENGINEERING EVIDENCE ── */}
        <section id="engineering" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl">
              <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8] mb-3">
                Engineering Evidence
              </div>
              <h2 className="text-2xl sm:text-[2.25rem] font-extrabold text-[#090D16] tracking-tight leading-tight">
                From interface to infrastructure.
              </h2>
              <p className="mt-4 text-[15px] text-[#475569] leading-relaxed">
                Each panel points to something implemented in the project — not a list of technologies. The
                goal is to show how the parts connect, not how long the stack is.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
              {ENGINEERING_PANELS.map((panel) => {
                const Icon = panel.icon;
                return (
                  <div key={panel.id} className="forge-card p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-10 h-10 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#94A3B8]">
                        {panel.label}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-bold text-[#0F172A]">{panel.title}</h3>
                    <p className="mt-1.5 text-[13px] text-[#1D4ED8] font-medium leading-relaxed">{panel.core}</p>
                    <ul className="mt-4 space-y-2 flex-1">
                      {panel.evidence.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-[12.5px] text-[#475569]">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-[#94A3B8] shrink-0" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={panel.href}
                      className="mt-5 text-[12px] font-bold text-[#1D4ED8] inline-flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      {panel.linkLabel} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Factual stack */}
            <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-3">
              <span className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-widest text-[#334155]">
                <Boxes className="w-4 h-4 text-[#1D4ED8]" />
                Stack
              </span>
              {STACK.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-[12px] font-semibold text-[#0F172A]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── CASE STUDY TEASER ── */}
        <section id="case-study" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5">
              <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8] mb-3">
                Engineering Case Study
              </div>
              <h2 className="text-2xl sm:text-[2.25rem] font-extrabold text-[#090D16] tracking-tight leading-tight">
                The reasoning behind the implementation.
              </h2>
              <p className="mt-4 text-[14px] text-[#475569] leading-relaxed">
                A dedicated write-up of the problem, the architecture, the engineering decisions, the
                verification approach, and the honest limitations of the project.
              </p>
              <Link
                href="/case-study"
                className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-lg text-[13px] font-semibold bg-[#0F172A] text-white hover:bg-[#1E293B] transition-colors"
              >
                Read the full case study
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: "The problem",
                  body: "A changed requirement can affect multiple connected assets, procedures, monitoring settings and approvals. Reading the revised document alone does not reveal every dependency.",
                },
                {
                  title: "The approach",
                  body: "Represent requirements and operational records as structured, related data. Detect changes, map dependencies, surface conflicts and produce reviewable actions.",
                },
                {
                  title: "Deterministic where it matters",
                  body: "Numerical and cadence comparisons run in code. AI is confined to tasks whose output can be validated or reviewed, with a deterministic fallback.",
                },
                {
                  title: "Limitations, stated plainly",
                  body: "The scenario uses synthetic industrial data and does not establish regulatory accuracy, production readiness or real-world deployment.",
                },
              ].map((c) => (
                <div key={c.title} className="forge-card p-5">
                  <h3 className="text-[13px] font-bold text-[#0F172A]">{c.title}</h3>
                  <p className="mt-2 text-[12.5px] text-[#475569] leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CUSTOM SOFTWARE ── */}
        <section id="custom" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl">
              <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8] mb-3">
                Custom Software
              </div>
              <h2 className="text-2xl sm:text-[2.25rem] font-extrabold text-[#090D16] tracking-tight leading-tight">
                Software built around the way your business works.
              </h2>
              <p className="mt-4 text-[15px] text-[#475569] leading-relaxed">
                Every team has different processes, data and operational challenges. I build custom
                applications designed around specific requirements rather than forcing every problem into the
                same template.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
              {CUSTOM_SOLUTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.title} className="forge-card p-6 flex flex-col">
                    <span className="w-11 h-11 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] flex items-center justify-center mb-5">
                      <Icon className="w-5 h-5" />
                    </span>
                    <h3 className="text-[15px] font-bold text-[#0F172A]">{s.title}</h3>
                    <p className="mt-2.5 text-[13px] text-[#475569] leading-relaxed flex-1">{s.body}</p>
                    <p className="mt-4 pt-4 border-t border-[#E2E8F0] text-[11.5px] text-[#64748B] leading-relaxed">
                      {s.connects}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 p-6 rounded-2xl bg-[#0F172A] text-white border border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <h3 className="text-[16px] font-bold">Have a workflow you want to improve?</h3>
                <p className="mt-1.5 text-[13px] text-[#CBD5E1] max-w-xl leading-relaxed">
                  Tell me about the problem and the systems involved. I can help explore a suitable technical
                  approach.
                </p>
              </div>
              <a
                href={`mailto:${email}?subject=${encodeURIComponent("Custom software project")}`}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-[13px] font-semibold bg-white text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
              >
                Discuss a Software Project
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* ── ABOUT ── */}
        <section id="about" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7">
              <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8] mb-3">
                About
              </div>
              <h2 className="text-2xl sm:text-[2rem] font-extrabold text-[#090D16] tracking-tight leading-tight">
                Meet the developer.
              </h2>
              <p className="mt-2 text-[14px] font-semibold text-[#1D4ED8]">
                {DEVELOPER.name} · {DEVELOPER.title}
              </p>

              <div className="mt-6 space-y-3">
                {DEVELOPER.bio.map((p, i) => (
                  <p key={i} className="text-[14px] text-[#475569] leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>

              <p className="mt-5 text-[13.5px] text-[#0F172A] font-medium leading-relaxed">
                {DEVELOPER.opportunity}
              </p>

              <a
                href={`mailto:${email}`}
                className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-lg text-[13px] font-semibold bg-white text-[#0F172A] border border-[#CBD5E1] hover:border-[#1D4ED8] transition-colors"
              >
                <Mail className="w-4 h-4 text-[#1D4ED8]" />
                {email}
              </a>
            </div>

            <div className="lg:col-span-5">
              <div className="forge-card p-6">
                <h3 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wide mb-4">
                  What this project demonstrates
                </h3>
                <ul className="space-y-3">
                  {[
                    "Translating a complex, regulated domain into structured, enforceable data",
                    "Designing interconnected applications across the full stack",
                    "Confining AI to the tasks it is reliable for, with deterministic fallbacks",
                    "Building governance in from the start: role scoping, review gates, auditability",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[13px] text-[#334155]">
                      <span className="w-5 h-5 rounded-md bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── CONTACT ── */}
        <section id="contact" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5">
              <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8] mb-3">
                Contact
              </div>
              <h2 className="text-2xl sm:text-[2rem] font-extrabold text-[#090D16] tracking-tight leading-tight">
                Let&apos;s build something useful.
              </h2>
              <p className="mt-4 text-[14px] text-[#475569] leading-relaxed">
                Whether you&apos;re hiring a developer, reviewing a technical project, or exploring a custom
                software idea, I&apos;d be glad to discuss it.
              </p>

              <div className="mt-6 space-y-3">
                <a
                  href={`mailto:${email}?subject=${encodeURIComponent("Engineering opportunity")}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-[13px] font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors"
                >
                  <Briefcase className="w-4 h-4" />
                  Discuss an Engineering Opportunity
                </a>
                <a
                  href={`mailto:${email}?subject=${encodeURIComponent("Custom software project")}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-[13px] font-semibold bg-white text-[#0F172A] border border-[#CBD5E1] hover:border-[#1D4ED8] transition-colors"
                >
                  <Code2 className="w-4 h-4" />
                  Discuss a Custom Software Project
                </a>
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-2.5 text-[13px] text-[#334155] hover:text-[#1D4ED8] pt-1"
                >
                  <Mail className="w-4 h-4 text-[#1D4ED8]" />
                  {email}
                </a>
              </div>

              <p className="mt-6 text-[11px] text-[#64748B] leading-relaxed">{SYNTHETIC_DATA_DISCLOSURE}</p>
            </div>

            <div className="lg:col-span-7">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
