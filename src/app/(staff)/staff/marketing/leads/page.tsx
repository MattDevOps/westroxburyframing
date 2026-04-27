"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Search, Plus, Upload, Mail, Filter, Settings, Send } from "lucide-react";

type UsageStats = {
  monthStartIso: string;
  aiDraftsCount: number;
  aiDraftsSent: number;
  draftsPending: number;
  classificationsCount: number;
  estimatedAnthropicSpendUsd: number;
  costAssumptions: { perDraftUsd: number; perClassificationUsd: number; note: string };
  postmarkOutbound: number | null;
  postmarkInbound: number | null;
  postmarkAvailable: boolean;
};

type Lead = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  companyName: string | null;
  city: string | null;
  vertical: string;
  status: string;
  source: string | null;
  emailedAt: string | null;
  repliedAt: string | null;
  followUpCount: number;
  nextFollowUpAt: string | null;
  autoFollowupAt: string | null;
  autoFollowupSent: boolean;
  updatedAt: string;
  createdAt: string;
  assignedTo: { id: string; name: string } | null;
};

const VERTICALS = [
  { value: "", label: "All verticals" },
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

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "researching", label: "Researching" },
  { value: "ready_to_email", label: "Ready to email" },
  { value: "emailed", label: "Emailed (awaiting reply)" },
  { value: "followed_up", label: "Followed up" },
  { value: "replied_positive", label: "Replied — positive" },
  { value: "replied_negative", label: "Replied — negative" },
  { value: "no_reply", label: "No reply (cold)" },
  { value: "qualified", label: "Qualified" },
  { value: "customer", label: "Converted to customer" },
  { value: "unsubscribed", label: "Unsubscribed" },
  { value: "bounced", label: "Bounced" },
];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  researching: "bg-purple-100 text-purple-800",
  ready_to_email: "bg-amber-100 text-amber-900",
  emailed: "bg-slate-100 text-slate-800",
  followed_up: "bg-slate-200 text-slate-900",
  replied_positive: "bg-emerald-100 text-emerald-900",
  replied_negative: "bg-rose-100 text-rose-900",
  no_reply: "bg-zinc-100 text-zinc-700",
  qualified: "bg-yellow-100 text-yellow-900",
  customer: "bg-green-100 text-green-900 font-semibold",
  unsubscribed: "bg-stone-100 text-stone-700 line-through",
  bounced: "bg-red-50 text-red-700",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [followupsToday, setFollowupsToday] = useState(0);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [vertical, setVertical] = useState("");
  const [status, setStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showSignatureSettings, setShowSignatureSettings] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkSend, setShowBulkSend] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleSelectAll(allOnPage: Lead[]) {
    setSelectedIds((prev) => {
      const eligibleIds = allOnPage.filter((l) => l.email).map((l) => l.id);
      const allSelected = eligibleIds.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        eligibleIds.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      eligibleIds.forEach((id) => next.add(id));
      return next;
    });
  }

  async function load() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (vertical) params.set("vertical", vertical);
    if (status) params.set("status", status);
    try {
      const res = await fetch(`/staff/api/leads?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setLeads(data.leads || []);
      setStatusCounts(data.statusCounts || {});
      setFollowupsToday(data.followupsToday || 0);
      // Refresh usage stats whenever leads reload — cheap, runs in parallel
      fetch("/staff/api/marketing/usage-stats", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((u) => u && setUsage(u))
        .catch(() => {});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vertical, status]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const totalLeads = leads.length;
  const emailedCount = (statusCounts.emailed || 0) + (statusCounts.followed_up || 0);
  const repliedCount =
    (statusCounts.replied_positive || 0) + (statusCounts.replied_negative || 0);
  const customerCount = statusCounts.customer || 0;
  const newCount = statusCounts.new || 0;

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Link href="/staff/dashboard" className="text-sm text-stone-500 hover:text-stone-900">
              ← Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-stone-900 mt-1">B2B Leads</h1>
            <p className="text-stone-600 text-sm mt-1">
              Designers, law firms, hospitals, and other prospects in the outreach pipeline.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {selectedIds.size > 0 && (
              <button
                onClick={() => setShowBulkSend(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 inline-flex items-center gap-2"
              >
                <Send size={16} /> Send to {selectedIds.size} selected
              </button>
            )}
            <button
              onClick={() => setShowSignatureSettings(true)}
              className="px-4 py-2 bg-white border border-stone-300 rounded text-sm font-medium hover:bg-stone-50 inline-flex items-center gap-2"
              title="Edit your outreach email signature"
            >
              <Settings size={16} /> Signature
            </button>
            <Link
              href="/staff/marketing/leads/import"
              className="px-4 py-2 bg-white border border-stone-300 rounded text-sm font-medium hover:bg-stone-50 inline-flex items-center gap-2"
            >
              <Upload size={16} /> Import CSV
            </Link>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-stone-900 text-white rounded text-sm font-medium hover:bg-stone-800 inline-flex items-center gap-2"
            >
              <Plus size={16} /> Add Lead
            </button>
          </div>
        </div>

        {/* Needs Action — daily-use section */}
        <NeedsActionSection
          counts={statusCounts}
          followupsToday={followupsToday}
          onFilterStatus={(s) => setStatus(s)}
        />

        {/* Pipeline summary — supplementary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <SummaryCard label="Total" value={totalLeads} />
          <SummaryCard label="New / unprocessed" value={newCount} accent="text-blue-700" />
          <SummaryCard label="Emailed (awaiting)" value={emailedCount} accent="text-slate-700" />
          <SummaryCard label="Replied" value={repliedCount} accent="text-emerald-700" />
          <SummaryCard label="Converted" value={customerCount} accent="text-green-700" />
        </div>

        {/* Cost / usage monitoring */}
        {usage && <UsageWidget usage={usage} />}

        {/* Filters */}
        <div className="bg-white border border-stone-200 rounded p-4 mb-4 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search name, email, or company"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              className="px-3 py-2 border border-stone-300 rounded text-sm bg-white"
            >
              {VERTICALS.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border border-stone-300 rounded text-sm bg-white"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                  {s.value && statusCounts[s.value] != null ? ` (${statusCounts[s.value]})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-stone-200 rounded overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-stone-500 text-sm">Loading…</div>
          ) : error ? (
            <div className="p-12 text-center text-rose-600 text-sm">{error}</div>
          ) : leads.length === 0 ? (
            <EmptyState onAdd={() => setShowCreate(true)} />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-600">
                <tr>
                  <th className="px-2 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={
                        leads.filter((l) => l.email).length > 0 &&
                        leads.filter((l) => l.email).every((l) => selectedIds.has(l.id))
                      }
                      onChange={() => toggleSelectAll(leads)}
                      onClick={(e) => e.stopPropagation()}
                      className="cursor-pointer"
                      title="Select all on page (with email)"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Name / Company</th>
                  <th className="px-4 py-3 text-left">Vertical</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Next action</th>
                  <th className="px-4 py-3 text-left">Last activity</th>
                  <th className="px-4 py-3 text-left">Source</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-t border-stone-100 hover:bg-stone-50 cursor-pointer"
                    onClick={() => (window.location.href = `/staff/marketing/leads/${lead.id}`)}
                  >
                    <td className="px-2 py-3 w-8" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(lead.id)}
                        onChange={() => toggleSelected(lead.id)}
                        disabled={!lead.email}
                        title={lead.email ? "Select for bulk send" : "No email — cannot bulk send"}
                        className="cursor-pointer disabled:opacity-30"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-stone-900">
                        {[lead.firstName, lead.lastName].filter(Boolean).join(" ") ||
                          lead.companyName ||
                          lead.email ||
                          "(unnamed)"}
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        {lead.companyName && (lead.firstName || lead.lastName) && (
                          <>{lead.companyName} · </>
                        )}
                        {lead.email}
                        {lead.title && <> · {lead.title}</>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-700 text-xs">
                      {humanizeVertical(lead.vertical)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${STATUS_COLORS[lead.status] || "bg-stone-100"}`}
                      >
                        {humanizeStatus(lead.status)}
                      </span>
                      {lead.followUpCount > 0 && (
                        <span className="ml-2 text-xs text-stone-500">
                          ({lead.followUpCount} follow-up{lead.followUpCount > 1 ? "s" : ""})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <NextActionCell lead={lead} />
                    </td>
                    <td className="px-4 py-3 text-stone-600 text-xs">
                      {lead.repliedAt ? (
                        <>Replied {timeAgo(lead.repliedAt)}</>
                      ) : lead.emailedAt ? (
                        <>Emailed {timeAgo(lead.emailedAt)}</>
                      ) : (
                        <>Added {timeAgo(lead.createdAt)}</>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-500 text-xs">{lead.source || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && <CreateLeadModal onClose={() => setShowCreate(false)} onCreated={load} />}
      {showSignatureSettings && (
        <SignatureSettingsModal onClose={() => setShowSignatureSettings(false)} />
      )}
      {showBulkSend && (
        <BulkSendModal
          leadIds={Array.from(selectedIds)}
          onClose={() => setShowBulkSend(false)}
          onDone={() => {
            setShowBulkSend(false);
            setSelectedIds(new Set());
            load();
          }}
        />
      )}
    </div>
  );
}

function BulkSendModal({
  leadIds,
  onClose,
  onDone,
}: {
  leadIds: string[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [delaySeconds, setDelaySeconds] = useState(30);
  const [autoFollowupDays, setAutoFollowupDays] = useState(5);
  const [useAi, setUseAi] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    sent: number;
    skipped: number;
    failed: number;
    results: Array<{ leadId: string; email: string | null; status: string; reason?: string }>;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function send() {
    const estMinutes = Math.ceil((leadIds.length * delaySeconds) / 60);
    if (
      !confirm(
        `Send ${leadIds.length} emails with ${delaySeconds}s between each (~${estMinutes} min total)? This will also schedule auto-followups in ${autoFollowupDays} days.`
      )
    ) {
      return;
    }
    setRunning(true);
    setErr(null);
    try {
      const res = await fetch("/staff/api/leads/bulk-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds, delaySeconds, useAi, autoFollowupDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk send failed");
      setResult(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Bulk send failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-stone-900 mb-2">Bulk Send Outreach</h2>
          <p className="text-sm text-stone-600 mb-4">
            Sending to <strong>{leadIds.length}</strong> selected leads.
            {leadIds.length > 25 && (
              <span className="text-rose-600"> Cap is 25 per batch — split into multiple runs.</span>
            )}
          </p>
          {err && <div className="p-2 bg-rose-50 text-rose-700 text-sm rounded mb-3">{err}</div>}

          {!result ? (
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={useAi}
                  onChange={(e) => setUseAi(e.target.checked)}
                />
                <span>Use Claude to draft each email individually (recommended)</span>
              </label>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-stone-700">Delay between sends:</span>
                <select
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(Number(e.target.value))}
                  className="px-2 py-1 border border-stone-300 rounded text-sm bg-white"
                >
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={120}>2 minutes</option>
                </select>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-stone-700">Auto-followup if no reply in:</span>
                <select
                  value={autoFollowupDays}
                  onChange={(e) => setAutoFollowupDays(Number(e.target.value))}
                  className="px-2 py-1 border border-stone-300 rounded text-sm bg-white"
                >
                  <option value={0}>Don&apos;t schedule</option>
                  <option value={3}>3 days</option>
                  <option value={5}>5 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                </select>
              </div>
              <div className="text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded p-3">
                Estimated time: <strong>{Math.ceil((leadIds.length * delaySeconds) / 60)} min</strong> for{" "}
                {leadIds.length} sends.{" "}
                {useAi
                  ? "Each email is AI-drafted using the lead's website, vertical, and your signature."
                  : "Falls back to a generic template."}
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                <strong>Done.</strong> Sent {result.sent} of {result.total}
                {result.skipped > 0 && <> · {result.skipped} skipped</>}
                {result.failed > 0 && <> · <span className="text-rose-700">{result.failed} failed</span></>}.
              </div>
              <details className="text-xs text-stone-700" open={result.failed > 0}>
                <summary className="cursor-pointer font-medium">Per-lead results</summary>
                <ul className="mt-2 space-y-0.5 font-mono">
                  {result.results.map((r) => (
                    <li
                      key={r.leadId}
                      className={
                        r.status === "sent"
                          ? "text-emerald-700"
                          : r.status === "skipped"
                          ? "text-amber-700"
                          : "text-rose-700"
                      }
                    >
                      {r.status.toUpperCase()} · {r.email || "(no email)"}
                      {r.reason && <> — {r.reason}</>}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )}

          <div className="flex gap-2 justify-end mt-5 pt-3 border-t border-stone-200">
            {!result ? (
              <>
                <button onClick={onClose} className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900">
                  Cancel
                </button>
                <button
                  onClick={send}
                  disabled={running || leadIds.length === 0 || leadIds.length > 25}
                  className="px-4 py-2 bg-purple-600 text-white rounded text-sm font-medium disabled:opacity-50"
                >
                  {running ? `Sending… (don't close this window)` : `Send ${leadIds.length}`}
                </button>
              </>
            ) : (
              <button
                onClick={onDone}
                className="px-4 py-2 bg-stone-900 text-white rounded text-sm font-medium"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_SIGNATURE_PLACEHOLDER = `Best,
Jake
West Roxbury Framing
1741 Centre Street, West Roxbury, MA 02132
(617) 327-3890
westroxburyframing.com`;

function SignatureSettingsModal({ onClose }: { onClose: () => void }) {
  const [signature, setSignature] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/staff/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setSignature(data?.user?.emailSignature || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/staff/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailSignature: signature }),
      });
      if (!res.ok) throw new Error("Save failed");
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow-xl max-w-lg w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold text-stone-900 mb-2">Outreach Email Signature</h2>
          <p className="text-sm text-stone-600 mb-4">
            This sign-off appears at the bottom of every outreach email you send. Edit it once
            and every future draft picks it up automatically.
          </p>
          {err && <div className="p-2 bg-rose-50 text-rose-700 text-sm rounded mb-3">{err}</div>}
          {loading ? (
            <p className="text-sm text-stone-500 py-8 text-center">Loading…</p>
          ) : (
            <>
              <textarea
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                rows={8}
                placeholder={DEFAULT_SIGNATURE_PLACEHOLDER}
                className="w-full px-3 py-2 border border-stone-300 rounded text-sm font-mono"
              />
              <p className="text-xs text-stone-500 mt-2">
                Leave blank to use the default shop signature shown in the placeholder.
              </p>
            </>
          )}
          <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-stone-200">
            <button onClick={onClose} className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || loading}
              className="px-4 py-2 bg-stone-900 text-white rounded text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-white border border-stone-200 rounded p-4">
      <div className="text-xs text-stone-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent || "text-stone-900"}`}>{value}</div>
    </div>
  );
}

function UsageWidget({ usage }: { usage: UsageStats }) {
  const monthLabel = new Date(usage.monthStartIso).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Postmark free tier is 100 outbound/mo; flag if approaching
  const postmarkFreeCap = 100;
  const outbound = usage.postmarkOutbound;
  const postmarkPct =
    typeof outbound === "number" ? Math.round((outbound / postmarkFreeCap) * 100) : null;
  const postmarkWarning = postmarkPct != null && postmarkPct >= 80;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs uppercase tracking-widest text-stone-500 font-semibold">
          Usage & cost — {monthLabel}
        </h2>
        <a
          href="https://console.anthropic.com/settings/usage"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-stone-500 hover:text-stone-900"
        >
          Real Anthropic spend ↗
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* AI drafts */}
        <div className="bg-white border border-stone-200 rounded p-4">
          <div className="text-xs text-stone-500 uppercase tracking-wide">AI drafts</div>
          <div className="text-2xl font-bold mt-1 text-purple-700">{usage.aiDraftsCount}</div>
          <div className="text-xs text-stone-500 mt-1">
            {usage.aiDraftsSent} sent · {usage.draftsPending} pending review
          </div>
        </div>

        {/* Classifications */}
        <div className="bg-white border border-stone-200 rounded p-4">
          <div className="text-xs text-stone-500 uppercase tracking-wide">Reply classifications</div>
          <div className="text-2xl font-bold mt-1 text-emerald-700">
            {usage.classificationsCount}
          </div>
          <div className="text-xs text-stone-500 mt-1">Inbound, auto-classified by Haiku</div>
        </div>

        {/* Estimated Anthropic spend */}
        <div className="bg-white border border-stone-200 rounded p-4">
          <div className="text-xs text-stone-500 uppercase tracking-wide">
            Est. Anthropic spend
          </div>
          <div className="text-2xl font-bold mt-1 text-stone-900">
            ${usage.estimatedAnthropicSpendUsd.toFixed(2)}
          </div>
          <div
            className="text-xs text-stone-500 mt-1 truncate"
            title={usage.costAssumptions.note}
          >
            Estimate · ${usage.costAssumptions.perDraftUsd.toFixed(2)}/draft
          </div>
        </div>

        {/* Postmark */}
        <div
          className={`rounded p-4 border ${
            postmarkWarning
              ? "bg-amber-50 border-amber-300"
              : "bg-white border-stone-200"
          }`}
        >
          <div className="text-xs text-stone-500 uppercase tracking-wide">Postmark</div>
          {usage.postmarkAvailable && outbound != null ? (
            <>
              <div
                className={`text-2xl font-bold mt-1 ${
                  postmarkWarning ? "text-amber-800" : "text-stone-900"
                }`}
              >
                {outbound}
                <span className="text-base text-stone-400 font-normal"> / 100 free</span>
              </div>
              <div className="text-xs text-stone-500 mt-1">
                {usage.postmarkInbound != null && (
                  <>{usage.postmarkInbound} inbound · </>
                )}
                {postmarkWarning ? (
                  <span className="text-amber-700 font-medium">
                    Near free-tier cap — $15/mo plan covers 10K
                  </span>
                ) : (
                  <>Free tier covers 100/mo outbound</>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-base font-medium mt-1 text-stone-500">unavailable</div>
              <div className="text-xs text-stone-500 mt-1">
                {usage.postmarkAvailable === false
                  ? "POSTMARK_SERVER_API_TOKEN not set"
                  : "API call failed"}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NeedsActionSection({
  counts,
  followupsToday,
  onFilterStatus,
}: {
  counts: Record<string, number>;
  followupsToday: number;
  onFilterStatus: (status: string) => void;
}) {
  const repliesWaiting = (counts.replied_positive || 0) + (counts.replied_negative || 0);
  const readyToEmail = counts.ready_to_email || 0;
  const newToResearch = counts.new || 0;

  const totalToDo = repliesWaiting + readyToEmail + followupsToday;

  if (totalToDo === 0 && newToResearch === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-xs uppercase tracking-widest text-stone-500 font-semibold mb-3">
        Needs your attention
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <ActionCard
          tone="emerald"
          urgency={repliesWaiting > 0 ? "now" : "idle"}
          count={repliesWaiting}
          title="Replies waiting"
          subtitle={
            repliesWaiting === 0
              ? "All replies handled"
              : repliesWaiting === 1
              ? "1 lead replied — respond or move along"
              : `${repliesWaiting} leads replied — respond or move along`
          }
          onClick={() => onFilterStatus("replied_positive")}
          actionLabel={repliesWaiting > 0 ? "View positive →" : undefined}
        />
        <ActionCard
          tone="amber"
          urgency={followupsToday > 0 ? "now" : "idle"}
          count={followupsToday}
          title="Auto-followups today"
          subtitle={
            followupsToday === 0
              ? "Nothing scheduled"
              : `${followupsToday} will fire when the cron runs (~9am ET tomorrow)`
          }
          onClick={() => onFilterStatus("emailed,followed_up")}
          actionLabel={followupsToday > 0 ? "Preview / cancel →" : undefined}
        />
        <ActionCard
          tone="blue"
          urgency={readyToEmail > 0 ? "soon" : "idle"}
          count={readyToEmail}
          title="Ready to email"
          subtitle={
            readyToEmail === 0
              ? "No leads queued"
              : `${readyToEmail} researched and waiting for first touch`
          }
          onClick={() => onFilterStatus("ready_to_email")}
          actionLabel={readyToEmail > 0 ? "Send batch →" : undefined}
        />
        <ActionCard
          tone="purple"
          urgency={newToResearch > 0 ? "soon" : "idle"}
          count={newToResearch}
          title="New leads to research"
          subtitle={
            newToResearch === 0
              ? "No new imports waiting"
              : `${newToResearch} just imported, need a once-over before emailing`
          }
          onClick={() => onFilterStatus("new")}
          actionLabel={newToResearch > 0 ? "Triage queue →" : undefined}
        />
      </div>
    </div>
  );
}

function ActionCard({
  tone,
  urgency,
  count,
  title,
  subtitle,
  actionLabel,
  onClick,
}: {
  tone: "emerald" | "amber" | "blue" | "purple";
  urgency: "now" | "soon" | "idle";
  count: number;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onClick?: () => void;
}) {
  const palette = {
    emerald: {
      now: "bg-emerald-50 border-emerald-300",
      soon: "bg-emerald-50/40 border-emerald-200",
      idle: "bg-white border-stone-200",
      countCls: "text-emerald-700",
      linkCls: "text-emerald-700 hover:text-emerald-900",
    },
    amber: {
      now: "bg-amber-50 border-amber-300",
      soon: "bg-amber-50/40 border-amber-200",
      idle: "bg-white border-stone-200",
      countCls: "text-amber-700",
      linkCls: "text-amber-700 hover:text-amber-900",
    },
    blue: {
      now: "bg-blue-50 border-blue-300",
      soon: "bg-blue-50/40 border-blue-200",
      idle: "bg-white border-stone-200",
      countCls: "text-blue-700",
      linkCls: "text-blue-700 hover:text-blue-900",
    },
    purple: {
      now: "bg-purple-50 border-purple-300",
      soon: "bg-purple-50/40 border-purple-200",
      idle: "bg-white border-stone-200",
      countCls: "text-purple-700",
      linkCls: "text-purple-700 hover:text-purple-900",
    },
  } as const;
  const p = palette[tone];
  const wrapperBg = urgency === "now" ? p.now : urgency === "soon" ? p.soon : p.idle;

  return (
    <div className={`rounded p-4 border ${wrapperBg}`}>
      <div className="flex items-baseline gap-2 mb-1">
        <span className={`text-2xl font-bold ${count > 0 ? p.countCls : "text-stone-300"}`}>
          {count}
        </span>
        <span className="text-sm font-semibold text-stone-900">{title}</span>
      </div>
      <p className="text-xs text-stone-600 leading-snug">{subtitle}</p>
      {actionLabel && onClick && (
        <button
          onClick={onClick}
          className={`mt-2 text-xs font-semibold ${p.linkCls}`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="p-12 text-center">
      <Mail size={32} className="mx-auto text-stone-400 mb-3" />
      <h3 className="font-semibold text-stone-900">No leads yet</h3>
      <p className="text-sm text-stone-600 mt-1 mb-5">
        Import a CSV of designers / firms / hospitals, or add leads one at a time.
      </p>
      <div className="flex gap-2 justify-center">
        <Link
          href="/staff/marketing/leads/import"
          className="px-4 py-2 bg-white border border-stone-300 rounded text-sm font-medium inline-flex items-center gap-2"
        >
          <Upload size={16} /> Import CSV
        </Link>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-stone-900 text-white rounded text-sm font-medium inline-flex items-center gap-2"
        >
          <Plus size={16} /> Add one
        </button>
      </div>
    </div>
  );
}

function CreateLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    companyName: "",
    title: "",
    phone: "",
    website: "",
    vertical: "designer",
    source: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/staff/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onCreated();
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={submit} className="p-6 space-y-3">
          <h2 className="text-xl font-bold text-stone-900 mb-2">Add a Lead</h2>
          {err && <div className="p-2 bg-rose-50 text-rose-700 text-sm rounded">{err}</div>}
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
            <Input label="Last name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Input label="Company / firm" value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} />
          <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Input label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
          </div>
          <div>
            <label className="text-xs text-stone-600 block mb-1">Vertical</label>
            <select
              value={form.vertical}
              onChange={(e) => setForm({ ...form, vertical: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded text-sm bg-white"
            >
              {VERTICALS.filter((v) => v.value).map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>
          <Input label="Source (e.g. IIDA Boston, Houzz, referral)" value={form.source} onChange={(v) => setForm({ ...form, source: v })} />
          <div>
            <label className="text-xs text-stone-600 block mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-stone-300 rounded text-sm"
              placeholder="Research notes, why they're a fit, etc."
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-stone-900 text-white rounded text-sm font-medium disabled:opacity-50">
              {saving ? "Saving…" : "Add lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-stone-600 block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-stone-300 rounded text-sm"
      />
    </div>
  );
}

function humanizeStatus(s: string): string {
  return s.replace(/_/g, " ");
}

function NextActionCell({ lead }: { lead: Lead }) {
  const action = computeNextAction(lead);
  if (!action) return <span className="text-stone-400">—</span>;
  return (
    <span className={`inline-block px-2 py-0.5 rounded ${action.cls}`}>
      {action.label}
    </span>
  );
}

function computeNextAction(lead: Lead): { label: string; cls: string } | null {
  // Replied — needs a human response NOW
  if (lead.status === "replied_positive") {
    return { label: "Reply waiting", cls: "bg-emerald-100 text-emerald-900 font-medium" };
  }
  if (lead.status === "replied_negative") {
    return { label: "Decide nurture vs. drop", cls: "bg-rose-100 text-rose-900" };
  }

  // Auto-followup queued
  if (lead.autoFollowupAt && !lead.autoFollowupSent) {
    const ms = new Date(lead.autoFollowupAt).getTime() - Date.now();
    const days = Math.round(ms / (24 * 60 * 60 * 1000));
    if (days <= 0) {
      return { label: "Auto-followup due now", cls: "bg-amber-100 text-amber-900" };
    }
    return { label: `Auto-followup in ${days}d`, cls: "bg-amber-50 text-amber-800" };
  }

  // Pipeline-stage actions
  switch (lead.status) {
    case "new":
      return { label: "Research + email", cls: "bg-blue-50 text-blue-800" };
    case "researching":
      return { label: "Finish research", cls: "bg-purple-50 text-purple-800" };
    case "ready_to_email":
      return { label: "Send first email", cls: "bg-amber-100 text-amber-900 font-medium" };
    case "emailed": {
      // No auto-followup queued — they just sat there. Suggest manual follow-up after 5+ days
      if (lead.emailedAt) {
        const days = Math.floor((Date.now() - new Date(lead.emailedAt).getTime()) / (24 * 60 * 60 * 1000));
        if (days >= 7) return { label: `Follow up (${days}d cold)`, cls: "bg-orange-100 text-orange-900" };
      }
      return { label: "Wait for reply", cls: "bg-stone-100 text-stone-700" };
    }
    case "followed_up":
      return { label: "Wait for reply", cls: "bg-stone-100 text-stone-700" };
    case "no_reply":
      return { label: "Final follow-up or drop", cls: "bg-rose-50 text-rose-800" };
    case "qualified":
      return { label: "Move to close", cls: "bg-yellow-100 text-yellow-900 font-medium" };
    case "customer":
      return { label: "Convert to customer record", cls: "bg-green-100 text-green-900" };
    case "unsubscribed":
    case "bounced":
      return null;
    default:
      return null;
  }
}

function humanizeVertical(v: string): string {
  return v.replace(/_/g, " ");
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 30) return new Date(iso).toLocaleDateString();
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}
