import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import DemoLaunchButton from "@/components/demo-launch-button";
import { DEMO_DISCLOSURE } from "@/lib/site-config";
import type { RefineryRole } from "@/app/auth/actions";
import {
  HardHat,
  ShieldCheck,
  Wrench,
  UserCheck,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Live Demo | PermitImpact AI",
  description:
    "Enter a synthetic refinery workspace as one of four personas to inspect the Boiler B-07 NOx permit change end to end.",
};

const personas: {
  role: RefineryRole;
  name: string;
  title: string;
  desc: string;
  cta: string;
  icon: React.ReactNode;
}[] = [
  {
    role: "engineer",
    name: "Sarah Lin",
    title: "Senior Air Quality Engineer",
    desc: "Evaluate the B-07 NOx limit delta and the FGR tuning plan.",
    cta: "Enter as Engineer",
    icon: <HardHat className="w-4 h-4" />,
  },
  {
    role: "manager",
    name: "Marcus Vance",
    title: "Environmental Compliance Manager",
    desc: "Review high-priority findings, budgets, and sign-off queues.",
    cta: "Enter as Manager",
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  {
    role: "operations",
    name: "David Chen",
    title: "Utilities & Steam Plant Lead",
    desc: "Inspect SOP-44 updates and DCS alarm setpoints.",
    cta: "Enter as Operations",
    icon: <Wrench className="w-4 h-4" />,
  },
  {
    role: "reviewer",
    name: "Elena Rostova",
    title: "Lead Regulatory Auditor",
    desc: "Verify clause citations and the hash-chained audit trail.",
    cta: "Enter as Reviewer",
    icon: <UserCheck className="w-4 h-4" />,
  },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#334155]">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden forge-light-hero border-b border-[#E2E8F0]">
          <div className="forge-light-grid absolute inset-0" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-[11px] font-semibold mb-5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Synthetic demonstration environment
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Explore the demo workspace
            </h1>
            <p className="mt-4 text-[15px] text-[#475569] max-w-2xl mx-auto leading-relaxed">
              One click signs you in as a guest persona — no signup or password. Follow the Boiler B-07
              NOx limit tightening from permit clause to asset impact, review action, and audit record.
            </p>
            <p className="mt-3 text-[12px] text-[#64748B] max-w-2xl mx-auto">{DEMO_DISCLOSURE}</p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {personas.map((p) => (
              <DemoLaunchButton
                key={p.role}
                variant="card"
                role={p.role}
                className="bg-white p-5 rounded-xl border border-[#CBD5E1] shadow-xs hover:border-[#2563EB] group"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] flex items-center justify-center">
                    {p.icon}
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-[#64748B] font-medium">{p.title}</div>
                  </div>
                </div>
                <p className="text-[11px] text-[#475569] leading-relaxed">{p.desc}</p>
                <div className="mt-4 text-[11px] text-[#1D4ED8] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  {p.cta} <ArrowRight className="w-3 h-3" />
                </div>
              </DemoLaunchButton>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: "What the guest session can do",
                body: "Open the dashboard, compare the two permit revisions, inspect asset impacts and conflicts, and advance implementation actions through the workflow.",
              },
              {
                title: "What is enforced",
                body: "Permissions and role scoping are enforced by Supabase row-level security, not just by the UI. The audit log is append-only at the database trigger level.",
              },
              {
                title: "How to reset",
                body: "The workspace ships pre-seeded. If you change action states, use “Reset Demo” in the workspace header to restore the starting statuses.",
              },
            ].map((c) => (
              <div key={c.title} className="forge-card p-5">
                <h2 className="text-[13px] font-bold text-[#0F172A]">{c.title}</h2>
                <p className="mt-2 text-[12px] text-[#475569] leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/case-study"
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#1D4ED8] hover:text-[#1E40AF]"
            >
              Read how the B-07 scenario was built <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
