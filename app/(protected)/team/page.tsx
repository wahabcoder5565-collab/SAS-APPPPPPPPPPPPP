import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TeamDirectory, { type TeamMember } from "./team-directory";

async function fetchTeam(): Promise<TeamMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pi_users")
    .select("id, full_name, role, title, department, email, avatar_url")
    .order("full_name");
  return (data as TeamMember[]) ?? [];
}

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const team = await fetchTeam();

  const roleCounts = team.reduce<Record<string, number>>((acc, m) => {
    acc[m.role] = (acc[m.role] ?? 0) + 1;
    return acc;
  }, {});
  const departmentCount = new Set(team.map((m) => m.department).filter(Boolean)).size;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest mb-1">
            NorthRiver Refining · Organization
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Team Directory</h1>
          <p className="text-sm text-slate-400 mt-1">
            Personnel, roles & departments across the compliance organization
          </p>
        </div>
        <div className="text-xs text-slate-400">
          <Link href="/signup" className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium">
            + Invite operator profile
          </Link>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Personnel" value={String(team.length)} accent="text-foreground" />
        <StatCard label="Engineers" value={String(roleCounts.engineer ?? 0)} accent="text-cyan-400" />
        <StatCard label="Managers" value={String(roleCounts.manager ?? 0)} accent="text-emerald-400" />
        <StatCard label="Operations" value={String(roleCounts.operations ?? 0)} accent="text-amber-400" />
        <StatCard label="Reviewers" value={String(roleCounts.reviewer ?? 0)} accent="text-blue-400" />
        <StatCard label="Departments" value={String(departmentCount)} accent="text-slate-300" />
      </div>

      <TeamDirectory team={team} currentUserId={user?.id ?? null} />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="glass-panel rounded-2xl p-4 border-slate-800">
      <div className={`text-2xl font-bold font-mono ${accent}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}