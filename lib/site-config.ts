/**
 * Central site configuration.
 *
 * Identity values are real. Only links that genuinely exist are listed: an email
 * address is provided, and no placeholder LinkedIn / GitHub / repository URLs are
 * fabricated. If a real profile is added later, extend `links` and the components
 * that read it will render the extra buttons automatically.
 */

export const DEVELOPER = {
  name: "Wahab",
  brand: "Wahab / Engineering",
  title: "Full-Stack Developer",
  positioning: "Full-Stack Development & AI Workflow Engineering",
  valueProp: "Custom software built around real business problems.",
  availability:
    "Open to software engineering opportunities and selected custom projects.",
  summary:
    "I design and build full-stack applications that connect data, automate repetitive work, and make complicated business processes easier to manage.",
  bio: [
    "I'm Wahab, a full-stack developer focused on building practical web applications, data-driven tools, and AI-assisted workflows.",
    "I enjoy turning complicated requirements into usable interfaces and connecting the frontend, application logic, and underlying data into working systems.",
    "PermitImpact AI is an independent project demonstrating my approach to solving a technically complex business problem.",
  ],
  opportunity:
    "Open to software engineering roles, technical collaborations, and custom development discussions.",
  links: {
    email: "wahabcoder5565@gmail.com",
  },
} as const;

export const CONTACT = {
  topics: [
    "software engineering opportunities",
    "product collaborations",
    "AI-assisted business workflow projects",
  ],
} as const;

export const SYNTHETIC_DATA_DISCLOSURE =
  "Built as an independent engineering demonstration using synthetic facility data. No real refinery deployment, customer engagement, or regulatory certification is implied.";

export const DEMO_DISCLOSURE =
  "NorthRiver Refining is a synthetic demonstration environment. Permit values, CEMS history, budgets, and personnel are fabricated to exercise the workflow and are not real regulatory or operational records.";

/** Human-readable pipeline actually implemented in the repository. */
export const ARCHITECTURE_PIPELINE = [
  {
    step: "Document Inputs",
    detail: "Baseline and revised permit text (paste or PDF via unpdf).",
    module: "app/permits/actions.ts",
  },
  {
    step: "Parsing & Validation",
    detail: "Clause normalization + Zod schema validation.",
    module: "lib/normalize.ts · lib/schemas.ts",
  },
  {
    step: "Condition Extraction",
    detail: "Pollutant, limit, unit, averaging period, cadence, citation.",
    module: "app/permits/actions.ts · lib/gemini.ts",
  },
  {
    step: "Change Detection",
    detail: "Deterministic numeric/cadence diff (never LLM for numbers).",
    module: "lib/diff.ts",
  },
  {
    step: "Asset Relationship Mapping",
    detail: "Metadata-first retrieval + pgvector similarity, 3 confidence tiers.",
    module: "lib/retrieve.ts",
  },
  {
    step: "Conflict Detection",
    detail: "SOP / DCS alarm / cadence mismatches with enforced citations.",
    module: "lib/conflicts.ts",
  },
  {
    step: "Review Workflow",
    detail: "Six-state action lifecycle with human sign-off gate.",
    module: "app/actions/actions.ts · app/actions/workflow.ts",
  },
  {
    step: "Audit Events",
    detail: "Append-only SHA-256 hash chain, DB-trigger enforced.",
    module: "app/(protected)/audit · pi_audit_log",
  },
] as const;

/** Real technology choices and what each is responsible for. */
export const TECH_STACK = [
  {
    name: "Next.js 16 (App Router, TypeScript)",
    role: "Full-stack application framework: server components for data views, server actions for mutations, `proxy.ts` for session refresh and route protection.",
    why: "Collocates data access and UI, avoids a separate API layer for an internal workflow tool, and gives server-side route protection.",
  },
  {
    name: "Supabase (Postgres, Auth, RLS, Storage, pgvector)",
    role: "Authoritative relational schema in a `pi_` namespace, row-level security on every table, session auth for the four demo personas, and 768-dim vector search over procedure/control chunks.",
    why: "Managed Postgres with first-class RLS let role scoping live in the database rather than only in the UI.",
  },
  {
    name: "Google Gemini (@google/genai)",
    role: "Natural-language clause classification and evidence-completeness verification. Numbers are never delegated to the model.",
    why: "Structured extraction and reasoning over prose; every model call has a deterministic fallback so the workflow degrades safely.",
  },
  {
    name: "Tailwind CSS v4",
    role: "Industrial UI styling across the marketing surface and the workspace.",
    why: "Fast, consistent styling without a component-library dependency.",
  },
  {
    name: "Zod",
    role: "Runtime validation of model output and server-action input.",
    why: "Prevents malformed AI output or user input from reaching the database.",
  },
  {
    name: "unpdf",
    role: "Server-side PDF text extraction for permit uploads.",
    why: "Dependency-free text extraction suitable for the serverless runtime.",
  },
] as const;

/** Entities that actually exist in the database. */
export const DATA_MODEL = [
  { table: "pi_permits", role: "Baseline / revised permit documents" },
  { table: "pi_permit_sections", role: "Citations and page ranges" },
  { table: "pi_permit_requirements", role: "Normalized clauses (pollutant, limit, unit, cadence)" },
  { table: "pi_comparisons", role: "A baseline↔revised comparison run" },
  { table: "pi_permit_changes", role: "Detected deltas with severity + review status" },
  { table: "pi_facility_assets", role: "Emission units and equipment" },
  { table: "pi_controls", role: "SOPs, CEMS, DCS alarms, reports attached to assets" },
  { table: "pi_documents", role: "Internal procedures, forms, training, calendars" },
  { table: "pi_document_chunks", role: "Chunked, embedded document text (pgvector)" },
  { table: "pi_impact_mappings", role: "Change → asset impact with confidence + human-review flag" },
  { table: "pi_conflicts", role: "Detected internal conflicts with citations" },
  { table: "pi_implementation_actions", role: "Reviewable remediation tasks + workflow state" },
  { table: "pi_evidence", role: "Submitted evidence with AI completeness verdict" },
  { table: "pi_review_events", role: "Human review decisions on a change" },
  { table: "pi_audit_log", role: "Append-only, hash-chained event history" },
  { table: "pi_eval_ground_truth", role: "Evaluation fixtures for the scorecard" },
] as const;

/**
 * Development history reconstructed from the phase tracker (PHASES.md) and the
 * applied database migrations. Dates are the real migration timestamps.
 */
export const CHANGELOG = [
  { date: "2026-10-06", title: "Project scaffolding", detail: "Next.js 16 + TypeScript + Tailwind foundation and Supabase SSR auth." },
  { date: "2026-10-06", title: "Relational schema (pi_0001–pi_0004)", detail: "Section 9 schema with pgvector HNSW index and RLS policies." },
  { date: "2026-10-06", title: "Synthetic facility dataset (pi_0006–pi_0010)", detail: "20+ emission units, controls/SOPs, personas, ground-truth changes, relationships." },
  { date: "2026-10-06", title: "Deterministic delta engine (pi_0011)", detail: "Numeric, cadence, averaging and retention diffing; classifier fallback." },
  { date: "2026-10-06", title: "Facility impact engine (pi_0012)", detail: "Metadata-first retrieval, conflict detection, match_document_chunks RPC." },
  { date: "2026-10-07", title: "Workflow + evidence (pi_action_workflow_state_machine / pi_evidence_verification_extensions)", detail: "Six-state action machine, human sign-off gate, AI evidence completeness check." },
  { date: "2026-10-07", title: "Audit hash chain (phase10_audit_hash_chain)", detail: "Append-only SHA-256 chain with verify RPC and immutability trigger." },
  { date: "2026-10-07", title: "Evaluation fixtures (phase10_eval_ground_truth)", detail: "Ground-truth KPIs backing the live evaluation scorecard." },
] as const;

export const VERIFICATION_COMMANDS = [
  { command: "npm run verify:phase4", covers: "Deterministic delta engine: pairing, numeric deltas, cadence, idempotency, storage roundtrip." },
  { command: "npm run verify:phase5", covers: "Asset resolution, conflict detection, citation integrity, confidence tiers." },
  { command: "npm run verify:phase10", covers: "Evaluation KPIs vs ground truth and audit-chain integrity." },
  { command: "npm run verify:e2e", covers: "Seeded demo funnel, route smoke, review-event counts." },
] as const;

export const LIMITATIONS = {
  implemented: [
    "Deterministic numeric/cadence delta engine over structured clauses.",
    "Relational asset/control/conflict mapping with enforced citations.",
    "Six-state implementation workflow with a human sign-off gate.",
    "Append-only, hash-chained audit log verified by a database function.",
    "Role-based demo personas backed by Supabase Auth + RLS.",
  ],
  simulated: [
    "The permit corpus is a prepared benchmark dataset; arbitrary uploaded PDFs are not processed end-to-end.",
    "Evidence 'attachments' are text records (sim:// references), not real file storage uploads.",
    "Budgets, personnel, and CEMS history are fabricated fixtures.",
    "The Gemini model is real, but every AI call has a deterministic fallback used when the API is unavailable.",
  ],
  planned: [
    "Real multi-tenant document ingestion pipeline with per-facility isolation.",
    "Actual evidence file storage and virus/type validation.",
    "Scheduled re-evaluation when a source permit changes.",
    "Additional conflict types (record-retention, test-method drift).",
  ],
} as const;

/** The flagship end-to-end demonstration path. */
export const FLAGSHIP = {
  title: "Boiler B-07 — NOx limit tightening",
  steps: [
    { label: "Source documents", detail: "Baseline T-V-2021-R2 §IV.B.1 (0.080) vs revised T-V-2024-REV §IV.B.1 (0.050).", route: "/permits" },
    { label: "Detected change", detail: "37.5% reduction on a 24-hour rolling average, flagged critical.", route: "/delta" },
    { label: "Asset impact", detail: "Utility Boiler #7 mapped at high confidence with CEMS history.", route: "/impacts" },
    { label: "Dependency trace", detail: "Clause → B-07 → CEMS-NOX-B07, SOP-44, DCS alarm 0.075.", route: "/propagation" },
    { label: "Review action", detail: "FGR O2 trim task with owner, budget, evidence, and sign-off gate.", route: "/actions" },
    { label: "Audit record", detail: "Every status change is a hash-chained audit event.", route: "/audit" },
  ],
} as const;

export const NAV_LINKS = [
  { href: "/#work", label: "Work" },
  { href: "/#workflow", label: "How It Works" },
  { href: "/engineering", label: "Engineering" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
] as const;
