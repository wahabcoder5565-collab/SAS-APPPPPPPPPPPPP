import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(file) {
  const out = {};
  const path = resolve(root, file);
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    out[trimmed.slice(0, i).trim()] = trimmed
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = { ...loadEnv(".env"), ...loadEnv(".env.local") };
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = env.GEMINI_API_KEY;
if (!SUPABASE_URL || !ANON_KEY || !GEMINI_API_KEY) {
  console.error("Missing SUPABASE_URL / ANON_KEY / GEMINI_API_KEY in env files");
  process.exit(1);
}

const DEMO_EMAIL = "demo.engineer@northriverrefining.com";
const DEMO_PASSWORD = "DemoPassword123!";
const BATCH_SIZE = 40;
const DIMENSIONS = 768;

async function login() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`GoTrue login failed (${res.status}): ${await res.text()}`);
  }
  const { access_token } = await res.json();
  return access_token;
}

const authHeaders = (token, extra = {}) => ({
  apikey: ANON_KEY,
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  ...extra,
});

async function fetchNullEmbeddings(token, table, textCol) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?embedding=is.null&select=id,${textCol}`,
    { headers: authHeaders(token) }
  );
  if (!res.ok) throw new Error(`Fetch ${table} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function embedBatch(texts) {
  const requests = texts.map((text) => ({
    model: "models/gemini-embedding-001",
    content: { parts: [{ text }] },
    outputDimensionality: DIMENSIONS,
  }));
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents",
    { method: "POST", headers: { "x-goog-api-key": GEMINI_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ requests }) }
  );
  if (!res.ok) throw new Error(`batchEmbedContents failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const values = (data.embeddings || []).map((e) => e.values);
  if (values.length !== texts.length) {
    throw new Error(`Expected ${texts.length} embeddings, got ${values.length}`);
  }
  for (const v of values) {
    if (!Array.isArray(v) || v.length !== DIMENSIONS) {
      throw new Error(`Bad embedding: expected ${DIMENSIONS} dims`);
    }
  }
  return values;
}

async function patchEmbedding(token, table, id, embedding) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: authHeaders(token, { Prefer: "return=minimal" }),
    body: JSON.stringify({ embedding }),
  });
  if (!res.ok) throw new Error(`PATCH ${table}/${id} failed (${res.status}): ${await res.text()}`);
}

async function backfillTable(token, table, textCol) {
  const rows = await fetchNullEmbeddings(token, table, textCol);
  console.log(`${table}: ${rows.length} rows missing embeddings`);
  if (rows.length === 0) return 0;
  let updated = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const embeddings = await embedBatch(batch.map((r) => r[textCol]));
    for (let j = 0; j < batch.length; j++) {
      await patchEmbedding(token, table, batch[j].id, embeddings[j]);
      updated++;
    }
    console.log(`${table}: ${updated}/${rows.length} done`);
  }
  return updated;
}

const token = await login();
console.log(`Authenticated as ${DEMO_EMAIL}`);
const a = await backfillTable(token, "pi_document_chunks", "text");
const b = await backfillTable(token, "pi_permit_requirements", "raw_text");
console.log(`Backfill complete: ${a + b} embeddings written`);
