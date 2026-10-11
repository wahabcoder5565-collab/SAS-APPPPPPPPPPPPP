export interface AuditUserLite {
  full_name: string | null;
  role: string | null;
  title: string | null;
  department: string | null;
}

export interface AuditLogEntry {
  seq: number | null;
  id: string;
  entity_type: string | null;
  entity_id: string | null;
  action: string | null;
  previous_state: unknown;
  new_state: unknown;
  performed_by: string | null;
  notes: string | null;
  timestamp: string | null;
  event_hash: string | null;
  prev_hash: string | null;
  user: AuditUserLite | null;
}

export interface ChainStatus {
  ok: boolean;
  total: number;
  checked: number;
  mismatches: number;
  first_broken_seq: string | null;
  genesis_ok: boolean;
  last_hash: string;
  verified_at: string;
}