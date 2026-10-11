export const ACTION_STATUSES = [
  "proposed",
  "in_review",
  "in_progress",
  "evidence_submitted",
  "approved",
  "rejected",
] as const;

export type ActionStatus = (typeof ACTION_STATUSES)[number];

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  proposed: "Proposed",
  in_review: "In Review",
  in_progress: "In Progress",
  evidence_submitted: "Evidence Submitted",
  approved: "Approved",
  rejected: "Rejected",
};

export const ACTION_STATUS_DESCRIPTIONS: Record<ActionStatus, string> = {
  proposed: "Proposed mitigation task awaiting review",
  in_review: "Under review by environmental compliance",
  in_progress: "Engineering work actively underway",
  evidence_submitted: "Evidence submitted, awaiting human sign-off",
  approved: "Approved by compliance reviewer",
  rejected: "Rejected — returned to planning",
};

export const ACTION_STATUS_CLASSES: Record<ActionStatus, string> = {
  proposed: "bg-amber-950/70 text-amber-400 border-amber-800/60",
  in_review: "bg-sky-950/70 text-sky-400 border-sky-800/60",
  in_progress: "bg-blue-950/70 text-blue-400 border-blue-800/60",
  evidence_submitted: "bg-teal-950/70 text-teal-300 border-teal-800/60",
  approved: "bg-emerald-950/70 text-emerald-400 border-emerald-800/60",
  rejected: "bg-rose-950/70 text-rose-400 border-rose-800/60",
};

export const ACTION_STATUS_DOTS: Record<ActionStatus, string> = {
  proposed: "bg-amber-400",
  in_review: "bg-sky-400",
  in_progress: "bg-blue-400",
  evidence_submitted: "bg-teal-400",
  approved: "bg-emerald-400",
  rejected: "bg-rose-400",
};

export const ACTION_WORKFLOW_TRANSITIONS: Record<ActionStatus, ActionStatus[]> = {
  proposed: ["in_review", "rejected"],
  in_review: ["in_progress", "rejected"],
  in_progress: ["evidence_submitted", "rejected"],
  evidence_submitted: ["approved", "rejected"],
  approved: [],
  rejected: ["proposed"],
};

export function canTransition(from: ActionStatus, to: ActionStatus): boolean {
  return ACTION_WORKFLOW_TRANSITIONS[from].includes(to);
}

export function nextTransitions(from: ActionStatus): ActionStatus[] {
  return ACTION_WORKFLOW_TRANSITIONS[from];
}

export function isTerminal(status: ActionStatus): boolean {
  return status === "approved" || status === "rejected";
}

export const DEFAULT_DEPT_ORDER = [
  "operations",
  "environmental",
  "instrumentation",
  "maintenance",
  "safety",
] as const;

export const REVIEWABLE_ROLES = ["engineer", "reviewer", "manager"] as const;

export function canSignOff(role: string | null | undefined): boolean {
  return !!role && (REVIEWABLE_ROLES as readonly string[]).includes(role);
}

export const DEPT_COLORS: Record<string, { label: string; className: string }> = {
  operations: { label: "Operations", className: "bg-blue-950/70 text-blue-400 border-blue-800/60" },
  environmental: { label: "Environmental", className: "bg-emerald-950/70 text-emerald-400 border-emerald-800/60" },
  instrumentation: { label: "Instrumentation", className: "bg-cyan-950/70 text-cyan-400 border-cyan-800/60" },
  maintenance: { label: "Maintenance", className: "bg-amber-950/70 text-amber-400 border-amber-800/60" },
  safety: { label: "Safety", className: "bg-rose-950/70 text-rose-400 border-rose-800/60" },
};