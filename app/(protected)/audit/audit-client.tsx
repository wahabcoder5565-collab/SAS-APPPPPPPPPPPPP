"use client";

import { useMemo, useState } from "react";
import {
  FileCheck,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Download,
  Fingerprint,
  ShieldAlert,
} from "lucide-react";
import type { AuditLogEntry, ChainStatus } from "./types";

const ROLE_STYLES: Record<string, string> = {
  engineer: "bg-cyan-950/70 border-cyan-700/50 text-cyan-300",
  manager: "bg-amber-950/70 border-amber-700/50 text-amber-300",
  reviewer: "bg-blue-950/70 border-blue-700/50 text-blue-300",
  operations: "bg-emerald-950/70 border-emerald-700/50 text-emerald-300",
  system: "bg-slate-800 border-slate-600/60 text-slate-300",
};

function personaOf(e: AuditLogEntry): string {
  return (e.user?.role ?? "system").toLowerCase();
}

function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export default function AuditClient({
  entries,
  chain,
}: {
  entries: AuditLogEntry[];
  chain: ChainStatus;
}) {
  const [query, setQuery] = useState("");
  const [entityType, setEntityType] = useState("all");
  const [persona, setPersona] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const entityTypes = useMemo(
    () =>
      Array.from(
        new Set(entries.map((e) => e.entity_type).filter((t): t is string => Boolean(t)))
      ).sort(),
    [entries]
  );
  const personas = useMemo(
    () => Array.from(new Set(entries.map(personaOf))).sort(),
    [entries]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (entityType !== "all" && e.entity_type !== entityType) return false;
      if (persona !== "all" && personaOf(e) !== persona) return false;
      if (q) {
        const hay = [e.action, e.notes, e.entity_type, e.entity_id, e.user?.full_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (fromDate || toDate) {
        const t = new Date(e.timestamp ?? 0).getTime();
        if (fromDate && t < new Date(fromDate).getTime()) return false;
        if (toDate && t > new Date(`${toDate}T23:59:59`).getTime()) return false;
      }
      return true;
    });
  }, [entries, query, entityType, persona, fromDate, toDate]);

  const hasFilters = query !== "" || entityType !== "all" || persona !== "all" || fromDate !== "" || toDate !== "";

  function resetFilters() {
    setQuery("");
    setEntityType("all");
    setPersona("all");
    setFromDate("");
    setToDate("");
  }

  function exportCsv() {
    const header = [
      "seq", "timestamp", "action", "entity_type", "entity_id", "performed_by", "role",
      "notes", "previous_state", "new_state", "event_hash", "prev_hash",
    ];
    const rows = filtered.map((e) => [
      e.seq, e.timestamp, e.action, e.entity_type, e.entity_id, e.user?.full_name, e.user?.role ?? "system",
      e.notes, e.previous_state, e.new_state, e.event_hash, e.prev_hash,
    ].map(csvCell).join(","));
    const blob = new Blob([`${header.join(",")}\r\n${rows.join("\r\n")}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pi-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search action, notes, entity, user…"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-700 transition-colors"
            />
          </div>

          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 outline-none focus:border-cyan-700 transition-colors"
          >
            <option value="all">All Entity Types</option>
            {entityTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 outline-none focus:border-cyan-700 transition-colors capitalize"
          >
            <option value="all">All Personas</option>
            {personas.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 outline-none focus:border-cyan-700 transition-colors"
            aria-label="From date"
          />
          <span className="text-[11px] text-slate-600">→</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 outline-none focus:border-cyan-700 transition-colors"
            aria-label="To date"
          />

          <button
            onClick={resetFilters}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>

          <button
            onClick={exportCsv}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-1.5">
            <Filter className="w-3 h-3" /> Showing <strong className="text-slate-300">{filtered.length}</strong> of{" "}
            <strong className="text-slate-300">{entries.length}</strong> events
          </span>
          {hasFilters && (
            <button onClick={resetFilters} className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
              clear filters
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="glass-panel p-6 rounded-2xl border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="text-xs font-bold text-foreground flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-cyan-400" />
            <span>Audit Events ({filtered.length} Records)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            EPA Title V & ISO 14001 Compliant Format
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No audit records match the current filters.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((log) => {
              const dateStr = new Date(log.timestamp ?? 0).toLocaleString();
              const userName = log.user?.full_name || "System Operator";
              const persona = personaOf(log);
              const roleStyle = ROLE_STYLES[persona] ?? ROLE_STYLES.system;

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 font-mono text-xs hover:border-slate-700 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-cyan-400 font-bold font-mono text-[11px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/60">
                        {log.action}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Target: <strong className="text-slate-200">{log.entity_type}</strong> ({log.entity_id?.slice(0, 8)}...)
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold border ${roleStyle} capitalize`}>
                        {persona}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-sans">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{dateStr}</span>
                      <span className="text-slate-600">seq {log.seq}</span>
                    </div>
                  </div>

                  {log.notes && (
                    <p className="text-xs text-slate-300 font-sans leading-relaxed pt-1">
                      {log.notes}
                    </p>
                  )}

                  {/* Previous vs New State Diff */}
                  {(Boolean(log.previous_state) || Boolean(log.new_state)) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px]">
                      {Boolean(log.previous_state) && (
                        <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-slate-300">
                          <span className="text-[10px] text-rose-400 font-bold block uppercase mb-1">Previous State</span>
                          <pre className="text-slate-400 overflow-x-auto text-[10px]">
                            {JSON.stringify(log.previous_state, null, 2)}
                          </pre>
                        </div>
                      )}
                      {Boolean(log.new_state) && (
                        <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-slate-300">
                          <span className="text-[10px] text-emerald-400 font-bold block uppercase mb-1">New State</span>
                          <pre className="text-emerald-300 overflow-x-auto text-[10px]">
                            {JSON.stringify(log.new_state, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-sans">
                    <span>
                      Performed by: <strong className="text-slate-300">{userName}</strong> (
                      {log.user?.role ?? "system"})
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-slate-600">
                      <Fingerprint className="w-3 h-3" />
                      {log.event_hash?.slice(0, 16)}…<span className="text-slate-400">◆</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Chain Integrity Footer */}
        <div className={`mt-4 p-3 rounded-xl border text-[11px] font-mono flex flex-wrap items-center gap-2 ${chain?.ok ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-300" : "bg-rose-950/20 border-rose-900/40 text-rose-300"}`}>
          <ShieldAlert className="w-3.5 h-3.5" />
          {chain?.ok ? (
            <span>
              Merkle-style chain integrity <strong>VERIFIED</strong> — recomputed SHA-256 over all{" "}
              {chain.total} events ({chain.checked} checked) · genesis {chain.genesis_ok ? "sealed" : "MISMATCH"} · verified {new Date(chain.verified_at ?? 0).toLocaleString()}
            </span>
          ) : (
            <span>
              <strong>BREACH DETECTED</strong> — {chain?.mismatches} mismatches · first broken seq {chain?.first_broken_seq ?? "—"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}