"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

const VERTICALS = [
  { value: "designer", label: "Interior designers" },
  { value: "law_firm", label: "Law firms" },
  { value: "photographer", label: "Photographers" },
  { value: "hospital", label: "Hospitals" },
  { value: "hotel", label: "Hotels" },
  { value: "gallery", label: "Galleries" },
  { value: "school", label: "Schools / alumni" },
  { value: "funeral_home", label: "Funeral homes" },
  { value: "real_estate_stager", label: "Real-estate stagers" },
  { value: "corporate", label: "Corporate" },
  { value: "other", label: "Other" },
];

const SAMPLE_CSV = `firstName,lastName,email,companyName,title,phone,website,city,neighborhood,notes
Jane,Smith,jane@studiosmith.com,Studio Smith,Principal Designer,617-555-1234,studiosmith.com,Boston,South End,Met at SoWa open studios — interested in matched moulding for client installs
Mark,Lee,mark@leeinteriors.com,Lee Interiors,Owner,,leeinteriors.com,Newton,,Specializes in luxury home staging`;

export default function LeadImportPage() {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [vertical, setVertical] = useState("designer");
  const [source, setSource] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    dryRun?: boolean;
    total: number;
    created: number;
    skipped: number;
    createdPreview?: Array<{ email: string | null; companyName: string | null }>;
    skippedDetail: Array<{ row: number; reason: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsv(text);
  }

  async function runImport(dryRun: boolean) {
    if (!csv.trim()) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/staff/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, vertical, source, dryRun }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/staff/marketing/leads" className="text-sm text-stone-500 hover:text-stone-900">
          ← Back to leads
        </Link>
        <h1 className="text-3xl font-bold text-stone-900 mt-1">Import Leads from CSV</h1>
        <p className="text-stone-600 text-sm mt-1 mb-6">
          Paste a CSV (or upload a .csv file) with a header row. Recognized columns:{" "}
          <code className="text-xs bg-stone-200 px-1 rounded">
            firstName, lastName, email, phone, title, companyName, website, linkedinUrl, city, state, neighborhood, notes, source, vertical
          </code>
          . All columns are optional but at least one of <code>email</code>, <code>companyName</code>, or <code>firstName</code> must be present per row.
        </p>

        <div className="bg-white border border-stone-200 rounded p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-stone-600 uppercase tracking-wide block mb-1">
                Default vertical for this batch
              </label>
              <select
                value={vertical}
                onChange={(e) => setVertical(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded text-sm bg-white"
              >
                {VERTICALS.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
              <p className="text-xs text-stone-500 mt-1">
                Applied to every row that doesn&apos;t have a <code>vertical</code> column.
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600 uppercase tracking-wide block mb-1">
                Default source (optional)
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. IIDA Boston member directory, Houzz, manual research"
                className="w-full px-3 py-2 border border-stone-300 rounded text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-stone-600 uppercase tracking-wide block mb-1">
              Upload .csv file
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-stone-600 uppercase tracking-wide">
                Or paste CSV here
              </label>
              <button
                onClick={() => setCsv(SAMPLE_CSV)}
                className="text-xs text-blue-600 hover:underline"
              >
                Use sample
              </button>
            </div>
            <textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              rows={14}
              className="w-full px-3 py-2 border border-stone-300 rounded text-xs font-mono"
              placeholder="firstName,lastName,email,companyName,..."
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded border border-rose-200">{error}</div>
          )}

          {result && (
            <div
              className={`p-4 text-sm rounded border ${
                result.dryRun
                  ? "bg-blue-50 text-blue-900 border-blue-200"
                  : "bg-emerald-50 text-emerald-900 border-emerald-200"
              }`}
            >
              <div className="font-semibold mb-2">
                {result.dryRun ? "Preview — nothing saved yet" : "Imported"} {result.created} of {result.total} rows
                {result.skipped > 0 && (
                  <span className={`font-normal ${result.dryRun ? "text-blue-700" : "text-emerald-700"}`}>
                    {" "}· {result.skipped} skipped
                  </span>
                )}
              </div>
              {result.dryRun && result.createdPreview && result.createdPreview.length > 0 && (
                <details className="text-xs text-blue-800 mb-2" open>
                  <summary className="cursor-pointer font-medium">
                    Preview of {Math.min(result.createdPreview.length, 25)} rows that will be created
                  </summary>
                  <ul className="mt-2 space-y-0.5 font-mono">
                    {result.createdPreview.map((c, i) => (
                      <li key={i}>
                        {(c.companyName || "(no company)")} — {c.email || "(no email)"}
                      </li>
                    ))}
                    {result.created > result.createdPreview.length && (
                      <li className="text-blue-600">…and {result.created - result.createdPreview.length} more</li>
                    )}
                  </ul>
                </details>
              )}
              {result.skippedDetail.length > 0 && (
                <details className={`text-xs ${result.dryRun ? "text-blue-800" : "text-emerald-800"}`}>
                  <summary className="cursor-pointer">Show skipped rows</summary>
                  <ul className="mt-2 space-y-0.5 font-mono">
                    {result.skippedDetail.map((s, i) => (
                      <li key={i}>Row {s.row}: {s.reason}</li>
                    ))}
                  </ul>
                </details>
              )}
              <div className="mt-3 flex gap-2">
                {result.dryRun ? (
                  <>
                    <button
                      onClick={() => runImport(false)}
                      disabled={running}
                      className="px-3 py-1.5 bg-stone-900 text-white rounded text-xs font-medium"
                    >
                      Confirm and import {result.created} rows
                    </button>
                    <button
                      onClick={() => setResult(null)}
                      className="px-3 py-1.5 bg-white border border-stone-300 rounded text-xs font-medium"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => router.push("/staff/marketing/leads")}
                      className="px-3 py-1.5 bg-stone-900 text-white rounded text-xs font-medium"
                    >
                      View leads →
                    </button>
                    <button
                      onClick={() => { setCsv(""); setResult(null); }}
                      className="px-3 py-1.5 bg-white border border-stone-300 rounded text-xs font-medium"
                    >
                      Import another batch
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => runImport(true)}
              disabled={running || !csv.trim()}
              className="px-5 py-2 bg-white border border-stone-300 rounded text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
            >
              {running ? "Working…" : "Preview"}
            </button>
            <button
              onClick={() => runImport(false)}
              disabled={running || !csv.trim()}
              className="px-5 py-2 bg-stone-900 text-white rounded text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Upload size={16} />
              {running ? "Importing…" : "Import directly"}
            </button>
          </div>
        </div>

        <div className="mt-6 bg-white border border-stone-200 rounded p-5 text-sm text-stone-700">
          <h3 className="font-semibold mb-2">Tips</h3>
          <ul className="list-disc pl-5 space-y-1 text-stone-600 text-xs">
            <li>Duplicate emails are skipped automatically (existing leads aren&apos;t overwritten).</li>
            <li>Header row is required. Column names are case-insensitive and underscores/dashes/spaces are ignored, so <code>First Name</code> = <code>firstname</code> = <code>first_name</code>.</li>
            <li>Both <code>company</code> and <code>companyName</code> work as headers.</li>
            <li>For the first batch of designers: scrape from the <strong>IIDA Boston</strong> or <strong>ASID New England</strong> member directories, or grab Boston-area designers from <strong>Houzz</strong>.</li>
            <li>Include short notes per row (why they&apos;re a fit, where you found them) — saves time when composing the personalized email.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
