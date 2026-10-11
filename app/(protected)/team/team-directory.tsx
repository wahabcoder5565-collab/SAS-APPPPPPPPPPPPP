"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { demoLoginAction, type RefineryRole } from "@/app/auth/actions";
import {
  Search,
  HardHat,
  ShieldCheck,
  Wrench,
  UserCheck,
  IdCard,
  ArrowRight,
  Loader2,
  BadgeCheck,
} from "lucide-react";

export interface TeamMember {
  id: string;
  full_name: string;
  role: string;
  title: string | null;
  department: string | null;
  email: string | null;
  avatar_url?: string | null;
}

const ROLE_META: Record<
  string,
  { label: string; badge: string; ring: string; initial: string; icon: typeof HardHat }
> = {
  engineer: {
    label: "Engineer",
    badge: "bg-cyan-950/70 text-cyan-400 border-cyan-800/60",
    ring: "from-cyan-500/30 to-cyan-900/40 border-cyan-800/60",
    initial: "bg-cyan-500/20 text-cyan-300",
    icon: HardHat,
  },
  manager: {
    label: "Manager",
    badge: "bg-emerald-950/70 text-emerald-400 border-emerald-800/60",
    ring: "from-emerald-500/30 to-emerald-900/40 border-emerald-800/60",
    initial: "bg-emerald-500/20 text-emerald-300",
    icon: ShieldCheck,
  },
  operations: {
    label: "Operations",
    badge: "bg-amber-950/70 text-amber-400 border-amber-800/60",
    ring: "from-amber-500/30 to-amber-900/40 border-amber-800/60",
    initial: "bg-amber-500/20 text-amber-300",
    icon: Wrench,
  },
  reviewer: {
    label: "Reviewer",
    badge: "bg-blue-950/70 text-blue-400 border-blue-800/60",
    ring: "from-blue-500/30 to-blue-900/40 border-blue-800/60",
    initial: "bg-blue-500/20 text-blue-300",
    icon: UserCheck,
  },
};

const DEMO_EMAILS = new Set([
  "demo.engineer@northriverrefining.com",
  "demo.manager@northriverrefining.com",
  "demo.operations@northriverrefining.com",
  "demo.reviewer@northriverrefining.com",
]);

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export default function TeamDirectory({
  team,
  currentUserId,
}: {
  team: TeamMember[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const roles = useMemo(
    () => Array.from(new Set(team.map((m) => m.role))).sort(),
    [team]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return team.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (!q) return true;
      return [m.full_name, m.title, m.department, m.email]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [team, search, roleFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, TeamMember[]>();
    for (const m of filtered) {
      const dept = m.department || "Unassigned";
      if (!map.has(dept)) map.set(dept, []);
      map.get(dept)!.push(m);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const handleActAs = (member: TeamMember) => {
    setPendingId(member.id);
    startTransition(async () => {
      await demoLoginAction(member.role as RefineryRole);
      setPendingId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter / search bar */}
      <div className="glass-panel rounded-2xl p-4 border-slate-800 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, title, department, or email…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-700 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setRoleFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
              roleFilter === "all"
                ? "bg-cyan-950/70 text-cyan-300 border-cyan-800/60"
                : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            All ({team.length})
          </button>
          {roles.map((r) => {
            const meta = ROLE_META[r] ?? ROLE_META.engineer;
            const count = team.filter((m) => m.role === r).length;
            const active = roleFilter === r;
            return (
              <button
                key={r}
                onClick={() => setRoleFilter(active ? "all" : r)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                  active ? meta.badge : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Department groups */}
      {grouped.length === 0 && (
        <div className="glass-panel rounded-2xl p-10 text-center border-slate-800">
          <UserCheck className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No personnel match the current filters.</p>
        </div>
      )}

      {grouped.map(([dept, members]) => (
        <section key={dept}>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">{dept}</span>
            <span className="text-[10px] font-mono text-slate-500">({members.length})</span>
            <span className="flex-1 h-px bg-slate-800/80" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {members.map((m) => {
              const meta = ROLE_META[m.role] ?? ROLE_META.engineer;
              const isDemo = m.email ? DEMO_EMAILS.has(m.email) : false;
              const isYou =
                currentUserId !== null && m.id === currentUserId;
              const pending = pendingId === m.id && isPending;

              return (
                <div
                  key={m.id}
                  className={`glass-panel glass-panel-hover rounded-2xl p-4 border-slate-800 relative overflow-hidden ${
                    isYou ? "border-cyan-700/70" : ""
                  }`}
                >
                  {isYou && (
                    <div className="absolute top-0 right-0 px-2.5 py-1 rounded-bl-xl bg-cyan-950/80 text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-300 border-b border-l border-cyan-800/60">
                      You
                    </div>
                  )}

                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-sm font-bold border shrink-0 ${meta.ring}`}
                    >
                      <span className={meta.initial}>{initials(m.full_name)}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {m.full_name}
                        </span>
                        {isDemo && (
                          <BadgeCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-label="Demo account with live session" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-300 truncate">{m.title || "—"}</div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold font-mono ${meta.badge}`}>
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">{m.department}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-3.5 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono truncate">
                      <IdCard className="w-3 h-3 shrink-0 text-slate-600" />
                      <span className="truncate">{m.email || "no email on file"}</span>
                    </div>

                    {isDemo ? (
                      <button
                        onClick={() => handleActAs(m)}
                        disabled={pending || isYou}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer disabled:opacity-50 ${
                          isYou
                            ? "bg-slate-900/60 text-slate-500 border-slate-800"
                            : "bg-slate-900/70 text-cyan-300 border-cyan-900/60 hover:bg-cyan-950/60 hover:border-cyan-700/70"
                        }`}
                      >
                        {pending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isYou ? (
                          "Current Session"
                        ) : (
                          <>
                            Act as
                            <ArrowRight className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[9px] font-mono uppercase tracking-wider text-slate-600">
                        Roster only
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}