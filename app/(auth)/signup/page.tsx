import Link from "next/link";
import { signupAction } from "@/app/auth/actions";
import Logo from "@/components/logo";
import { ArrowLeft, UserPlus, Flame, AlertCircle } from "lucide-react";

interface SignupPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 text-xs font-medium mb-3">
            <Flame className="w-3.5 h-3.5 text-cyan-400" />
            NorthRiver Refining
          </div>
          <div className="flex justify-center mb-2">
            <Logo markClassName="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Operator Profile</h1>
          <p className="text-xs text-slate-400 mt-1">Register for environmental compliance workspace</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{decodeURIComponent(error)}</span>
          </div>
        )}

        <div className="glass-panel rounded-2xl p-6 shadow-2xl">
          <form action={signupAction} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="fullName">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="e.g. Sarah Lin, PE"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="email">
                Refinery Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@northriverrefining.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="role">
                Organizational Role
              </label>
              <select
                id="role"
                name="role"
                defaultValue="engineer"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-sm text-slate-100 outline-none transition-all"
              >
                <option value="engineer">Environmental Engineer (Permits & Delta Analysis)</option>
                <option value="manager">Compliance Manager (Executive Oversight & Approvals)</option>
                <option value="operations">Operations Engineer (Utilities, Boilers & SOP Controls)</option>
                <option value="reviewer">Regulatory Reviewer (Legal, Audit & Final Verification)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold shadow-lg shadow-cyan-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Complete Registration
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-800 text-center text-xs text-slate-400">
            Already registered?{" "}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
