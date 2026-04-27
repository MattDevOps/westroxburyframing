"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, Plus, Upload, Mail, Filter } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [vertical, setVertical] = useState("");
  const [status, setStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <div className="flex gap-2">
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

        {/* Pipeline summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <SummaryCard label="Total" value={totalLeads} />
          <SummaryCard label="New / unprocessed" value={newCount} accent="text-blue-700" />
          <SummaryCard label="Emailed (awaiting)" value={emailedCount} accent="text-slate-700" />
          <SummaryCard label="Replied" value={repliedCount} accent="text-emerald-700" />
          <SummaryCard label="Converted" value={customerCount} accent="text-green-700" />
        </div>

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
                  <th className="px-4 py-3 text-left">Name / Company</th>
                  <th className="px-4 py-3 text-left">Vertical</th>
                  <th className="px-4 py-3 text-left">Status</th>
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
