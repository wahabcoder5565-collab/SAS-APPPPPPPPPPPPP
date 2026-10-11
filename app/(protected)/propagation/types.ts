export interface ClauseNode {
  citation: string | null;
  section: string | null;
  page: number | null;
  pollutant: string | null;
  parameter: string | null;
  limitValue: number | null;
  unit: string | null;
  averagingPeriod: string | null;
}

export interface ConflictLite {
  conflictType: string;
  summary: string;
  permitValue: string | null;
  controlValue: string | null;
  unit: string | null;
}

export interface ChildNode {
  id: string;
  kind: "control" | "document";
  controlType: string;
  label: string;
  subtitle: string | null;
  sourceDocId: string | null;
  docTitle: string | null;
  docType: string | null;
  docVersion: string | null;
  conflicts: ConflictLite[];
}

export interface AssetNode {
  id: string;
  assetCode: string;
  name: string | null;
  area: string | null;
  assetType: string | null;
  capacity: string | null;
  isBottleneck: boolean;
  impactType: string | null;
  riskLevel: string | null;
  impactConfidence: number | null;
  technicalAnalysis: string | null;
  children: ChildNode[];
}

export interface RunAction {
  id: string;
  title: string;
  department: string | null;
  actionType: string | null;
  status: string | null;
  cost: number | null;
}

export interface ChangeTree {
  changeId: string;
  summary: string;
  severity: string;
  reviewStatus: string;
  oldValue: string | null;
  newValue: string | null;
  confidence: number | null;
  clause: ClauseNode;
  assets: AssetNode[];
  actions: RunAction[];
}

export const CONTROL_META: Record<string, { label: string; className: string }> = {
  dcs_alarm: { label: "DCS Alarm", className: "text-rose-400" },
  cems: { label: "CEMS Analyzer", className: "text-cyan-400" },
  sop_parameter: { label: "SOP Parameter", className: "text-amber-400" },
  calculation: { label: "Calculation", className: "text-sky-400" },
  training: { label: "Training", className: "text-sky-400" },
  reporting: { label: "Reporting", className: "text-emerald-400" },
  inspection: { label: "Inspection / Form", className: "text-teal-400" },
  monitoring: { label: "Monitoring", className: "text-blue-400" },
  document: { label: "Document / Evidence", className: "text-slate-400" },
};

export const RISK_STYLES: Record<string, string> = {
  high: "bg-rose-950/80 text-rose-400 border-rose-800/80",
  medium: "bg-amber-950/80 text-amber-400 border-amber-800/80",
  low: "bg-emerald-950/80 text-emerald-400 border-emerald-800/80",
};

export const IMPACT_TYPE_LABELS: Record<string, string> = {
  exceedance_risk: "Emission Exceedance Risk",
  monitoring_gap: "Monitoring & Sampling Gap",
  operational_constraint: "Operational Constraint",
  reporting_change: "Reporting Procedure Modification",
};