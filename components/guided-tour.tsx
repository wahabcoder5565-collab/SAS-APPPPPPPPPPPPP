"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Compass, X, ArrowRight, CheckCircle2 } from "lucide-react";
import { FLAGSHIP } from "@/lib/site-config";

const STORAGE_KEY = "pi_tour_seen_v1";

export default function GuidedTour() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function goTo(index: number) {
    const target = FLAGSHIP.steps[index];
    if (!target) return;
    setStep(index);
    router.push(target.route);
  }

  const current = FLAGSHIP.steps[step];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#2563EB] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-900/40 hover:bg-[#1D4ED8] transition-colors cursor-pointer"
      >
        <Compass className="w-4 h-4" />
        Guided Tour
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-[#0F172A]/60 backdrop-blur-sm"
            onClick={dismiss}
            aria-hidden="true"
          />
          <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-slate-700/60 bg-[#0F172A] text-white shadow-2xl">
            <header className="flex items-start justify-between border-b border-slate-700/60 p-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#60A5FA]">
                  {FLAGSHIP.steps.length}-step walkthrough
                </p>
                <h2 className="mt-1 text-base font-semibold">{FLAGSHIP.title}</h2>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                aria-label="Close tour"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5">
              <ol className="space-y-2">
                {FLAGSHIP.steps.map((s, i) => {
                  const isCurrent = i === step;
                  const isVisited = pathname === s.route;
                  return (
                    <li key={s.label}>
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors cursor-pointer ${
                          isCurrent
                            ? "border-[#2563EB]/70 bg-[#1E293B]"
                            : "border-slate-800 bg-[#111827]/60 hover:border-slate-600"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            isVisited
                              ? "bg-emerald-500/20 text-emerald-300"
                              : isCurrent
                                ? "bg-[#2563EB] text-white"
                                : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {isVisited ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold text-white">{s.label}</span>
                          <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-400">
                            {s.detail}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            <footer className="border-t border-slate-700/60 p-5">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => goTo(Math.max(0, step - 1))}
                  disabled={step === 0}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-500 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Back
                </button>
                {step < FLAGSHIP.steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => goTo(step + 1)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8] transition-colors cursor-pointer"
                  >
                    Next step
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={dismiss}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Finish tour
                  </button>
                )}
              </div>
              {current && (
                <p className="mt-3 text-center text-[10px] font-mono text-slate-500">
                  Now viewing: {current.route}
                </p>
              )}
              <p className="mt-3 text-center text-[10px] leading-relaxed text-slate-500">
                The tour highlights the Boiler B-07 path on synthetic data. You can close it at any
                time and reopen it from the button in the corner.
              </p>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
