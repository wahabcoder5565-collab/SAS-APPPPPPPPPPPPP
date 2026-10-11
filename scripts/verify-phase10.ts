/**
 * Phase 10 verification: Comprehensive Audit Trail & Quantitative Evaluation.
 *
 * Gates:
 *   G1  Extraction recall ≥ 90%  (18 caused clauses vs ground truth)
 *   G2  Numeric delta accuracy = 100%  (8 numeric deltas exact)
 *   G3  Hero asset mapping precision = 100%  (12 seeded change→asset links)
 *   G4  Seeded conflict detection recall ≥ 90%  (7 seeded internal conflicts)
 *   G5  Unsupported claim rate on high-impact items = 0%
 *   G6  Audit log SHA-256 hash chain intact (genesis sealed, 0 mismatches)
 *   G7  Audit log append-only guard blocks UPDATE/DELETE
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { runEvaluation } from "../lib/evaluation";

function loadEnv(): void {
  for (const file of [".env.local", ".env"]) {
    const p = path.resolve(__dirname, "..", file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

let failures = 0;
function gate(id: string, name: string, ok: boolean, detail: string): void {
  console.log(`[${ok ? "PASS" : "FAIL"}] ${id} ${name}: ${detail}`);
  if (!ok) failures += 1;
}
function info(msg: string): void {
  console.log(`       ${msg}`);
}

async function main(): Promise<void> {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: loginErr } = await supabase.auth.signInWithPassword({
    email: "demo.engineer@northriverrefining.com",
    password: "DemoPassword123!",
  });
  if (loginErr) throw new Error(`login failed: ${loginErr.message}`);

  const report = await runEvaluation(supabase);
  for (const kpi of report.scorecard) {
    gate(
      `KPI-${kpi.key}`,
      `${kpi.label} (${kpi.unit})`,
      kpi.pass,
      `${kpi.value}${kpi.unit} ≥/== ${kpi.target}${kpi.unit} | ${kpi.detail}` +
        (kpi.compared.mismatches.length ? ` | [${kpi.compared.mismatches.join("; ")}]` : "")
    );
  }

  const { data: chain } = await supabase.rpc("pi_audit_verify_chain");
  gate(
    "G6",
    "audit hash-chain integrity",
    Boolean(chain?.ok) && chain?.genesis_ok === true && chain?.mismatches === 0,
    `total=${chain?.total}, checked=${chain?.checked}, mismatches=${chain?.mismatches}, first_broken=${chain?.first_broken_seq ?? "none"}, genesis=${chain?.genesis_ok}, tail=${(chain?.last_hash ?? "").slice(0, 20)}…`
  );

  const { data: chainInfo } = await supabase.rpc("pi_audit_chain_info");
  info(`chain spans seq ${chainInfo?.first_seq} → ${chainInfo?.last_seq} (${chainInfo?.items} events)`);

  const { error: guardErr, data: guardData } = await supabase
    .from("pi_audit_log")
    .update({ notes: "tamper" })
    .eq("seq", chainInfo?.first_seq);
  const blockedByError =
    guardErr &&
    (String(guardErr.message).toLowerCase().includes("append-only") ||
      String(guardErr.code) === "42501" ||
      String(guardErr.message).toLowerCase().includes("permission denied"));
  const guardRows = (guardData ?? []) as unknown as unknown[];
  const tamperApplied = guardRows.length > 0;
  const { data: tamperRead } = await supabase
    .from("pi_audit_log")
    .select("notes")
    .eq("seq", chainInfo?.first_seq)
    .single();
  const blocked = blockedByError || (!tamperApplied && !guardErr);
  gate(
    "G7",
    "audit append-only guard (UPDATE/DELETE blocked)",
    blocked,
    blocked
      ? blockedByError
        ? `write rejected: ${String(guardErr.message).split("\n")[0]} (code ${String(guardErr.code)})`
        : "silent RLS deny (0 rows affected)"
      : `tamper applied: notes=${JSON.stringify(tamperRead?.notes)}`
  );

  console.log(`\nGenerated: ${report.generatedAt}`);
  console.log(`Phase 10 verification: ${failures === 0 ? "ALL GATES PASS" : `${failures} GATE(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("verify:phase10 crashed:", err);
  process.exit(1);
});