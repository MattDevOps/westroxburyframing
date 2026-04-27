"use client";

import { useState } from "react";
import { Copy, Check, Upload, Loader2, AlertTriangle } from "lucide-react";

interface AuditResult {
  status: "pending" | "ok" | "error";
  error?: string;
  // Populated when status === "ok"
  observation?: string;
  primary?: string | null;
  secondary?: string | null;
  issues?: string;
  caption?: string;
  suggestedFilename?: string;
  verdict?: string;
  raw?: string;
  usage?: {
    inputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    outputTokens: number;
  };
}

interface PhotoEntry {
  file: File;
  previewUrl: string;
  result: AuditResult;
}

const PAGE_SLUGS = [
  "sports-memorabilia",
  "diploma-framing",
  "military-first-responder",
  "canvas-stretching",
  "corporate-art",
  "wedding-keepsakes",
] as const;

function verdictKind(verdict: string): "HERO" | "EXTRA" | "REJECT" | "UNKNOWN" {
  const head = verdict.trim().split(/\s+/)[0]?.toUpperCase();
  if (head === "HERO" || head === "EXTRA" || head === "REJECT") return head;
  return "UNKNOWN";
}

function badgeClass(kind: ReturnType<typeof verdictKind>) {
  switch (kind) {
    case "HERO":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "EXTRA":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "REJECT":
      return "bg-rose-100 text-rose-800 border-rose-300";
    default:
      return "bg-neutral-100 text-neutral-700 border-neutral-300";
  }
}

export default function PhotoIntakePage() {
  const [entries, setEntries] = useState<PhotoEntry[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function copyText(key: string, text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((cur) => (cur === key ? null : cur)), 1200);
    } catch {
      /* clipboard unavailable in some browsers — silently ignore */
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const incoming: PhotoEntry[] = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      result: { status: "pending" },
    }));

    setEntries((prev) => [...prev, ...incoming]);

    // Audit serially so cache hits build up across the batch (the first call
    // writes the system-prompt cache; subsequent calls read it). Parallel
    // calls would all race to write the same cache, undoing the benefit.
    for (let i = 0; i < incoming.length; i++) {
      const entry = incoming[i];
      const fd = new FormData();
      fd.append("file", entry.file);

      try {
        const res = await fetch("/staff/api/photo-intake/audit", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) {
          updateEntry(entry, { status: "error", error: data?.error || `HTTP ${res.status}` });
        } else {
          updateEntry(entry, { status: "ok", ...data });
        }
      } catch (err) {
        updateEntry(entry, {
          status: "error",
          error: err instanceof Error ? err.message : "Network error",
        });
      }
    }
  }

  function updateEntry(target: PhotoEntry, result: AuditResult) {
    setEntries((prev) =>
      prev.map((e) => (e.file === target.file && e.previewUrl === target.previewUrl ? { ...e, result } : e))
    );
  }

  function clearAll() {
    entries.forEach((e) => URL.revokeObjectURL(e.previewUrl));
    setEntries([]);
  }

  const summary = summarize(entries);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-neutral-900">Photo Intake</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Drop the photos from a shoot. Each one gets routed against the 6 SEO landing-page rubrics in <code>IMAGE_TODO.md</code>:
          which page (or none), HERO / EXTRA / REJECT, defects, suggested caption + filename.
        </p>
      </header>

      <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-6">
        <label className="flex flex-col items-center justify-center cursor-pointer text-center">
          <Upload className="w-10 h-10 text-neutral-400" />
          <span className="mt-2 text-sm font-medium text-neutral-700">
            Click to choose photos, or drop them here
          </span>
          <span className="mt-1 text-xs text-neutral-500">
            JPEG / PNG / WebP / GIF, up to 10 MB each
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>

      {entries.length > 0 && (
        <div className="flex items-center justify-between rounded-md bg-white border border-neutral-200 px-4 py-3 text-sm">
          <div className="text-neutral-700">
            <strong>{entries.length}</strong> photo{entries.length === 1 ? "" : "s"} •{" "}
            <span className="text-emerald-700">{summary.hero} hero</span> •{" "}
            <span className="text-amber-700">{summary.extra} extras</span> •{" "}
            <span className="text-rose-700">{summary.reject} reject</span> •{" "}
            <span className="text-neutral-500">
              {summary.pending} pending, {summary.error} error
            </span>
          </div>
          <button
            onClick={clearAll}
            className="text-xs text-neutral-600 hover:text-neutral-900 underline"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="space-y-3">
        {entries.map((entry, idx) => (
          <PhotoCard
            key={`${entry.file.name}-${idx}`}
            entry={entry}
            copyText={copyText}
            copiedKey={copiedKey}
            idx={idx}
          />
        ))}
      </div>

      {entries.length > 0 && summary.byPage && (
        <div className="rounded-md border border-neutral-200 bg-white p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            By page
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PAGE_SLUGS.map((slug) => {
              const count = summary.byPage[slug] || { hero: 0, extra: 0 };
              return (
                <div key={slug} className="text-sm">
                  <div className="font-medium text-neutral-800">{slug}</div>
                  <div className="text-xs text-neutral-600">
                    <span className="text-emerald-700">{count.hero} hero</span> •{" "}
                    <span className="text-amber-700">{count.extra} extras</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoCard({
  entry,
  copyText,
  copiedKey,
  idx,
}: {
  entry: PhotoEntry;
  copyText: (key: string, text: string) => void;
  copiedKey: string | null;
  idx: number;
}) {
  const r = entry.result;
  const kind = r.status === "ok" && r.verdict ? verdictKind(r.verdict) : "UNKNOWN";

  return (
    <div className="flex gap-4 rounded-md border border-neutral-200 bg-white p-4">
      <div className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.previewUrl}
          alt={entry.file.name}
          className="h-32 w-32 object-cover rounded border border-neutral-200 bg-neutral-100"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-neutral-800 truncate">{entry.file.name}</div>
          {r.status === "ok" && r.verdict && (
            <span
              className={`shrink-0 rounded-full px-3 py-0.5 text-xs font-semibold border ${badgeClass(kind)}`}
            >
              {r.verdict}
            </span>
          )}
        </div>

        {r.status === "pending" && (
          <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Auditing…
          </div>
        )}

        {r.status === "error" && (
          <div className="mt-3 flex items-center gap-2 text-sm text-rose-700">
            <AlertTriangle className="w-4 h-4" /> {r.error}
          </div>
        )}

        {r.status === "ok" && (
          <div className="mt-2 space-y-1.5 text-sm text-neutral-700">
            {r.observation && <p>{r.observation}</p>}
            {r.issues && r.issues !== "none" && (
              <p className="text-rose-700"><strong>Issues:</strong> {r.issues}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs text-neutral-600 pt-1">
              {r.caption && r.caption !== "n/a" && (
                <CopyableField
                  k={`caption-${idx}`}
                  label="Caption"
                  value={r.caption}
                  copied={copiedKey === `caption-${idx}`}
                  onCopy={(t) => copyText(`caption-${idx}`, t)}
                />
              )}
              {r.suggestedFilename && r.suggestedFilename !== "n/a" && (
                <CopyableField
                  k={`fname-${idx}`}
                  label="Filename"
                  value={r.suggestedFilename}
                  copied={copiedKey === `fname-${idx}`}
                  onCopy={(t) => copyText(`fname-${idx}`, t)}
                />
              )}
            </div>
            {r.usage && (
              <div className="text-[11px] text-neutral-400 pt-1">
                tokens — in {r.usage.inputTokens} / cache_read {r.usage.cacheReadTokens} / cache_write{" "}
                {r.usage.cacheWriteTokens} / out {r.usage.outputTokens}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CopyableField({
  k,
  label,
  value,
  copied,
  onCopy,
}: {
  k: string;
  label: string;
  value: string;
  copied: boolean;
  onCopy: (text: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-neutral-500">{label}:</span>
      <span className="font-mono truncate text-neutral-800">{value}</span>
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="text-neutral-400 hover:text-neutral-700"
        title={`Copy ${label.toLowerCase()}`}
        aria-label={`Copy ${label.toLowerCase()}`}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function summarize(entries: PhotoEntry[]) {
  let hero = 0,
    extra = 0,
    reject = 0,
    pending = 0,
    error = 0;
  const byPage: Record<string, { hero: number; extra: number }> = {};

  for (const e of entries) {
    if (e.result.status === "pending") pending++;
    else if (e.result.status === "error") error++;
    else if (e.result.status === "ok" && e.result.verdict) {
      const k = verdictKind(e.result.verdict);
      if (k === "HERO") hero++;
      if (k === "EXTRA") extra++;
      if (k === "REJECT") reject++;
      const slug = e.result.primary;
      if (slug && (k === "HERO" || k === "EXTRA")) {
        byPage[slug] = byPage[slug] || { hero: 0, extra: 0 };
        if (k === "HERO") byPage[slug].hero++;
        if (k === "EXTRA") byPage[slug].extra++;
      }
    }
  }
  return { hero, extra, reject, pending, error, byPage };
}
