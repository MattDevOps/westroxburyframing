"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Send, Trash2, Save, Check, AlertTriangle, ExternalLink } from "lucide-react";

interface Draft {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  title: string | null;
  companyName: string | null;
  website: string | null;
  vertical: string;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  emailedAt: string | null;
  followUpCount: number;
  draftSubject: string;
  draftBody: string;
  draftMode: string | null;
  draftSource: string | null;
  draftCreatedAt: string;
}

type RowState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "sending" }
  | { kind: "discarding" }
  | { kind: "sent" }
  | { kind: "discarded" }
  | { kind: "error"; message: string };

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/staff/api/leads/drafts", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setDrafts(data.drafts || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load drafts");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function removeDraftLocal(id: string) {
    setDrafts((cur) => (cur ? cur.filter((d) => d.id !== id) : cur));
  }

  if (error) return <div className="p-6 text-rose-700">{error}</div>;
  if (drafts === null)
    return (
      <div className="p-6 text-stone-500 inline-flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading drafts…
      </div>
    );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-stone-900">Email Drafts</h1>
        <p className="mt-1 text-sm text-stone-600">
          Review and edit pending outbound emails before they go out. Drafts are created by bulk-send and the
          lead-followups cron. Nothing on this page sends until you click Approve.
        </p>
      </header>

      <div className="text-sm text-stone-700 bg-white border border-stone-200 rounded px-4 py-3">
        <strong>{drafts.length}</strong> draft{drafts.length === 1 ? "" : "s"} pending
      </div>

      {drafts.length === 0 ? (
        <div className="rounded-md border border-stone-200 bg-stone-50 p-8 text-center text-sm text-stone-600">
          Nothing waiting. When bulk-send or the cron creates drafts, they&apos;ll appear here.
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((d) => (
            <DraftCard key={d.id} draft={d} onResolved={() => removeDraftLocal(d.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function DraftCard({ draft, onResolved }: { draft: Draft; onResolved: () => void }) {
  const [subject, setSubject] = useState(draft.draftSubject);
  const [body, setBody] = useState(draft.draftBody);
  const [state, setState] = useState<RowState>({ kind: "idle" });

  const dirty = subject !== draft.draftSubject || body !== draft.draftBody;

  async function saveDraft() {
    setState({ kind: "saving" });
    try {
      const res = await fetch(`/staff/api/leads/${draft.id}/draft`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setState({ kind: "idle" });
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : "Save failed" });
    }
  }

  async function send() {
    if (!confirm(`Send to ${draft.email}?`)) return;
    setState({ kind: "sending" });
    try {
      const res = await fetch(`/staff/api/leads/${draft.id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          outboundKind: draft.draftSource === "cron-followup" ? "auto_followup" : "ai_drafted",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setState({ kind: "sent" });
      setTimeout(onResolved, 600);
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : "Send failed" });
    }
  }

  async function discard() {
    if (!confirm("Discard this draft? The lead won't be emailed.")) return;
    setState({ kind: "discarding" });
    try {
      const res = await fetch(`/staff/api/leads/${draft.id}/draft`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setState({ kind: "discarded" });
      setTimeout(onResolved, 400);
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : "Discard failed" });
    }
  }

  const fullName =
    [draft.firstName, draft.lastName].filter(Boolean).join(" ") || draft.email || "(unnamed)";
  const location = [draft.city, draft.neighborhood, draft.state].filter(Boolean).join(", ");
  const sourceBadge =
    draft.draftSource === "cron-followup"
      ? "auto-followup draft"
      : draft.draftSource === "bulk-send"
        ? "bulk draft"
        : draft.draftSource || "draft";

  const busy = state.kind === "saving" || state.kind === "sending" || state.kind === "discarding";
  const done = state.kind === "sent" || state.kind === "discarded";

  return (
    <div className={`rounded-md border bg-white p-5 ${done ? "opacity-50" : "border-stone-200"}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/staff/marketing/leads/${draft.id}`}
              className="text-base font-semibold text-stone-900 hover:underline inline-flex items-center gap-1"
            >
              {fullName} <ExternalLink size={12} className="text-stone-400" />
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              {sourceBadge}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              {draft.draftMode === "followup" ? `follow-up #${draft.followUpCount + 1}` : "first touch"}
            </span>
          </div>
          <div className="mt-1 text-xs text-stone-600 flex flex-wrap gap-x-3 gap-y-0.5">
            {draft.companyName && <span>{draft.companyName}</span>}
            {draft.title && <span>· {draft.title}</span>}
            <span>· {draft.vertical}</span>
            {location && <span>· {location}</span>}
            <span>· to {draft.email || "(no email)"}</span>
            <span className="text-stone-400">
              · drafted {new Date(draft.draftCreatedAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-stone-600 block mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded text-sm"
            disabled={busy || done}
          />
        </div>
        <div>
          <label className="text-xs text-stone-600 block mb-1">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border border-stone-300 rounded text-sm font-mono"
            disabled={busy || done}
          />
        </div>
      </div>

      {state.kind === "error" && (
        <div className="mt-3 text-sm text-rose-700 inline-flex items-center gap-2">
          <AlertTriangle size={14} /> {state.message}
        </div>
      )}

      {state.kind === "sent" && (
        <div className="mt-3 text-sm text-emerald-700 inline-flex items-center gap-2">
          <Check size={14} /> Sent.
        </div>
      )}
      {state.kind === "discarded" && (
        <div className="mt-3 text-sm text-stone-600 inline-flex items-center gap-2">
          <Check size={14} /> Discarded.
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-end mt-4 pt-3 border-t border-stone-100">
        <button
          onClick={discard}
          disabled={busy || done}
          className="px-3 py-1.5 text-sm text-rose-600 hover:text-rose-800 inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <Trash2 size={14} /> Discard
        </button>
        {dirty && !done && (
          <button
            onClick={saveDraft}
            disabled={busy}
            className="px-3 py-1.5 text-sm bg-white border border-stone-300 rounded hover:bg-stone-50 inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {state.kind === "saving" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save edits
          </button>
        )}
        <button
          onClick={send}
          disabled={busy || done || !draft.email}
          className="px-4 py-1.5 text-sm bg-stone-900 text-white rounded hover:bg-stone-800 inline-flex items-center gap-1.5 disabled:opacity-50"
          title={!draft.email ? "No email address on this lead" : ""}
        >
          {state.kind === "sending" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Approve & send
        </button>
      </div>
    </div>
  );
}
