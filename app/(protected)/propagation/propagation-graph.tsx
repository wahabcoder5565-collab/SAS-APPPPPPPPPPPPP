"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BellRing,
  Gauge,
  FileText,
  Calculator,
  GraduationCap,
  ClipboardList,
  ClipboardCheck,
  Activity,
  FileSearch,
  Milestone,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Layers,
  ArrowRight,
  CheckSquare,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  ChangeTree,
  AssetNode,
  ChildNode,
  CONTROL_META,
  RISK_STYLES,
  IMPACT_TYPE_LABELS,
} from "./types";
import { CONFLICT_STYLES, STATUS_STYLES, SEVERITY_STYLES } from "../delta/types";

type Selection =
  | { kind: "clause"; tree: ChangeTree }
  | { kind: "asset"; tree: ChangeTree; asset: AssetNode }
  | { kind: "child"; tree: ChangeTree; asset: AssetNode; child: ChildNode };

const CONTROL_ICONS: Record<string, typeof Milestone> = {
  dcs_alarm: BellRing,
  cems: Gauge,
  sop_parameter: FileText,
  calculation: Calculator,
  training: GraduationCap,
  reporting: ClipboardList,
  inspection: ClipboardCheck,
  monitoring: Activity,
  document: FileSearch,
};

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

function formatMoney(v: number | null): string {
  if (v === null) return "—";
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${Math.round(v / 1000)}K`;
  return `$${v.toFixed(0)}`;
}

function ConflictBadges({ conflicts }: { conflicts: ChildNode["conflicts"] }) {
  if (conflicts.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {conflicts.map((c, i) => {
        const style = CONFLICT_STYLES[c.conflictType] ?? {
          label: c.conflictType,
          className: "bg-slate-800/80 border-slate-700 text-slate-300",
        };
        return (
          <span
            key={i}
            className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold uppercase tracking-wide ${style.className}`}
          >
            {style.label}
          </span>
        );
      })}
    </div>
  );
}

export default function PropagationGraph({ trees }: { trees: ChangeTree[] }) {
  const [assetType, setAssetType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [department, setDepartment] = useState<string>("all");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(trees.flatMap((t) => t.assets.map((a) => `${t.changeId}:${a.id}`)))
  );

  const assetTypes = useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(
          trees
            .flatMap((t) => t.assets.map((a) => a.assetType))
            .filter((s): s is string => Boolean(s))
        )
      ).sort(),
    ],
    [trees]
  );

  const statuses = useMemo(
    () => ["all", ...Array.from(new Set(trees.map((t) => t.reviewStatus)))],
    [trees]
  );

  const departments = useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(trees.flatMap((t) => t.actions.map((a) => a.department).filter(Boolean)))
      ).sort(),
    ] as string[],
    [trees]
  );

  const filtered = useMemo(
    () =>
      trees.filter((t) => {
        if (status !== "all" && t.reviewStatus !== status) return false;
        if (assetType !== "all" && !t.assets.some((a) => a.assetType === assetType)) return false;
        if (department !== "all" && !t.actions.some((a) => a.department === department))
          return false;
        return true;
      }),
    [trees, status, assetType, department]
  );

  const stats = useMemo(() => {
    const touchedAssets = new Set<string>();
    let conflicts = 0;
    const bottlenecks = new Set<string>();
    for (const t of filtered) {
      for (const a of t.assets) {
        touchedAssets.add(a.id);
        if (a.isBottleneck) bottlenecks.add(a.id);
        conflicts += a.children.reduce((acc, c) => acc + c.conflicts.length, 0);
      }
    }
    return {
      clauses: filtered.length,
      assets: touchedAssets.size,
      conflicts,
      bottlenecks: bottlenecks.size,
    };
  }, [filtered]);

  function toggleExpanded(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function expandAll() {
    setExpanded(new Set(trees.flatMap((t) => t.assets.map((a) => `${t.changeId}:${a.id}`))));
  }

  function collapseAll() {
    setExpanded(new Set());
  }

  const hasFilters = assetType !== "all" || status !== "all" || department !== "all";

  function clearFilters() {
    setAssetType("all");
    setStatus("all");
    setDepartment("all");
  }

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="space-y-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <FilterPills
            label="Asset Type"
            options={assetTypes}
            value={assetType}
            onChange={setAssetType}
          />
          <FilterPills label="Status" options={statuses} value={status} onChange={setStatus} />
          <FilterPills
            label="Department"
            options={departments}
            value={department}
            onChange={setDepartment}
          />
          <div className="flex items-center gap-1.5 ml-auto">
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 text-[11px] font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3 h-3" /> Reset
              </button>
            )}
            <button
              onClick={expandAll}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 text-[11px] font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <Maximize2 className="w-3 h-3" /> Expand all
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 text-[11px] font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <Minimize2 className="w-3 h-3" /> Collapse
            </button>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Clauses Propagating", value: stats.clauses, accent: "text-cyan-400" },
          { label: "Assets Touched", value: stats.assets, accent: "text-blue-400" },
          { label: "Active Conflicts", value: stats.conflicts, accent: "text-rose-400" },
          { label: "Bottleneck Assets", value: stats.bottlenecks, accent: "text-amber-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="glass-panel p-4 rounded-2xl border-slate-800 flex items-center justify-between"
          >
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
              {s.label}
            </span>
            <span className={`font-mono text-2xl font-bold ${s.accent}`}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        {/* Tree list */}
        <div className="space-y-5">
          {filtered.length === 0 && (
            <div className="glass-panel p-8 rounded-2xl border-slate-800 text-center">
              <div className="inline-flex items-center gap-2 text-xs text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                No permit changes match the current filters. Reset filters to view the full
                propagation graph.
              </div>
            </div>
          )}

          {filtered.map((tree) => (
            <div key={tree.changeId} className="glass-panel rounded-2xl border-slate-800">
              {/* Change header */}
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-800/80 bg-slate-950/40">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider font-bold ${SEVERITY_STYLES[tree.severity] ?? SEVERITY_STYLES.low}`}
                >
                  {tree.severity}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${STATUS_STYLES[tree.reviewStatus] ?? STATUS_STYLES.pending}`}
                >
                  {tree.reviewStatus}
                </span>
                <Link
                  href={`/delta/${tree.changeId}`}
                  className="text-xs text-slate-200 hover:text-cyan-300 font-medium truncate"
                >
                  {tree.summary}
                </Link>
                <div className="ml-auto flex items-center gap-3">
                  {tree.confidence !== null && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      AI {Math.round(tree.confidence * 100)}%
                    </span>
                  )}
                  {tree.actions.length > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/60 text-cyan-400 font-semibold">
                      {tree.actions.length} action{tree.actions.length > 1 ? "s" : ""}
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* Root: Permit Clause */}
                <button
                  onClick={() => setSelection({ kind: "clause", tree })}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer group ${
                    selection?.kind === "clause" && selection.tree.changeId === tree.changeId
                      ? "bg-cyan-950/40 border-cyan-700/70"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="w-9 h-9 shrink-0 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <FileSearch className="w-4.5 h-4.5 text-cyan-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400">
                        Permit Clause
                      </span>
                      {tree.clause.pollutant && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-300">
                          {tree.clause.pollutant}
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-slate-400 truncate">
                        {tree.clause.citation ?? "—"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-200 mt-0.5 truncate">
                      {tree.clause.parameter ?? tree.summary}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[10px] text-slate-500 font-mono line-through">
                      {tree.oldValue ?? "—"}
                    </div>
                    <div className="text-xs font-mono text-emerald-400 font-bold">
                      {tree.newValue ?? "—"}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0" />
                </button>

                {/* Assets */}
                <div className="ml-3 pl-4 border-l border-slate-800 space-y-2.5">
                  {tree.assets.length === 0 && (
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-500">
                      No facility asset matched — site-wide requirement. See implementation actions
                      in the clause inspector.
                    </div>
                  )}

                  {tree.assets.map((asset) => {
                    const key = `${tree.changeId}:${asset.id}`;
                    const open = expanded.has(key);
                    const conflictCount = asset.children.reduce(
                      (acc, c) => acc + c.conflicts.length,
                      0
                    );
                    return (
                      <div key={key} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleExpanded(key)}
                            className="w-6 h-6 shrink-0 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-cyan-300 cursor-pointer"
                            title={open ? "Collapse" : "Expand"}
                          >
                            {open ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => setSelection({ kind: "asset", tree, asset })}
                            className={`flex-1 min-w-0 flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer group ${
                              selection?.kind === "asset" &&
                              selection.tree.changeId === tree.changeId &&
                              selection.asset.id === asset.id
                                ? "bg-amber-950/30 border-amber-700/70"
                                : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            <div className="w-8 h-8 shrink-0 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-xs text-amber-300">
                              {asset.assetCode}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-semibold text-foreground truncate">
                                  {asset.name}
                                </span>
                                {asset.isBottleneck && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800/80 text-rose-400 font-bold uppercase">
                                    Bottleneck
                                  </span>
                                )}
                                <span
                                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border uppercase tracking-wider font-bold ${
                                    RISK_STYLES[asset.riskLevel ?? ""] ?? RISK_STYLES.low
                                  }`}
                                >
                                  {asset.riskLevel ?? "low"} risk
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate font-mono">
                                {asset.assetType} · {asset.area} · {asset.capacity}
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-slate-400">
                                {asset.children.length} node{asset.children.length !== 1 ? "s" : ""}
                              </span>
                              {conflictCount > 0 && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800/80 text-rose-400 font-bold">
                                  {conflictCount} conflict{conflictCount > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </button>
                        </div>

                        {open && (
                          <div className="ml-6 pl-4 border-l border-slate-800/70 space-y-1.5">
                            {asset.children.map((child) => {
                              const Icon =
                                CONTROL_ICONS[child.controlType] ?? Milestone;
                              const meta = CONTROL_META[child.controlType] ?? {
                                label: child.controlType,
                                className: "text-slate-400",
                              };
                              const isSel =
                                selection?.kind === "child" &&
                                selection.tree.changeId === tree.changeId &&
                                selection.asset.id === asset.id &&
                                selection.child.id === child.id;
                              return (
                                <button
                                  key={child.id}
                                  onClick={() =>
                                    setSelection({ kind: "child", tree, asset, child })
                                  }
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer group ${
                                    isSel
                                      ? "bg-blue-950/30 border-blue-700/70"
                                      : "bg-slate-950/40 border-slate-800/70 hover:border-slate-700"
                                  }`}
                                >
                                  <div
                                    className={`w-7 h-7 shrink-0 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center ${meta.className}`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                        {meta.label}
                                      </span>
                                      <span className="text-[11px] font-semibold text-slate-200 truncate">
                                        {child.label}
                                      </span>
                                      {child.docTitle && (
                                        <span className="text-[9px] font-mono text-slate-500 truncate">
                                          {child.docTitle}
                                          {child.docVersion ? ` v${child.docVersion}` : ""}
                                        </span>
                                      )}
                                    </div>
                                    {child.subtitle && (
                                      <div className="text-[10px] text-slate-500 font-mono truncate">
                                        {child.subtitle}
                                      </div>
                                    )}
                                  </div>
                                  <div className="shrink-0 flex items-center gap-1.5">
                                    <ConflictBadges conflicts={child.conflicts} />
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Node Inspector */}
        <div className="xl:sticky xl:top-0 space-y-4">
          <div className="glass-panel rounded-2xl border-slate-800">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/80 bg-slate-950/40">
              <Layers className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-foreground">Node Inspector</span>
              <span className="text-[10px] text-slate-500 font-mono ml-auto">
                click any node
              </span>
            </div>

            {!selection ? (
              <div className="p-5 text-xs text-slate-500 leading-relaxed">
                Select a permit clause, facility asset, or dependency node to inspect its
                configuration, owner documentation, and downstream conflict status.
              </div>
            ) : selection.kind === "clause" ? (
              <InspectorClause tree={selection.tree} />
            ) : selection.kind === "asset" ? (
              <InspectorAsset asset={selection.asset} />
            ) : (
              <InspectorChild child={selection.child} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InspectorClause({ tree }: { tree: ChangeTree }) {
  const c = tree.clause;
  return (
    <div className="p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider font-bold text-cyan-400 border-cyan-800/60 bg-cyan-950/70">
          Permit Clause
        </span>
        {c.pollutant && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-mono">
            {c.pollutant}
          </span>
        )}
      </div>
      <DetailRow label="Citation" value={c.citation} mono />
      <DetailRow label="Parameter" value={c.parameter} />
      <DetailRow
        label="Revised Limit"
        value={
          c.limitValue !== null
            ? `${c.limitValue} ${c.unit ?? ""}${c.averagingPeriod ? ` · ${c.averagingPeriod}` : ""}`.trim()
            : c.averagingPeriod ?? "—"
        }
        mono
      />
      <DetailRow label="Section / Page" value={c.section ? `${c.section}${c.page ? ` · p.${c.page}` : ""}` : c.page ? `p.${c.page}` : "—"} />
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
          Old → New
        </span>
        <div className="text-xs font-mono text-slate-400 line-through">{tree.oldValue ?? "—"}</div>
        <div className="text-sm font-mono text-emerald-400 font-bold">{tree.newValue ?? "—"}</div>
      </div>

      {tree.actions.length > 0 && (
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5">
              <CheckSquare className="w-3 h-3 text-cyan-400" /> Implementation Actions
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{tree.actions.length}</span>
          </div>
          {tree.actions.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-200">{a.title}</span>
              <span className="shrink-0 flex items-center gap-1.5">
                {a.department && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    {a.department}
                  </span>
                )}
                <span className="text-[10px] font-mono text-cyan-400">{formatMoney(a.cost)}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <Link
        href={`/delta/${tree.changeId}`}
        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all"
      >
        Open change detail <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function InspectorAsset({ asset }: { asset: AssetNode }) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-sm text-amber-300">
          {asset.assetCode}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-foreground">{asset.name}</div>
          <div className="text-[10px] text-slate-500 font-mono truncate">{asset.assetCode} · {asset.area}</div>
        </div>
        {asset.isBottleneck && (
          <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800/80 text-rose-400 font-bold uppercase">
            Bottleneck
          </span>
        )}
      </div>

      <DetailRow label="Asset Type" value={asset.assetType} />
      <DetailRow label="Capacity" value={asset.capacity} />

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border ${
            RISK_STYLES[asset.riskLevel ?? ""] ?? RISK_STYLES.low
          }`}
        >
          {asset.riskLevel ?? "low"} risk
        </span>
        <span className="text-[10px] text-slate-300 font-mono">
          {IMPACT_TYPE_LABELS[asset.impactType ?? ""] ?? asset.impactType ?? "Impact"}
        </span>
        {asset.impactConfidence !== null && (
          <span className="text-[10px] font-mono text-slate-500">
            conf {Math.round(asset.impactConfidence * 100)}%
          </span>
        )}
      </div>

      {asset.technicalAnalysis && (
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
            Engineering Analysis
          </span>
          <p className="text-[11px] text-slate-300 leading-relaxed">{asset.technicalAnalysis}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
          Dependent Systems ({asset.children.length})
        </span>
        {asset.children.map((child) => {
          const meta = CONTROL_META[child.controlType] ?? { label: child.controlType, className: "text-slate-400" };
          return (
            <div
              key={child.id}
              className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800/60"
            >
              <span className={`text-[10px] uppercase font-bold w-24 shrink-0 mt-0.5 ${meta.className}`}>
                {meta.label}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-slate-200">{child.label}</div>
                {child.docTitle && (
                  <div className="text-[10px] text-slate-500 font-mono truncate">{child.docTitle}</div>
                )}
              </div>
              <ConflictBadges conflicts={child.conflicts} />
            </div>
          );
        })}
      </div>

      <Link
        href="/assets"
        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700/60"
      >
        Open facility assets registry <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function InspectorChild({ child }: { child: ChildNode }) {
  const meta = CONTROL_META[child.controlType] ?? { label: child.controlType, className: "text-slate-400" };
  return (
    <div className="p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-[10px] uppercase tracking-wider font-bold text-slate-400 ${meta.className}`}>
          {meta.label}
        </span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
          {child.kind === "document" ? "document" : child.controlType}
        </span>
      </div>
      <div className="text-sm font-bold text-foreground">{child.label}</div>

      {child.subtitle && <DetailRow label="Configured Value" value={child.subtitle} mono />}

      {child.docTitle && (
        <div className="space-y-1.5">
          <DetailRow label="Source Document" value={child.docTitle} />
          {(child.docType || child.docVersion) && (
            <DetailRow
              label="Version"
              value={[child.docType, child.docVersion ? `v${child.docVersion}` : null]
                .filter(Boolean)
                .join(" · ")}
            />
          )}
        </div>
      )}

      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
          Conflict Status
        </span>
        {child.conflicts.length === 0 ? (
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-[11px] text-emerald-300">
              Compliant with revised permit requirement
            </span>
          </div>
        ) : (
          child.conflicts.map((c, i) => {
            const style = CONFLICT_STYLES[c.conflictType] ?? {
              label: c.conflictType,
              className: "bg-slate-800/80 border-slate-700 text-slate-300",
            };
            return (
              <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <span
                  className={`inline-block text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${style.className}`}
                >
                  {style.label}
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">{c.summary}</p>
                {(c.permitValue || c.controlValue) && (
                  <div className="text-[10px] font-mono text-slate-500">
                    Permit {c.permitValue ?? "—"} vs internal {c.controlValue ?? "—"}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 shrink-0 pt-0.5">
        {label}
      </span>
      <span
        className={`text-[11px] text-slate-200 text-right break-words ${mono ? "font-mono" : ""}`}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}