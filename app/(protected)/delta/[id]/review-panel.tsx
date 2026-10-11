"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateChangeReviewStatus } from "@/app/delta/actions";
import { CheckCircle2, PencilLine, XCircle, UserRound, Loader2 } from "lucide-react";
import { ReviewEventRow, STATUS_STYLES } from "../types";

interface ReviewPanelProps {
  changeId: string;
  initialStatus: string;
  initialEvents: ReviewEventRow[];
}

type Decision = "accepted" | "modified" | "rejected";

const DECISION_CONFIG: Record<Decision, { label: string; className: string; active: string }> = {
  accepted: {
    label: "Accept",
    className:
      "bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 hover:text-foreground",
    active: "bg-emerald-900 border border-emerald-600 text-foreground",
  },
  modified: {
    label: "Modify",
    className:
      "bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 hover:text-foreground",
    active: "bg-cyan-900 border border-cyan-600 text-foreground",
  },
  rejected: {
    label: "Reject",
    className:
      "bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 hover:text-foreground",
    active: "bg-rose-900 border border-rose-600 text-foreground",
  },
};

const DECISION_ICONS: Record<Decision, typeof CheckCircle2> = {
  accepted: CheckCircle2,
  modified: PencilLine,
  rejected: XCircle,
};

export default function ReviewPanel({
  changeId,
  initialStatus,
  initialEvents,
}: ReviewPanelProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!decision || saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateChangeReviewStatus(changeId, decision, note.trim() || undefined);
      setStatus(decision);
      setNote("");
      setDecision(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save review decision");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/50">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <UserRound className="w-4 h-4 text-cyan-400" />
          Human Review
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold border ${
            STATUS_STYLES[status] ?? STATUS_STYLES.pending
          }`}
        >
          {status}
        </span>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Record your engineering decision. A note is optional but recommended — it is stored as an
          auditable review event with your identity and timestamp.
        </p>

        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(DECISION_CONFIG) as Decision[]).map((d) => {
            const Icon = DECISION_ICONS[d];
            const active = decision === d || status === d;
            return (
              <button
                key={d}
                onClick={() => setDecision(d)}
                disabled={status === d}
                className={`px-2 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                  active ? DECISION_CONFIG[d].active : DECISION_CONFIG[d].className
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {DECISION_CONFIG[d].label}
              </button>
            );
          })}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reviewer note (e.g. justification, condition, or reference to supporting data)…"
          rows={3}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 outline-none resize-none placeholder:text-slate-600"
        />

        {error && (
          <p className="text-[11px] text-rose-400 bg-rose-950/50 border border-rose-800/50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={submit}
          disabled={!decision || saving}
          className="w-full px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
            </>
          ) : (
            "Submit Review Decision"
          )}
        </button>

        {initialEvents.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800/70">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
              Review History
            </span>
            {initialEvents.map((e) => (
              <div key={e.id} className="rounded-lg bg-slate-950/70 border border-slate-800/70 p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-bold border ${
                      STATUS_STYLES[e.decision] ?? STATUS_STYLES.pending
                    }`}
                  >
                    {e.decision}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(e.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {e.reviewer_name ?? "Reviewer"} {e.note ? `— ${e.note}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}