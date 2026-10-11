"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Cpu,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Search,
} from "lucide-react";
import {
  createAssetAction,
  updateAssetAction,
  deleteAssetAction,
  type AssetActionResult,
} from "@/app/actions/assets";

export interface AssetRecord {
  id: string;
  asset_code: string;
  name: string;
  area: string;
  asset_type: string;
  capacity: string | null;
  is_bottleneck: boolean;
  installed_controls: string[];
  monitoring_systems: string[];
  impacts?: { id: string }[];
}

interface Props {
  assets: AssetRecord[];
}

const inputClass =
  "w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none text-xs focus:border-cyan-800";
const labelClass = "block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5 font-medium";

export default function AssetsDirectory({ assets }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState("");
  const [drawer, setDrawer] = useState<null | { mode: "create"; asset: null } | { mode: "edit"; asset: AssetRecord }>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const types = Array.from(new Set(assets.map((a) => a.asset_type))).sort();

  const filtered = assets.filter((a) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      a.asset_code.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.area.toLowerCase().includes(q)
    );
  });

  function openCreate() {
    setError(null);
    setDrawer({ mode: "create", asset: null });
  }

  function openEdit(asset: AssetRecord) {
    setError(null);
    setDrawer({ mode: "edit", asset });
  }

  function close() {
    setDrawer(null);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (drawer?.asset) fd.set("id", drawer.asset.id);
    const editing = drawer?.asset;
    startTransition(async () => {
      const res: AssetActionResult = editing
        ? await updateAssetAction(fd)
        : await createAssetAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  async function handleDelete(asset: AssetRecord) {
    if (!window.confirm(`Delete asset ${asset.asset_code} (${asset.name})? This is recorded in the audit trail.`)) {
      return;
    }
    setDeletingId(asset.id);
    const fd = new FormData();
    fd.set("id", asset.id);
    const res = await deleteAssetAction(fd);
    setDeletingId(null);
    if (!res.ok) {
      window.alert(res.error);
      return;
    }
    router.refresh();
  }

  const editingAsset = drawer?.asset ?? null;
  const editing = !editingAsset ? undefined : editingAsset;

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-label="Search assets" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by tag, name, area…"
            className="bg-transparent outline-none text-slate-200 w-full placeholder:text-slate-600"
          />
        </div>
        <button
          onClick={openCreate}
          className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Asset
        </button>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((asset) => {
          const impactCount = asset.impacts?.length || 0;
          return (
            <div
              key={asset.id}
              className={`glass-panel rounded-2xl p-6 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between ${
                asset.is_bottleneck ? "border-t-4 border-t-rose-500" : ""
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-bold text-base text-cyan-400">
                    {asset.asset_code}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {asset.is_bottleneck && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-400 font-bold uppercase">
                        Bottleneck
                      </span>
                    )}
                    {impactCount > 0 && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-400 font-semibold">
                        {impactCount} Active Impact{impactCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-base font-bold text-foreground leading-snug">{asset.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {asset.area} · {asset.asset_type}
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    {asset.capacity ? `Capacity: ${asset.capacity}` : "No capacity spec"}
                  </p>
                </div>

                {/* Installed Controls */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">
                    Installed Controls
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(asset.installed_controls) && asset.installed_controls.length > 0 ? (
                      asset.installed_controls.map((ctrl, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[10px] font-mono"
                        >
                          {ctrl}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">None</span>
                    )}
                  </div>
                </div>

                {/* Monitoring Systems */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">
                    Monitoring & Sensors
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(asset.monitoring_systems) && asset.monitoring_systems.length > 0 ? (
                      asset.monitoring_systems.map((mon, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 text-[10px] font-mono"
                        >
                          {mon}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">None</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono text-[11px]">Tag: {asset.asset_code}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(asset)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                    aria-label={`Edit ${asset.asset_code}`}
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(asset)}
                    disabled={deletingId === asset.id}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/40 hover:border-rose-700/60 border border-slate-700 text-slate-300 hover:text-rose-300 text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    aria-label={`Delete ${asset.asset_code}`}
                  >
                    <Trash2 className="w-3 h-3" /> {deletingId === asset.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-800 p-10 text-center text-sm text-slate-500">
          <Cpu className="w-6 h-6 mx-auto mb-2 text-slate-600" aria-label="No assets" />
          No assets match your search.
        </div>
      )}

      {/* Edit / Create Drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={close}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md p-6 bg-slate-950 border-l border-slate-800 overflow-y-auto space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-foreground">
                  {editing ? "Edit Asset" : "Add Asset"}
                </h2>
              </div>
              <button onClick={close} className="text-slate-400 hover:text-foreground cursor-pointer" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Asset Tag (unique)</label>
                <input
                  required
                  name="assetCode"
                  defaultValue={editing?.asset_code ?? ""}
                  disabled={!!editing}
                  placeholder="e.g. E-203"
                  className={`${inputClass} ${editing ? "opacity-60" : ""} uppercase font-mono`}
                />
              </div>

              <div>
                <label className={labelClass}>Name</label>
                <input
                  required
                  name="name"
                  defaultValue={editing?.name ?? ""}
                  placeholder="e.g. Hydrotreater Heater"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Area</label>
                  <input
                    required
                    name="area"
                    defaultValue={editing?.area ?? ""}
                    placeholder="e.g. Crude Unit"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Asset Type</label>
                  <input
                    required
                    name="assetType"
                    defaultValue={editing?.asset_type ?? ""}
                    list="asset-types"
                    placeholder="e.g. boiler"
                    className={inputClass}
                  />
                  <datalist id="asset-types">
                    {types.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className={labelClass}>Capacity (optional)</label>
                  <input
                    name="capacity"
                    defaultValue={editing?.capacity ?? ""}
                    placeholder="e.g. 850 MMBtu/hr"
                    className={inputClass}
                  />
                </div>
                <label className="flex items-center gap-2 py-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isBottleneck"
                    defaultChecked={editing?.is_bottleneck ?? false}
                    className="accent-rose-500 w-4 h-4"
                  />
                  Bottleneck unit
                </label>
              </div>

              <div>
                <label className={labelClass}>Installed Controls</label>
                <textarea
                  name="installedControls"
                  defaultValue={(editing?.installed_controls ?? []).join("\n")}
                  rows={3}
                  placeholder={"One per line, e.g.:\nSCR, 2-cell, 4SX2 (post-1990)"}
                  className={`${inputClass} resize-y font-mono`}
                />
              </div>

              <div>
                <label className={labelClass}>Monitoring & Sensors</label>
                <textarea
                  name="monitoringSystems"
                  defaultValue={(editing?.monitoring_systems ?? []).join("\n")}
                  rows={3}
                  placeholder={"One per line, e.g.:\nCEMS SO2 analyzer"}
                  className={`${inputClass} resize-y font-mono`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={close}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {pending ? (editing ? "Saving…" : "Adding…") : editing ? "Save Changes" : "Create Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}