import Link from "next/link";
import { loginAction, demoLoginAction } from "@/app/auth/actions";
import Logo from "@/components/logo";
import { ShieldCheck, HardHat, UserCheck, Wrench, ArrowRight, Zap, Flame, AlertCircle, Lock } from "lucide-react";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 text-xs font-medium mb-3">
            <Flame className="w-3.5 h-3.5 text-cyan-400" />
            NorthRiver Refining · Clean Air Intelligence
          </div>
          <h1 className="sr-only">PermitImpact AI</h1>
          <div className="flex justify-center">
            <Logo markClassName="h-10 w-10" />
          </div>
          <p className="text-sm text-slate-400 mt-2">
            Automated permit delta analysis & facility compliance mapping
          </p>
        </div>

        {/* Error message banner */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{decodeURIComponent(error)}</span>
          </div>
        )}

        {/* Demo Fast Login Personas */}
        <div className="glass-panel rounded-2xl p-5 mb-5 border-cyan-900/40 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> One-Click Demo Access
            </span>
            <span className="text-[11px] text-slate-400">Instant Role Switch</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <form action={demoLoginAction.bind(null, "engineer")}>
              <button
                type="submit"
                className="w-full flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 transition-all text-center group cursor-pointer"
              >
                <HardHat className="w-5 h-5 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-slate-200">Engineer</span>
                <span className="text-[10px] text-slate-500">Sarah Lin</span>
              </button>
            </form>

            <form action={demoLoginAction.bind(null, "manager")}>
              <button
                type="submit"
                className="w-full flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/80 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/50 transition-all text-center group cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-slate-200">Manager</span>
                <span className="text-[10px] text-slate-500">Marcus V.</span>
              </button>
            </form>

            <form action={demoLoginAction.bind(null, "operations")}>
              <button
                type="submit"
                className="w-full flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/80 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/50 transition-all text-center group cursor-pointer"
              >
                <Wrench className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-slate-200">Operations</span>
                <span className="text-[10px] text-slate-500">David Chen</span>
              </button>
            </form>

            <form action={demoLoginAction.bind(null, "reviewer")}>
              <button
                type="submit"
                className="w-full flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/80 hover:bg-blue-950/60 border border-slate-800 hover:border-blue-500/50 transition-all text-center group cursor-pointer"
              >
                <UserCheck className="w-5 h-5 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-slate-200">Reviewer</span>
                <span className="text-[10px] text-slate-500">Elena R.</span>
              </button>
            </form>
          </div>
        </div>

        {/* Regular Login Form */}
        <div className="glass-panel rounded-2xl p-6 shadow-2xl">
          <form action={loginAction} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="email">
                Refinery Work Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@northriverrefining.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300" htmlFor="password">
                  Password
                </label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold shadow-lg shadow-cyan-950/40 hover:shadow-cyan-900/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Sign In to Refinery Console
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Need an account?{" "}
            <Link href="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium">
              Create operator profile
            </Link>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span>
            Secure channel · TLS certificate presented by{" "}
            <span className="text-slate-400 font-medium">NorthRiver Refining Internal CA</span>
          </span>
        </div>
      </div>
    </div>
  );
}
