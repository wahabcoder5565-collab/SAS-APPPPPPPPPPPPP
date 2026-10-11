import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import PersonaSwitcher from "./persona-switcher";
import Logo from "@/components/logo";
import {
  LayoutDashboard,
  FileText,
  GitCompare,
  Cpu,
  CheckSquare,
  History,
  Users,
  Shield,
  Lock,
  Layers,
  Network,
  LogOut,
  User,
} from "lucide-react";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile info
  const { data: profile } = await supabase
    .from("pi_users")
    .select("*")
    .eq("id", user.id)
    .single();

  const role = profile?.role || user.user_metadata?.role || "engineer";
  const fullName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Operator";
  const userTitle = profile?.title || user.user_metadata?.title || "Refinery Air Quality Team";
  const userDepartment = profile?.department || user.user_metadata?.department || "Environmental Compliance";

  const roleBadgeStyles: Record<string, string> = {
    engineer: "bg-cyan-950/70 text-cyan-400 border-cyan-800/60",
    manager: "bg-emerald-950/70 text-emerald-400 border-emerald-800/60",
    operations: "bg-amber-950/70 text-amber-400 border-amber-800/60",
    reviewer: "bg-blue-950/70 text-blue-400 border-blue-800/60",
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/permits", label: "Permit Ingestion", icon: FileText },
    { href: "/delta", label: "Delta Comparison", icon: GitCompare },
    { href: "/impacts", label: "Asset Impacts", icon: Layers },
    { href: "/propagation", label: "Propagation Graph", icon: Network },
    { href: "/actions", label: "Implementation Register", icon: CheckSquare },
    { href: "/assets", label: "Facility Assets", icon: Cpu },
    { href: "/audit", label: "Audit Trail", icon: History },
    { href: "/team", label: "Team Directory", icon: Users },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800/80 bg-white/80 backdrop-blur-xl flex flex-col shrink-0">
        {/* App Logo */}
        <div className="p-5 border-b border-slate-800/80 flex items-center">
          <Logo href="/dashboard" tagline="NorthRiver Refining" />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Compliance Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-foreground hover:bg-slate-800/60 border border-transparent hover:border-slate-700/50 transition-all group"
              >
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Persona & Role Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200">
              <User className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">{fullName}</div>
              <div className="text-[10px] text-slate-400 truncate">{userTitle}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold font-mono ${
                    roleBadgeStyles[role] || roleBadgeStyles.engineer
                  }`}
                >
                  {role}
                </span>
                <span className="text-[10px] text-slate-500 truncate">{userDepartment}</span>
              </div>
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-slate-800/80 bg-white/70 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Facility Status: <strong className="text-slate-200">Refinery Complex 1 · Title V Major Source</strong></span>
            </div>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <div className="text-xs text-slate-400 hidden sm:block">
              Active Comparison: <span className="text-cyan-400 font-mono">T-V-2021-R2 vs T-V-2024-REV</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PersonaSwitcher
              currentRole={role}
              currentName={fullName}
              currentTitle={userTitle}
            />

            <div className="hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-[11px]">TLS · Factory Signed</span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400 font-mono text-[11px]">Strict Audit Mode</span>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
