"use client";

import { useState, useTransition } from "react";
import { demoLoginAction, type RefineryRole } from "@/app/auth/actions";
import {
  HardHat,
  ShieldCheck,
  Wrench,
  UserCheck,
  ChevronDown,
  Sparkles,
  Loader2,
} from "lucide-react";

interface PersonaSwitcherProps {
  currentRole: string;
  currentName: string;
  currentTitle?: string;
}

const PERSONAS: Array<{
  role: RefineryRole;
  name: string;
  title: string;
  department: string;
  badgeStyle: string;
  icon: typeof HardHat;
}> = [
  {
    role: "engineer",
    name: "Sarah Lin",
    title: "Senior Air Quality Engineer",
    department: "Environmental Compliance",
    badgeStyle: "bg-cyan-950/80 text-cyan-400 border-cyan-800/70",
    icon: HardHat,
  },
  {
    role: "manager",
    name: "Marcus Vance",
    title: "Environmental Compliance Manager",
    department: "Refinery Management",
    badgeStyle: "bg-emerald-950/80 text-emerald-400 border-emerald-800/70",
    icon: ShieldCheck,
  },
  {
    role: "operations",
    name: "David Chen",
    title: "Utilities & Steam Plant Lead",
    department: "Plant Operations",
    badgeStyle: "bg-amber-950/80 text-amber-400 border-amber-800/70",
    icon: Wrench,
  },
  {
    role: "reviewer",
    name: "Elena Rostova",
    title: "Lead Regulatory Auditor",
    department: "Quality Assurance & Audit",
    badgeStyle: "bg-blue-950/80 text-blue-400 border-blue-800/70",
    icon: UserCheck,
  },
];

export default function PersonaSwitcher({
  currentRole,
  currentName,
  currentTitle,
}: PersonaSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const activePersona =
    PERSONAS.find((p) => p.role === currentRole) || PERSONAS[0];

  const handleSwitch = (role: RefineryRole) => {
    if (role === currentRole) {
      setIsOpen(false);
      return;
    }

    startTransition(async () => {
      await demoLoginAction(role);
      setIsOpen(false);
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 text-xs transition-all shadow-sm cursor-pointer disabled:opacity-60"
        title="Switch Refinery Persona for Testing & Demos"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-400 text-[11px] font-mono uppercase tracking-wider">Persona:</span>
          <span className="font-semibold text-foreground">{currentName || activePersona.name}</span>
        </span>

        <span
          className={`text-[10px] px-2 py-0.5 rounded-md border font-medium uppercase tracking-wider ${activePersona.badgeStyle}`}
        >
          {activePersona.role}
        </span>

        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-700/90 shadow-2xl shadow-cyan-950/40 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 border-b border-slate-800/80 mb-1 flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> Switch NorthRiver Persona
              </span>
              <span className="text-[10px] text-slate-500 font-mono">MVP Multi-Role</span>
            </div>

            <div className="space-y-1">
              {PERSONAS.map((persona) => {
                const Icon = persona.icon;
                const isCurrent = persona.role === currentRole;

                return (
                  <button
                    key={persona.role}
                    onClick={() => handleSwitch(persona.role)}
                    disabled={isPending}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${
                      isCurrent
                        ? "bg-cyan-950/50 border border-cyan-800/60"
                        : "hover:bg-slate-900 border border-transparent hover:border-slate-800"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${persona.badgeStyle}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">
                          {persona.name}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded border uppercase font-mono ${persona.badgeStyle}`}
                        >
                          {persona.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 truncate mt-0.5">
                        {persona.title}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {persona.department}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
