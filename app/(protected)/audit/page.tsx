import { createClient } from "@/lib/supabase/server";
import { History, ShieldCheck } from "lucide-react";
import AuditClient from "./audit-client";
import type { AuditLogEntry } from "./types";

export default async function AuditPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("pi_audit_log")
    .select(
      `
      seq,
      id,
      entity_type,
      entity_id,
      action,
      previous_state,
      new_state,
      performed_by,
      notes,
      timestamp,
      event_hash,
      prev_hash,
      user:pi_users!performed_by (full_name, role, title, department)
    `
    )
    .order("seq", { ascending: false });

  const { data: chain } = await supabase.rpc("pi_audit_verify_chain");
  const entries = (logs ?? []) as unknown as AuditLogEntry[];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/50 text-cyan-400 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5" /> Immutable Regulatory Audit Trail
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Compliance Traceability & Evidence Log
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            SHA-256 hash-chained timeline of every AI extraction, delta review, asset risk verification, evidence check, and human approval.
          </p>
        </div>

        <div
          className={`px-3.5 py-2 rounded-xl border text-xs font-mono flex items-center gap-2 ${
            chain?.ok
              ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
              : "bg-rose-950/40 border-rose-800/60 text-rose-300"
          }`}
        >
          <ShieldCheck className={`w-4 h-4 ${chain?.ok ? "text-emerald-400" : "text-rose-400"}`} />
          {chain?.ok ? (
            <span>
              SHA-256 Hash-Chain <strong className="text-emerald-600">VERIFIED</strong> · {chain.total} events linked
            </span>
          ) : (
            <span>
              Chain integrity FAILED · mismatches: {String(chain?.mismatches)} · first broken: {String(chain?.first_broken_seq)}
            </span>
          )}
        </div>
      </div>

      <AuditClient entries={entries} chain={chain} />
    </div>
  );
}