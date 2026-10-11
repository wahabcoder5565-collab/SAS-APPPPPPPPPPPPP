"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/logo";
import HeroInspectionCard from "@/components/hero-inspection-card";
import ThreeFacilityScene from "@/components/three-facility-scene";
import WalkthroughModal from "@/components/walkthrough-modal";
import DemoLaunchButton from "@/components/demo-launch-button";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  GitCompare,
  Layers,
  Cpu,
  ShieldCheck,
  Video,
  Building2,
  Sparkles,
  ChevronRight,
  Flame,
  Menu,
  X,
  HardHat,
  UserCheck,
  Wrench,
  Workflow,
  Check,
  FileSpreadsheet,
  SlidersHorizontal,
  Box,
  Activity,
  Shield,
  Gauge,
  Terminal,
} from "lucide-react";

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHeroView, setActiveHeroView] = useState<"inspection" | "topology">("inspection");

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFD] text-[#1E293B] selection:bg-[#1D4ED8]/10 selection:text-[#0F172A]">
      {/* Walkthrough Scheduling Modal */}
      <WalkthroughModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* ═══════════════════════════════════════════
          TOP BENCHMARK STRIP — Executive Dark Slate
          ═══════════════════════════════════════════ */}
      <div className="bg-[#0B0F19] px-4 py-2 text-center text-xs flex items-center justify-center gap-2 font-medium border-b border-white/10 text-white">
        <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
        <span className="text-[#93C5FD] font-mono text-[11px] font-semibold uppercase tracking-wider">
          NorthRiver Refining Synthetic Benchmark
        </span>
        <span className="text-[#334155] hidden sm:inline">|</span>
        <span className="text-[#94A3B8] hidden sm:inline text-[11px]">
          Deterministic Permit Delta Analysis &amp; Asset Topological Mapping
        </span>
        <Link
          href="/demo"
          className="text-[#60A5FA] hover:text-white font-semibold underline underline-offset-2 ml-1 transition-colors text-[11px]"
        >
          Launch Refinery Console &rarr;
        </Link>
      </div>

      {/* ═══════════════════════════════════════════
          HEADER — Crisp Architectural Glass
          ═══════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
          <Logo
            href="/"
            theme="light"
            tagline="Permit-to-Operations AI for Industrial Facilities"
          />

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-7 text-[12px] font-semibold text-[#475569]">
            <a href="#what-it-does" className="hover:text-[#0F172A] transition-colors">
              What It Does
            </a>
            <a href="#differentiation" className="hover:text-[#0F172A] transition-colors">
              More Than Comparison
            </a>
            <a href="#workflow" className="hover:text-[#0F172A] transition-colors">
              How It Works
            </a>
            <a href="#use-cases" className="hover:text-[#0F172A] transition-colors">
              Use Cases
            </a>
            <a href="#implementation" className="hover:text-[#0F172A] transition-colors">
              Implementation
            </a>
            <a href="#demo" className="hover:text-[#0F172A] transition-colors">
              Refinery Demo
            </a>
          </nav>

          {/* Header Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/demo"
              className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-[#334155] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-all border border-[#CBD5E1]"
            >
              Interactive Demo
            </Link>
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-1.5 rounded-lg text-[12px] font-semibold bg-[#0F172A] hover:bg-[#1E293B] text-white transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              Book Walkthrough
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E2E8F0] bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
            <nav className="flex flex-col space-y-1 text-[12px] font-medium text-[#334155]">
              {[
                { href: "#what-it-does", label: "What It Does" },
                { href: "#differentiation", label: "More Than Comparison" },
                { href: "#workflow", label: "How It Works" },
                { href: "#use-cases", label: "Use Cases" },
                { href: "#implementation", label: "Implementation" },
                { href: "#demo", label: "Refinery Demo" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-lg hover:bg-[#F8FAFC] hover:text-[#1D4ED8]"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="pt-2 border-t border-[#F1F5F9] flex flex-col gap-2">
              <Link
                href="/demo"
                className="w-full text-center py-2.5 rounded-lg text-[12px] font-semibold text-[#334155] bg-[#F8FAFC] border border-[#E2E8F0]"
              >
                View Interactive Demo
              </Link>
              <button
                onClick={() => { setMobileMenuOpen(false); setModalOpen(true); }}
                className="w-full py-2.5 rounded-lg text-[12px] font-semibold bg-[#0F172A] text-white flex items-center justify-center gap-2"
              >
                <Video className="w-3.5 h-3.5" />
                Book Walkthrough
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════
          1. HERO SECTION — Mature Agency Architecture
          ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white border-b border-[#E2E8F0] pt-14 sm:pt-20 pb-16 sm:pb-20">
        {/* Subtle Architectural Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#F1F5F9_1px,transparent_1px),linear-gradient(to_bottom,#F1F5F9_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#F1F5F9] border border-[#CBD5E1] text-[#0F172A] text-[11px] font-mono font-bold tracking-wider uppercase mb-7">
            <span className="w-2 h-2 rounded-full bg-[#1D4ED8]" />
            <span>Title V Regulatory Protocol &middot; Refinery Air-Permit AI</span>
          </div>

          {/* Headline — Solid Authoritative Typography */}
          <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-[#090D16] tracking-tight leading-[1.12] max-w-4xl mx-auto">
            Every Permit Change. Every Equipment Change.{" "}
            <span className="text-[#1D4ED8]">
              Reviewed in Facility Context.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-[15px] sm:text-base text-[#334155] max-w-3xl mx-auto leading-relaxed font-normal">
            PermitImpact AI helps industrial teams connect permit obligations to real operations.
            It compares revised permit conditions, screens proposed equipment and process changes, and traces their
            impact across assets, procedures, monitoring requirements, and internal records — so your team can review
            changes faster and with stronger evidence.
          </p>

          {/* Dual CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-lg text-xs sm:text-sm font-semibold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white shadow-sm flex items-center justify-center gap-2 group transition-all cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Book a Google Meet Walkthrough</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <DemoLaunchButton
              variant="secondary"
              label="View Interactive Demo"
              className="w-full sm:w-auto !bg-[#F8FAFC] !text-[#0F172A] !border-[#CBD5E1] hover:!bg-[#F1F5F9] hover:!border-[#94A3B8] !rounded-lg !py-3 !px-6"
            />
          </div>

          {/* Support Line */}
          <p className="mt-4 text-[11px] text-[#64748B] font-medium">
            No login. No signup. No payment gate. Just a working demo and a direct technical walkthrough.
          </p>

          {/* Command Center Mode Switcher Dock */}
          <div className="mt-12 mb-6 inline-flex items-center p-1 rounded-xl bg-[#F1F5F9] border border-[#CBD5E1] shadow-xs text-xs font-semibold">
            <button
              onClick={() => setActiveHeroView("inspection")}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeHeroView === "inspection"
                  ? "bg-white text-[#0F172A] shadow-xs font-bold border border-[#E2E8F0]"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Facility Impact Inspector</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#1D4ED8] font-bold">
                Live Data
              </span>
            </button>
            <button
              onClick={() => setActiveHeroView("topology")}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeHeroView === "topology"
                  ? "bg-white text-[#0F172A] shadow-xs font-bold border border-[#E2E8F0]"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>3D Facility Topology Graph</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#475569] font-bold">
                Interactive
              </span>
            </button>
          </div>
        </div>

        {/* Centerpiece Showcase */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeHeroView === "inspection" ? (
            <HeroInspectionCard />
          ) : (
            <div className="w-full rounded-2xl bg-white border border-[#CBD5E1] shadow-[0_12px_40px_-10px_rgba(15,23,42,0.08)] overflow-hidden p-5 sm:p-7 text-center">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9] text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1D4ED8] animate-ping" />
                  <span className="font-bold text-[#0F172A]">Real-Time 3D Facility Topology Graph</span>
                  <span className="text-[#CBD5E1]">|</span>
                  <span className="text-[#475569] font-mono text-[11px]">Permit T-V-2024 Core &rarr; 6 Refinery Nodes</span>
                </div>
                <div className="text-[11px] text-[#64748B] font-mono">
                  Move cursor to tilt and rotate 3D mesh
                </div>
              </div>
              <div className="h-[380px] sm:h-[440px] relative">
                <ThreeFacilityScene />
              </div>
              <div className="pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-center gap-5 text-[11px] font-mono text-[#334155]">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#B91C1C]" /> B-07 Boiler (NOx)</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#D97706]" /> CT-4 Cooling Tower (VOC)</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2563EB]" /> F-101 Flare Header (Ja)</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#059669]" /> CEMS QA Monitoring</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#475569]" /> SOP-44 Firing Limit</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          2. TRUST / POSITIONING STRIP — Architectural 3-Pillars
          ═══════════════════════════════════════════ */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono font-bold text-[#1D4ED8] uppercase tracking-widest mb-3">
                01 / ARCHITECTURE
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wide">
                Facility-specific implementation
              </h3>
              <p className="text-xs text-[#475569] mt-2 leading-relaxed">
                Configured to your physical assets, naming conventions, operating limits, and permit structures — not generic templates.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono font-bold text-[#047857] uppercase tracking-widest mb-3">
                02 / VERIFICATION
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wide">
                Evidence-linked AI review
              </h3>
              <p className="text-xs text-[#475569] mt-2 leading-relaxed">
                Every finding, limit delta, and recommended action is anchored to page and condition-level source citations.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono font-bold text-[#475569] uppercase tracking-widest mb-3">
                03 / GOVERNANCE
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] border border-[#CBD5E1] text-[#334155] flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wide">
                Human-reviewed decisions
              </h3>
              <p className="text-xs text-[#475569] mt-2 leading-relaxed">
                Designed for engineering and compliance staff. AI prepares the technical review; certified experts retain full decision sign-off.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          3. WHAT IT DOES — Core Review Workflow
          ═══════════════════════════════════════════ */}
      <section id="what-it-does" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8] mb-3">
              Core Capabilities
            </div>
            <h2 className="text-2xl sm:text-[2.25rem] font-extrabold text-[#090D16] tracking-tight leading-tight">
              From permit language to operational impact
            </h2>
            <p className="mt-4 text-[15px] text-[#334155] leading-relaxed font-medium">
              PermitImpact AI is not a generic document chatbot.
            </p>
            <p className="mt-2 text-[14px] text-[#64748B] leading-relaxed">
              It is an AI review workflow designed to help industrial teams understand how regulatory requirements
              connect to the actual reality of a facility: equipment, procedures, monitoring controls, records, and
              proposed changes.
            </p>
          </div>

          {/* Three Capability Cards */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Capability 01 */}
            <div className="bg-[#FAFBFD] p-7 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between hover:border-[#93C5FD] transition-all group">
              <div>
                <div className="w-11 h-11 rounded-lg bg-white border border-[#CBD5E1] text-[#1D4ED8] flex items-center justify-center mb-6 group-hover:border-[#1D4ED8] transition-colors shadow-2xs">
                  <GitCompare className="w-5 h-5" />
                </div>
                <div className="text-[10px] font-mono font-bold text-[#1D4ED8] tracking-wider uppercase mb-1">
                  Capability 01
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
                  Permit Change Intelligence
                </h3>
                <p className="mt-3 text-[13px] text-[#475569] leading-relaxed">
                  Compare current and revised permit conditions. Identify changes in limits, monitoring frequencies,
                  operating conditions, reporting requirements, and compliance obligations.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#E2E8F0] flex flex-wrap gap-2 text-[11px] font-mono text-[#475569]">
                <span className="px-2 py-0.5 rounded bg-white border border-[#CBD5E1]">Limit Deltas</span>
                <span className="px-2 py-0.5 rounded bg-white border border-[#CBD5E1]">Monitoring Frequencies</span>
                <span className="px-2 py-0.5 rounded bg-white border border-[#CBD5E1]">Obligations</span>
              </div>
            </div>

            {/* Capability 02 */}
            <div className="bg-[#FAFBFD] p-7 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between hover:border-[#A7F3D0] transition-all group">
              <div>
                <div className="w-11 h-11 rounded-lg bg-white border border-[#CBD5E1] text-[#047857] flex items-center justify-center mb-6 group-hover:border-[#047857] transition-colors shadow-2xs">
                  <Cpu className="w-5 h-5" />
                </div>
                <div className="text-[10px] font-mono font-bold text-[#047857] tracking-wider uppercase mb-1">
                  Capability 02
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
                  Equipment &amp; Process Impact Review
                </h3>
                <p className="mt-3 text-[13px] text-[#475569] leading-relaxed">
                  Screen equipment modifications, operating changes, and documented internal updates against applicable
                  permit conditions and facility controls.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#E2E8F0] flex flex-wrap gap-2 text-[11px] font-mono text-[#475569]">
                <span className="px-2 py-0.5 rounded bg-white border border-[#CBD5E1]">CEMS Verification</span>
                <span className="px-2 py-0.5 rounded bg-white border border-[#CBD5E1]">Boilers &amp; Heaters</span>
                <span className="px-2 py-0.5 rounded bg-white border border-[#CBD5E1]">Operating Envelopes</span>
              </div>
            </div>

            {/* Capability 03 */}
            <div className="bg-[#FAFBFD] p-7 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between hover:border-[#CBD5E1] transition-all group">
              <div>
                <div className="w-11 h-11 rounded-lg bg-white border border-[#CBD5E1] text-[#334155] flex items-center justify-center mb-6 group-hover:border-[#0F172A] transition-colors shadow-2xs">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="text-[10px] font-mono font-bold text-[#475569] tracking-wider uppercase mb-1">
                  Capability 03
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
                  Evidence-Linked Action Plans
                </h3>
                <p className="mt-3 text-[13px] text-[#475569] leading-relaxed">
                  Trace every finding to source evidence, highlight affected records and procedures, and prepare a
                  human-reviewed implementation path.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#E2E8F0] flex flex-wrap gap-2 text-[11px] font-mono text-[#475569]">
                <span className="px-2 py-0.5 rounded bg-white border border-[#CBD5E1]">SOP Alignment</span>
                <span className="px-2 py-0.5 rounded bg-white border border-[#CBD5E1]">DCS Alarm Changes</span>
                <span className="px-2 py-0.5 rounded bg-white border border-[#CBD5E1]">Human Sign-Off</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          4. STRONG DIFFERENTIATION — Agency Comparison Matrix
          ═══════════════════════════════════════════ */}
      <section id="differentiation" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Narrative */}
            <div className="lg:col-span-6 space-y-5">
              <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8]">
                Architectural Distinction
              </div>
              <h2 className="text-2xl sm:text-[2.25rem] font-extrabold text-[#090D16] tracking-tight leading-tight">
                More than permit comparison
              </h2>
              <p className="text-[14px] sm:text-[15px] text-[#334155] leading-relaxed font-medium">
                Most tools stop at extracting text from documents.
              </p>
              <p className="text-[14px] text-[#64748B] leading-relaxed">
                PermitImpact AI goes further by connecting permit changes and operational changes to the internal
                context that matters:
              </p>

              {/* 7 Internal Context Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {[
                  { label: "emission units", desc: "Boilers, heaters, cooling towers, flares" },
                  { label: "monitored equipment", desc: "CEMS, drift eliminators, flow meters" },
                  { label: "operating procedures", desc: "Standard Operating Procedures (SOPs)" },
                  { label: "inspection frequencies", desc: "El Paso, Method 9, quarterly calibration" },
                  { label: "internal forms", desc: "DCS shift logs, deviation checklists" },
                  { label: "compliance records", desc: "Semi-annual Title V certifications" },
                  { label: "review responsibilities", desc: "Engineering & compliance leads" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-white border border-[#CBD5E1] flex items-start gap-2.5 hover:border-[#1D4ED8] transition-colors shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[12px] font-bold text-[#0F172A] capitalize">{item.label}</div>
                      <div className="text-[11px] text-[#64748B]">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Punch Line Box */}
              <div className="pt-2">
                <div className="p-5 rounded-xl bg-[#0B0F19] text-white space-y-2 border border-[#1E293B] shadow-md">
                  <div className="text-[11px] font-mono text-[#94A3B8]">Not just:</div>
                  <div className="text-[14px] font-semibold text-[#CBD5E1] font-mono">
                    &ldquo;What changed in the permit?&rdquo;
                  </div>
                  <div className="text-[11px] font-mono text-[#94A3B8] pt-1">But:</div>
                  <div className="text-base font-bold text-white font-mono text-[#93C5FD]">
                    &ldquo;What does that change affect inside the facility?&rdquo;
                  </div>
                </div>
              </div>
            </div>

            {/* Right Comparison Matrix */}
            <div className="lg:col-span-6 space-y-4">
              {/* Generic AI — Bad */}
              <div className="bg-white p-6 rounded-xl border border-[#CBD5E1] space-y-4 shadow-xs">
                <div className="text-[11px] font-mono font-bold text-[#64748B] uppercase tracking-wider flex items-center justify-between">
                  <span>Generic Document AI / Text Chatbots</span>
                  <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] text-[10px] font-mono font-bold">Unanchored</span>
                </div>
                <div className="space-y-3 text-[13px] text-[#64748B]">
                  {[
                    "Extracts text diffs in isolation without understanding equipment topology",
                    "Produces free-form narrative that cannot verify historical CEMS log data",
                    "Blind to outdated internal SOPs, alarm settings, and external lab contracts",
                    "No evidence chain linking conclusions to specific permit condition numbers",
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-[#DC2626] font-bold shrink-0 text-[13px] font-mono">✕</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* PermitImpact AI — Good */}
              <div className="bg-white p-6 rounded-xl border-2 border-[#1D4ED8] space-y-4 shadow-md">
                <div className="text-[11px] font-mono font-bold text-[#1D4ED8] uppercase tracking-wider flex items-center justify-between">
                  <span>PermitImpact AI Facility Review Workflow</span>
                  <span className="px-2 py-0.5 rounded bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] text-[10px] font-mono font-bold">
                    Configured
                  </span>
                </div>
                <div className="space-y-3 text-[13px] text-[#0F172A] font-medium">
                  {[
                    "Correlates every condition to physical emission units, heaters, and monitored assets",
                    "Evaluates numeric threshold tightness against 6-month continuous monitoring logs",
                    "Surfaces conflicts between new limits and existing operating SOPs & DCS alarms",
                    "Strict evidence-anchored citations with human engineering sign-off workflow",
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          5. VISUAL WORKFLOW — Methodology
          ═══════════════════════════════════════════ */}
      <section id="workflow" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8] mb-3">
              Structured Methodology
            </div>
            <h2 className="text-2xl sm:text-[2.25rem] font-extrabold text-[#090D16] tracking-tight leading-tight">
              How the workflow works
            </h2>
            <p className="mt-3 text-[14px] sm:text-[15px] text-[#64748B]">
              A four-step engineering pipeline connecting regulatory documents to real facility operations.
            </p>
          </div>

          {/* Four Steps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                title: "1. Ingest",
                icon: <FileText className="w-4 h-4 text-[#1D4ED8]" />,
                desc: "Permits, procedures, asset references, and selected internal records are mapped into a facility-specific review layer.",
                tags: "Title V Permits · SOPs · Asset Lists",
              },
              {
                step: "02",
                title: "2. Detect",
                icon: <GitCompare className="w-4 h-4 text-[#1D4ED8]" />,
                desc: "AI identifies relevant changes in permit language, operating requirements, and documented facility events.",
                tags: "Limit Deltas · Cadence Shifts · Conditions",
              },
              {
                step: "03",
                title: "3. Map",
                icon: <Layers className="w-4 h-4 text-[#1D4ED8]" />,
                desc: "The system links those changes to equipment, procedures, monitoring expectations, and internal responsibilities.",
                tags: "Equipment Specs · DCS Alarms · Roles",
              },
              {
                step: "04",
                title: "4. Review",
                icon: <CheckCircle2 className="w-4 h-4 text-[#047857]" />,
                desc: "Your team receives evidence-backed findings and action recommendations for expert review and approval.",
                tags: "Remediation Actions · Sign-Off Queue",
              },
            ].map((s) => (
              <div key={s.step} className="bg-[#FAFBFD] p-6 rounded-xl border border-[#CBD5E1] flex flex-col justify-between shadow-2xs hover:border-[#1D4ED8] transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-[#CBD5E1] text-[#0F172A]">
                      STEP {s.step}
                    </span>
                    {s.icon}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0F172A] mb-2">{s.title}</h3>
                  <p className="text-[13px] text-[#475569] leading-relaxed">{s.desc}</p>
                </div>
                <div className="mt-6 pt-3 border-t border-[#E2E8F0] text-[11px] font-mono text-[#64748B]">
                  {s.tags}
                </div>
              </div>
            ))}
          </div>

          {/* Closing Statement */}
          <div className="mt-14 text-center">
            <div className="inline-block px-7 py-3 rounded-lg bg-[#0F172A] text-white font-semibold text-[14px] tracking-wide shadow-md">
              AI prepares the review. Your team makes the decision.
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          6. EXAMPLE USE CASES — Refinery Scenarios
          ═══════════════════════════════════════════ */}
      <section id="use-cases" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-14">
            <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8] mb-3">
              Operational Scenarios
            </div>
            <h2 className="text-2xl sm:text-[2.25rem] font-extrabold text-[#090D16] tracking-tight leading-tight">
              Example reviews PermitImpact AI can support
            </h2>
            <p className="mt-3 text-[14px] sm:text-[15px] text-[#475569]">
              Tailored review modes for environmental compliance engineers, plant managers, and operations leads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <FileText className="w-4 h-4" />,
                label: "Permit Renewal & Revision",
                title: "Revised Title V permit review",
                desc: "Detect changes in emission limits, monitoring cadence, operating conditions, and reporting requirements.",
                example: "Example: Boiler NOx limit drops from 0.080 to 0.050 lb/MMBtu; CEMS historical analysis flags 3 excursion risks.",
              },
              {
                icon: <SlidersHorizontal className="w-4 h-4" />,
                label: "Management of Change (MOC)",
                title: "Equipment change screening",
                desc: "Review whether a proposed equipment modification may affect a permit obligation, control assumption, or internal procedure.",
                example: "Example: Flare gas header tie-in evaluated against NSPS Subpart Ja net heating value (NHVcz) operating envelope.",
              },
              {
                icon: <FileSpreadsheet className="w-4 h-4" />,
                label: "Internal Procedures & Calibrations",
                title: "Procedure alignment checks",
                desc: "Surface internal documents or records that may still reflect outdated limits, intervals, or conditions.",
                example: "Example: SOP-31 and lab logistics contract still calling for monthly VOC tests when permit mandates 14 days.",
              },
              {
                icon: <ShieldCheck className="w-4 h-4" />,
                label: "Audit & Record Readiness",
                title: "Monitoring & evidence readiness",
                desc: "Help teams identify where supporting evidence, approvals, or follow-up review may be needed.",
                example: "Example: Pre-certification verification confirming all quarterly calibrations and deviation logs are fully reconciled.",
              },
            ].map((uc, i) => (
              <div key={i} className="bg-white p-7 rounded-xl border border-[#CBD5E1] shadow-2xs flex flex-col justify-between hover:border-[#1D4ED8] transition-colors">
                <div>
                  <div className="flex items-center gap-2.5 mb-3.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] flex items-center justify-center">
                      {uc.icon}
                    </div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1D4ED8]">
                      {uc.label}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">{uc.title}</h3>
                  <p className="mt-2.5 text-[13px] text-[#475569] leading-relaxed">{uc.desc}</p>
                </div>
                <div className="mt-6 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[12px] text-[#334155] font-mono font-medium">
                  {uc.example}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          7. IMPLEMENTATION CREDIBILITY — Engineering Deployment
          ═══════════════════════════════════════════ */}
      <section id="implementation" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto">
          <div className="p-8 sm:p-12 rounded-2xl bg-[#0B0F19] text-white shadow-xl relative overflow-hidden border border-[#1E293B]">
            <div className="max-w-3xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/10 border border-white/20 text-[#93C5FD] text-xs font-mono font-bold uppercase tracking-wider mb-5">
                Implementation Protocol
              </div>

              <h2 className="text-2xl sm:text-[2.25rem] font-extrabold tracking-tight text-white leading-tight">
                Built for implementation, not self-serve setup
              </h2>

              <p className="mt-4 text-[14px] sm:text-[15px] text-[#CBD5E1] leading-relaxed font-medium">
                PermitImpact AI is designed for facilities where context matters.
              </p>
              <p className="mt-2 text-[14px] sm:text-[15px] text-[#94A3B8] leading-relaxed">
                Every facility has different assets, naming conventions, procedures, records, and permit structures.
                That is why PermitImpact AI is implemented with your team and configured to your actual operating
                environment.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  {
                    title: "Configured to your permit structure",
                    desc: "Modeled around your state agency format (TCEQ, SCAQMD, LDEQ, IEPA), Title V renewals, PSD permits, and NSPS/NESHAP subparts.",
                  },
                  {
                    title: "Mapped to your facility assets and records",
                    desc: "Ingests your actual equipment IDs, DCS tag structures, operating SOPs, and CEMS spans into an interconnected graph.",
                  },
                  {
                    title: "Reviewed with your technical and compliance staff",
                    desc: "Engineers and compliance specialists validate delta classifications and approval thresholds during deployment.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3.5">
                    <div className="w-6 h-6 rounded-md bg-[#1D4ED8] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-semibold text-white">{item.title}</h3>
                      <p className="text-[12px] text-[#94A3B8] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-9 pt-6 border-t border-white/10 text-[13px] text-[#60A5FA] font-semibold">
                This is not off-the-shelf compliance automation. It is a facility-specific AI workflow.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          8. DEMO SECTION — NorthRiver Refining
          ═══════════════════════════════════════════ */}
      <section id="demo" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] text-xs font-semibold mb-5">
            <Flame className="w-3.5 h-3.5 text-[#1D4ED8]" />
            <span>NorthRiver Refining Benchmark Environment</span>
          </div>

          <h2 className="text-2xl sm:text-[2.25rem] font-extrabold text-[#090D16] tracking-tight leading-tight">
            Explore the NorthRiver Refining demo
          </h2>

          <p className="mt-4 text-[14px] sm:text-[15px] text-[#475569] max-w-2xl mx-auto leading-relaxed">
            See how PermitImpact AI compares revised permit conditions and maps them to equipment, internal controls,
            and review actions inside a synthetic refinery environment.
          </p>

          {/* Persona Cards */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {[
              {
                role: "engineer" as const,
                name: "Sarah Lin",
                title: "Senior Air Quality Engineer",
                desc: "Evaluate B-07 NOx limit delta & FGR tuning plan.",
                cta: "Enter as Engineer",
                icon: <HardHat className="w-4 h-4" />,
              },
              {
                role: "manager" as const,
                name: "Marcus Vance",
                title: "Compliance Manager",
                desc: "Review high-priority findings and remediation budgets.",
                cta: "Enter as Manager",
                icon: <ShieldCheck className="w-4 h-4" />,
              },
              {
                role: "operations" as const,
                name: "David Chen",
                title: "Plant Operations Lead",
                desc: "Inspect SOP-44 updates and DCS alarm setpoints.",
                cta: "Enter as Operations",
                icon: <Wrench className="w-4 h-4" />,
              },
              {
                role: "reviewer" as const,
                name: "Elena Rostova",
                title: "Lead QA Auditor",
                desc: "Verify permit clause citations and audit evidence.",
                cta: "Enter as Reviewer",
                icon: <UserCheck className="w-4 h-4" />,
              },
            ].map((persona) => (
              <DemoLaunchButton
                key={persona.role}
                variant="card"
                role={persona.role}
                className="bg-white p-5 rounded-xl border border-[#CBD5E1] shadow-2xs hover:border-[#1D4ED8] group transition-all"
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] flex items-center justify-center">
                    {persona.icon}
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors">
                      {persona.name}
                    </div>
                    <div className="text-[10px] text-[#64748B] font-medium">{persona.title}</div>
                  </div>
                </div>
                <p className="text-[11px] text-[#475569] mt-2 leading-relaxed">{persona.desc}</p>
                <div className="mt-3.5 text-[10px] text-[#1D4ED8] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  {persona.cta} &rarr;
                </div>
              </DemoLaunchButton>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <DemoLaunchButton
              label="Open Demo"
              className="w-full sm:w-auto !rounded-lg !py-3 !px-6"
            />
            <button
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-lg text-xs sm:text-sm font-semibold bg-white text-[#0F172A] border border-[#CBD5E1] hover:bg-[#F8FAFC] hover:border-[#94A3B8] shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Video className="w-4 h-4 text-[#1D4ED8]" />
              Book a Technical Walkthrough
            </button>
          </div>

          <p className="mt-5 text-[11px] text-[#64748B] max-w-lg mx-auto">
            NorthRiver Refining is a synthetic demonstration environment created to illustrate the workflow.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          9. CONTACT SECTION — Google Meet Walkthrough
          ═══════════════════════════════════════════ */}
      <section id="contact" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto">
          <div className="p-8 sm:p-14 rounded-2xl bg-[#FAFBFD] border border-[#CBD5E1] shadow-sm text-center space-y-6">
            <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] flex items-center justify-center mx-auto">
              <Video className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-[2.25rem] font-extrabold text-[#090D16] tracking-tight leading-tight">
                Talk directly with us
              </h2>
              <p className="mt-4 text-[14px] sm:text-[15px] text-[#334155] max-w-2xl mx-auto leading-relaxed font-medium">
                If you want to see whether this workflow fits your facility, book a direct walkthrough.
              </p>
              <p className="mt-2 text-[14px] sm:text-[15px] text-[#64748B] max-w-2xl mx-auto leading-relaxed">
                We will show the demo, discuss your environment, and explain how the system could be configured around
                your permits, equipment, procedures, and review processes.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setModalOpen(true)}
                className="px-8 py-3.5 rounded-lg text-sm font-semibold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white shadow-md flex items-center justify-center gap-2 mx-auto cursor-pointer transition-all"
              >
                <Video className="w-4.5 h-4.5" />
                Book a Google Meet
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[12px] text-[#64748B] space-y-0.5">
              <div>No sales maze. No forced signup.</div>
              <div className="font-semibold text-[#0F172A]">
                Just a direct conversation and a live walkthrough.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          10. POSITIONING ANCHOR STRIP
          ═══════════════════════════════════════════ */}
      <section className="bg-[#0B0F19] py-14 px-4 sm:px-6 lg:px-8 border-t border-white/10 text-white">
        <div className="max-w-5xl mx-auto text-center space-y-2.5">
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#60A5FA] font-bold">
            PermitImpact AI
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Permit-to-Operations AI for Industrial Facilities
          </h2>
          <p className="text-[13px] text-[#94A3B8] font-medium">
            Implemented with your team. Configured to your facility. Reviewed by humans.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════ */}
      <footer className="bg-[#070B14] border-t border-white/5 py-10 px-4 sm:px-6 lg:px-8 text-[12px] text-[#94A3B8]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo href="/" theme="dark" tagline="Facility Context Workflow" />

          <div className="flex flex-wrap items-center justify-center gap-6 text-[#94A3B8] text-[12px] font-medium">
            <a href="#what-it-does" className="hover:text-white transition-colors">
              What It Does
            </a>
            <a href="#differentiation" className="hover:text-white transition-colors">
              Differentiation
            </a>
            <a href="#workflow" className="hover:text-white transition-colors">
              Workflow
            </a>
            <a href="#use-cases" className="hover:text-white transition-colors">
              Use Cases
            </a>
            <a href="#demo" className="hover:text-white transition-colors">
              Refinery Demo
            </a>
            <Link href="/login" className="hover:text-white transition-colors">
              Console Sign In
            </Link>
          </div>

          <div className="text-center md:text-right text-[11px] text-[#64748B] space-y-0.5">
            <div>Synthetic NorthRiver Refining demonstration dataset.</div>
            <div>Modeled for Title V Clean Air Act industrial compliance review workflows.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}