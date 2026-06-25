"use client";

import { useState, useEffect, useCallback } from "react";

interface Reply {
  id: string;
  direction: string;
  fromUserName: string | null;
  body: string;
  emailOk: boolean;
  emailError: string | null;
  createdAt: string;
}

interface CustomerMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  body: string;
  source: string;
  orderNumber: string | null;
  status: string;
  spamReason: string | null;
  read: boolean;
  createdAt: string;
  replies?: Reply[];
  _count?: { replies: number };
}

type Tab = "active" | "spam" | "archived";

const SOURCE_LABEL: Record<string, string> = {
  contact_form: "Contact form",
  quote_request: "Quote request",
};

export default function CustomerInboxPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CustomerMessage | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/staff/api/inbox?status=${tab}`);
      if (!res.ok) throw new Error("Failed to load inbox");
      const data = await res.json();
      setMessages(data.messages || []);
      setCounts(data.counts || {});
    } catch (e) {
      console.error("Error loading inbox:", e);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  async function openMessage(m: CustomerMessage) {
    setReply("");
    setActionError(null);
    try {
      const res = await fetch(`/staff/api/inbox/${m.id}`);
      if (!res.ok) throw new Error("Failed to load message");
      const data = await res.json();
      setSelected(data.message);
      // refresh list so the unread dot clears
      if (!m.read) loadList();
    } catch (e) {
      console.error(e);
    }
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    setSending(true);
    setActionError(null);
    try {
      const res = await fetch(`/staff/api/inbox/${selected.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reply");
      setReply("");
      // reload the thread + list
      await openMessage({ ...selected, read: true });
      loadList();
    } catch (e: any) {
      setActionError(e.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  async function setStatus(status: string) {
    if (!selected) return;
    setActionError(null);
    try {
      const res = await fetch(`/staff/api/inbox/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update");
      }
      setSelected(null);
      loadList();
    } catch (e: any) {
      setActionError(e.message || "Failed to update");
    }
  }

  const tabs: Array<{ key: Tab; label: string; badge?: number }> = [
    { key: "active", label: "Inbox", badge: counts.unread },
    { key: "spam", label: "Spam", badge: counts.spam },
    { key: "archived", label: "Archived" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customer Inbox</h1>
          <p className="text-sm text-neutral-500">
            Messages from the website Contact form and quote requests. Reply by email right here.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setSelected(null);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-black text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            {t.label}
            {t.badge ? (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  tab === t.key ? "bg-white text-black" : "bg-neutral-300 text-neutral-800"
                }`}
              >
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            {loading ? (
              <div className="p-4 text-center text-neutral-500">Loading...</div>
            ) : messages.length === 0 ? (
              <div className="p-6 text-center text-neutral-500 text-sm">No messages here.</div>
            ) : (
              <div className="divide-y divide-neutral-100 max-h-[640px] overflow-y-auto">
                {messages.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => openMessage(m)}
                    className={`w-full text-left p-4 hover:bg-neutral-50 transition-colors ${
                      selected?.id === m.id ? "bg-blue-50" : ""
                    } ${!m.read ? "font-semibold" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-sm text-neutral-900 truncate">{m.name}</span>
                      {!m.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] uppercase tracking-wide text-neutral-400">
                        {SOURCE_LABEL[m.source] || m.source}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-600 truncate font-normal">
                      {m.body.replace(/\n+/g, " ")}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="mb-4 pb-4 border-b border-neutral-200">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="text-xl font-bold">{selected.name}</h2>
                  <span className="text-[11px] uppercase tracking-wide text-neutral-400 shrink-0 mt-1.5">
                    {SOURCE_LABEL[selected.source] || selected.source}
                  </span>
                </div>
                <div className="text-sm text-neutral-600 space-y-0.5">
                  <div>
                    <span className="font-medium">Email:</span>{" "}
                    {selected.email ? (
                      <a href={`mailto:${selected.email}`} className="text-amber-700">{selected.email}</a>
                    ) : (
                      <span className="text-neutral-400">none provided</span>
                    )}
                  </div>
                  {selected.phone && (
                    <div>
                      <span className="font-medium">Phone:</span>{" "}
                      <a href={`tel:${selected.phone}`} className="text-amber-700">{selected.phone}</a>
                    </div>
                  )}
                  {selected.orderNumber && (
                    <div>
                      <span className="font-medium">Order:</span> {selected.orderNumber}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Received:</span>{" "}
                    {new Date(selected.createdAt).toLocaleString()}
                  </div>
                  {selected.spamReason && (
                    <div className="text-orange-700">
                      <span className="font-medium">Flagged as spam:</span> {selected.spamReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Original message */}
              <div className="rounded-lg bg-neutral-50 border border-neutral-100 p-4 mb-4">
                <p className="whitespace-pre-wrap text-neutral-800 text-sm">{selected.body}</p>
              </div>

              {/* Reply thread */}
              {selected.replies && selected.replies.length > 0 && (
                <div className="space-y-3 mb-4">
                  {selected.replies.map((r) => (
                    <div
                      key={r.id}
                      className={`rounded-lg p-4 text-sm ${
                        r.direction === "outbound"
                          ? "bg-blue-50 border border-blue-100"
                          : "bg-neutral-50 border border-neutral-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 text-xs text-neutral-500">
                        <span className="font-medium">
                          {r.direction === "outbound"
                            ? `${r.fromUserName || "Staff"} → ${selected.name}`
                            : `${selected.name} replied`}
                        </span>
                        <span>{new Date(r.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-neutral-800">{r.body}</p>
                      {r.direction === "outbound" && !r.emailOk && (
                        <p className="mt-2 text-xs text-red-600">
                          ⚠ Email failed: {r.emailError || "unknown error"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {actionError && (
                <div className="mb-3 rounded-lg bg-red-50 text-red-700 text-sm p-3 border border-red-200">
                  {actionError}
                </div>
              )}

              {/* Reply box */}
              {selected.email ? (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Reply by email
                  </label>
                  <textarea
                    rows={5}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={`Write a reply to ${selected.name}...`}
                    className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="text-xs text-neutral-400 mt-1">
                    Sends from West Roxbury Framing; their reply comes back to your shop inbox.
                  </div>
                </div>
              ) : (
                <div className="mb-3 text-sm text-neutral-500">
                  No email address on file — follow up by phone.
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {selected.email && (
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    className="rounded-xl bg-black px-5 py-2 text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? "Sending..." : "Send reply"}
                  </button>
                )}
                {selected.status !== "archived" && (
                  <button
                    onClick={() => setStatus("archived")}
                    className="rounded-xl border border-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-50"
                  >
                    Archive
                  </button>
                )}
                {selected.status === "spam" ? (
                  <button
                    onClick={() => setStatus("new")}
                    className="rounded-xl border border-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-50"
                  >
                    Not spam
                  </button>
                ) : (
                  <button
                    onClick={() => setStatus("spam")}
                    className="rounded-xl border border-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-50"
                  >
                    Mark spam
                  </button>
                )}
                {selected.status === "archived" && (
                  <button
                    onClick={() => setStatus("new")}
                    className="rounded-xl border border-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-50"
                  >
                    Restore to inbox
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center text-neutral-500">
              <p className="text-lg mb-2">Select a message</p>
              <p className="text-sm">Choose a message on the left to read and reply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
