import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Cpu,
  Layers,
  Network,
} from "lucide-react";
import AssetsDirectory, { type AssetRecord } from "./assets-directory";

export default async function AssetsPage() {
  const supabase = await createClient();

  const { data: assets } = await supabase
    .from("pi_facility_assets")
    .select(`
      *,
      impacts:pi_impact_mappings (id)
    `)
    .order("is_bottleneck", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/50 text-cyan-400 text-xs font-semibold mb-2">
            <Cpu className="w-3.5 h-3.5" /> Physical Equipment Registry
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Refinery Process Units & Emission Sources
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            NorthRiver Refining Complex #1 asset database with operating envelopes, emission controls, and instrumentation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/impacts"
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40 transition-all flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            View Active Impacts
          </Link>
          <Link
            href="/propagation"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-2 border border-slate-700/60"
          >
            <Network className="w-4 h-4" />
            Propagation Graph
          </Link>
        </div>
      </div>

      <AssetsDirectory assets={(assets ?? []) as unknown as AssetRecord[]} />
    </div>
  );
}
