"use client";

import { useEffect, useState } from "react";

export default function EditOrderPage({ params }: any) {
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/staff/api/orders/${params.id}`).then(r => r.json()).then(setData);
  }, [params.id]);

  async function save(e: any) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const form = new FormData(e.currentTarget);
    const payload: any = {
      status: String(form.get("status") || ""),
      notes: String(form.get("notes") || ""),
      width: Number(form.get("width") || 0),
      height: Number(form.get("height") || 0),
      total_cents: Math.round(Number(form.get("total") || 0) * 100),
    };

    const res = await fetch(`/staff/api/orders/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let out: any = null;
    try { out = text ? JSON.parse(text) : null; } catch {}

    if (!res.ok) {
      setMsg(out?.error || text || "Save failed");
      setSaving(false);
      return;
    }

    setMsg("Saved.");
    setData(out);
    setSaving(false);
  }

  const order = data?.order;
  if (!order) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Edit Order</h1>

      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-600 mb-1">Status</label>
          <select name="status" defaultValue={order.status || "NEW"} className="w-full rounded-xl border border-neutral-300 bg-white/5 p-3">
            <option value="NEW">New / Design</option>
            <option value="AWAITING_MATERIALS">Awaiting Materials</option>
            <option value="IN_PRODUCTION">In Production</option>
            <option value="QUALITY_CHECK">Quality Check</option>
            <option value="READY">Ready</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-neutral-600 mb-1">Width (in)</label>
            <input name="width" defaultValue={order.width ?? 0} className="w-full rounded-xl border border-neutral-300 bg-white/5 p-3" />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-1">Height (in)</label>
            <input name="height" defaultValue={order.height ?? 0} className="w-full rounded-xl border border-neutral-300 bg-white/5 p-3" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Total ($)</label>
          <input name="total" defaultValue={(Number(order.totalCents ?? order.total_cents ?? 0) / 100).toFixed(2)} className="w-full rounded-xl border border-neutral-300 bg-white/5 p-3" />
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Notes</label>
          <textarea name="notes" defaultValue={order.notes || ""} className="w-full rounded-xl border border-neutral-300 bg-white/5 p-3 min-h-[120px]" />
        </div>

        <div className="flex items-center gap-3">
          <button disabled={saving} className="rounded-xl bg-black text-white px-4 py-2">
            {saving ? "Saving..." : "Save changes"}
          </button>
          <a className="text-sm underline text-neutral-600" href={`/staff/orders/${params.id}`}>Back to order</a>
          {msg && <span className="text-sm text-neutral-300">{msg}</span>}
        </div>
      </form>

      <p className="text-xs text-neutral-500 mt-6">
        Note: This edit screen updates a basic set of fields. We can extend it to edit full framing specs, materials, and pricing formulas.
      </p>
    </div>
  );
}
