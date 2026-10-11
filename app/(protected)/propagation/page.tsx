import { createClient } from "@/lib/supabase/server";
import type { ClauseNode, ChangeTree, ChildNode, ConflictLite } from "./types";
import PropagationGraph from "./propagation-graph";

interface RequirementLiteRow {
  citation: string | null;
  section: string | null;
  page: number | null;
  pollutant: string | null;
  parameter: string | null;
  limit_value: number | null;
  unit: string | null;
  averaging_period: string | null;
}

interface ChangeRow {
  id: string;
  severity: string;
  review_status: string;
  summary: string;
  old_value: string | null;
  new_value: string | null;
  confidence: number | null;
  new_requirement: RequirementLiteRow | RequirementLiteRow[] | null;
}

interface AssetRow {
  id: string;
  asset_code: string;
  name: string | null;
  area: string | null;
  asset_type: string | null;
  capacity: string | null;
  is_bottleneck: boolean;
}

interface MappingRow {
  change_id: string;
  asset_id: string;
  impact_type: string | null;
  risk_level: string | null;
  confidence_score: number | null;
  technical_analysis: string | null;
  asset: AssetRow | AssetRow[] | null;
}

interface ControlRow {
  id: string;
  asset_id: string;
  control_type: string;
  name: string;
  value: string | null;
  unit: string | null;
  source_document_id: string | null;
  source_document: {
    id: string;
    title: string | null;
    document_type: string | null;
    version: string | null;
  } | null;
}

interface ConflictRow {
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
}

interface ActionRow {
  id: string;
  change_id: string;
  title: string;
  department: string | null;
  action_type: string | null;
  status: string | null;
  estimated_cost: number | null;
}

function asOne<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function castRows<T>(value: unknown): T[] {
  return (value ?? []) as unknown as T[];
}

export default async function PropagationPage() {
  const supabase = await createClient();

  const { data: comparison } = await supabase
    .from("pi_comparisons")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: changes } = await supabase
    .from("pi_permit_changes")
    .select(`
      id, severity, review_status, summary, old_value, new_value, confidence,
      new_requirement:pi_permit_requirements!new_requirement_id (
        citation, section, page, pollutant, parameter, limit_value, unit, averaging_period
      )
    `)
    .eq("comparison_id", comparison?.id ?? "")
    .order("created_at", { ascending: true });

  const changeIds = (changes ?? []).map((c) => c.id);

  const [{ data: mappings }, { data: controls }, { data: conflicts }, { data: actions }] =
    await Promise.all([
      supabase
        .from("pi_impact_mappings")
        .select(`
          change_id, asset_id, impact_type, risk_level, confidence_score, technical_analysis,
          asset:pi_facility_assets (id, asset_code, name, area, asset_type, capacity, is_bottleneck)
        `)
        .in("change_id", changeIds),
      supabase
        .from("pi_controls")
        .select(`
          id, asset_id, control_type, name, value, unit,
          source_document_id,
          source_document:pi_documents (id, title, document_type, version)
        `)
        .order("name"),
      supabase
        .from("pi_conflicts")
        .select(
          `id, change_id, asset_id, control_id, document_id, conflict_type, summary, permit_value, control_value, unit, citation`
        )
        .in("change_id", changeIds),
      supabase
        .from("pi_implementation_actions")
        .select("id, change_id, title, department, action_type, status, estimated_cost")
        .in("change_id", changeIds),
    ]);

  const conflictDocIds = [
    ...new Set(
      (conflicts ?? [])
        .map((c) => c.document_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const { data: conflictDocs } = await supabase
    .from("pi_documents")
    .select("id, title, document_type, version")
    .in("id", conflictDocIds);

  const docMap = new Map<string, { id: string; title: string | null; document_type: string | null; version: string | null }>();
  castRows<{ id: string; title: string | null; document_type: string | null; version: string | null }>(
    conflictDocs
  ).forEach((d) => docMap.set(d.id, d));

  const byControl = new Map<string, ConflictLite[]>();
  const byDocument = new Map<string, ConflictLite[]>();
  castRows<ConflictRow>(conflicts).forEach((c) => {
    const lite: ConflictLite = {
      conflictType: c.conflict_type,
      summary: c.summary,
      permitValue: c.permit_value,
      controlValue: c.control_value,
      unit: c.unit,
    };
    if (c.control_id) {
      const list = byControl.get(c.control_id);
      if (list) list.push(lite);
      else byControl.set(c.control_id, [lite]);
    }
    if (c.document_id) {
      const list = byDocument.get(c.document_id);
      if (list) list.push(lite);
      else byDocument.set(c.document_id, [lite]);
    }
  });

  const controlsByAsset = new Map<string, ControlRow[]>();
  castRows<ControlRow>(controls).forEach((c) => {
    const list = controlsByAsset.get(c.asset_id);
    if (list) list.push(c);
    else controlsByAsset.set(c.asset_id, [c]);
  });

  const trees: ChangeTree[] = castRows<ChangeRow>(changes).map((ch) => {
    const req = asOne<RequirementLiteRow>(ch.new_requirement);
    const clause: ClauseNode = {
      citation: req?.citation ?? null,
      section: req?.section ?? null,
      page: req?.page ?? null,
      pollutant: req?.pollutant ?? null,
      parameter: req?.parameter ?? null,
      limitValue: req?.limit_value ?? null,
      unit: req?.unit ?? null,
      averagingPeriod: req?.averaging_period ?? null,
    };

    const changeMappings = castRows<MappingRow>(mappings).filter((m) => m.change_id === ch.id);
    const changeConflicts = castRows<ConflictRow>(conflicts).filter((c) => c.change_id === ch.id);

    const assets = changeMappings
      .map((m) => {
        const asset = asOne<AssetRow>(m.asset);
        if (!asset) return null;

        const children: ChildNode[] = (controlsByAsset.get(asset.id) ?? []).map((ctrl) => {
          const ctrlConflicts: ConflictLite[] = [
            ...(byControl.get(ctrl.id) ?? []),
            ...(ctrl.source_document_id ? (byDocument.get(ctrl.source_document_id) ?? []) : []),
          ];
          return {
            id: ctrl.id,
            kind: "control" as const,
            controlType: ctrl.control_type,
            label: ctrl.name,
            subtitle:
              ctrl.value && ctrl.unit
                ? `${ctrl.value} ${ctrl.unit}`
                : (ctrl.value ?? null),
            sourceDocId: ctrl.source_document_id ?? null,
            docTitle: ctrl.source_document?.title ?? null,
            docType: ctrl.source_document?.document_type ?? null,
            docVersion: ctrl.source_document?.version ?? null,
            conflicts: ctrlConflicts,
          };
        });

        const sourceDocIds = new Set(
          children.map((c) => c.sourceDocId).filter((id): id is string => Boolean(id))
        );

        for (const c of changeConflicts) {
          if (c.asset_id === asset.id && c.document_id && !sourceDocIds.has(c.document_id)) {
            const doc = docMap.get(c.document_id);
            const docConflicts = [
              ...(byDocument.get(c.document_id) ?? []),
            ];
            children.push({
              id: `doc-${c.document_id}`,
              kind: "document" as const,
              controlType: "document",
              label: doc?.title ?? "Evidence document",
              subtitle: c.summary,
              sourceDocId: c.document_id,
              docTitle: doc?.title ?? null,
              docType: doc?.document_type ?? null,
              docVersion: doc?.version ?? null,
              conflicts: docConflicts,
            });
          }
        }

        return {
          id: asset.id,
          assetCode: asset.asset_code,
          name: asset.name,
          area: asset.area,
          assetType: asset.asset_type,
          capacity: asset.capacity,
          isBottleneck: asset.is_bottleneck,
          impactType: m.impact_type,
          riskLevel: m.risk_level,
          impactConfidence: m.confidence_score ? Number(m.confidence_score) : null,
          technicalAnalysis: m.technical_analysis,
          children,
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);

    const changeActions = castRows<ActionRow>(actions).filter((a) => a.change_id === ch.id);

    return {
      changeId: ch.id,
      summary: ch.summary,
      severity: ch.severity,
      reviewStatus: ch.review_status,
      oldValue: ch.old_value,
      newValue: ch.new_value,
      confidence: ch.confidence ? Number(ch.confidence) : null,
      clause,
      assets,
      actions: changeActions.map((a) => ({
        id: a.id,
        title: a.title,
        department: a.department,
        actionType: a.action_type,
        status: a.status,
        cost: a.estimated_cost ? Number(a.estimated_cost) : null,
      })),
    };
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/50 text-cyan-400 text-xs font-semibold mb-2">
            Screen C · Facility Dependency Graph
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Permit Change Propagation View
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            How each revised permit clause propagates through facility assets, controls, SOPs,
            calculations, training, and compliance reporting.
          </p>
        </div>
      </div>

      <PropagationGraph trees={trees} />
    </div>
  );
}