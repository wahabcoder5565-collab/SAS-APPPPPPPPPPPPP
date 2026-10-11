"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateActionStatus, updateAction, createNewActionItem } from "@/app/actions/actions";
import {
  ACTION_STATUSES,
  ACTION_STATUS_LABELS,
  ACTION_STATUS_CLASSES,
  ACTION_STATUS_DESCRIPTIONS,
  DEPT_COLORS,
  DEFAULT_DEPT_ORDER,
  nextTransitions,
  type ActionStatus,
} from "@/app/actions/workflow";
import type { EvidenceRow, MappingOption, RegisterAction } from "./types";
import EvidenceDrawer from "./evidence-drawer";
import {
  CheckSquare,
  Clock,
  List,
  LayoutGrid,
  Search,
  User,
  Pencil,
  Plus,
  X,
  Download,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Building,
  Paperclip,
  ScrollText,
} from "lucide-react";

interface RegisterViewProps {
  actions: RegisterAction[];
  owners: { id: string; full_name: string; title: string | null; department: string | null; role: string }[];
  mappings: MappingOption[];
  evidence: EvidenceRow[];
}

type ViewMode = "table" | "board";

function fmtMoney(value: string | number | null): string {
  return "$" + Number(value || 0).toLocaleString("en-US");
}

function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  const dt = new Date(value + "T00:00:00");
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isOverdue(act: RegisterAction): boolean {
  if (!act.due_date || act.status === "approved" || act.status === "rejected") return false;
  const due = new Date(act.due_date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

function typeLabel(t: string): string {
  return t.replaceAll("_", " ");
}

function ownerShort(name: string | null | undefined): string {
  if (!name) return "Unassigned";
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : name;
}

function StatusPill({ status }: { status: ActionStatus }) {
  return (
    <span
      className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold border ${ACTION_STATUS_CLASSES[status]}`}
      title={ACTION_STATUS_DESCRIPTIONS[status]}
    >
      {ACTION_STATUS_LABELS[status]}
    </span>
  );
}

function DeptPill({ department }: { department: string }) {
  const meta = DEPT_COLORS[department] || { label: department, className: "bg-slate-800 text-slate-300 border-slate-700" };
  return (
    <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full capitalize font-semibold border ${meta.className}`}>
      {meta.label}
    </span>
  );
}

interface TransitionButtonsProps {
  act: RegisterAction;
  waiting: boolean;
  onTransition: (id: string, to: ActionStatus) => void;
  onOpenEvidence?: (act: RegisterAction) => void;
  compact?: boolean;
}

function TransitionButtons({ act, waiting, onTransition, onOpenEvidence, compact = false }: TransitionButtonsProps) {
  const allowed = nextTransitions(act.status);
  if (act.status === "evidence_submitted") {
    return (
      <div className={compact ? "" : "flex items-center justify-end"}>
        {onOpenEvidence && (
          <button
            onClick={() => onOpenEvidence(act)}
            className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
          >
            <ScrollText className="w-3.5 h-3.5" /> Review & Sign-Off
          </button>
        )}
      </div>
    );
  }
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${compact ? "" : "justify-end"}`}>
      {allowed
        .filter((to) => to !== "rejected")
        .map((to) => (
          <button
            key={to}
            onClick={() => onTransition(act.id, to)}
            disabled={waiting}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer disabled:opacity-50 ${
              to === "in_review"
                ? "bg-sky-950 hover:bg-sky-900 border-sky-800 text-sky-300"
                : to === "in_progress"
                  ? "bg-blue-950 hover:bg-blue-900 border-blue-800 text-blue-300"
                  : to === "evidence_submitted"
                    ? "bg-teal-950 hover:bg-teal-900 border-teal-800 text-teal-300"
                    : to === "approved"
                      ? "bg-emerald-950 hover:bg-emerald-900 border-emerald-800 text-emerald-300"
                      : "bg-cyan-950 hover:bg-cyan-900 border-cyan-800 text-cyan-300"
            }`}
          >
            {ACTION_STATUS_LABELS[to]}
          </button>
        ))}
      {allowed.includes("rejected") && act.status !== "rejected" && (
        <button
          onClick={() => onTransition(act.id, "rejected")}
          disabled={waiting}
          className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-900/60 text-rose-400 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
        >
          Reject
        </button>
      )}
      {allowed.includes("proposed") && (
        <button
          onClick={() => onTransition(act.id, "proposed")}
          disabled={waiting}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Reopen
        </button>
      )}
    </div>
  );
}

export default function RegisterView({ actions, owners, mappings, evidence }: RegisterViewProps) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("table");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<RegisterAction | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState<RegisterAction | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return actions.filter((a) => {
      if (deptFilter !== "all" && a.department !== deptFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (q && !a.title.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [actions, deptFilter, statusFilter, query]);

  const stats = useMemo(() => {
    let budget = 0;
    let overdue = 0;
    for (const a of filtered) {
      budget += Number(a.estimated_cost || 0);
      if (isOverdue(a)) overdue += 1;
    }
    const approved = filtered.filter((a) => a.status === "approved").length;
    const deptBudget = new Map<string, number>();
    const deptCount = new Map<string, number>();
    for (const a of actions) {
      deptBudget.set(a.department, (deptBudget.get(a.department) || 0) + Number(a.estimated_cost || 0));
      deptCount.set(a.department, (deptCount.get(a.department) || 0) + 1);
    }
    const statusCount = new Map<ActionStatus, number>();
    for (const a of actions) {
      statusCount.set(a.status, (statusCount.get(a.status) || 0) + 1);
    }
    return { budget, overdue, approved, deptBudget, deptCount, statusCount };
  }, [filtered, actions]);

  const deptOrder = useMemo(() => {
    const present = Array.from(new Set(actions.map((a) => a.department)));
    const ordered: string[] = DEFAULT_DEPT_ORDER.filter((d) => present.includes(d));
    for (const d of present) if (!DEFAULT_DEPT_ORDER.includes(d as (typeof DEFAULT_DEPT_ORDER)[number])) ordered.push(d);
    return ordered;
  }, [actions]);

  const hasFilters = deptFilter !== "all" || statusFilter !== "all" || query !== "";

  const evidenceAction = evidenceOpen
    ? actions.find((a) => a.id === evidenceOpen.id) ?? null
    : null;

  async function handleTransition(id: string, to: ActionStatus) {
    try {
      setUpdatingId(id);
      await updateActionStatus(id, to);
    } catch (err) {
      console.error(err);
      alert("Failed to update action status");
    } finally {
      setUpdatingId(null);
      router.refresh();
    }
  }

  function handleSaveEdit() {
    if (!editing) return;
    const ownerId = editing.owner_id || null;
    const dueDate = editing.due_date || null;
    void (async () => {
      try {
        await updateAction(editing.id, {
          ownerId,
          dueDate,
          description: editing.description,
        });
        setEditing(null);
        router.refresh();
      } catch (err) {
        console.error(err);
        alert("Failed to save action changes");
      }
    })();
  }

  function handleExportJson() {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(actions, null, 2));
    const anchor = document.createElement("a");
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `NorthRiver_Implementation_Register_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="glass-panel p-4 rounded-2xl border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Total Budget</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">{fmtMoney(stats.budget)}</div>
          <span className="text-[11px] text-slate-400 block mt-0.5">{filtered.length} actions shown</span>
        </div>
        <div className="glass-panel p-4 rounded-2xl border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Approved</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">{stats.approved}</div>
          <span className="text-[11px] text-slate-400 block mt-0.5">human sign-off</span>
        </div>
        <div className="glass-panel p-4 rounded-2xl border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Overdue</span>
          <div className={`text-xl font-bold mt-1 ${stats.overdue > 0 ? "text-rose-400" : "text-slate-200"}`}>{stats.overdue}</div>
          <span className="text-[11px] text-slate-400 block mt-0.5">past deadline</span>
        </div>
        <div className="glass-panel p-4 rounded-2xl border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Departments</span>
          <div className="text-xl font-bold text-cyan-400 mt-1">{deptOrder.length}</div>
          <span className="text-[11px] text-slate-400 block mt-0.5">registered owners</span>
        </div>
      </div>

      {/* Department cost aggregation */}
      <div className="flex flex-wrap items-center gap-2 p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs">
        <Building className="w-4 h-4 text-slate-500" />
        <span className="text-slate-400 font-medium">Budget by Department:</span>
        {deptOrder.length === 0 && <span className="text-slate-500">No actions</span>}
        {deptOrder.map((d) => {
          const meta = DEPT_COLORS[d] || { label: d, className: "bg-slate-800 text-slate-300 border-slate-700" };
          return (
            <div key={d} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase ${meta.className}`}>{meta.label}</span>
              <span className="font-mono text-emerald-400 font-semibold">{fmtMoney(stats.deptBudget.get(d) ?? 0)}</span>
              <span className="text-slate-500">· {stats.deptCount.get(d) || 0}</span>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="space-y-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">View:</span>
            <div className="flex rounded-lg overflow-hidden border border-slate-800">
              <button
                onClick={() => setView("table")}
                className={`px-3 py-1.5 flex items-center gap-1.5 transition-all cursor-pointer ${
                  view === "table" ? "bg-cyan-600 text-white font-semibold" : "bg-slate-950 text-slate-400 hover:text-slate-200"
                }`}
              >
                <List className="w-3.5 h-3.5" /> Table
              </button>
              <button
                onClick={() => setView("board")}
                className={`px-3 py-1.5 flex items-center gap-1.5 transition-all cursor-pointer ${
                  view === "board" ? "bg-cyan-600 text-white font-semibold" : "bg-slate-950 text-slate-400 hover:text-slate-200"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Board
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search actions…"
                className="bg-transparent outline-none text-slate-200 w-40 placeholder:text-slate-600"
              />
            </div>
            {hasFilters && (
              <button
                onClick={() => {
                  setDeptFilter("all");
                  setStatusFilter("all");
                  setQuery("");
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Reset
              </button>
            )}
            <button
              onClick={handleExportJson}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" /> Export
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Action Item
            </button>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-medium">Status:</span>
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 rounded-lg capitalize font-mono transition-all cursor-pointer ${
              statusFilter === "all" ? "bg-cyan-600 text-white font-semibold" : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            All
          </button>
          {ACTION_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg capitalize font-mono transition-all cursor-pointer ${
                statusFilter === s ? "bg-cyan-600 text-white font-semibold" : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {ACTION_STATUS_LABELS[s].replace(" ", " ")} ({stats.statusCount.get(s) || 0})
            </button>
          ))}
        </div>

        {/* Department filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-medium">Department:</span>
          <button
            onClick={() => setDeptFilter("all")}
            className={`px-3 py-1 rounded-lg capitalize font-mono transition-all cursor-pointer ${
              deptFilter === "all" ? "bg-cyan-600 text-white font-semibold" : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            All
          </button>
          {deptOrder.map((d) => (
            <button
              key={d}
              onClick={() => setDeptFilter(d)}
              className={`px-3 py-1 rounded-lg capitalize font-mono transition-all cursor-pointer ${
                deptFilter === d ? "bg-cyan-600 text-white font-semibold" : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {(DEPT_COLORS[d]?.label || d).replace(" ", " ")}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="p-10 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
          <CheckSquare className="w-6 h-6 text-slate-600" />
          No actions match the current filters.
        </div>
      )}

      {/* TABLE VIEW */}
      {view === "table" && filtered.length > 0 && (
        <div className="space-y-6">
          {deptOrder
            .filter((d) => deptFilter === "all" || deptFilter === d)
            .map((d) => {
              const group = filtered.filter((a) => a.department === d);
              if (group.length === 0) return null;
              const meta = DEPT_COLORS[d] || { label: d, className: "bg-slate-800 text-slate-300 border-slate-700" };
              const subtotal = group.reduce((s, a) => s + Number(a.estimated_cost || 0), 0);
              return (
                <div key={d} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-mono px-2.5 py-1 rounded-full border uppercase font-semibold ${meta.className}`}>
                        {meta.label}
                      </span>
                      <span className="text-xs text-slate-500">{group.length} tasks</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      {fmtMoney(subtotal)} · subtotal
                    </span>
                  </div>
                  <div className="glass-panel rounded-2xl border-slate-800 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                          <th className="px-4 py-2.5 font-medium">Action / Asset</th>
                          <th className="px-4 py-2.5 font-medium">Type</th>
                          <th className="px-4 py-2.5 font-medium">Owner</th>
                          <th className="px-4 py-2.5 font-medium">Deadline</th>
                          <th className="px-4 py-2.5 font-medium">Cost</th>
                          <th className="px-4 py-2.5 font-medium">Status</th>
                          <th className="px-4 py-2.5 font-medium text-right">Workflow</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.map((act) => {
                          const due = fmtDate(act.due_date);
                          const late = isOverdue(act);
                          return (
                            <tr key={act.id} className="border-b border-slate-200 last:border-0 hover:bg-slate-900/40">
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-100 leading-snug">{act.title}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                                  {act.mapping?.asset ? (
                                    <span className="font-mono text-cyan-300 font-semibold">
                                      {act.mapping.asset.asset_code} · {act.mapping.asset.name}
                                    </span>
                                  ) : (
                                    <span className="italic">No asset mapping</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 capitalize text-slate-300">{typeLabel(act.action_type)}</td>
                              <td className="px-4 py-3 text-slate-300">
                                <div className="flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-slate-500" />
                                  {act.owner?.full_name || "Unassigned"}
                                </div>
                              </td>
                              <td className="px-4 py-3 font-mono">
                                <span className={`flex items-center gap-1 ${late ? "text-rose-400 font-semibold" : "text-slate-300"}`}>
                                  {late && <AlertTriangle className="w-3.5 h-3.5" />}
                                  {due}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono text-emerald-400 font-semibold">{fmtMoney(act.estimated_cost)}</td>
                              <td className="px-4 py-3"><StatusPill status={act.status} /></td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setEvidenceOpen(act)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                                  >
                                    <Paperclip className="w-3 h-3" /> Evidence
                                  </button>
                                  <button
                                    onClick={() => setEditing(act)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                                  >
                                    <Pencil className="w-3 h-3" /> Edit
                                  </button>
                                  <TransitionButtons act={act} onTransition={handleTransition} waiting={updatingId === act.id} onOpenEvidence={setEvidenceOpen} />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* BOARD VIEW */}
      {view === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ACTION_STATUSES.map((s) => {
            const cards = filtered.filter((a) => a.status === s);
            const subtotal = cards.reduce((sum, a) => sum + Number(a.estimated_cost || 0), 0);
            return (
              <div key={s} className="rounded-2xl bg-slate-900/40 border border-slate-800 min-h-24 space-y-2 p-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <StatusPill status={s} />
                    <span className="text-xs text-slate-500 font-mono">{cards.length}</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400">{subtotal > 0 ? fmtMoney(subtotal) : ""}</span>
                </div>
                {cards.length === 0 && (
                  <div className="p-3 rounded-xl border border-dashed border-slate-800 text-center text-[11px] text-slate-600">
                    No tasks
                  </div>
                )}
                {cards.map((act) => {
                  const late = isOverdue(act);
                  return (
                    <div key={act.id} className="glass-panel p-3 rounded-xl border-slate-800 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <DeptPill department={act.department} />
                            <span className="text-[10px] font-mono text-cyan-300 font-semibold">
                              {act.mapping?.asset?.asset_code || "—"}
                            </span>
                          </div>
                          <h3 className="text-xs font-semibold text-slate-100 leading-snug">{act.title}</h3>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <User className="w-3 h-3" /> {ownerShort(act.owner?.full_name)} ·{" "}
                            <span className={late ? "text-rose-400 font-semibold flex items-center gap-1" : ""}>
                              {late && <AlertTriangle className="w-3 h-3" />}
                              {fmtDate(act.due_date)}
                            </span>
                          </p>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 shrink-0">{fmtMoney(act.estimated_cost)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1.5">
                        <TransitionButtons act={act} onTransition={handleTransition} waiting={updatingId === act.id} onOpenEvidence={setEvidenceOpen} compact />
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setEvidenceOpen(act)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Paperclip className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setEditing(act)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* EDITING DRAWER */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md p-6 bg-slate-950 border-l border-slate-800 overflow-y-auto space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-foreground">Edit Action</h2>
              </div>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-100 leading-snug">{editing.title}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <DeptPill department={editing.department} />
                <StatusPill status={editing.status} />
                <span className="text-[10px] font-mono text-cyan-300 font-semibold">
                  {editing.mapping?.asset?.asset_code || "—"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5 font-medium">Assigned Owner</label>
              <select
                value={editing.owner_id || ""}
                onChange={(e) =>
                  setEditing({ ...editing, owner_id: e.target.value === "" ? null : e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none text-xs"
              >
                <option value="">Unassigned</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.full_name} — {o.title || o.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5 font-medium">Deadline</label>
              <input
                type="date"
                value={editing.due_date || ""}
                onChange={(e) => setEditing({ ...editing, due_date: e.target.value || null })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5 font-medium">Mitigation Steps</label>
              <textarea
                rows={6}
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none text-xs leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 pb-4">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 font-mono text-xs">
                <span className="text-slate-500 block">Estimated Cost</span>
                <span className="text-emerald-400 font-bold text-sm">{fmtMoney(editing.estimated_cost)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 font-mono text-xs">
                <span className="text-slate-500 block">Effort / Lead</span>
                <span className="text-slate-200 font-semibold text-sm">
                  {editing.estimated_days || "—"}d · {editing.lead_time_weeks || "—"}w
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-foreground text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ACTION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border-slate-800 bg-slate-900/95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-foreground">Add Remediation Action Item</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              action={async (formData) => {
                await createNewActionItem(formData);
                setShowAddModal(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Target Asset Mapping</label>
                <select name="mappingId" required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none">
                  {mappings.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.asset?.asset_code} - {m.asset?.name} ({m.risk_level} risk)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Action Title</label>
                <input type="text" name="title" required placeholder="e.g. Recalibrate Low-NOx Burner Flue Gas Ratio" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none" />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Mitigation Steps</label>
                <textarea name="description" required rows={3} placeholder="Engineering steps, vendor involvement, and calibration parameters..." className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Department</label>
                  <select name="department" defaultValue="operations" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none">
                    <option value="operations">Operations</option>
                    <option value="environmental">Environmental</option>
                    <option value="instrumentation">Instrumentation</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="safety">Safety</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Action Type</label>
                  <select name="actionType" defaultValue="calibration" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none">
                    <option value="calibration">Calibration</option>
                    <option value="procedural">Procedural</option>
                    <option value="hardware">Hardware</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="permit_revision">Permit Revision</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Cost ($)</label>
                  <input type="number" name="estimatedCost" defaultValue={5000} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none" />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Days</label>
                  <input type="number" name="estimatedDays" defaultValue={3} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none" />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Lead Weeks</label>
                  <input type="number" name="leadTimeWeeks" defaultValue={1} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none" />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-foreground">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
                  Save Action Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-[11px] text-slate-500 px-1">
        <Clock className="w-3.5 h-3.5" />
        Workflow: Propose ➔ In Review ➔ In Progress ➔ Evidence Submitted ➔ <span className="text-emerald-400">Approved</span> / <span className="text-rose-400">Rejected</span>. All transitions are audited.
      </div>

      {/* EVIDENCE & VERIFICATION DRAWER */}
      {evidenceAction && (
        <EvidenceDrawer
          action={evidenceAction}
          evidence={evidence}
          onClose={() => setEvidenceOpen(null)}
        />
      )}
    </div>
  );
}