import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FileDiff,
  Sparkles,
  Cpu,
  ShieldAlert,
  CheckSquare,
  FileText,
} from "lucide-react";
import ReviewPanel from "./review-panel";
import {
  ChangeRow,
  MappingLite,
  RequirementLite,
  ConflictRow,
  ActionRow,
  ReviewEventRow,
  SEVERITY_STYLES,
  STATUS_STYLES,
  CONFLICT_STYLES,
} from "../types";

interface Props {
  params: Promise<{ id: string }>;
}

function normalizeMapping(value: MappingLite[] | MappingLite | null): MappingLite | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function normalizeRequirement(value: RequirementLite[] | RequirementLite | null): RequirementLite | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export default async function ChangeDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: rawChange } = await supabase
    .from("pi_permit_changes")
    .select(`
      *,
      old_requirement:pi_permit_requirements!old_requirement_id (*),
      new_requirement:pi_permit_requirements!new_requirement_id (*),
      mapping:pi_impact_mappings (
        id,
        risk_level,
        confidence_score,
        technical_analysis,
        impact_type,
        asset:pi_facility_assets (asset_code, name, asset_type)
      )
    `)
    .eq("id", id)
    .single();

  if (!rawChange) notFound();

  const change: ChangeRow = {
    id: rawChange.id,
    summary: rawChange.summary,
    delta_description: rawChange.delta_description,
    change_type: rawChange.change_type,
    change_kind: rawChange.change_kind,
    severity: rawChange.severity,
    old_value: rawChange.old_value,
    new_value: rawChange.new_value,
    confidence: rawChange.confidence,
    ai_reasoning: rawChange.ai_reasoning,
    review_status: rawChange.review_status,
    reviewed_by: rawChange.reviewed_by,
    reviewed_at: rawChange.reviewed_at,
    created_at: rawChange.created_at,
    comparison_id: rawChange.comparison_id,
    old_requirement: normalizeRequirement(rawChange.old_requirement),
    new_requirement: normalizeRequirement(rawChange.new_requirement),
    mapping: normalizeMapping(rawChange.mapping),
  };

  const { data: rawConflicts } = await supabase
    .from("pi_conflicts")
    .select("id, change_id, asset_id, control_id, document_id, conflict_type, summary, permit_value, control_value, unit, confidence, citation")
    .eq("change_id", id)
    .order("created_at", { ascending: false });
  const conflicts: ConflictRow[] = (rawConflicts ?? []).map((c) => ({
    id: c.id,
    change_id: c.change_id,
    asset_id: c.asset_id,
    control_id: c.control_id,
    document_id: c.document_id,
    conflict_type: c.conflict_type,
    summary: c.summary,
    permit_value: c.permit_value,
    control_value: c.control_value,
    unit: c.unit,
    confidence: c.confidence,
    citation: c.citation as ConflictRow["citation"],
  }));

  const { data: rawActions } = await supabase
    .from("pi_implementation_actions")
    .select("id, title, description, department, action_type, status, due_date, estimated_cost, estimated_days, lead_time_weeks")
    .eq("change_id", id)
    .order("created_at", { ascending: true });
  const actions: ActionRow[] = (rawActions ?? []) as ActionRow[];

  const { data: rawEvents } = await supabase
    .from("pi_review_events")
    .select("id, decision, note, reviewer_id, timestamp")
    .eq("entity_type", "permit_change")
    .eq("entity_id", id)
    .order("timestamp", { ascending: false });

  // Resolve reviewer profiles (pi_review_events.reviewer_id → auth.users → pi_users has no FK)
  let reviewerNames: Record<string, string> = {};
  const reviewerIds = Array.from(
    new Set((rawEvents ?? []).map((e) => e.reviewer_id).filter(Boolean)),
  );
  if (reviewerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("pi_users")
      .select("id, full_name")
      .in("id", reviewerIds);
    reviewerNames = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id as string, p.full_name as string]),
    );
  }

  const reviewEvents: ReviewEventRow[] = (rawEvents ?? []).map((e) => ({
    id: e.id,
    decision: e.decision,
    note: e.note,
    timestamp: e.timestamp,
    reviewer_name: e.reviewer_id ? (reviewerNames[e.reviewer_id] ?? null) : null,
  }));

  const conf = change.confidence !== null && change.confidence !== undefined ? Number(change.confidence) : 0;
  const oldReq = change.old_requirement;
  const newReq = change.new_requirement;
  const asset = change.mapping?.asset;
  const confStyle = conf >= 0.95 ? "text-emerald-400" : conf >= 0.9 ? "text-cyan-400" : "text-amber-400";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back + header */}
      <div className="space-y-4">
        <Link
          href="/delta"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Change Register
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold border ${
                  SEVERITY_STYLES[change.severity] ?? SEVERITY_STYLES.low
                }`}
              >
                {change.severity} delta
              </span>
              <span
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold border ${
                  STATUS_STYLES[change.review_status] ?? STATUS_STYLES.pending
                }`}
              >
                {change.review_status}
              </span>
              {change.change_kind && (
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  kind: {change.change_kind.replace(/_/g, " ")}
                </span>
              )}
              {asset && (
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {asset.asset_code}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{change.summary}</h1>
            <p className="text-xs text-slate-400 max-w-3xl">{change.delta_description}</p>
          </div>

          <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">
              AI Confidence
              {conf > 0 && (
                <div className={`text-lg font-bold ${confStyle}`}>{Math.round(conf * 100)}%</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Permit comparison */}
          <section className="rounded-2xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/50">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileDiff className="w-4 h-4 text-cyan-400" />
                Permit Clause Comparison
              </div>
              {newReq?.citation && (
                <span className="text-[10px] font-mono text-amber-300/90 bg-amber-950/50 border border-amber-800/40 px-2 py-0.5 rounded-md">
                  {newReq.citation}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800/60">
                  <span className="text-[10px] uppercase font-bold">Baseline Clause</span>
                  <span className="text-cyan-400 font-medium font-mono">
                    {oldReq?.citation ?? "—"}
                    {oldReq?.page ? ` · p.${oldReq.page}` : ""}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {oldReq?.raw_text ?? "Requirement not specified"}
                </p>
                <div className="pt-2 text-xs">
                  <span className="text-[10px] text-slate-500 uppercase block">Active Value / Baseline</span>
                  <span className="text-slate-100 font-bold font-mono">{change.old_value ?? oldReq?.limit_value ?? "—"}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-800/40 space-y-2">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800/60">
                  <span className="text-[10px] uppercase font-bold text-amber-400">Revised Renewal Clause</span>
                  <span className="text-amber-400 font-medium font-mono">
                    {newReq?.citation ?? "—"}
                    {newReq?.page ? ` · p.${newReq.page}` : ""}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-sans leading-relaxed">
                  {newReq?.raw_text ?? "Requirement not specified"}
                </p>
                <div className="pt-2 text-xs">
                  <span className="text-[10px] text-slate-500 uppercase block">New Requirement Value</span>
                  <span className="text-amber-300 font-bold font-mono">{change.new_value ?? newReq?.limit_value ?? "—"}</span>
                </div>
              </div>
            </div>

            {change.old_value && change.new_value && change.old_value !== change.new_value && (
              <div className="mx-5 mb-5 px-4 py-3 rounded-xl bg-slate-950 border border-cyan-800/40 flex flex-wrap items-center gap-3 text-xs font-mono">
                <span className="text-slate-400 line-through">{change.old_value}</span>
                <span className="text-cyan-400 font-bold">→</span>
                <span className="text-amber-300 font-bold">{change.new_value}</span>
                <span className="text-[10px] text-slate-500 font-sans ml-auto">
                  Deterministic numeric delta · directional stringency verified by code
                </span>
              </div>
            )}
          </section>

          {/* 2. AI Interpretation */}
          <section className="rounded-2xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/50">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                AI Interpretation
              </div>
              {conf > 0 && (
                <span className={`text-xs font-bold font-mono ${confStyle}`}>{Math.round(conf * 100)}% confidence</span>
              )}
            </div>
            <div className="p-5 space-y-4">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">Summary</span>
                <p className="text-sm text-slate-200 leading-relaxed">{change.summary}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">Rationale</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {change.ai_reasoning ?? "Deterministic delta detection; no LLM involved in the numeric computation."}
                </p>
              </div>
              <div className="rounded-xl bg-amber-950/40 border border-amber-800/50 p-3.5 text-[11px] leading-relaxed">
                <span className="text-amber-300 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                  Assumption Disclosure
                </span>
                <p className="text-amber-100/80">
                  AI-assisted interpretation only. Numeric limits, unit conversions, cadence math, and delta direction are
                  computed deterministically by the engine and never by the language model. Regulatory interpretation and
                  final sign-off remain the responsibility of a qualified engineer.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Downstream conflicts */}
          <section className="rounded-2xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/50">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Downstream Conflicts
              </div>
              <span className="text-xs text-slate-400 font-mono">{conflicts.length} found</span>
            </div>
            {conflicts.length === 0 ? (
              <p className="px-5 py-6 text-xs text-slate-500">
                No downstream conflicts detected for this change. Run “Facility Impact Resolution” on the{" "}
                <Link href="/impacts" className="text-cyan-400 hover:underline">Asset Impact Matrix</Link> to populate this panel.
              </p>
            ) : (
              <ul className="divide-y divide-slate-800/70">
                {conflicts.map((conflict) => {
                  const style = CONFLICT_STYLES[conflict.conflict_type] ?? {
                    label: conflict.conflict_type,
                    className: "bg-slate-800 border-slate-700 text-slate-300",
                  };
                  return (
                    <li key={conflict.id} className="px-5 py-4 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wide ${style.className}`}
                        >
                          {style.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {(Number(conflict.confidence) * 100).toFixed(0)}% engine confidence
                        </span>
                      </div>

                      {conflict.permit_value && conflict.control_value && (
                        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-300">
                            Permit {conflict.permit_value}
                          </span>
                          <span className="text-slate-500">vs</span>
                          <span className="px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800/50 text-rose-300">
                            Internal {conflict.control_value}
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-slate-300 leading-relaxed">{conflict.summary}</p>

                      <div className="rounded-lg bg-slate-950/70 border border-slate-800/70 p-3 text-[11px] text-slate-400 space-y-1">
                        <div className="flex items-center gap-2 font-semibold text-slate-300">
                          <FileText className="w-3 h-3 text-cyan-400" />
                          {conflict.citation?.document_title ?? "Uncited"}
                          {conflict.citation?.page_or_section && (
                            <span className="text-cyan-400 font-mono">{conflict.citation.page_or_section}</span>
                          )}
                        </div>
                        {conflict.citation?.quote && (
                          <p className="italic text-slate-500 leading-relaxed">“{conflict.citation.quote}”</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* 4. Facility Impact */}
          <section className="rounded-2xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/50">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Facility Impact
            </div>
            <div className="p-5 space-y-3">
              {asset ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 font-bold font-mono text-sm">
                      {asset.asset_code}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">{asset.name ?? asset.asset_code}</div>
                      <div className="text-[11px] text-slate-400">{asset.asset_type}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 uppercase tracking-wider">
                      {change.mapping?.impact_type ?? "Impact"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${
                        (change.mapping?.risk_level ?? "") === "high"
                          ? "bg-rose-950/70 text-rose-400 border-rose-800/60"
                          : "bg-amber-950/70 text-amber-400 border-amber-800/60"
                      }`}
                    >
                      {change.mapping?.risk_level ?? "—"} risk
                    </span>
                  </div>
                  {change.mapping?.technical_analysis && (
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {change.mapping.technical_analysis}
                    </p>
                  )}
                  {change.mapping?.confidence_score ? (
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-slate-500">Mapping confidence</span>
                      <span className="font-mono text-emerald-400">
                        {Math.round(Number(change.mapping.confidence_score) * 100)}%
                      </span>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed">
                  No asset resolved for this change — facility-wide or administrative provision requiring human
                  determination.
                </p>
              )}
            </div>
          </section>

          {/* 5. Implementation plan preview */}
          <section className="rounded-2xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/50">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CheckSquare className="w-4 h-4 text-blue-400" />
                Implementation Plan
              </div>
              <span className="text-xs text-slate-400 font-mono">{actions.length} actions</span>
            </div>
            <ul className="divide-y divide-slate-800/70">
              {actions.length === 0 ? (
                <li className="px-5 py-6 text-xs text-slate-500">
                  No implementation actions proposed yet. Full lifecycle lives on the{" "}
                  <Link href="/actions" className="text-cyan-400 hover:underline">Implementation Plan</Link> screen.
                </li>
              ) : (
                actions.map((a) => (
                  <li key={a.id} className="px-5 py-3.5 space-y-1.5">
                    <div className="text-xs font-semibold text-slate-100">{a.title}</div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 uppercase">
                        {a.department}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 uppercase">
                        {a.action_type}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 uppercase">
                        {a.status}
                      </span>
                      {a.estimated_cost != null && (
                        <span className="text-slate-500">${Number(a.estimated_cost).toLocaleString()}</span>
                      )}
                      {a.due_date && <span className="text-slate-500">due {a.due_date}</span>}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* 6. Review */}
          <ReviewPanel
            changeId={change.id}
            initialStatus={change.review_status}
            initialEvents={reviewEvents}
          />
        </div>
      </div>
    </div>
  );
}