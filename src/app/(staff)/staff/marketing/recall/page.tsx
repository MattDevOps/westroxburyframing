"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Campaign = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  enabled: boolean;
  lastRunAt: string | null;
  perRunCap: number;
  pendingCount: number;
  _count: { sends: number };
};

type Send = {
  id: string;
  status: string;
  renderedSubject: string;
  renderedBodyHtml: string;
  renderedBodyText: string | null;
  draftedAt: string;
  campaign: { id: string; name: string; slug: string };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  };
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function fmtWindow(c: Campaign) {
  return `${MONTHS[c.startMonth - 1]} ${c.startDay} – ${MONTHS[c.endMonth - 1]} ${c.endDay}`;
}

export default function RecallCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sends, setSends] = useState<Send[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewSend, setPreviewSend] = useState<Send | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function loadAll() {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        fetch("/staff/api/recall-campaigns"),
        fetch("/staff/api/recall-campaigns/sends?status=pending_review"),
      ]);
      const cData = await cRes.json();
      const sData = await sRes.json();
      setCampaigns(cData.campaigns || []);
      setSends(sData.sends || []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadAll();
  }, []);

  async function toggleEnabled(c: Campaign) {
    setBusy(true);
    setMsg(null);
    try {
      await fetch(`/staff/api/recall-campaigns/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !c.enabled }),
      });
      await loadAll();
    } finally {
      setBusy(false);
    }
  }

  async function actOne(sendId: string, action: "approve" | "discard") {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(
        `/staff/api/recall-campaigns/sends/${sendId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setMsg(`Error: ${data.error}`);
      } else {
        setMsg(action === "approve" ? "Sent." : "Discarded.");
        if (previewSend?.id === sendId) setPreviewSend(null);
        await loadAll();
      }
    } finally {
      setBusy(false);
    }
  }

  async function actBulk(action: "approve" | "discard") {
    if (selected.size === 0) return;
    if (action === "approve") {
      const ok = confirm(
        `Send ${selected.size} email${selected.size === 1 ? "" : "s"} to customers now?`,
      );
      if (!ok) return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(
        `/staff/api/recall-campaigns/sends/bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: Array.from(selected), action }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setMsg(`Error: ${data.error}`);
      } else if (action === "approve") {
        setMsg(
          `Sent ${data.sent}${data.errorCount ? ` (${data.errorCount} failed)` : ""}.`,
        );
      } else {
        setMsg(`Discarded ${data.discarded}.`);
      }
      setSelected(new Set());
      await loadAll();
    } finally {
      setBusy(false);
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }
  function toggleSelectAllPending() {
    if (selected.size === sends.length) setSelected(new Set());
    else setSelected(new Set(sends.map((s) => s.id)));
  }

  if (loading)
    return <div className="p-6 text-neutral-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Customer Recall
          </h1>
          <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
            Calendar-triggered email campaigns to past retail customers. The
            cron drafts personalized emails into the review queue below;
            nothing sends until you approve.
          </p>
        </div>
        <Link
          href="/staff/marketing"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Marketing
        </Link>
      </div>

      {msg && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          {msg}
        </div>
      )}

      {/* Campaigns */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">Campaigns</h2>
        {campaigns.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
            No campaigns yet. Run the seed script to create the four default
            ones, or POST to `/staff/api/recall-campaigns`.
          </div>
        ) : (
          <div className="grid gap-3">
            {campaigns.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-neutral-200 bg-white p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/staff/marketing/recall/${c.id}`}
                      className="font-semibold text-neutral-900 hover:underline"
                    >
                      {c.name}
                    </Link>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${c.enabled ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-neutral-300 bg-neutral-50 text-neutral-600"}`}
                    >
                      {c.enabled ? "Enabled" : "Disabled"}
                    </span>
                    {c.pendingCount > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full border border-amber-300 bg-amber-50 text-amber-700">
                        {c.pendingCount} pending
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    Window {fmtWindow(c)} · cap {c.perRunCap}/run · total
                    drafted {c._count.sends}
                    {c.lastRunAt &&
                      ` · last run ${new Date(c.lastRunAt).toLocaleDateString()}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={busy}
                    onClick={() => toggleEnabled(c)}
                    className={`rounded-xl border px-3 py-1.5 text-sm ${c.enabled ? "border-neutral-300 text-neutral-700 hover:bg-neutral-50" : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                  >
                    {c.enabled ? "Disable" : "Enable"}
                  </button>
                  <Link
                    href={`/staff/marketing/recall/${c.id}`}
                    className="rounded-xl border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Review queue */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Review queue ({sends.length})
          </h2>
          {sends.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAllPending}
                className="text-xs text-blue-600 hover:underline"
              >
                {selected.size === sends.length
                  ? "Clear selection"
                  : "Select all"}
              </button>
              <button
                disabled={busy || selected.size === 0}
                onClick={() => actBulk("approve")}
                className="rounded-xl bg-emerald-600 text-white px-3 py-1.5 text-sm hover:bg-emerald-700 disabled:opacity-40"
              >
                Approve & send ({selected.size})
              </button>
              <button
                disabled={busy || selected.size === 0}
                onClick={() => actBulk("discard")}
                className="rounded-xl border border-red-300 text-red-700 px-3 py-1.5 text-sm hover:bg-red-50 disabled:opacity-40"
              >
                Discard ({selected.size})
              </button>
            </div>
          )}
        </div>

        {sends.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
            Nothing pending. The cron drafts campaigns daily; you can also use
            "Run now" on a campaign's edit page.
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-xs text-neutral-500 uppercase">
                <tr>
                  <th className="px-3 py-2 text-left w-8"></th>
                  <th className="px-3 py-2 text-left">Customer</th>
                  <th className="px-3 py-2 text-left">Campaign</th>
                  <th className="px-3 py-2 text-left">Subject</th>
                  <th className="px-3 py-2 text-left">Drafted</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {sends.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-neutral-100 hover:bg-neutral-50"
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-neutral-900">
                        {s.customer.firstName} {s.customer.lastName}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {s.customer.email || "(no email)"}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-neutral-700">
                      {s.campaign.name}
                    </td>
                    <td className="px-3 py-2 text-neutral-700 max-w-xs truncate">
                      {s.renderedSubject}
                    </td>
                    <td className="px-3 py-2 text-xs text-neutral-500">
                      {new Date(s.draftedAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => setPreviewSend(s)}
                        className="text-xs text-blue-600 hover:underline mr-3"
                      >
                        Preview
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => actOne(s.id, "approve")}
                        className="text-xs text-emerald-700 hover:underline mr-3"
                      >
                        Send
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => actOne(s.id, "discard")}
                        className="text-xs text-red-700 hover:underline"
                      >
                        Discard
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {previewSend && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setPreviewSend(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-neutral-200 p-4 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <div className="text-xs text-neutral-500">
                  To {previewSend.customer.email}
                </div>
                <div className="font-semibold text-neutral-900">
                  {previewSend.renderedSubject}
                </div>
              </div>
              <button
                onClick={() => setPreviewSend(null)}
                className="text-sm text-neutral-500 hover:text-neutral-900"
              >
                ✕
              </button>
            </div>
            <div
              className="p-4"
              dangerouslySetInnerHTML={{ __html: previewSend.renderedBodyHtml }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
