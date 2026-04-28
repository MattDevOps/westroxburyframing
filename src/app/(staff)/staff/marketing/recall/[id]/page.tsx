"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
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
  segmentRule: Record<string, unknown>;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  enabled: boolean;
  perRunCap: number;
  lastRunAt: string | null;
};

export default function EditRecallCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [c, setC] = useState<Campaign | null>(null);
  const [segmentRuleText, setSegmentRuleText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/staff/api/recall-campaigns/${id}`);
    const data = await res.json();
    if (res.ok) {
      setC(data.campaign);
      setSegmentRuleText(JSON.stringify(data.campaign.segmentRule, null, 2));
    } else {
      setMsg(data.error || "Failed to load");
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function save() {
    if (!c) return;
    setBusy(true);
    setMsg(null);
    let segmentRule: unknown;
    try {
      segmentRule = JSON.parse(segmentRuleText || "{}");
    } catch {
      setMsg("Segment rule is not valid JSON");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch(`/staff/api/recall-campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: c.name,
          description: c.description,
          subject: c.subject,
          bodyHtml: c.bodyHtml,
          bodyText: c.bodyText,
          startMonth: c.startMonth,
          startDay: c.startDay,
          endMonth: c.endMonth,
          endDay: c.endDay,
          enabled: c.enabled,
          perRunCap: c.perRunCap,
          segmentRule,
        }),
      });
      const data = await res.json();
      if (res.ok) setMsg("Saved.");
      else setMsg(`Error: ${data.error}`);
    } finally {
      setBusy(false);
    }
  }

  async function testSend() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(
        `/staff/api/recall-campaigns/${id}/test-send`,
        { method: "POST" },
      );
      const data = await res.json();
      if (res.ok) setMsg(`Test sent to ${data.sentTo}.`);
      else setMsg(`Error: ${data.error}`);
    } finally {
      setBusy(false);
    }
  }

  async function runNow() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(
        `/staff/api/recall-campaigns/${id}/run-now`,
        { method: "POST" },
      );
      const data = await res.json();
      if (res.ok)
        setMsg(`Drafted ${data.drafted}, skipped ${data.skipped}.`);
      else setMsg(`Error: ${data.error}`);
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!confirm("Delete this campaign and all of its sends?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/staff/api/recall-campaigns/${id}`, {
        method: "DELETE",
      });
      if (res.ok) router.push("/staff/marketing/recall");
    } finally {
      setBusy(false);
    }
  }

  if (!c) return <div className="p-6 text-neutral-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">{c.name}</h1>
        <Link
          href="/staff/marketing/recall"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back
        </Link>
      </div>

      {msg && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          {msg}
        </div>
      )}

      <div className="grid gap-4">
        <Field
          label="Name"
          value={c.name}
          onChange={(v) => setC({ ...c, name: v })}
        />
        <Field
          label="Description"
          value={c.description || ""}
          onChange={(v) => setC({ ...c, description: v })}
        />
        <div className="grid grid-cols-4 gap-3">
          <NumField
            label="Start month"
            value={c.startMonth}
            onChange={(v) => setC({ ...c, startMonth: v })}
            min={1}
            max={12}
          />
          <NumField
            label="Start day"
            value={c.startDay}
            onChange={(v) => setC({ ...c, startDay: v })}
            min={1}
            max={31}
          />
          <NumField
            label="End month"
            value={c.endMonth}
            onChange={(v) => setC({ ...c, endMonth: v })}
            min={1}
            max={12}
          />
          <NumField
            label="End day"
            value={c.endDay}
            onChange={(v) => setC({ ...c, endDay: v })}
            min={1}
            max={31}
          />
        </div>
        <NumField
          label="Per-run cap (max sends drafted per cron)"
          value={c.perRunCap}
          onChange={(v) => setC({ ...c, perRunCap: v })}
          min={1}
          max={1000}
        />
        <Field
          label="Subject (supports {{firstName}}, {{shopName}}, etc.)"
          value={c.subject}
          onChange={(v) => setC({ ...c, subject: v })}
        />
        <div>
          <label className="block text-sm text-neutral-700 mb-1">
            Body HTML (supports {"{{firstName}}, {{shopName}}, {{shopPhone}}, {{shopUrl}}"})
          </label>
          <textarea
            value={c.bodyHtml}
            onChange={(e) => setC({ ...c, bodyHtml: e.target.value })}
            rows={12}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-700 mb-1">
            Body text fallback (optional — auto-stripped from HTML if empty)
          </label>
          <textarea
            value={c.bodyText || ""}
            onChange={(e) => setC({ ...c, bodyText: e.target.value || null })}
            rows={4}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-700 mb-1">
            Segment rule (JSON) — see /lib/recall.ts for shape
          </label>
          <textarea
            value={segmentRuleText}
            onChange={(e) => setSegmentRuleText(e.target.value)}
            rows={6}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm font-mono"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={c.enabled}
            onChange={(e) => setC({ ...c, enabled: e.target.checked })}
          />
          Enabled (cron will draft when within window)
        </label>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          disabled={busy}
          onClick={save}
          className="rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm disabled:opacity-50"
        >
          Save
        </button>
        <button
          disabled={busy}
          onClick={testSend}
          className="rounded-xl border border-blue-300 bg-blue-50 text-blue-700 px-4 py-2 text-sm disabled:opacity-50"
        >
          Send test to me
        </button>
        <button
          disabled={busy}
          onClick={runNow}
          className="rounded-xl border border-amber-300 bg-amber-50 text-amber-700 px-4 py-2 text-sm disabled:opacity-50"
          title="Manually draft this campaign now, ignoring the calendar window"
        >
          Run now
        </button>
        <button
          disabled={busy}
          onClick={del}
          className="rounded-xl border border-red-300 text-red-700 px-4 py-2 text-sm disabled:opacity-50 ml-auto"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm text-neutral-700 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="block text-sm text-neutral-700 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
