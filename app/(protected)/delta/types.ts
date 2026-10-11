export interface RequirementLite {
  id: string;
  raw_text: string | null;
  citation: string | null;
  section: string | null;
  page: number | null;
  pollutant: string | null;
  limit_value: number | null;
  unit: string | null;
  frequency: string | null;
  averaging_period: string | null;
  parameter: string | null;
}

export interface AssetLite {
  asset_code: string;
  name: string | null;
  asset_type: string | null;
}

export interface MappingLite {
  id: string;
  risk_level: string | null;
  confidence_score: number | null;
  technical_analysis: string | null;
  impact_type: string | null;
  asset: AssetLite | null;
}

export interface ChangeRow {
  id: string;
  summary: string;
  delta_description: string;
  change_type: string;
  change_kind: string | null;
  severity: string;
  old_value: string | null;
  new_value: string | null;
  confidence: number | null;
  ai_reasoning: string | null;
  review_status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string | null;
  comparison_id: string | null;
  old_requirement: RequirementLite | null;
  new_requirement: RequirementLite | null;
  mapping: MappingLite | null;
}

export interface ConfidenceStats {
  avg: number;
  min: number;
  max: number;
  high: number;
  mid: number;
  low: number;
}

export interface KpiStats {
  total: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  unresolvedActions: number;
  confidence: ConfidenceStats;
}

export const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-rose-950/80 text-rose-400 border-rose-800/80",
  moderate: "bg-amber-950/80 text-amber-400 border-amber-800/80",
  low: "bg-blue-950/80 text-blue-400 border-blue-800/80",
  administrative: "bg-slate-900 text-slate-400 border-slate-800",
};

export const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-950/70 text-amber-400 border-amber-800/60",
  accepted: "bg-emerald-950/70 text-emerald-400 border-emerald-800/60",
  rejected: "bg-rose-950/70 text-rose-400 border-rose-800/60",
  modified: "bg-cyan-950/70 text-cyan-400 border-cyan-800/60",
};

export const CONFLICT_STYLES: Record<string, { label: string; className: string }> = {
  sop_parameter_mismatch: {
    label: "SOP conflict",
    className: "bg-amber-950/70 border-amber-800/60 text-amber-300",
  },
  alarm_setpoint_mismatch: {
    label: "DCS alarm conflict",
    className: "bg-rose-950/70 border-rose-800/60 text-rose-300",
  },
  cadence_mismatch: {
    label: "Cadence conflict",
    className: "bg-sky-950/70 border-sky-800/60 text-sky-300",
  },
  historical_excursion: {
    label: "Historical excursion",
    className: "bg-orange-950/70 border-orange-800/60 text-orange-300",
  },
};

export const pollutantOf = (ch: ChangeRow): string =>
  ch.new_requirement?.pollutant ??
  ch.old_requirement?.pollutant ??
  (ch.change_kind ?? ch.change_type);

export interface ConflictCitation {
  document_id: string | null;
  document_title: string | null;
  page_or_section?: string | null;
  quote: string | null;
}

export interface ConflictRow {
  id: string;
  change_id: string;
  asset_id: string | null;
  control_id: string | null;
  document_id: string | null;
  conflict_type: string;
  summary: string;
  permit_value: string | null;
  control_value: string | null;
  unit: string | null;
  confidence: number | null;
  citation: ConflictCitation | null;
}

export interface ActionRow {
  id: string;
  title: string;
  description: string | null;
  department: string | null;
  action_type: string | null;
  status: string | null;
  due_date: string | null;
  estimated_cost: number | null;
  estimated_days: number | null;
  lead_time_weeks: number | null;
}

export interface ReviewEventRow {
  id: string;
  decision: string;
  note: string | null;
  timestamp: string;
  reviewer_name: string | null;
}