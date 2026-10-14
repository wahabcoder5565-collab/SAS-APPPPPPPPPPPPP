/**
 * The PermitImpact AI business-process workflow, expressed as data.
 *
 * This is the single source of truth for the homepage "One change. Every
 * connected impact." explorer. Every displayed figure is defined here once so
 * the graph stages, the detail panel, and the hero preview cannot drift apart.
 *
 * The walkthrough follows one concrete example: a revised permit tightens the
 * NOx limit for Boiler B-07 from 0.080 to 0.050 lb/MMBtu.
 */

export type WorkflowIcon = "input" | "detect" | "map" | "actions" | "review";

export type FactTone = "default" | "change" | "warn" | "ok";

export type WorkflowFact = {
  label: string;
  value: string;
  tone?: FactTone;
};

export type WorkflowRecord = {
  code: string;
  label: string;
  note: string;
};

export type WorkflowAction = {
  title: string;
  status: "Needs Review" | "Pending Approval" | "Approved";
};

export type WorkflowStage = {
  id: string;
  step: string;
  title: string;
  nodeLabel: string;
  description: string;
  icon: WorkflowIcon;
  facts: WorkflowFact[];
  records?: WorkflowRecord[];
  actions?: WorkflowAction[];
  chain?: string[];
  note: string;
};

/** Canonical values for the flagship example, referenced by the hero preview. */
export const EXAMPLE = {
  asset: "Boiler B-07",
  assetLong: "Utility Boiler #7",
  pollutant: "NOx",
  averagingPeriod: "24-hour rolling average",
  oldLimit: "0.080 lb/MMBtu",
  newLimit: "0.050 lb/MMBtu",
  changePct: "37.5%",
  changeLabel: "37.5% tighter limit",
  severity: "Critical",
} as const;

export const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    id: "documents",
    step: "01",
    title: "Document input",
    nodeLabel: "Document input",
    description: "Bring the original and revised requirements into one review.",
    icon: "input",
    facts: [
      {
        label: "Original permit",
        value: `${EXAMPLE.oldLimit} · Condition 12.A (T-V-2021-R2)`,
      },
      {
        label: "Revised permit",
        value: `${EXAMPLE.newLimit} · Draft §4.2.1 (T-V-2024-REV, p.114)`,
        tone: "change",
      },
      {
        label: "Comparison",
        value: "Two versions aligned clause-by-clause",
      },
    ],
    note: "Source excerpts and their condition references sit next to the comparison, so every later finding can be traced back to the document it came from.",
  },
  {
    id: "detect",
    step: "02",
    title: "Change detection",
    nodeLabel: "Detect changes",
    description: "Identify what changed and how significant it is.",
    icon: "detect",
    facts: [
      { label: "Extracted condition", value: `${EXAMPLE.pollutant} · ${EXAMPLE.averagingPeriod}` },
      { label: "Old limit", value: EXAMPLE.oldLimit },
      { label: "New limit", value: EXAMPLE.newLimit, tone: "change" },
      { label: "Detected change", value: EXAMPLE.changeLabel, tone: "warn" },
      { label: "Classification", value: EXAMPLE.severity, tone: "warn" },
    ],
    note: "AI can assist with extracting and normalizing the clause, but the arithmetic itself is a separate, deterministic step — the model never decides the numbers.",
  },
  {
    id: "map",
    step: "03",
    title: "Dependency mapping",
    nodeLabel: "Map dependencies",
    description: "Connect the change to affected equipment and internal records.",
    icon: "map",
    facts: [
      {
        label: "Affected asset",
        value: `${EXAMPLE.asset} — ${EXAMPLE.assetLong}`,
        tone: "change",
      },
      { label: "Mapping basis", value: "Asset tag and pollutant match" },
    ],
    records: [
      { code: "SOP-44", label: "Operating procedure", note: "Still cites the old 0.080 limit" },
      { code: "DCS alarm", label: "Alarm setpoint", note: "Configured to 0.075 lb/MMBtu" },
      { code: "CEMS", label: "Monitoring record", note: "Span / calibration register" },
    ],
    note: "The application works with related operational data — equipment, procedures and monitoring controls — not just document text.",
  },
  {
    id: "actions",
    step: "04",
    title: "Review actions",
    nodeLabel: "Prepare actions",
    description: "Turn findings into assigned, reviewable tasks.",
    icon: "actions",
    facts: [
      { label: "Findings converted", value: "3 structured action records", tone: "change" },
      { label: "Evidence", value: "Each action links back to its source finding" },
    ],
    actions: [
      { title: "Update operating procedure (SOP-44)", status: "Needs Review" },
      { title: "Review DCS alarm configuration", status: "Pending Approval" },
      { title: "Assess equipment tuning requirements", status: "Needs Review" },
    ],
    note: "Findings become structured records with an owner, a status and evidence references, instead of being left in a document.",
  },
  {
    id: "review",
    step: "05",
    title: "Human review & audit",
    nodeLabel: "Human review",
    description: "Keep decisions reviewable and changes traceable.",
    icon: "review",
    facts: [
      { label: "Review gate", value: "Engineering approval required", tone: "warn" },
      { label: "Audit record", value: "Origin and progression captured per finding" },
    ],
    chain: [
      "Source requirement",
      "Linked equipment",
      "Review action",
      "Approval state",
      "Audit record",
    ],
    note: "The system supports human decisions. It does not make regulatory or engineering decisions on its own — approval is always an explicit human step.",
  },
];
