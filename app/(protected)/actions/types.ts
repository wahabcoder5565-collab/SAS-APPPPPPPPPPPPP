import type { ActionStatus } from "@/app/actions/workflow";

export interface AssetLite {
  asset_code: string;
  name: string | null;
}

export interface ExpectedLite {
  parameter: string | null;
  limit_value: string | number | null;
  unit: string | null;
  pollutant: string | null;
}

export interface ChangeLite {
  id: string;
  summary: string | null;
  new_requirement: ExpectedLite | null;
}

export interface MappingLite {
  id: string;
  risk_level: string | null;
  asset: AssetLite | null;
  change: ChangeLite | null;
}

export interface OwnerLite {
  id: string;
  full_name: string;
  title: string | null;
  department: string | null;
}

export interface RegisterAction {
  id: string;
  title: string;
  description: string;
  department: string;
  action_type: string;
  status: ActionStatus;
  estimated_cost: string | number | null;
  estimated_days: number | null;
  lead_time_weeks: number | null;
  due_date: string | null;
  required_evidence: string | null;
  owner_id: string | null;
  mapping: MappingLite | null;
  owner: OwnerLite | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewer_note: string | null;
}

export type EvidenceStatus = "pending" | "compliant" | "incomplete" | "inconclusive";

export interface EvidenceRow {
  id: string;
  action_id: string;
  file_url: string | null;
  title: string | null;
  document_type: string | null;
  ai_check_status: EvidenceStatus;
  ai_confidence: number | null;
  ai_check_reason: string | null;
  uploaded_by_name: string | null;
  created_at: string | null;
}

export interface MappingOption {
  id: string;
  risk_level: string | null;
  asset: AssetLite | null;
}