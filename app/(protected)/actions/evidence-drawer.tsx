"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitEvidence, reviewAction } from "@/app/actions/evidence";
import type { EvidenceRow, RegisterAction } from "./types";
import {
  FileText,
  Upload,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Shield,
  User,
  ScrollText,
  Calendar,
} from "lucide-react";

const DOC_TYPES: Record<string, string> = {
  sop: "Revised SOP / Procedure",
  calibration_log: "Calibration Log",
  test_report: "Test / Inspection Report",
  photo: "Field Photo",
  cems_log: "CEMS Data Log",
  contract_amendment: "Contract / Amendment",
  training_record: "Training Record",
  analysis: "Engineering Analysis",
  other: "Other Document",
};

const VERDICT_META: Record<string, { label: string; className: string }> = {
  pending: { label: "AI check pending", className: "bg-slate-950/70 text-slate-400 border-slate-700" },
  compliant: { label: "AI verified · compliant", className: "bg-emerald-950/70 text-emerald-400 border-emerald-800/60" },
  incomplete: { label: "AI check · incomplete", className: "bg-amber-950/70 text-amber-400 border-amber-800/60" },
  inconclusive: { label: "AI check · inconclusive", className: "bg-slate-950/70 text-slate-400 border-slate-700" },
};

function VerdictBadge({ status }: { status: string }) {
  const meta = VERDICT_META[status] || VERDICT_META.pending;
  return (
    <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold border ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function expectedValue(action: RegisterAction): string | null {
  const r = action.mapping?.change?.new_requirement;
  if (!r) return null;
  const parts: string[] = [];
  if (r.parameter) parts.push(String(r.parameter));
  if (r.limit_value != null && r.limit_value !== "") {
    parts.push(String(r.limit_value) + (r.unit ? ` ${r.unit}` : ""));
  }
  return parts.length ? parts.join(" ") : null;
}

function buildTemplate(action: RegisterAction, docType: string): string {
  const value = expectedValue(action) || "0.05 lb/MMBtu NOx";
  const today = new Date().toISOString().slice(0, 10);
  return [
    `DOCUMENT TITLE: ${action.title} — Submitted Evidence`,
    `Document type: ${DOC_TYPES[docType] || docType} | Date: ${today} | Record ref: NR-${action.id.slice(0, 6).toUpperCase()}`,
    ``,
    `1. OBJECTIVE & APPLICABILITY`,
    `This document supports compliance action "${action.title}" (${action.department}) against the revised Title V permit obligation.`,
    ``,
    `2. REVISED REQUIREMENT`,
    `The applicable permit limit is revised to ${value}. This document explicitly implements and reflects ${value} as the governing operating parameter for the affected equipment.`,
    ``,
    `3. IMPLEMENTATION DETAIL`,
    `${action.description.slice(0, 500)}`,
    ``,
    `4. VERIFICATION`,
    `Field verification completed ${today}. The implemented configuration was checked against ${value} and found to match the revised permit requirement exactly. No deviations recorded.`,
    ``,
    `5. DOCUMENT CONTROL / ENDORSEMENT`,
    `Prepared by: P. Raman, Instrumentation & Controls | Reviewed by: M. Vance, Environmental Compliance Manager | Signature block valid. Revision 2 of this record supersedes prior revision.`,
  ].join("\n");
}

function buildSuggestedTitle(action: RegisterAction, docType: string): string {
  const type = DOC_TYPES[docType] || "Document";
  return `${action.title} — ${type}`;
}

function buildFileName(action: RegisterAction): string {
  const base = action.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return `${base}-${action.id.slice(0, 6)}.pdf`;
}

interface EvidenceDrawerProps {
  action: RegisterAction;
  evidence: EvidenceRow[];
  onClose: () => void;
}

export default function EvidenceDrawer({ action, evidence, onClose }: EvidenceDrawerProps) {
  const router = useRouter();
  const [attaching, setAttaching] = useState(false);
  const [documentType, setDocumentType] = useState("sop");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [signing, setSigning] = useState(false);

  const itemEvidence = evidence.filter((e) => e.action_id === action.id);
  const reviewTarget = expectedValue(action);

  function useTemplate() {
    setDocumentType(documentType);
    setTitle(buildSuggestedTitle(action, documentType));
    setContent(buildTemplate(action, documentType));
    setFileName(buildFileName(action));
  }

  async function handleSubmit() {
    setError(null);
    setBusy(true);
    try {
      await submitEvidence({
        actionId: action.id,
        documentType,
        title: title.trim(),
        content,
        fileName: fileName.trim(),
      });
      setAttaching(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit evidence");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOff(decision: "approved" | "rejected") {
    setError(null);
    setSigning(true);
    try {
      await reviewAction({ actionId: action.id, decision, note });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record sign-off");
    } finally {
      setSigning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-full max-w-lg p-6 bg-slate-950 border-l border-slate-800 overflow-y-auto space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-foreground">Evidence & Verification</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-100 leading-snug">{action.title}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {action.mapping?.asset?.asset_code || "—"} · {action.department}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-slate-300 font-medium">Gemini checks this action against:</span>
              <span className="block font-mono text-emerald-400 mt-0.5">{reviewTarget || "—"}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            The AI engine returns a structured verdict (compliant / incomplete / inconclusive) with confidence and
            reasoning. It never closes or approves an action.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900/60 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Evidence list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Attachments ({itemEvidence.length})
            </span>
            <button
              onClick={() => setAttaching((v) => !v)}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" /> Attach Evidence
            </button>
          </div>

          {itemEvidence.length === 0 && !attaching && (
            <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-[11px] text-slate-500">
              No evidence attached yet. Attach a simulated report, revised SOP, calibration log, or photo.
            </div>
          )}

          {itemEvidence.map((ev) => (
            <div key={ev.id} className="glass-panel p-3 rounded-xl border-slate-800 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-100 truncate">{ev.title || "Untitled"}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {DOC_TYPES[ev.document_type || "other"] || ev.document_type} · {fmtDateTime(ev.created_at)}
                    </p>
                  </div>
                </div>
                <VerdictBadge status={ev.ai_check_status} />
              </div>
              {ev.ai_confidence != null && ev.ai_check_status !== "pending" && (
                <div className="space-y-1">
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ev.ai_check_status === "compliant"
                          ? "bg-emerald-400"
                          : ev.ai_check_status === "incomplete"
                            ? "bg-amber-400"
                            : "bg-slate-500"
                      }`}
                      style={{ width: `${Math.round(Number(ev.ai_confidence) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">
                    confidence {Math.round(Number(ev.ai_confidence) * 100)}%
                  </p>
                </div>
              )}
              {ev.ai_check_reason && (
                <p className="text-[11px] text-slate-400 leading-snug">{ev.ai_check_reason}</p>
              )}
              <p className="text-[10px] text-slate-600 flex items-center gap-1">
                <User className="w-3 h-3" /> uploaded by {ev.uploaded_by_name || "Unknown"} · {ev.file_url || "no file"}
              </p>
            </div>
          ))}
        </div>

        {/* Attach form */}
        {attaching && (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Attach Simulated Evidence</span>
              <button
                onClick={useTemplate}
                className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-[11px] cursor-pointer"
              >
                Fill draft with required value
              </button>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
              >
                {Object.entries(DOC_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">File Name</label>
              <input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. sop-44-rev2.pdf"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Revised SOP-44 — NOx 0.05 lb/MMBtu"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Document Content (text used by the AI check)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder="Paste the report/SOP excerpt text here so the Gemini engine can verify the revised value appears…"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none font-mono text-[11px] leading-relaxed"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAttaching(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={busy || !title.trim() || !content.trim()}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {busy ? "Running AI check…" : "Attach & Run AI Check"}
              </button>
            </div>
          </div>
        )}

        {/* Sign-off gate */}
        {action.status === "evidence_submitted" && (
          <div className="p-4 rounded-xl border border-cyan-800/60 bg-cyan-950/30 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-foreground">Human Approval Gate</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              A Certified Environmental Engineer or Compliance Manager must sign off with a note. Approval requires at
              least one AI-verified compliant attachment.
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Reviewer note (required)…"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleSignOff("rejected")}
                disabled={signing || note.trim().length < 4}
                className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-900/60 text-rose-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Reject
              </button>
              <button
                onClick={() => handleSignOff("approved")}
                disabled={signing || note.trim().length < 4}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Approve & Close
              </button>
            </div>
          </div>
        )}

        {/* Sign-off record */}
        {(action.status === "approved" || action.status === "rejected") && (
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-xs space-y-1.5">
            <div className={`flex items-center gap-2 ${action.status === "approved" ? "text-emerald-400" : "text-rose-400"}`}>
              {action.status === "approved" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span className="font-bold uppercase tracking-wider">
                {action.status === "approved" ? "Approved" : "Rejected"}
              </span>
              <span className="text-slate-500 normal-case">· human sign-off</span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <User className="w-3 h-3" /> {action.owner?.full_name || "Reviewer"}
              <Calendar className="w-3 h-3 ml-2" /> {fmtDateTime(action.reviewed_at)}
            </p>
            {action.reviewer_note && (
              <p className="text-[11px] text-slate-300 leading-snug">“{action.reviewer_note}”</p>
            )}
          </div>
        )}

        {action.status !== "evidence_submitted" && !["approved", "rejected"].includes(action.status) && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-500">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
            <span>
              Action is still in “{action.status.replaceAll("_", " ")}”. Move it to Evidence Submitted to unlock the
              human sign-off gate.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}