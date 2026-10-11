# PermitImpact AI — Phased Implementation & Progress Tracker

> **Mission:** A vertical AI implementation for refinery environmental teams that compares revised air permits against the baseline permit, deterministically calculates regulatory deltas, maps obligations to physical refinery equipment and controls, and produces a human-reviewed implementation plan with traceable evidence.
>
> **Reference Document:** `PermitImpact_AI_Product_Specification` (NorthRiver Refining Title V Prototype)  
> **Core Stack:** Next.js 16 (App Router, TypeScript) · Supabase (Auth, Postgres, pgvector, Storage) · Google Gemini API (`@google/genai`) · Tailwind CSS

---

## 📊 Phase Progress Summary

| Phase | Title | Status | Completion |
|---|---|:---:|:---:|
| **Phase 1** | Project Architecture, Routing & Supabase Auth Hardening | ✅ Completed | 100% |
| **Phase 2** | Authoritative Relational Schema & pgvector Migration | ✅ Completed | 100% |
| **Phase 3** | NorthRiver Refining Synthetic Dataset & Ground Truth | ✅ Completed | 100% |
| **Phase 4** | Ingestion & Deterministic Delta Engine | ✅ Completed | 100% |
| **Phase 5** | Facility Impact Resolution & Conflict Detection Engine | ✅ Completed | 100% |
| **Phase 6** | Screen A & B: Command Center & Change Detail Deep-Dive | ✅ Completed | 100% |
| **Phase 7** | Screen C: Facility Dependency Graph & Propagation View | ✅ Completed | 100% |
| **Phase 8** | Screen D: Implementation Register & Task Lifecycle | ✅ Completed | 100% |
| **Phase 9** | Interactive Evidence Verification & Human Sign-Off | ✅ Completed | 100% |
| **Phase 10** | Comprehensive Audit Trail, Evaluation & Demo Verification | ✅ Completed | 100% |

---

## 🎯 The Core Transformation Chain

Every phase is built to support this single, unbroken, defensible chain:
```
[Permit Change] ──▶ [Affected Asset] ──▶ [Affected Control] ──▶ [Required Action] ──▶ [Evidence Package] ──▶ [Human Approval]
  (Citations)          (Boiler B-07)       (SOP-44 / DCS Alarm)    (Tune FGR & SOP)        (Lab / Cert)          (Engineer Sign-Off)
```

---

## 🛠️ Phase-by-Phase Roadmap

### Phase 1: Project Architecture, Routing & Supabase Auth Hardening
**Objective:** Establish a rock-solid, production-grade Next.js 16 + Supabase foundation with multi-user authentication, secure session handling, and role-based access control (RBAC).

- [x] Next.js 16 App Router scaffolding with TypeScript and Tailwind CSS
- [x] Supabase SSR client setup (`lib/supabase/server.ts`, `lib/supabase/client.ts`)
- [x] Standard Next.js `middleware.ts` for session refresh and comprehensive route protection
- [x] Dedicated Auth pages (`/login`, `/signup`) with industrial refinery styling
- [x] Multi-persona demo switcher for all 4 NorthRiver refinery personas (Engineer, Manager, Operations, Reviewer)
- [x] Role-Based Access Control (RBAC) synchronization with `pi_users` and verified `auth.users` credentials
- [x] Interactive PersonaSwitcher component in the top header and role/department badge in the layout footer
- [x] Verified secure cookie handling and universal redirection for protected routes (`/dashboard`, `/permits`, `/delta`, etc.)

**Exit Criteria:** Users can sign in, register, switch personas seamlessly, and unauthenticated visitors are redirected. All protected routes are secured. *(MET)*

---

### Phase 2: Authoritative Relational Schema & pgvector Migration
**Objective:** Implement the complete relational and vector database schema matching Section 9 of the product specification in Supabase with `pi_` namespace isolation.

- [x] Create foundational `pi_` tables (`pi_permits`, `pi_assets`, `pi_changes`, `pi_actions`)
- [x] Align schema strictly with Section 9 specification:
  - `pi_permits` (id, title, permit_number, agency, type, status, effective_date, file_url, created_by)
  - `pi_permit_requirements` (id, permit_id, section, page, raw_text, normalized_type, pollutant, unit, limit_value, frequency, confidence)
  - `pi_permit_changes` (id, old_requirement_id, new_requirement_id, change_type, severity, summary, confidence, ai_reasoning)
  - `pi_facility_assets` (id, asset_code, name, asset_type, area, tags, operating_envelope)
  - `pi_controls` (id, asset_id, control_type, name, value, unit, frequency, source_document_id)
  - `pi_documents` (id, title, document_type, version, file_url, effective_date)
  - `pi_document_chunks` (id, document_id, text, embedding vector(768), page_or_section, metadata)
  - `pi_relationships` (id, from_type, from_id, relation, to_type, to_id, confidence, evidence)
  - `pi_implementation_actions` (id, change_id, title, department, action_type, owner_id, due_date, status, required_evidence)
  - `pi_evidence` (id, action_id, file_url, note, ai_check_status, ai_check_reason, uploaded_by)
  - `pi_review_events` (id, entity_type, entity_id, reviewer_id, decision, note, timestamp)
  - `pi_audit_log` (id, entity_type, entity_id, action, previous_state, new_state, performed_by, notes, timestamp)
- [x] Enable pgvector extension and create HNSW vector index for `pi_document_chunks`
- [x] Configure Row Level Security (RLS) policies for all `pi_*` tables

**Exit Criteria:** Database schema fully migrated. Relational joins allow traversing from permit clause to asset, control, action, and review event. *(MET)*

---

### Phase 3: NorthRiver Refining Synthetic Dataset & Ground Truth
**Objective:** Populate the synthetic refinery with realistic, deterministic ground-truth data including the hero demo cases, historical exceedances, and distractors.

- [x] **Hero Case 1 Seed (Boiler B-07 NOx Tightening):**
  - Baseline requirement: 0.08 lb/MMBtu (24-hour rolling average)
  - Revised requirement: 0.05 lb/MMBtu (24-hour rolling average)
  - Associated equipment: Utility Boiler #7 (`B-07`), Utilities / Steam Plant
  - Seeded internal conflict 1: SOP-44 references obsolete 0.08 lb/MMBtu limit
  - Seeded internal conflict 2: DCS alarm threshold set to 0.075 lb/MMBtu (exceeds new limit)
  - Historical context: Simulated 6-month CEMS log showing 3 periods operating between 0.051 and 0.074 lb/MMBtu
- [x] **Hero Case 2 Seed (Cooling Tower CT-4 Monitoring Frequency):**
  - Baseline requirement: Monthly El Paso stripping column VOC sampling
  - Revised requirement: Every 14 days (bi-weekly) El Paso VOC sampling
  - Associated equipment: Mechanical Draft Cooling Tower #4 (`CT-4`)
  - Seeded internal conflict: Environmental calendar schedule & inspection form still set to monthly
- [x] **Seed Facility Model (20–30 Emission Units):**
  - Flares (`FL-1`), Fluid Catalytic Cracking Unit (`FCCU-1`), Sulfur Recovery (`SRU-2`), Crude Distillation (`CDU-1`), Storage Tanks (`TK-101`)
- [x] **Seed Internal Controls & SOPs (15–20 Documents):**
  - Standard Operating Procedures, Calculation Worksheets, Compliance Report Templates (e.g., `AIR-7`), Training Modules (`TR-12`)
- [x] **Seed Distractor Records (3+ Distractors):**
  - Semantically similar SOPs belonging to different equipment (e.g., Boiler B-02, Cooling Tower CT-1) to evaluate retrieval precision
- [x] **Seed 6–10 Refinery Personas & Owners:**
  - Environmental Engineers, Operations Managers, Instrument Techs, and Compliance Reviewers

**Exit Criteria:** Queries for `B-07` and `CT-4` return complete asset profiles, outdated controls, and clear conflict flags. *(MET)*

---

### Phase 4: Ingestion & Deterministic Delta Engine
**Objective:** Implement structured permit ingestion, clause extraction, and a deterministic comparison engine that never relies on LLM hallucination for numbers.

- [x] Ingestion server actions for raw permit text and metadata
- [x] PDF upload support using Supabase Storage and structured clause extraction
- [x] Clause normalization: Extract pollutant, limit value, unit, averaging period, cadence, and citation
- [x] Deterministic Diff Engine (TypeScript):
  - Numeric limit comparison (`old_value` vs `new_value`, % change, direction of stringency)
  - Frequency & cadence normalization (Monthly = 30d vs 14d = 53% frequency increase)
  - Averaging period analysis (e.g., 1-hour block vs 24-hour rolling)
- [x] AI Clause Classifier (Gemini flash model):
  - Categorize non-numeric shifts: Wording changes, applicability expansions, record retention, test method shifts
  - Severity scoring (`critical`, `moderate`, `low`) and confidence assessment
- [x] Structured extraction schema validation via Zod

**Exit Criteria:** Uploading or selecting Current vs. Revised permits outputs a verified change list with 100% deterministic accuracy on numeric deltas. *(MET — `npm run verify:phase4` passes G1–G4 & G6–G8 gating gates: 19 pairs/18 changes paired exactly, 8/8 numeric deltas accurate (values, direction, ≤1.0pp pct), 6/6 cadence matches, 18/18 change kinds, reconcile idempotent, storage roundtrip + PDF extraction verified. Classifier pinned to `gemini-3.8-flash` after `gemini-2.5-flash` was retired by the API; deterministic fallback covers outages.)*

---

### Phase 5: Facility Impact Resolution & Conflict Detection Engine
**Objective:** Connect identified permit deltas to physical refinery assets, identify downstream conflicts, and link internal documents.

- [x] Hierarchical retrieval: Metadata filtering first (asset tag, pollutant, unit) before semantic search to avoid cross-unit false positives
- [x] Vector similarity search using pgvector on chunked refinery SOPs and control descriptions
- [x] Downstream Conflict Detection:
  - SOP parameter mismatch (SOP value > new limit)
  - DCS alarm setpoint mismatch (alert threshold > new limit)
  - Inspection cadence mismatch (scheduled interval > permit mandated interval)
- [x] Historical monitoring correlation: Flag past operating excursions that would violate the new standard
- [x] Confidence scoring:
  - High: Direct asset tag match in permit clause
  - Medium: Equipment type & pollutant match with clear contextual link
  - Low: Facility-wide general provision requiring human determination
- [x] Citation enforcement: "No evidence, no claim" contract — every link cites permit page/section and document reference

**Exit Criteria:** Hero Case 1 immediately resolves Boiler B-07, flags SOP-44 and the DCS alert threshold, and generates traceable citations. *(MET — `npm run verify:phase5` passes G1–G8 gating gates: hero resolves B-07 tier=high (0.98) and 12/12 seeded asset mappings correct (ground truth from `pi_impact_mappings`); filtered retrieval returns only B-07 chunks incl. SOP-44 (top 0.8206) while the unfiltered query surfaces the B-02 distractor, proving metadata-first hierarchy; hero emits sop_parameter_mismatch (SOP-44 0.08) + alarm_setpoint_mismatch (DCS 0.075) vs 0.05 lb/MMBtu with SOP-44 §4.2/§5.1 quotes, CEMS excursions 0.074/0.063/0.058 correlated with the 0.08 baseline correctly excluded; CT-4 cadence flags SOP-31 + inspection form + 2024 calendar (training control excluded) all citable; low/medium confidence tiers behave as specced; persistence idempotent under RLS. Migration `pi_0012_phase5_facility_impact` adds `pi_conflicts` + `match_document_chunks` RPC (768-dim metadata-filtered); embeddings pinned to `outputDimensionality: 768`.)*

---

### Phase 6: Screen A & Screen B — Command Center & Change Detail UI
**Objective:** Deliver a state-of-the-art refinery compliance user experience with rich dark aesthetics, industrial clarity, and zero generic chatbot feel.

- [x] **Screen A (Command Center / Overview):**
  - KPI banner: Total changes, critical/moderate/low breakdown, unresolved actions count, AI confidence spread
  - Multi-dimensional filters: Filter by Asset/Unit, Pollutant (NOx, SO2, VOC), Severity, and Review Status
  - Interactive Change Register table with visual severity badges and quick navigation
- [x] **Screen B (Change Detail — The Core Experience):**
  - Side-by-side Clause Diff panel: Baseline vs. Revised text, highlighted numeric deltas, exact permit citation
  - AI Interpretation card: Summary, confidence percentage, rationale, and explicit assumption disclosure
  - Facility Impact panel: Matched asset details, operating context, and match explanation
  - Downstream Conflicts card: Direct visual comparison of permit limit vs. current SOP-44 and alarm threshold
  - Action items preview & interactive Human Review controls (Accept, Modify, Reject with reviewer notes)

**Exit Criteria:** *(MET — Verified: authenticated `/delta` (KPI banner + register + 4 filter groups) and `/delta/[id]` (clause diff, AI interpretation with assumptions, facility impact, downstream conflicts with SOP-44 + 0.075 alarm, implementation plan, review panel) both render 200; the review decision write (pi_review_events insert + pi_permit_changes status update) succeeds under RLS and was reverted to pristine demo state; added pi_review_events DELETE policy.)*

---

### Phase 7: Screen C — Facility Dependency Graph & Propagation View
**Objective:** Render the operational dependency tree showing how a single permit clause propagates through refinery assets, controls, procedures, and reports.

- [x] Interactive Tree / Graph component representing propagation hierarchy:
  ```
  Permit Clause 4.3.2 (NOx Limit)
    └─ Asset: Boiler B-07
        ├─ Control: CEMS-NOX-B07 (Analyzer Span)
        ├─ SOP: SOP-44 Boiler Operation (Outdated 0.08 limit)
        ├─ Calculation: Monthly NOx Balance Worksheet
        ├─ Training: TR-12 Boiler Operator Certification
        └─ Reporting: Compliance Form AIR-7
  ```
- [x] Conflict highlight styling: Nodes with active conflicts highlighted in amber/red, compliant nodes in emerald
- [x] Interactive node inspector: Click node to view parameter values, owner, and source document excerpt
- [x] Graph filtering by asset type, status, and department

**Exit Criteria:** *(MET — Verified: authenticated `/propagation` renders the full propagation hierarchy for all 18 permit changes (clause → assets → controls/SOPs/calculations/training/reporting + document evidence), conflict badges (SOP/DCS-alarm/cadence/excursion) with amber/red and emerald-compliant styling, a click-driven Node Inspector for clause/asset/dependency nodes, and asset-type/status/department filter pills; full server-rendered tree confirms nodes such as CEMS-NOX-B07, SOP-44 (0.08 vs 0.05), B-07 alarm 0.075, Monthly NOx Balance, TR-12, AIR-7. Added `/propagation` to the sidebar nav + a Propagation Graph CTA on the Facility Assets registry. One data-layer fix: the `pi_permit_changes → pi_permit_requirements` join needed the explicit `!new_requirement_id` FK hint (two-requirement FK ambiguity).)*

---

### Phase 8: Screen D — Implementation Register & Task Lifecycle
**Objective:** Provide a full-lifecycle remediation tracker for operational engineering tasks resulting from permit deltas.

- [x] Automated action proposal generation from detected conflicts (e.g., FGR O2 trim tuning, SOP revision, lab contract update)
- [x] Action attributes: Title, description, department, action type (calibration, procedural, hardware, monitoring), owner, due date, estimated cost, and status
- [x] Status workflow machine:
  `Proposed` ➔ `In Review` ➔ `In Progress` ➔ `Evidence Submitted` ➔ `Approved` / `Rejected`
- [x] Implementation Register view: Table & board view with status filtering, department grouping, and cost aggregation
- [x] Action editing drawer: Reassign owners, adjust deadlines, and edit mitigation steps

**Exit Criteria:** *(MET — Verified: `/actions` is now the Implementation Register. All 9 demo actions (7 proposed / 2 in review) are conflict-derived (linked to change_id/mapping_id), carry assigned pi_users owners, action types, calibrated budgets ($3.5K–$18K), and concrete deadlines (Oct 2026–Jan 2027, 5 dated + 4 backfilled before the 2027-01-15 planning anchor). The state machine ships as a shared workflow module (`app/actions/workflow.ts`) enforced both client- and server-side (`canTransition` guard in `updateActionStatus`; DB CHECK constraint limits status to the six states) — illegal transitions/states are rejected. Screen D UI: toggleable Table & Board views, status + department filter pills with live counts, department-grouped register rows with subtotals, aggregate budget/approved/overdue summary, an override-aware edit drawer (owner, deadline, mitigation steps) writing `ACTION_UPDATED` audit entries, and every transition persisted to `pi_audit_log`. Live smoke-verified: authenticated `/actions` renders all workflow columns/counts (Proposed (7), In Review (2)), department budget strip, owners, and drawer labels; unauth → redirect. Bonus: removed the legacy 5-state actions client, replacing it with the new register (clears pre-existing lint errors on that file).)*

---

### Phase 9: Interactive Evidence Verification & Human Sign-Off
**Objective:** Enable evidence attachment, run automated AI completeness checks, and enforce mandatory human approval before closure.

- [x] Evidence submission interface: Attach simulated test reports, revised SOP PDFs, calibration logs, and photos
- [x] Gemini AI Evidence Completeness Engine:
  - Validates whether submitted document addresses the specific change parameters (e.g., checks if uploaded SOP-44 reflects 0.05 lb/MMBtu)
  - Outputs structured verification: Status (`compliant`, `incomplete`, `inconclusive`), confidence, and specific reasoning
- [x] Critical Boundary Enforcement: The AI never auto-closes or auto-approves actions
- [x] Human Approval Gate: Certified Environmental Engineer or Compliance Manager must sign off with a reviewer note
- [x] State transition lock: Prevent action completion without human sign-off

**Exit Criteria:** *(MET — Verified: evidence attaches to actions via a submission drawer (document-type picker, "Fill draft with required value" template generator, `sim://` record refs), runs through the Gemini Evidence Completeness Engine (`lib/evidence-verifier.ts`: structured `{status, confidence, reasoning}` verdicts, JSON-mode Gemini with deterministic keyword fallback, schema-validated), and is approved/rejected only by a human reviewer. Live engine test with the real Gemini key returned `compliant (85%)` for all three seeded evidence packages (Revised SOP-44, CEMS calibration log, FGR O2 trim summary). Boundary enforcement: `updateActionStatus` blocks any transition to `approved` and any move out of `evidence_submitted` — the only path is the sign-off action; `reviewAction` requires a `canSignOff` role (Certified Environmental Engineer/Compliance Manager), a ≥4-char reviewer note, `status = evidence_submitted`, and ≥1 `compliant` evidence row (for approvals). Reviewer identity (`reviewed_by/reviewed_at/reviewer_note`) is persisted with the audit events `ACTION_APPROVED`/`ACTION_REJECTED`. Live smoke: `/actions` renders 200 with an evidence-submitted card exposing the "Review & Sign-Off" gate and per-row Evidence buttons; audit trail shows `ACTION_EVIDENCE_UPLOADED_COMPLIANT` + `ACTION_APPROVED` events with human sign-off notes. Demo funnel seeded with audited transitions: 2 approved (SOP-44, CEMS), 1 evidence-submitted pending sign-off (FGR), 2 in progress, 2 in review, 2 proposed. Two PostgREST fixes on the register query: `pi_permit_changes` columns are `summary`/`id` (no `citation`/`title`), and the new `reviewed_by` FK made the `owner` embed ambiguous → explicit `!owner_id` hint.)*

---

### Phase 10: Comprehensive Audit Trail, Evaluation & Demo Verification
**Objective:** Ensure full regulatory auditability, validate against quantitative evaluation targets, and deliver a seamless 5-minute hero demo.

- [x] Comprehensive Audit Trail Page (`/audit`):
  - Immutable timeline recording every extraction, comparison, status change, evidence check, and human approval
  - Before/after JSON snapshots of modified entities
  - Filter by entity type, user persona, and timestamp
- [x] Quantitative Evaluation Suite:
  - Requirement extraction recall (target ≥ 90%)
  - Numeric delta accuracy (target 100%)
  - Hero case asset mapping precision (target 100%)
  - Deliberately seeded conflict detection (target ≥ 90%)
  - Unsupported claim rate on high-impact items (target 0%)
- [x] Five-Minute Demo Script Readiness (Section 16 Definition of Done):
  1. Open NorthRiver Refining dashboard
  2. Select Baseline vs. Revised Permit
  3. View ranked change register
  4. Inspect Boiler B-07 NOx change detail & citations
  5. Trace propagation in Facility Graph
  6. Review downstream conflict with SOP-44 & alarm threshold
  7. Inspect generated implementation action
  8. Submit simulated evidence & view AI completeness check
  9. Execute human approval sign-off
  10. Verify complete path in the Audit Trail
- [x] Design polish: Rich dark mode palette, smooth transitions, responsive layout, clear error states

**Exit Criteria:** Full 13-step demo executed without errors or presenter apologies. All acceptance criteria from Section 14 met.
**Exit Criteria MET:** `/audit` ships an append-only SHA-256 hash chain (seq backfill + verify via `pi_audit_verify_chain`; UPDATE/DELETE blocked by `pi_audit_immutable` trigger) with filters by entity type/persona/timestamp and CSV export; before/after JSON snapshots render per event. `npm run verify:phase10` → **ALL GATES PASS**: extraction_recall 100% (18/18), delta_accuracy 100% (8/8), mapping_precision 100% (12/12), conflict_recall 100% (7/7), unsupported_claim 0% (5/5), chain intact (13 events, 0 mismatches), append-only guard verified. All 10 demo steps exercised end-to-end; dashboard hero cards corrected to real seeded data (0.080→0.050 lb/MMBtu, 14-day cadence) and now include the live Quantitative Evaluation Scorecard. Design polish pass applied; full 13-route smoke green (all protected 200, unauth 307→/login).

---

## 📌 Implementation Protocol

1. **Step-by-Step Discipline:** Work through one phase at a time. No rushing or premature declarations of completion.
2. **Quality Over Speed:** Every screen must look premium, feel responsive, and accurately reflect petrochemical plant operations.
3. **No Hallucinated Compliance:** Deterministic logic handles numbers and dates; AI handles natural language synthesis and contextual reasoning.
4. **Interactive Tracking:** Update this `PHASES.md` document at each phase milestone.
