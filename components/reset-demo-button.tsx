"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Loader2, Check } from "lucide-react";
import { resetDemoWorkspace } from "@/app/actions/demo";

export default function ResetDemoButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleReset() {
    const confirmed = window.confirm(
      "Reset the demo workspace? This restores all implementation actions to their seeded statuses and clears review decisions made during this session. It does not delete data you added."
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await resetDemoWorkspace();
      if (result.ok) {
        setMessage(`Demo reset — ${result.reset ?? 0} actions restored.`);
        router.refresh();
      } else {
        setMessage(result.error ?? "Reset failed.");
      }
      window.setTimeout(() => setMessage(null), 4000);
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleReset}
        disabled={pending}
        title="Restore the demo to its seeded starting state"
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-900/50 transition-all disabled:opacity-60 cursor-pointer"
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <RotateCcw className="w-3.5 h-3.5" />
        )}
        <span className="font-mono text-[11px] hidden xl:inline">Reset Demo</span>
      </button>

      {message && (
        <div className="absolute right-0 top-full mt-2 z-50 flex items-center gap-2 whitespace-nowrap rounded-lg border border-emerald-800/60 bg-emerald-950/90 px-3 py-1.5 text-[11px] text-emerald-300 shadow-lg">
          <Check className="w-3.5 h-3.5" />
          {message}
        </div>
      )}
    </div>
  );
}
