import { CLAUSE_CATEGORIES, type NormalizedClause } from "./schemas";

export interface RequirementRowInput {
  id: string;
  permit_id?: string | null;
  section?: string | null;
  page?: number | null;
  citation?: string | null;
  category?: string | null;
  raw_text: string;
  parameter?: string | null;
  pollutant?: string | null;
  limit_value?: number | string | null;
  unit?: string | null;
  averaging_period?: string | null;
  frequency?: string | null;
  applicability?: string | null;
  confidence?: number | string | null;
}

const POLLUTANT_PATTERNS: Array<[RegExp, string]> = [
  [/\bnitrogen oxides\b|\bNOx\b/i, "NOx"],
  [/\bvolatile organic\b|\bVOCs?\b/i, "VOC"],
  [/\bsulfur dioxide\b|\bSO2\b/i, "SO2"],
  [/\bhydrogen sulfide\b|\bH2S\b/i, "H2S"],
  [/\bcarbon monoxide\b/i, "CO"],
  [/\bparticulate matter\b|\bPM2\.5\b|\bPM10\b/i, "PM"],
  [/\bnet heating value\b|\bNHV/i, "NHV"],
  [/\bopacity\b/i, "Opacity"],
  [/\bhydrogen fluoride\b|\bHF\b/i, "HF"],
];

export function detectPollutant(text?: string | null): string | null {
  if (!text) return null;
  for (const [re, name] of POLLUTANT_PATTERNS) {
    if (re.test(text)) return name;
  }
  return null;
}

const LIMIT_UNIT_PATTERN =
  "lb/MMBtu|lb/hr|Btu/scf|scfm|gpm|ppmv|ppmw|ppb|ppm|percent|%|seconds";

const LIMIT_KEYWORDS =
  /at least|not exceed|no more than|less than|maximum|minimum|below|at or above|or above|shall|limit/i;

function canonicalUnit(u: string): string {
  const map: Record<string, string> = {
    "lb/mmbtu": "lb/MMBtu",
    "lb/hr": "lb/hr",
    "btu/scf": "Btu/scf",
    scfm: "scfm",
    gpm: "gpm",
    ppmv: "ppmv",
    ppmw: "ppmw",
    ppb: "ppb",
    ppm: "ppm",
    percent: "percent",
    "%": "%",
    seconds: "seconds",
  };
  return map[u.toLowerCase()] ?? u;
}

export function parseNumericLimit(
  text: string,
): { value: number; unit: string } | null {
  const re = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${LIMIT_UNIT_PATTERN})`, "gi");
  const matches = [...text.matchAll(re)];
  if (matches.length === 0) return null;
  let chosen = matches[0];
  for (const m of matches) {
    const idx = m.index ?? 0;
    const window = text.slice(Math.max(0, idx - 70), idx);
    if (LIMIT_KEYWORDS.test(window)) {
      chosen = m;
      break;
    }
  }
  return { value: parseFloat(chosen[1]), unit: canonicalUnit(chosen[2]) };
}

const NAMED_INTERVALS: Array<[RegExp, number]> = [
  [/^(hourly|every hour|each hour|per hour)$/i, 1 / 24],
  [/^(daily|every day|each day|once daily)$/i, 1],
  [/^(weekly|every week|each week)$/i, 7],
  [/^(bi-?weekly|fortnightly)$/i, 14],
  [/^(monthly|every month|each month)$/i, 30],
  [/^(quarterly|every 3 months|every three months)$/i, 90],
  [
    /^(semi-?annual|semi-?annually|every 6 months|every six months)$/i,
    180,
  ],
  [/^(annual|annually|yearly|per year|every year)$/i, 365],
];

export function parseFrequencyInterval(frequency?: string | null): number | null {
  if (!frequency) return null;
  const f = frequency.trim();
  if (!f || /^continuous$/i.test(f)) return null;
  const everyDays = f.match(/every\s+(\d+(?:\.\d+)?)\s*-?\s*days?/i);
  if (everyDays) return parseFloat(everyDays[1]);
  const everyMonths = f.match(/every\s+(\d+(?:\.\d+)?)\s*-?\s*months?/i);
  if (everyMonths) return parseFloat(everyMonths[1]) * 30;
  for (const [re, days] of NAMED_INTERVALS) {
    if (re.test(f)) return days;
  }
  const days = f.match(/^(\d+(?:\.\d+)?)\s*-?\s*days?$/i);
  if (days) return parseFloat(days[1]);
  const months = f.match(/^(\d+(?:\.\d+)?)\s*-?\s*months?$/i);
  if (months) return parseFloat(months[1]) * 30;
  const years = f.match(/^(\d+(?:\.\d+)?)\s*-?\s*years?$/i);
  if (years) return parseFloat(years[1]) * 365;
  return null;
}

const AVERAGING_RULES: Array<[RegExp, string]> = [
  [/24\s*-?\s*hour[^,;.]*roll|roll[^,;.]*24\s*-?\s*hour/i, "24-hour rolling"],
  [/30\s*-?\s*day[^,;.]*roll|roll[^,;.]*30\s*-?\s*day/i, "30-day rolling"],
  [/8\s*-?\s*hour/i, "8-hour"],
  [/3\s*-?\s*hour/i, "3-hour"],
  [/1\s*-?\s*hour/i, "1-hour"],
  [/30\s*-?\s*minute/i, "30-minute"],
  [/15\s*-?\s*minute/i, "15-minute"],
  [/6\s*-?\s*minute/i, "6-minute"],
  [/\bgrab\b|composite/i, "grab sample"],
  [/\bblock\b/i, "block average"],
];

export function normalizeAveraging(raw?: string | null): string | null {
  if (!raw) return null;
  for (const [re, klass] of AVERAGING_RULES) {
    if (re.test(raw)) return klass;
  }
  return raw.trim().toLowerCase().slice(0, 40);
}

export function isMinimumText(text: string): boolean {
  return /\bat least\b|\bat or above\b|\bnot less than\b|\bminimum of\b|\bor above\b/i.test(
    text,
  );
}

function toNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function normalizeClause(row: RequirementRowInput): NormalizedClause {
  const category = (CLAUSE_CATEGORIES as readonly string[]).includes(
    row.category ?? "",
  )
    ? (row.category as NormalizedClause["category"])
    : "monitoring";
  const rawText = (row.raw_text ?? "").trim();
  const pollutant =
    row.pollutant?.trim() || detectPollutant(row.parameter) || detectPollutant(rawText);
  const frequency = row.frequency?.trim() || null;
  const averagingPeriod = row.averaging_period?.trim() || null;
  let limitValue = toNumber(row.limit_value);
  let unit = row.unit?.trim() || null;
  if (limitValue === null && rawText) {
    const parsed = parseNumericLimit(rawText);
    if (parsed) {
      limitValue = parsed.value;
      if (!unit) unit = parsed.unit;
    }
  }
  return {
    id: row.id,
    category,
    section: row.section?.trim() || null,
    page: toNumber(row.page),
    citation: row.citation?.trim() || null,
    raw_text: rawText,
    parameter: row.parameter?.trim() || null,
    pollutant,
    limit_value: limitValue,
    unit,
    averaging_period: averagingPeriod,
    averaging_class: normalizeAveraging(averagingPeriod),
    frequency,
    interval_days: parseFrequencyInterval(frequency),
    is_minimum: isMinimumText(rawText),
    applicability: row.applicability?.trim() || null,
    confidence: toNumber(row.confidence) ?? 0.7,
  };
}
