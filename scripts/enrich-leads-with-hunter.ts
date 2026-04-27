/**
 * Enrich a leads CSV with emails from Hunter.io's Domain Search API.
 *
 * Usage:
 *   1. Sign up at hunter.io and grab your API key from the dashboard
 *   2. Set the env var:
 *        export HUNTER_API_KEY=your_key_here
 *   3. Run:
 *        npx tsx scripts/enrich-leads-with-hunter.ts \
 *          scripts/boston-designers-leads.csv \
 *          scripts/boston-designers-leads.enriched.csv
 *
 *   Args:
 *     [1] input CSV path  (default: scripts/boston-designers-leads.csv)
 *     [2] output CSV path (default: <input>.enriched.csv)
 *
 *   Optional flags via env:
 *     - HUNTER_DRY_RUN=1     don't call the API, just show what would be looked up
 *     - HUNTER_LIMIT=N       only process the first N rows that need enrichment
 *
 * What it does:
 *   - Reads the input CSV (must have header: firstName,lastName,email,companyName,
 *     title,website,city,neighborhood,notes,source)
 *   - For every row that has a website but no email, calls Hunter Domain Search
 *   - Picks the best email Hunter returns (first match with type=personal, confidence > 70)
 *   - Writes the enriched CSV
 *   - Prints a summary
 *
 * Hunter free tier: 25 domain searches/month. Each row = 1 search.
 *
 * Rate limit: Hunter allows ~10 req/sec on paid tiers; 1 req/sec on free.
 * We sleep 1100ms between requests to be safe.
 */

import { readFile, writeFile } from "node:fs/promises";

interface Row {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  title: string;
  website: string;
  city: string;
  neighborhood: string;
  notes: string;
  source: string;
}

interface HunterEmail {
  value: string;
  type: "personal" | "generic";
  confidence: number;
  first_name?: string | null;
  last_name?: string | null;
  position?: string | null;
}

interface HunterResponse {
  data?: {
    domain: string;
    organization?: string | null;
    emails?: HunterEmail[];
  };
  errors?: Array<{ details: string }>;
}

const HEADERS: (keyof Row)[] = [
  "firstName",
  "lastName",
  "email",
  "companyName",
  "title",
  "website",
  "city",
  "neighborhood",
  "notes",
  "source",
];

async function main() {
  const apiKey = process.env.HUNTER_API_KEY;
  const dryRun = process.env.HUNTER_DRY_RUN === "1";
  const limit = process.env.HUNTER_LIMIT ? parseInt(process.env.HUNTER_LIMIT, 10) : Infinity;

  if (!apiKey && !dryRun) {
    console.error("HUNTER_API_KEY env var is required (or set HUNTER_DRY_RUN=1 to preview).");
    process.exit(1);
  }

  const inputPath = process.argv[2] || "scripts/boston-designers-leads.csv";
  const outputPath = process.argv[3] || inputPath.replace(/\.csv$/, ".enriched.csv");

  console.log(`Reading: ${inputPath}`);
  const csv = await readFile(inputPath, "utf8");
  const rows = parseCsv(csv);
  console.log(`Parsed ${rows.length} rows.`);

  const needsEnrichment = rows.filter((r) => r.website && !r.email);
  console.log(
    `${needsEnrichment.length} rows have a website but no email — these will be enriched.`
  );
  console.log(
    `${rows.length - needsEnrichment.length} rows skipped (already have email, or no website).`
  );

  let processed = 0;
  let foundEmails = 0;
  let noResults = 0;
  let errors = 0;

  for (const row of rows) {
    if (!row.website || row.email) continue;
    if (processed >= limit) break;

    const domain = normalizeDomain(row.website);
    if (!domain) {
      console.log(`  ✗ ${row.companyName}: invalid website "${row.website}"`);
      errors++;
      processed++;
      continue;
    }

    if (dryRun) {
      console.log(`  [dry] would lookup: ${domain} (${row.companyName})`);
      processed++;
      continue;
    }

    process.stdout.write(`  → ${row.companyName.padEnd(40)} ${domain.padEnd(35)} `);
    try {
      const res = await hunterDomainSearch(domain, apiKey!);
      const best = pickBestEmail(res, row);
      if (best) {
        row.email = best.value;
        if (best.first_name && !row.firstName) row.firstName = best.first_name;
        if (best.last_name && !row.lastName) row.lastName = best.last_name;
        if (best.position && !row.title) row.title = best.position;
        console.log(`✓ ${best.value} (${best.type}, ${best.confidence}%)`);
        foundEmails++;
      } else {
        console.log("✗ no usable email");
        noResults++;
      }
    } catch (e) {
      console.log(`✗ error: ${e instanceof Error ? e.message : "unknown"}`);
      errors++;
    }

    processed++;
    // Rate-limit politely
    await sleep(1100);
  }

  // Write output
  const outCsv = stringifyCsv(rows);
  await writeFile(outputPath, outCsv, "utf8");

  console.log("\n=== Summary ===");
  console.log(`Processed:    ${processed}`);
  console.log(`Found emails: ${foundEmails}`);
  console.log(`No results:   ${noResults}`);
  console.log(`Errors:       ${errors}`);
  console.log(`\nWrote: ${outputPath}`);
  console.log(
    `\nNext step: review the enriched CSV, then paste it into /staff/marketing/leads/import (use Preview first).`
  );
}

async function hunterDomainSearch(domain: string, apiKey: string): Promise<HunterResponse> {
  const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(
    domain
  )}&api_key=${apiKey}&limit=10`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * Pick the single best email from a Hunter response. Preference:
 *   1. A personal email with confidence >= 70 (typically a principal's address)
 *   2. A personal email with confidence >= 50
 *   3. A generic email with confidence >= 70 (info@, hello@) as a fallback
 */
function pickBestEmail(res: HunterResponse, _row: Row): HunterEmail | null {
  const emails = res.data?.emails || [];
  if (emails.length === 0) return null;

  const personalHigh = emails
    .filter((e) => e.type === "personal" && e.confidence >= 70)
    .sort((a, b) => b.confidence - a.confidence);
  if (personalHigh.length > 0) return personalHigh[0];

  const personalMed = emails
    .filter((e) => e.type === "personal" && e.confidence >= 50)
    .sort((a, b) => b.confidence - a.confidence);
  if (personalMed.length > 0) return personalMed[0];

  const genericHigh = emails
    .filter((e) => e.type === "generic" && e.confidence >= 70)
    .sort((a, b) => b.confidence - a.confidence);
  if (genericHigh.length > 0) return genericHigh[0];

  return null;
}

function normalizeDomain(website: string): string | null {
  if (!website) return null;
  const cleaned = website
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
  if (!cleaned.includes(".")) return null;
  return cleaned;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ─── Tiny CSV parser/writer (handles quoted fields, no multi-line strings) ── */

function parseCsv(input: string): Row[] {
  const lines = input.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const headerCells = parseCsvLine(lines[0]).map((h) => h.trim());
  const headerIndex: Record<string, number> = {};
  headerCells.forEach((h, i) => (headerIndex[h] = i));

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row = {} as Row;
    for (const h of HEADERS) {
      const idx = headerIndex[h];
      row[h] = idx != null && cells[idx] != null ? cells[idx].trim() : "";
    }
    return row;
  });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        result.push(current);
        current = "";
      } else current += c;
    }
  }
  result.push(current);
  return result;
}

function stringifyCsv(rows: Row[]): string {
  const escape = (s: string) =>
    /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  const out = [HEADERS.join(",")];
  for (const r of rows) {
    out.push(HEADERS.map((h) => escape(r[h] || "")).join(","));
  }
  return out.join("\n") + "\n";
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
