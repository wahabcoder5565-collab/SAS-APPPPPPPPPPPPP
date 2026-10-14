"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
} from "react";
import {
  WORKFLOW_STAGES,
  type WorkflowIcon,
  type WorkflowStage,
  type FactTone,
} from "@/lib/workflow";
import {
  FileText,
  GitCompareArrows,
  Network,
  ListChecks,
  ShieldCheck,
  Play,
  Pause,
  ChevronRight,
  ChevronDown,
  Check,
} from "lucide-react";

type IconComponent = ComponentType<{ className?: string }>;

const ICONS: Record<WorkflowIcon, IconComponent> = {
  input: FileText,
  detect: GitCompareArrows,
  map: Network,
  actions: ListChecks,
  review: ShieldCheck,
};

const AUTO_ADVANCE_MS = 3400;

const toneText: Record<FactTone, string> = {
  default: "text-[#0F172A]",
  change: "text-[#1D4ED8]",
  warn: "text-[#B45309]",
  ok: "text-[#047857]",
};

const statusStyles: Record<string, string> = {
  "Needs Review": "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]",
  "Pending Approval": "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]",
  Approved: "bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]",
};

function StageDetail({ stage }: { stage: WorkflowStage }) {
  const Icon = ICONS[stage.icon];
  return (
    <div
      key={stage.id}
      role="tabpanel"
      id={`wf-panel-${stage.id}`}
      aria-labelledby={`wf-tab-${stage.id}`}
      className="wf-detail-enter rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-7"
    >
      <div className="flex items-start gap-3.5">
        <span className="shrink-0 w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </span>
        <div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#1D4ED8]">
            Stage {stage.step}
          </div>
          <h3 className="text-lg font-bold text-[#0F172A]">{stage.title}</h3>
          <p className="mt-1 text-[13.5px] text-[#475569] leading-relaxed">{stage.description}</p>
        </div>
      </div>

      {/* Facts */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {stage.facts.map((f) => (
          <div
            key={f.label}
            className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
              {f.label}
            </div>
            <div className={`mt-0.5 text-[13px] font-bold font-mono ${toneText[f.tone ?? "default"]}`}>
              {f.value}
            </div>
          </div>
        ))}
      </div>

      {/* Related records */}
      {stage.records && (
        <div className="mt-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] mb-2">
            Connected equipment records
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {stage.records.map((r) => (
              <div
                key={r.code}
                className="rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-3 shadow-xs"
              >
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#1D4ED8]">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  {r.code}
                </div>
                <div className="mt-1 text-[12.5px] font-semibold text-[#0F172A]">{r.label}</div>
                <div className="mt-0.5 text-[11px] text-[#B45309] font-medium">{r.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {stage.actions && (
        <div className="mt-5 space-y-2">
          {stage.actions.map((a) => (
            <div
              key={a.title}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 shadow-xs"
            >
              <span className="text-[13px] font-semibold text-[#0F172A]">{a.title}</span>
              <span
                className={`shrink-0 w-fit text-[10.5px] font-semibold px-2.5 py-1 rounded-full border ${
                  statusStyles[a.status]
                }`}
              >
                {a.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Traceability chain */}
      {stage.chain && (
        <div className="mt-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] mb-2">
            Trace of this finding
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {stage.chain.map((link, i) => (
              <span key={link} className="flex items-center gap-2">
                <span className="text-[11.5px] font-medium text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-2.5 py-1 rounded-lg">
                  {link}
                </span>
                {i < stage.chain!.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Note */}
      <p className="mt-5 pt-4 border-t border-[#F1F5F9] text-[12px] text-[#64748B] leading-relaxed">
        {stage.note}
      </p>
    </div>
  );
}

export default function WorkflowExplorer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const total = WORKFLOW_STAGES.length;
  const active = WORKFLOW_STAGES[activeIndex];

  const select = useCallback((index: number, moveFocus = false) => {
    const clamped = Math.max(0, Math.min(total - 1, index));
    setActiveIndex(clamped);
    if (moveFocus) tabRefs.current[clamped]?.focus();
  }, [total]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => {
        if (prev >= total - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [playing, total]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        select((activeIndex + 1) % total, true);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        select((activeIndex - 1 + total) % total, true);
        break;
      case "Home":
        event.preventDefault();
        select(0, true);
        break;
      case "End":
        event.preventDefault();
        select(total - 1, true);
        break;
      default:
        break;
    }
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (activeIndex >= total - 1) select(0);
              setPlaying((p) => !p);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F172A] text-white text-[12px] font-semibold hover:bg-[#1E293B] transition-colors cursor-pointer"
          >
            {playing ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause walkthrough
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Play walkthrough
              </>
            )}
          </button>
          <span className="text-[11px] font-mono text-[#64748B]">
            Stage {activeIndex + 1} of {total}
          </span>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {WORKFLOW_STAGES.map((s, i) => (
            <span
              key={s.id}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex
                  ? "w-7 bg-[#1D4ED8]"
                  : i < activeIndex
                    ? "w-4 bg-[#93C5FD]"
                    : "w-4 bg-[#E2E8F0]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Desktop: horizontal graph ── */}
      <div
        role="tablist"
        aria-label="PermitImpact AI workflow stages"
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        className="hidden md:flex items-stretch"
      >
        {WORKFLOW_STAGES.map((stage, i) => {
          const Icon = ICONS[stage.icon];
          const isActive = i === activeIndex;
          const isTraversed = i < activeIndex;
          return (
            <div key={stage.id} className="flex items-stretch flex-1 min-w-0">
              <button
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`wf-tab-${stage.id}`}
                aria-selected={isActive}
                aria-controls={`wf-panel-${stage.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => {
                  setPlaying(false);
                  select(i);
                }}
                className={`wf-node flex-1 text-left rounded-xl border p-3.5 cursor-pointer ${
                  isActive
                    ? "border-[#1D4ED8] bg-white shadow-[0_10px_30px_-12px_rgba(29,78,216,0.45)] ring-1 ring-[#1D4ED8]/30"
                    : "border-[#E2E8F0] bg-white/70 hover:border-[#CBD5E1]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-mono font-bold ${
                      isActive
                        ? "bg-[#1D4ED8] text-white"
                        : isTraversed
                          ? "bg-[#DBEAFE] text-[#1D4ED8]"
                          : "bg-[#F1F5F9] text-[#64748B]"
                    }`}
                  >
                    {isTraversed ? <Check className="w-3.5 h-3.5" /> : stage.step}
                  </span>
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#1D4ED8]" : "text-[#94A3B8]"}`} />
                </div>
                <div
                  className={`text-[13px] font-bold leading-tight ${
                    isActive ? "text-[#0F172A]" : "text-[#334155]"
                  }`}
                >
                  {stage.nodeLabel}
                </div>
                <div className="mt-1 text-[11px] text-[#64748B] leading-snug line-clamp-2">
                  {stage.description}
                </div>
              </button>
              {i < total - 1 && (
                <div className="flex items-center justify-center w-7 shrink-0" aria-hidden="true">
                  <ChevronRight
                    className={`w-4 h-4 ${i < activeIndex ? "text-[#1D4ED8]" : "text-[#CBD5E1]"}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Mobile: vertical graph ── */}
      <div
        role="tablist"
        aria-label="PermitImpact AI workflow stages"
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
        className="md:hidden flex flex-col"
      >
        {WORKFLOW_STAGES.map((stage, i) => {
          const Icon = ICONS[stage.icon];
          const isActive = i === activeIndex;
          const isTraversed = i < activeIndex;
          return (
            <div key={stage.id} className="flex flex-col">
              <button
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`wf-tab-mobile-${stage.id}`}
                aria-selected={isActive}
                aria-controls={`wf-panel-${stage.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => {
                  setPlaying(false);
                  select(i);
                }}
                className={`wf-node flex items-center gap-3 text-left rounded-xl border p-3.5 cursor-pointer ${
                  isActive
                    ? "border-[#1D4ED8] bg-white shadow-[0_10px_30px_-12px_rgba(29,78,216,0.45)] ring-1 ring-[#1D4ED8]/30"
                    : "border-[#E2E8F0] bg-white/70"
                }`}
              >
                <span
                  className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-[11px] font-mono font-bold ${
                    isActive
                      ? "bg-[#1D4ED8] text-white"
                      : isTraversed
                        ? "bg-[#DBEAFE] text-[#1D4ED8]"
                        : "bg-[#F1F5F9] text-[#64748B]"
                  }`}
                >
                  {isTraversed ? <Check className="w-4 h-4" /> : stage.step}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-bold text-[#0F172A]">{stage.nodeLabel}</span>
                  <span className="mt-0.5 block text-[11px] text-[#64748B] leading-snug">
                    {stage.description}
                  </span>
                </span>
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#1D4ED8]" : "text-[#94A3B8]"}`} />
              </button>
              {i < total - 1 && (
                <div className="flex justify-center py-1" aria-hidden="true">
                  <ChevronDown
                    className={`w-4 h-4 ${i < activeIndex ? "text-[#1D4ED8]" : "text-[#CBD5E1]"}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      <div className="mt-6">
        <StageDetail stage={active} />
      </div>
    </div>
  );
}
