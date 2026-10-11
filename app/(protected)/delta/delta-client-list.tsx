"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Filter, X } from "lucide-react";
import { ChangeRow, SEVERITY_STYLES, STATUS_STYLES, pollutantOf } from "./types";

interface DeltaClientListProps {
  initialChanges: ChangeRow[];
}

const SEVERITY_ORDER = ["critical", "moderate", "low", "administrative"];

function FilterPills<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mt-2 w-16 shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt as T)}
            className={`px-2.5 py-1 rounded-lg capitalize font-mono text-[11px] transition-all cursor-pointer ${
              value === opt
                ? "bg-cyan-600 text-white font-semibold"
                : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DeltaClientList({
  initialChanges,
}: DeltaClientListProps) {
  const [assetFilter, setAssetFilter] = useState<string>("all");
  const [pollutantFilter, setPollutantFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const assets = useMemo(() => {
    const set = new Set<string>();
    for (const ch of initialChanges) {
      set.add(ch.mapping?.asset?.asset_code ?? "Unmapped");
    }
    return ["all", ...Array.from(set).sort()];
  }, [initialChanges]);

  const pollutants = useMemo(() => {
    const set = new Set<string>();
    for (const ch of initialChanges) set.add(pollutantOf(ch));
    return ["all", ...Array.from(set).sort()];
  }, [initialChanges]);

  const severities = useMemo(
    () => ["all", ...SEVERITY_ORDER.filter((s) => initialChanges.some((c) => c.severity === s))],
    [initialChanges],
  );

  const statuses = useMemo(() => {
    const set = new Set<string>();
    for (const ch of initialChanges) set.add(ch.review_status);
    return ["all", ...Array.from(set)];
  }, [initialChanges]);

  const filtered = initialChanges.filter((ch) => {
    if (
      assetFilter !== "all" &&
      (ch.mapping?.asset?.asset_code ?? "Unmapped") !== assetFilter
    )
      return false;
    if (pollutantFilter !== "all" && pollutantOf(ch) !== pollutantFilter) return false;
    if (severityFilter !== "all" && ch.severity !== severityFilter) return false;
    if (statusFilter !== "all" && ch.review_status !== statusFilter) return false;
    return true;
  });

  const hasFilters =
    assetFilter !== "all" ||
    pollutantFilter !== "all" ||
    severityFilter !== "all" ||
    statusFilter !== "all";

  function resetFilters() {
    setAssetFilter("all");
    setPollutantFilter("all");
    setSeverityFilter("all");
    setStatusFilter("all");
  }

  return (
    <div className="space-y-4">
      {/* Multi-dimensional filter bar */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span className="font-medium">Filter Register</span>
            <span className="text-slate-500 font-mono text-[11px]">
              {filtered.length} of {initialChanges.length} changes
            </span>
          </div>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>
        <FilterPills
          label="Asset"
          options={assets}
          value={assetFilter}
          onChange={setAssetFilter}
        />
        <FilterPills
          label="Pollutant"
          options={pollutants}
          value={pollutantFilter}
          onChange={setPollutantFilter}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-2">
          <FilterPills
            label="Severity"
            options={severities}
            value={severityFilter}
            onChange={setSeverityFilter}
          />
          <FilterPills
            label="Review"
            options={statuses}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {/* Change Register Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/80 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <th className="px-4 py-3 font-bold w-32">Severity</th>
                <th className="px-4 py-3 font-bold">Change</th>
                <th className="px-4 py-3 font-bold w-24">Pollutant</th>
                <th className="px-4 py-3 font-bold w-24">Asset</th>
                <th className="px-4 py-3 font-bold w-28">AI Confidence</th>
                <th className="px-4 py-3 font-bold w-28">Review</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    No changes match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((ch) => {
                  const conf = ch.confidence !== null && ch.confidence !== undefined ? Number(ch.confidence) : 0;
                  const isCritical = ch.severity === "critical";
                  return (
                    <tr
                      key={ch.id}
                      className="group hover:bg-slate-900/60 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-2">
                          <span
                            className={`w-1 h-8 rounded-full ${isCritical ? "bg-rose-500" : ch.severity === "moderate" ? "bg-amber-500" : "bg-slate-600"}`}
                          />
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border ${
                              SEVERITY_STYLES[ch.severity] ?? SEVERITY_STYLES.low
                            }`}
                          >
                            {ch.severity}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 min-w-[300px]">
                        <Link
                          href={`/delta/${ch.id}`}
                          className="block text-slate-100 font-semibold hover:text-cyan-300 transition-colors"
                        >
                          {ch.summary}
                        </Link>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-md">
                          {ch.delta_description}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-300">
                        {(ch.new_requirement?.pollutant ??
                          ch.old_requirement?.pollutant ??
                          ch.change_kind ??
                          "—").toUpperCase()}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center">
                            {ch.mapping?.asset?.asset_code?.slice(0, 2) ?? "—"}
                          </span>
                          <span className="font-mono text-slate-300">
                            {ch.mapping?.asset?.asset_code ?? "Unmapped"}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${conf >= 0.95 ? "bg-emerald-400" : conf >= 0.9 ? "bg-cyan-400" : "bg-amber-400"}`}
                              style={{ width: `${conf * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-slate-400 tabular-nums">
                            {Math.round(conf * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold border ${
                            STATUS_STYLES[ch.review_status] ?? STATUS_STYLES.pending
                          }`}
                        >
                          {ch.review_status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/delta/${ch.id}`}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 group-hover:bg-cyan-600 group-hover:border-cyan-500 group-hover:text-white transition-all"
                          aria-label={`Open change ${ch.summary}`}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}