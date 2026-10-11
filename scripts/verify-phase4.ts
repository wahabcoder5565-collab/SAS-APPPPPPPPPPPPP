/**
 * Phase 4 verification: deterministic delta engine vs frozen ground truth.
 *
 * Gates:
 *  G1 pairing      — engine reproduces exactly the 18 seeded change pairs
 *                    (by old/new requirement id) out of 19 clause pairs,
 *                    with the NHV clause pair unchanged.
 *  G2 numeric      — 100% accuracy on numeric deltas: values match seed
 *                    old/new numbers, direction correct, and |delta_pct|
 *                    within 1.0pp of the seeded delta text percentages.
 *  G3 cadence      — frequency pairs: engine display values appear in seed
 *                    values, pct within 1.0pp where the seed quotes one.
 *  G4 kinds        — deterministic change_kind for all 18 pairs.
 *  G5 severity     — informational: seeded vs rule-based severity match rate.
 *  G6 reconcile    — a re-run of the hero comparison would insert 0 and
 *                    update 0 rows (curated seed is numerically consistent).
 *  G7 storage      — authenticated upload/get/delete roundtrip in pi-documents.
 *  G8 pdf          — unpdf text extraction on a generated one-page PDF.
 *  G9 classifier   — optional live Gemini flash classification (non-gating).
 */
import { existsSync, readFileSync } from "node:fs";
import { diffRequirements } from "../lib/diff";
import type { RequirementRowInput } from "../lib/normalize";
import { classifyClauseChange } from "../lib/classifier";

for (const envFile of [".env.local", ".env"]) {
  if (!existsSync(envFile)) continue;
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const EMAIL = "demo.engineer@northriverrefining.com";
const PASSWORD = "DemoPassword123!";
const CURRENT_ID = "aae7f064-897b-4959-a8b4-d5e7f148a8c0";
const REVISED_ID = "3941845c-99ea-4a4b-82f1-90cfb0ef3c49";
const SEED_COMPARISON_ID = "fb2f728e-d500-4c59-9789-1a77394d3cba";
const NHV_OLD_ID = "3aec4b16-5e4c-4f8d-85ef-f15547fe2a6f";
const NHV_NEW_ID = "894f8e62-b885-4793-b646-267e2db22476";

const EXPECTED_KIND: Record<string, string> = {
  "011e551f-7600-4290-f81a-66941edcf612": "frequency",
  "e738199d-c9f9-4333-b1a8-fcab133cdf13": "numeric_limit",
  "0b0bbfa5-2070-4ecb-8526-fc8d287315bb": "numeric_limit",
  "4b47cd1e-5140-5cb0-7121-049aad220c72": "numeric_limit",
  "52f77115-84f7-5473-4380-94715cd4cfc3": "numeric_limit",
  "e2985a3b-9620-8fc9-05fc-b7eb548a4d97": "numeric_limit",
  "4e6d6ecd-8746-0cde-1e2c-2c0e6014df76": "numeric_limit",
  "54479643-5239-9ac1-54d3-ae2a6350b15e": "numeric_limit",
  "9ffd6365-71f2-e0b5-8698-8d53fb19e702": "frequency",
  "86e69b1a-6c71-4902-a2e2-9e8b34368ace": "frequency",
  "097a2ec2-d7d4-6cd8-5864-2ef0a8892b60": "frequency",
  "c3b905bc-7bfe-f994-ba3f-c00ca27fbbe6": "frequency",
  "f7e9a4f9-f3a2-4176-4ecb-d36dc0c64248": "numeric_limit",
  "b4d3036d-4740-2e8a-0286-34d61da597ff": "record_retention",
  "ee804065-d7f0-4383-d229-cb44865fce1f": "frequency",
  "1543486f-5f93-22f4-2e6d-19c5b3bfb642": "reporting",
  "65737918-e763-6df0-8057-2c5eb97871eb": "administrative",
  "cca5d74c-f356-9b08-1e19-d20fb4c45876": "method",
};

const EXPECTED_SIGN: Record<string, "down" | "up"> = {
  "e738199d-c9f9-4333-b1a8-fcab133cdf13": "down",
  "0b0bbfa5-2070-4ecb-8526-fc8d287315bb": "down",
  "4b47cd1e-5140-5cb0-7121-049aad220c72": "down",
  "52f77115-84f7-5473-4380-94715cd4cfc3": "down",
  "e2985a3b-9620-8fc9-05fc-b7eb548a4d97": "down",
  "4e6d6ecd-8746-0cde-1e2c-2c0e6014df76": "down",
  "54479643-5239-9ac1-54d3-ae2a6350b15e": "down",
  "f7e9a4f9-f3a2-4176-4ecb-d36dc0c64248": "up",
};

interface SeedChange {
  old_requirement_id: string;
  new_requirement_id: string;
  change_type: string;
  severity: string;
  old_value: string | null;
  new_value: string | null;
  delta_description: string;
  summary: string;
}

interface GateResult {
  name: string;
  passed: boolean;
  detail: string;
  gating: boolean;
}

const results: GateResult[] = [];

function gate(name: string, passed: boolean, detail: string, gating = true) {
  results.push({ name, passed, detail, gating });
}

function firstNumber(v?: string | null): number | null {
  if (!v) return null;
  const m = v.match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

function firstPct(v: string): number | null {
  const m = v.match(/(\d+(?:\.\d+)?)\s*%/);
  return m ? parseFloat(m[1]) : null;
}

function pairKeyOf(c: {
  old_requirement_id: string | null;
  new_requirement_id: string | null;
}): string {
  return `${c.old_requirement_id}|${c.new_requirement_id}`;
}

async function rest(path: string, token: string, init: RequestInit = {}) {
  return fetch(`${URL_BASE}${path}`, {
    ...init,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
}

function buildPdf(text: string): Uint8Array {
  const escaped = text.replace(/([()\\])/g, "\\$1");
  const content = `BT /F1 18 Tf 40 700 Td (${escaped}) Tj ET`;
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const startxref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

async function main() {
  if (!URL_BASE || !ANON_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
    process.exit(1);
  }

  console.log("== Phase 4 verification: deterministic delta engine ==\n");

  // Auth
  const loginRes = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!loginRes.ok) {
    console.error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    process.exit(1);
  }
  const { access_token: token } = (await loginRes.json()) as { access_token: string };

  // Data
  const oldRows = (await (
    await rest(
      `/rest/v1/pi_permit_requirements?permit_id=eq.${CURRENT_ID}&select=*`,
      token,
    )
  ).json()) as RequirementRowInput[];
  const newRows = (await (
    await rest(
      `/rest/v1/pi_permit_requirements?permit_id=eq.${REVISED_ID}&select=*`,
      token,
    )
  ).json()) as RequirementRowInput[];
  const seedChanges = (await (
    await rest(
      `/rest/v1/pi_permit_changes?comparison_id=eq.${SEED_COMPARISON_ID}&select=*`,
      token,
    )
  ).json()) as SeedChange[];

  const result = diffRequirements(oldRows, newRows);
  const changed = result.changes;
  const unchanged = result.pairs.filter((p) => p.change.change_type === "unchanged");
  const engineByKey = new Map(changed.map((c) => [pairKeyOf(c), c]));
  const seedByKey = new Map(seedChanges.map((c) => [pairKeyOf(c), c]));

  // G1 — pairing
  const missing = [...seedByKey.keys()].filter((k) => !engineByKey.has(k));
  const extra = [...engineByKey.keys()].filter((k) => !seedByKey.has(k));
  const nhvUnchanged =
    unchanged.length === 1 &&
    unchanged[0].old?.id === NHV_OLD_ID &&
    unchanged[0].new?.id === NHV_NEW_ID;
  gate(
    "G1 pairing",
    result.pairs.length === 19 &&
      missing.length === 0 &&
      extra.length === 0 &&
      changed.length === 18 &&
      nhvUnchanged,
    `pairs=${result.pairs.length} changed=${changed.length} unchanged=${unchanged.length} (NHV unchanged: ${nhvUnchanged}) missing=${missing.length} extra=${extra.length}`,
  );

  // G2 — numeric accuracy
  const numericProblems: string[] = [];
  let numericChecked = 0;
  for (const seed of seedChanges) {
    const engine = engineByKey.get(pairKeyOf(seed));
    if (!engine || engine.change_kind !== "numeric_limit") continue;
    numericChecked += 1;
    const sOld = firstNumber(seed.old_value);
    const sNew = firstNumber(seed.new_value);
    const eOld = firstNumber(engine.old_value);
    const eNew = firstNumber(engine.new_value);
    const id = seed.old_requirement_id.slice(0, 8);
    if (sOld === null || sNew === null || eOld === null || eNew === null) {
      numericProblems.push(`${id}: unparsable values`);
      continue;
    }
    if (Math.abs(sOld - eOld) > 1e-9 || Math.abs(sNew - eNew) > 1e-9) {
      numericProblems.push(
        `${id}: value mismatch engine ${eOld}->${eNew} vs seed ${sOld}->${sNew}`,
      );
      continue;
    }
    const expectedSign = EXPECTED_SIGN[seed.old_requirement_id];
    const actualSign =
      engine.delta_pct === null
        ? "flat"
        : engine.delta_pct < 0
          ? "down"
          : "up";
    if (actualSign !== expectedSign) {
      numericProblems.push(`${id}: sign ${actualSign} (expected ${expectedSign})`);
      continue;
    }
    const seedPct = firstPct(seed.delta_description);
    if (seedPct !== null && engine.delta_pct !== null) {
      const drift = Math.abs(Math.abs(engine.delta_pct) - seedPct);
      if (drift > 1.0) {
        numericProblems.push(
          `${id}: pct ${engine.delta_pct.toFixed(2)} vs seed ${seedPct} (drift ${drift.toFixed(2)}pp)`,
        );
      }
    }
  }
  gate(
    "G2 numeric accuracy",
    numericChecked === 8 && numericProblems.length === 0,
    `checked=${numericChecked}/8 ${numericProblems.length ? `problems: ${numericProblems.join("; ")}` : "100% accurate (values, direction, pct<=1.0pp)"}`,
  );

  // G3 — cadence
  const cadenceProblems: string[] = [];
  let cadenceChecked = 0;
  for (const seed of seedChanges) {
    const engine = engineByKey.get(pairKeyOf(seed));
    if (!engine || engine.change_kind !== "frequency") continue;
    cadenceChecked += 1;
    const id = seed.old_requirement_id.slice(0, 8);
    const inSeed = (needle: string | null, hay: string | null) => {
      if (!needle || !hay) return false;
      return hay.toLowerCase().includes(needle.toLowerCase());
    };
    if (!inSeed(engine.old_value, seed.old_value)) {
      cadenceProblems.push(`${id}: old "${engine.old_value}" not in seed "${seed.old_value}"`);
    }
    if (!inSeed(engine.new_value, seed.new_value)) {
      cadenceProblems.push(`${id}: new "${engine.new_value}" not in seed "${seed.new_value}"`);
    }
    const seedPct = firstPct(seed.delta_description);
    if (seedPct !== null && engine.delta_pct !== null) {
      const drift = Math.abs(Math.abs(engine.delta_pct) - seedPct);
      if (drift > 1.0) {
        cadenceProblems.push(
          `${id}: pct ${engine.delta_pct.toFixed(2)} vs seed ${seedPct} (drift ${drift.toFixed(2)}pp)`,
        );
      }
    }
  }
  gate(
    "G3 cadence",
    cadenceChecked === 6 && cadenceProblems.length === 0,
    `checked=${cadenceChecked}/6 ${cadenceProblems.length ? `problems: ${cadenceProblems.join("; ")}` : "all intervals + pcts match seed text"}`,
  );

  // G4 — kinds
  const engineByOldId = new Map(changed.map((c) => [c.old_requirement_id, c]));
  const kindProblems: string[] = [];
  for (const [id, expected] of Object.entries(EXPECTED_KIND)) {
    const engine = engineByOldId.get(id);
    const actual = engine?.change_kind;
    if (actual !== expected) {
      kindProblems.push(`${id.slice(0, 8)}: ${actual ?? "missing"} (expected ${expected})`);
    }
  }
  gate(
    "G4 change kinds",
    Object.keys(EXPECTED_KIND).length === 18 && kindProblems.length === 0,
    kindProblems.length ? kindProblems.join("; ") : "all 18 deterministic kinds match",
  );

  // G5 — severity (informational)
  let severityMatches = 0;
  const severityMismatches: string[] = [];
  for (const seed of seedChanges) {
    const engine = engineByKey.get(pairKeyOf(seed));
    if (!engine) continue;
    if (engine.severity === seed.severity) severityMatches += 1;
    else
      severityMismatches.push(
        `${seed.old_requirement_id.slice(0, 8)}: engine=${engine.severity} seed=${seed.severity}`,
      );
  }
  gate(
    "G5 severity (info)",
    true,
    `${severityMatches}/18 match` +
      (severityMismatches.length ? ` — curated-variance: ${severityMismatches.join("; ")}` : ""),
    false,
  );

  // G6 — reconcile idempotency (simulates runComparisonAction re-run)
  const wouldUpdate: string[] = [];
  for (const seed of seedChanges) {
    const engine = engineByKey.get(pairKeyOf(seed));
    if (!engine) {
      wouldUpdate.push(`${seed.old_requirement_id.slice(0, 8)}: no engine pair`);
      continue;
    }
    const pairs: Array<[number | null, number | null]> = [
      [firstNumber(seed.old_value), firstNumber(engine.old_value)],
      [firstNumber(seed.new_value), firstNumber(engine.new_value)],
    ];
    for (const [s, e] of pairs) {
      if (s !== null && e !== null && Math.abs(s - e) > 1e-9) {
        wouldUpdate.push(
          `${seed.old_requirement_id.slice(0, 8)}: stored ${s} vs engine ${e}`,
        );
      }
    }
  }
  gate(
    "G6 reconcile idempotency",
    wouldUpdate.length === 0,
    wouldUpdate.length
      ? wouldUpdate.join("; ")
      : "re-running the hero comparison would insert 0 and update 0 rows",
  );

  // G7 — storage roundtrip
  try {
    const path = `verify/phase4-roundtrip-${Date.now()}.pdf`;
    const payload = buildPdf("Phase 4 storage roundtrip probe.");
    const up = await rest(`/storage/v1/object/pi-documents/${path}`, token, {
      method: "POST",
      headers: { "Content-Type": "application/pdf" },
      body: payload as unknown as BodyInit,
    });
    const down = up.ok
      ? await rest(`/storage/v1/object/pi-documents/${path}`, token)
      : null;
    const same =
      down?.ok &&
      Buffer.from(await down.arrayBuffer()).equals(Buffer.from(payload));
    const del = await rest(`/storage/v1/object/pi-documents/${path}`, token, {
      method: "DELETE",
    });
    gate(
      "G7 storage roundtrip",
      Boolean(up.ok && same && del.ok),
      `upload=${up.status} download=${down?.status} delete=${del.status} bytesMatch=${Boolean(same)}`,
    );
  } catch (err) {
    gate("G7 storage roundtrip", false, `error: ${String(err)}`);
  }

  // G8 — PDF text extraction
  try {
    const { extractText } = await import("unpdf");
    const pdf = buildPdf("NorthRiver Permit B-07 NOx 0.05 lb/MMBtu 24-hour rolling.");
    const { text } = await extractText(pdf, { mergePages: true });
    const ok =
      text.includes("B-07") && text.includes("0.05") && text.includes("lb/MMBtu");
    gate("G8 pdf extraction", ok, `extracted ${text.length} chars, contains clause text: ${ok}`);
  } catch (err) {
    gate("G8 pdf extraction", false, `error: ${String(err)}`);
  }

  // G9 — live classifier (non-gating)
  if (process.env.GEMINI_API_KEY) {
    try {
      const methodChange = engineByKey.get(
        `${"cca5d74c-f356-9b08-1e19-d20fb4c45876"}|${"228ac741-639a-a9b2-2679-91b1b7616ebc"}`,
      );
      if (methodChange) {
        const oldRow = oldRows.find((r) => r.id === methodChange.old_requirement_id);
        const newRow = newRows.find((r) => r.id === methodChange.new_requirement_id);
        const out = await classifyClauseChange(
          methodChange,
          oldRow?.raw_text ?? "",
          newRow?.raw_text ?? "",
        );
        gate(
          "G9 live classifier (info)",
          true,
          `kind=${out.change_kind} severity=${out.severity} confidence=${out.confidence} summary="${out.summary}"`,
          false,
        );
      }
    } catch (err) {
      gate("G9 live classifier (info)", false, `error: ${String(err)}`, false);
    }
  } else {
    gate("G9 live classifier (info)", true, "skipped (no GEMINI_API_KEY)", false);
  }

  // Report
  let gatingFailures = 0;
  for (const r of results) {
    const tag = r.passed ? "PASS" : r.gating ? "FAIL" : "WARN";
    console.log(`[${tag}] ${r.name}: ${r.detail}`);
    if (!r.passed && r.gating) gatingFailures += 1;
  }

  console.log("");
  if (gatingFailures === 0) {
    console.log(
      "EXIT CRITERIA MET: verified change list with 100% deterministic accuracy on numeric deltas.",
    );
    process.exit(0);
  }
  console.log(`${gatingFailures} gating gate(s) failed.`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
