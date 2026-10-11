import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Layers,
  Tag,
  Clock,
  Shield,
  Gauge,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PermitDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: permit } = await supabase
    .from("pi_permits")
    .select(`
      *,
      pi_permit_sections (*),
      pi_permit_requirements (*)
    `)
    .eq("id", id)
    .single();

  if (!permit) {
    notFound();
  }

  const categoryBadges: Record<string, string> = {
    emission_limit: "bg-rose-950/70 text-rose-400 border-rose-800/60",
    monitoring: "bg-cyan-950/70 text-cyan-400 border-cyan-800/60",
    recordkeeping: "bg-amber-950/70 text-amber-400 border-amber-800/60",
    reporting: "bg-blue-950/70 text-blue-400 border-blue-800/60",
    work_practice: "bg-emerald-950/70 text-emerald-400 border-emerald-800/60",
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Back button and Header */}
      <div>
        <Link
          href="/permits"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Permits
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                  permit.type === "current"
                    ? "bg-cyan-950 text-cyan-400 border-cyan-800"
                    : "bg-amber-950 text-amber-400 border-amber-800"
                }`}
              >
                {permit.type === "current" ? "Current Baseline" : "Revised Draft"}
              </span>
              <span className="text-xs font-mono text-slate-400">{permit.permit_number}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{permit.title}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Issued by {permit.agency} · Effective Date: {permit.effective_date}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/delta"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
            >
              Compare with Another Permit
            </Link>
          </div>
        </div>
      </div>

      {/* Extracted Obligations List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Extracted Structured Obligations ({permit.pi_permit_requirements?.length || 0})
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Deterministic Extraction · Gemini Passage Verified
          </span>
        </div>

        <div className="space-y-3">
          {permit.pi_permit_requirements?.map((ob: any) => (
            <div
              key={ob.id}
              className="glass-panel p-5 rounded-2xl border-slate-800 hover:border-slate-700/80 transition-all space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border capitalize font-semibold ${
                      categoryBadges[ob.category] || categoryBadges.monitoring
                    }`}
                  >
                    {ob.category.replace("_", " ")}
                  </span>
                  <span className="text-xs font-mono text-cyan-300 font-semibold">
                    {ob.citation}
                  </span>
                </div>

                {ob.applicability && (
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-cyan-400" />
                    Target: <strong>{ob.applicability}</strong>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-200">
                &ldquo;{ob.raw_text}&rdquo;
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 font-mono">
                {ob.parameter && (
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Parameter</span>
                    <span className="text-slate-300 font-medium">{ob.parameter}</span>
                  </div>
                )}
                {ob.limit_value !== null && (
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Limit Value</span>
                    <span className="text-rose-400 font-bold">
                      {ob.limit_value} {ob.unit}
                    </span>
                  </div>
                )}
                {ob.averaging_period && (
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Averaging Period</span>
                    <span className="text-slate-300">{ob.averaging_period}</span>
                  </div>
                )}
                {ob.frequency && (
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Monitoring Cadence</span>
                    <span className="text-amber-400">{ob.frequency}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
