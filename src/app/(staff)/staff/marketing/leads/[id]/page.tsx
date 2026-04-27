"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mail, MessageSquare, Save, Trash2, ExternalLink, Phone, Building, Globe } from "lucide-react";

type LeadEmailRecord = {
  id: string;
  direction: "outbound" | "inbound";
  subject: string;
  body: string;
  fromAddr: string | null;
  toAddr: string | null;
  outboundKind: string | null;
  classification: string | null;
  createdAt: string;
  sentBy: { id: string; name: string } | null;
};

type Lead = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  companyName: string | null;
  website: string | null;
  linkedinUrl: string | null;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  vertical: string;
  status: string;
  source: string | null;
  notes: string | null;
  emailSubject: string | null;
  emailBody: string | null;
  emailedAt: string | null;
  repliedAt: string | null;
  replyText: string | null;
  replyClassification: string | null;
  followUpCount: number;
  lastFollowUpAt: string | null;
  nextFollowUpAt: string | null;
  autoFollowupAt: string | null;
  autoFollowupSent: boolean;
  convertedCustomerId: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: string; name: string } | null;
  convertedCustomer: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null;
  emails: LeadEmailRecord[];
};

const VERTICALS = [
  { value: "designer", label: "Interior designer" },
  { value: "law_firm", label: "Law firm" },
  { value: "photographer", label: "Photographer" },
  { value: "hospital", label: "Hospital" },
  { value: "hotel", label: "Hotel" },
  { value: "gallery", label: "Gallery" },
  { value: "school", label: "School / alumni" },
  { value: "funeral_home", label: "Funeral home" },
  { value: "real_estate_stager", label: "Real-estate stager" },
  { value: "corporate", label: "Corporate" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  "new",
  "researching",
  "ready_to_email",
  "emailed",
  "followed_up",
  "replied_positive",
  "replied_negative",
  "no_reply",
  "qualified",
  "customer",
  "unsubscribed",
  "bounced",
];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [showLogReply, setShowLogReply] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/staff/api/leads/${leadId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setLead(data.lead);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(updates: Partial<Lead>) {
    setSaving(true);
    try {
      const res = await fetch(`/staff/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setLead(data.lead);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteLead() {
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    const res = await fetch(`/staff/api/leads/${leadId}`, { method: "DELETE" });
    if (res.ok) router.push("/staff/marketing/leads");
    else alert("Delete failed");
  }

  if (loading) return <div className="p-12 text-center text-stone-500">Loading…</div>;
  if (error || !lead) return <div className="p-12 text-center text-rose-600">{error || "Not found"}</div>;

  const displayName =
    [lead.firstName, lead.lastName].filter(Boolean).join(" ") ||
    lead.companyName ||
    lead.email ||
    "(unnamed lead)";

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Link href="/staff/marketing/leads" className="text-sm text-stone-500 hover:text-stone-900">
              ← All leads
            </Link>
            <h1 className="text-3xl font-bold text-stone-900 mt-1">{displayName}</h1>
            <div className="text-stone-600 text-sm mt-1 flex flex-wrap gap-x-3 gap-y-1">
              {lead.companyName && (lead.firstName || lead.lastName) && <span>{lead.companyName}</span>}
              {lead.title && <span>· {lead.title}</span>}
              {lead.city && <span>· {lead.city}{lead.state ? `, ${lead.state}` : ""}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCompose(true)}
              disabled={!lead.email}
              title={!lead.email ? "Add an email address first" : ""}
              className="px-4 py-2 bg-stone-900 text-white rounded text-sm font-medium hover:bg-stone-800 inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Mail size={16} /> {lead.emailedAt ? "Send Follow-Up" : "Compose Email"}
            </button>
            <button
              onClick={() => setShowLogReply(true)}
              className="px-4 py-2 bg-white border border-stone-300 rounded text-sm font-medium hover:bg-stone-50 inline-flex items-center gap-2"
            >
              <MessageSquare size={16} /> Log Reply
            </button>
          </div>
        </div>

        {/* Status row */}
        <div className="bg-white border border-stone-200 rounded p-4 mb-4 grid sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">Status</div>
            <select
              value={lead.status}
              onChange={(e) => save({ status: e.target.value })}
              className="w-full px-2 py-1 border border-stone-300 rounded text-sm bg-white"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">Vertical</div>
            <select
              value={lead.vertical}
              onChange={(e) => save({ vertical: e.target.value })}
              className="w-full px-2 py-1 border border-stone-300 rounded text-sm bg-white"
            >
              {VERTICALS.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">Emailed</div>
            <div className="text-stone-900">
              {lead.emailedAt ? new Date(lead.emailedAt).toLocaleDateString() : "—"}
              {lead.followUpCount > 0 && (
                <span className="text-stone-500 text-xs ml-2">+{lead.followUpCount} follow-up</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">Replied</div>
            <div className="text-stone-900">
              {lead.repliedAt ? new Date(lead.repliedAt).toLocaleDateString() : "—"}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left: contact & details */}
          <div className="lg:col-span-1 space-y-4">
            <DetailsCard lead={lead} onSave={save} saving={saving} />
            <NotesCard lead={lead} onSave={save} saving={saving} />
            <DangerCard onDelete={deleteLead} />
          </div>

          {/* Right: email thread */}
          <div className="lg:col-span-2 space-y-4">
            <ThreadCard lead={lead} />
            {lead.autoFollowupAt && !lead.autoFollowupSent && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-900">
                <strong>Auto-followup scheduled</strong> for{" "}
                {new Date(lead.autoFollowupAt).toLocaleString()}.{" "}
                <button
                  className="underline hover:no-underline"
                  onClick={() => save({ autoFollowupAt: null } as Partial<Lead>)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {showCompose && (
          <ComposeModal
            lead={lead}
            onClose={() => setShowCompose(false)}
            onSent={() => {
              setShowCompose(false);
              load();
            }}
          />
        )}
        {showLogReply && (
          <LogReplyModal
            leadId={lead.id}
            onClose={() => setShowLogReply(false)}
            onLogged={() => {
              setShowLogReply(false);
              load();
            }}
          />
        )}
      </div>
    </div>
  );
}

function DetailsCard({ lead, onSave, saving }: { lead: Lead; onSave: (u: Partial<Lead>) => void; saving: boolean }) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    firstName: lead.firstName || "",
    lastName: lead.lastName || "",
    email: lead.email || "",
    phone: lead.phone || "",
    title: lead.title || "",
    companyName: lead.companyName || "",
    website: lead.website || "",
    linkedinUrl: lead.linkedinUrl || "",
    city: lead.city || "",
    state: lead.state || "",
    neighborhood: lead.neighborhood || "",
    source: lead.source || "",
  });

  if (!edit) {
    return (
      <div className="bg-white border border-stone-200 rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-stone-900 text-sm">Contact</h3>
          <button onClick={() => setEdit(true)} className="text-xs text-stone-500 hover:text-stone-900">Edit</button>
        </div>
        <dl className="text-sm space-y-2">
          {lead.email && (
            <Row icon={<Mail size={14} />}><a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a></Row>
          )}
          {lead.phone && <Row icon={<Phone size={14} />}><a href={`tel:${lead.phone}`}>{lead.phone}</a></Row>}
          {lead.companyName && <Row icon={<Building size={14} />}>{lead.companyName}</Row>}
          {lead.website && (
            <Row icon={<Globe size={14} />}>
              <a href={normalizeUrl(lead.website)} target="_blank" rel="noopener" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                {lead.website} <ExternalLink size={12} />
              </a>
            </Row>
          )}
          {lead.linkedinUrl && (
            <Row icon={<ExternalLink size={14} />}>
              <a href={normalizeUrl(lead.linkedinUrl)} target="_blank" rel="noopener" className="text-blue-600 hover:underline">LinkedIn</a>
            </Row>
          )}
          {lead.source && (
            <Row icon={null}><span className="text-stone-500 text-xs uppercase tracking-wide mr-2">Source</span>{lead.source}</Row>
          )}
        </dl>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded p-4">
      <h3 className="font-semibold text-stone-900 text-sm mb-3">Edit Contact</h3>
      <div className="space-y-2">
        {(["firstName", "lastName", "email", "phone", "title", "companyName", "website", "linkedinUrl", "city", "state", "neighborhood", "source"] as const).map((field) => (
          <div key={field}>
            <label className="text-xs text-stone-600 block mb-0.5">{field}</label>
            <input
              type="text"
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="w-full px-2 py-1 border border-stone-300 rounded text-sm"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3 justify-end">
        <button onClick={() => setEdit(false)} className="px-3 py-1.5 text-sm text-stone-600">Cancel</button>
        <button
          onClick={async () => {
            await onSave(form);
            setEdit(false);
          }}
          disabled={saving}
          className="px-3 py-1.5 bg-stone-900 text-white rounded text-sm inline-flex items-center gap-1 disabled:opacity-50"
        >
          <Save size={14} /> Save
        </button>
      </div>
    </div>
  );
}

function NotesCard({ lead, onSave, saving }: { lead: Lead; onSave: (u: Partial<Lead>) => void; saving: boolean }) {
  const [notes, setNotes] = useState(lead.notes || "");
  const [edit, setEdit] = useState(false);

  if (!edit) {
    return (
      <div className="bg-white border border-stone-200 rounded p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-stone-900 text-sm">Notes</h3>
          <button onClick={() => setEdit(true)} className="text-xs text-stone-500 hover:text-stone-900">Edit</button>
        </div>
        <p className="text-sm text-stone-700 whitespace-pre-wrap">
          {lead.notes || <span className="text-stone-400 italic">No notes yet — research, intel, why they're a fit.</span>}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded p-4">
      <h3 className="font-semibold text-stone-900 text-sm mb-2">Notes</h3>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={6}
        className="w-full px-2 py-1 border border-stone-300 rounded text-sm"
      />
      <div className="flex gap-2 mt-2 justify-end">
        <button onClick={() => { setNotes(lead.notes || ""); setEdit(false); }} className="px-3 py-1.5 text-sm text-stone-600">Cancel</button>
        <button
          onClick={async () => {
            await onSave({ notes });
            setEdit(false);
          }}
          disabled={saving}
          className="px-3 py-1.5 bg-stone-900 text-white rounded text-sm inline-flex items-center gap-1 disabled:opacity-50"
        >
          <Save size={14} /> Save
        </button>
      </div>
    </div>
  );
}

function ThreadCard({ lead }: { lead: Lead }) {
  const emails = lead.emails || [];

  if (emails.length === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded p-4">
        <h3 className="font-semibold text-stone-900 text-sm mb-2">Email thread</h3>
        <p className="text-sm text-stone-500">
          No emails yet. Click <strong>Compose Email</strong> above to start the thread.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-stone-900 text-sm">
          Email thread — {emails.length} message{emails.length > 1 ? "s" : ""}
        </h3>
      </div>
      {emails.map((email) => (
        <ThreadMessage key={email.id} email={email} lead={lead} />
      ))}
    </div>
  );
}

function ThreadMessage({ email, lead }: { email: LeadEmailRecord; lead: Lead }) {
  const isOutbound = email.direction === "outbound";
  const wrapperCls = isOutbound
    ? "bg-white border border-stone-200"
    : "bg-emerald-50 border border-emerald-200";
  const labelCls = isOutbound ? "text-stone-700" : "text-emerald-900";

  const senderLabel = isOutbound
    ? `Sent by ${email.sentBy?.name || "Jake"} (${email.fromAddr || "us"}) → ${email.toAddr || lead.email || ""}`
    : `Reply from ${email.fromAddr || lead.email || "lead"}`;

  return (
    <div className={`${wrapperCls} rounded p-4`}>
      <div className="flex items-start justify-between mb-2 text-xs">
        <div>
          <span className={`font-semibold ${labelCls}`}>
            {isOutbound ? "→ Outbound" : "← Inbound"}
          </span>
          {email.outboundKind && (
            <span className="ml-2 text-stone-500">({email.outboundKind.replace(/_/g, " ")})</span>
          )}
          {email.classification && (
            <span className="ml-2 text-stone-500">({email.classification})</span>
          )}
        </div>
        <div className="text-stone-500">{new Date(email.createdAt).toLocaleString()}</div>
      </div>
      <div className="text-xs text-stone-500 mb-2">{senderLabel}</div>
      <div className="font-medium text-stone-900 text-sm mb-2">Subject: {email.subject}</div>
      <div className="text-stone-700 text-sm whitespace-pre-wrap">{email.body}</div>
    </div>
  );
}

function DangerCard({ onDelete }: { onDelete: () => void }) {
  return (
    <div className="bg-white border border-rose-200 rounded p-4">
      <button onClick={onDelete} className="text-rose-600 hover:text-rose-800 text-sm inline-flex items-center gap-2">
        <Trash2 size={14} /> Delete this lead
      </button>
    </div>
  );
}

function ComposeModal({ lead, onClose, onSent }: { lead: Lead; onClose: () => void; onSent: () => void }) {
  const isFollowUp = Boolean(lead.emailedAt);
  const [subject, setSubject] = useState(defaultSubject(lead, isFollowUp));
  const [body, setBody] = useState(defaultBody(lead, isFollowUp));
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [autoFollowupDays, setAutoFollowupDays] = useState<number>(isFollowUp ? 0 : 5);
  const [err, setErr] = useState<string | null>(null);

  async function send() {
    if (!confirm(`Send to ${lead.email}?`)) return;
    setSending(true);
    setErr(null);
    try {
      const res = await fetch(`/staff/api/leads/${lead.id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, autoFollowupDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      onSent();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  async function draftWithAi() {
    setDrafting(true);
    setErr(null);
    try {
      const res = await fetch(`/staff/api/leads/${lead.id}/draft-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: isFollowUp ? "followup" : "first_touch" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI drafting failed");
      if (data.subject) setSubject(data.subject);
      if (data.body) setBody(data.body);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "AI drafting failed");
    } finally {
      setDrafting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-xl font-bold text-stone-900">
              {isFollowUp ? "Send Follow-Up" : "Compose Outreach"}
            </h2>
            <button
              onClick={draftWithAi}
              disabled={drafting}
              title={
                lead.website
                  ? "Use Claude to research their website and draft a personalized email"
                  : "Use Claude to draft a personalized email (no website to research)"
              }
              className="px-3 py-1.5 bg-purple-50 text-purple-800 border border-purple-200 rounded text-xs font-medium hover:bg-purple-100 disabled:opacity-50 inline-flex items-center gap-1"
            >
              {drafting ? "Drafting…" : "✨ Draft with AI"}
            </button>
          </div>
          <p className="text-sm text-stone-600 mb-4">To: <strong>{lead.email}</strong></p>
          {err && <div className="p-2 bg-rose-50 text-rose-700 text-sm rounded mb-3">{err}</div>}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-stone-600 block mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-stone-600 block mb-1">Body (plain text)</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={16}
                className="w-full px-3 py-2 border border-stone-300 rounded text-sm font-mono"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-700 bg-stone-50 border border-stone-200 rounded p-3">
              <span>Auto-send a follow-up</span>
              <select
                value={autoFollowupDays}
                onChange={(e) => setAutoFollowupDays(Number(e.target.value))}
                className="px-2 py-1 border border-stone-300 rounded text-xs bg-white"
              >
                <option value={0}>No auto-followup</option>
                <option value={3}>in 3 days</option>
                <option value={5}>in 5 days</option>
                <option value={7}>in 7 days</option>
                <option value={14}>in 14 days</option>
              </select>
              <span>if no reply.</span>
            </div>
            <p className="text-xs text-stone-500">
              Sent as plain text from <code>jake@westroxburyframing.com</code> (or <code>OUTREACH_FROM</code> env var) — no branded HTML, reads as a personal note.
            </p>
          </div>
          <div className="flex gap-2 justify-end mt-5 pt-4 border-t border-stone-200">
            <button onClick={onClose} className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900">Cancel</button>
            <button
              onClick={send}
              disabled={sending}
              className="px-4 py-2 bg-stone-900 text-white rounded text-sm font-medium disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogReplyModal({ leadId, onClose, onLogged }: { leadId: string; onClose: () => void; onLogged: () => void }) {
  const [replyText, setReplyText] = useState("");
  const [classification, setClassification] = useState("positive");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!replyText.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/staff/api/leads/${leadId}/log-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText, classification }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onLogged();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow-xl max-w-lg w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold text-stone-900 mb-3">Log a Reply</h2>
          {err && <div className="p-2 bg-rose-50 text-rose-700 text-sm rounded mb-3">{err}</div>}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-stone-600 block mb-1">Their reply (paste it here)</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-stone-300 rounded text-sm"
                placeholder="Paste the email body they sent back…"
              />
            </div>
            <div>
              <label className="text-xs text-stone-600 block mb-1">Tone</label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded text-sm bg-white"
              >
                <option value="positive">Positive — interested or asking questions</option>
                <option value="neutral">Neutral / acknowledging</option>
                <option value="needs_followup">Needs follow-up — punted</option>
                <option value="negative">Negative — not interested / unsubscribe</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-5 pt-4 border-t border-stone-200">
            <button onClick={onClose} className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900">Cancel</button>
            <button
              onClick={submit}
              disabled={saving || !replyText.trim()}
              className="px-4 py-2 bg-stone-900 text-white rounded text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Saving…" : "Log Reply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {icon && <span className="text-stone-400 shrink-0">{icon}</span>}
      <span className="text-stone-700">{children}</span>
    </div>
  );
}

function normalizeUrl(u: string): string {
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `https://${u}`;
}

function defaultSubject(lead: Lead, isFollowUp: boolean): string {
  const company = lead.companyName || "your firm";
  if (isFollowUp) return `Following up — West Roxbury Framing & ${company}`;
  return `Quick intro — West Roxbury Framing`;
}

function defaultBody(lead: Lead, isFollowUp: boolean): string {
  const greeting = lead.firstName ? `Hi ${lead.firstName},` : "Hi,";
  const company = lead.companyName ? lead.companyName : "your studio";

  if (isFollowUp) {
    return `${greeting}

Wanted to circle back on my earlier note. No pressure if framing isn't a current need — just letting you know we're here when it is.

If you'd like to stop by the shop sometime to see the work in person, the door is open Mon–Fri 9:30–6 at 1741 Centre Street, West Roxbury.

Best,
Jake
West Roxbury Framing
(617) 327-3890
westroxburyframing.com
`;
  }

  return `${greeting}

I'm Jake, second-generation owner of West Roxbury Framing — a custom picture framing shop in West Roxbury that's been working with Boston-area designers, hotels, hospitals, and law firms for over 40 years.

I came across ${company} and wanted to introduce myself. We do museum-quality custom framing, conservation framing, shadow boxes, canvas stretching, and matched-moulding installations — the kind of work that holds up across an office or a curated space.

A few things designers and firms tend to like about working with us:

- We match moulding lines years later so new pieces blend with existing installations
- Volume pricing on projects of 10+ pieces, Net-30 for established accounts
- Single point of contact for the duration of every project
- Pickup, delivery, and on-site install across Greater Boston

If framing is something ${company} handles regularly — for client homes, the office itself, or anything in between — I'd love to put a portfolio in front of you. Stop by the shop anytime, or reply to this email and we'll set something up.

Either way, glad to introduce myself.

Best,
Jake
West Roxbury Framing
1741 Centre Street, West Roxbury, MA 02132
(617) 327-3890
westroxburyframing.com
`;
}
