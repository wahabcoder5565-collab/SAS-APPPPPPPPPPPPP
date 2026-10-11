import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  FileText,
  Upload,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";

export default async function PermitsPage() {
  const supabase = await createClient();

  const { data: permits } = await supabase
    .from("pi_permits")
    .select(`
      *,
      pi_permit_requirements (count),
      pi_permit_sections (count)
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/50 text-cyan-400 text-xs font-semibold mb-2">
            <FileText className="w-3.5 h-3.5" /> Permit Ingestion & Document Repository
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Air Operating Permits (Title V)
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Ingest and maintain current baseline vs revised operating permits with structured obligation extraction.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/permits/new"
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Ingest New Permit
          </Link>
        </div>
      </div>

      {/* Permits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {permits?.map((permit) => {
          const isCurrent = permit.type === "current";
          const obligationCount = permit.pi_permit_requirements?.[0]?.count || 0;
          const sectionCount = permit.pi_permit_sections?.[0]?.count || 0;

          return (
            <div
              key={permit.id}
              className={`glass-panel rounded-2xl p-6 border-slate-800 relative transition-all ${
                isCurrent
                  ? "hover:border-cyan-500/40"
                  : "hover:border-amber-500/40"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                      isCurrent
                        ? "bg-cyan-950 text-cyan-400 border-cyan-800"
                        : "bg-amber-950 text-amber-400 border-amber-800"
                    }`}
                  >
                    {permit.type === "current" ? "Current Baseline" : "Revised Draft"}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{permit.permit_number}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="capitalize">{permit.status}</span>
                </div>
              </div>

              <h2 className="text-base font-bold text-foreground mb-2 leading-snug">
                {permit.title}
              </h2>
              <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                Agency: <strong className="text-slate-300">{permit.agency}</strong>
              </p>

              <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 mb-5 font-mono text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Effective Date</div>
                  <div className="text-slate-200 font-semibold mt-0.5">{permit.effective_date || "N/A"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Sections</div>
                  <div className="text-slate-200 font-semibold mt-0.5">{sectionCount}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Obligations</div>
                  <div className="text-cyan-400 font-semibold mt-0.5">{obligationCount} Clauses</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-500">
                  ID: <span className="font-mono text-slate-400">{permit.id.slice(0, 8)}...</span>
                </span>
                <Link
                  href={`/permits/${permit.id}`}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1.5"
                >
                  View Obligations <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Launch Promo */}
      <div className="glass-panel p-6 rounded-2xl border-cyan-900/40 bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Ready for Regulatory Delta Comparison?
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare baseline <span className="text-cyan-300 font-mono">T-V-2021-R2</span> against renewal <span className="text-amber-300 font-mono">T-V-2024-REV</span> to detect altered emission limits and monitoring rules.
            </p>
          </div>
        </div>

        <Link
          href="/delta"
          className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/50 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          Launch Delta Engine
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
