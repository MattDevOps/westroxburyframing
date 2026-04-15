"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Customer = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
};

const PICKUP_MESSAGE_PREVIEW = `Hello, this is West Roxbury Framing. Your work is all set and ready for pickup. If you would like to come on the weekend, Sunday is the best time.

Hours: M-F: 10-6, Sunday: 10:30am-4:30pm

Thank you.`;

export default function PickupNotifyPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function load(search?: string) {
    setLoading(true);
    setErr(null);
    const query = (search ?? q).trim();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    try {
      const res = await fetch(`/staff/api/customers?${params.toString()}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load customers");
      setRows(data?.customers || []);
    } catch (e: any) {
      setErr(e?.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendPickup(customer: Customer) {
    const name = `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "this customer";
    if (!customer.phone) {
      setFlash({ kind: "err", text: `${name} has no phone number on file.` });
      return;
    }
    if (!confirm(`Send pickup-ready SMS to ${name} (${customer.phone})?`)) return;

    setSendingId(customer.id);
    setFlash(null);
    try {
      const res = await fetch(`/staff/api/customers/${customer.id}/notify-pickup`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send");
      setFlash({ kind: "ok", text: `SMS sent to ${name} at ${customer.phone}` });
    } catch (e: any) {
      setFlash({ kind: "err", text: `Failed: ${e?.message || "unknown error"}` });
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Pickup Notify</h1>
        <p className="text-neutral-600 text-sm mt-1">
          Send a &ldquo;your work is ready for pickup&rdquo; text to any saved customer. No order required.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
        <div className="font-medium text-neutral-900 mb-1">Message that will be sent:</div>
        <div className="italic whitespace-pre-line">{PICKUP_MESSAGE_PREVIEW}</div>
      </div>

      {flash && (
        <div
          className={`rounded-xl border px-4 py-2.5 text-sm ${
            flash.kind === "ok"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {flash.text}
          <button onClick={() => setFlash(null)} className="ml-2 underline text-xs">
            dismiss
          </button>
        </div>
      )}

      <div className="flex gap-3 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, phone…"
          className="flex-1 max-w-lg rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") load(q);
          }}
        />
        <button onClick={() => load(q)} className="rounded-xl bg-black text-white px-4 py-3 text-sm">
          Search
        </button>
        <button
          onClick={() => {
            setQ("");
            load("");
          }}
          className="rounded-xl border border-neutral-300 px-4 py-3 text-sm"
        >
          Clear
        </button>
      </div>

      {err && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 bg-neutral-50 px-4 py-3 text-xs font-medium text-neutral-600">
          <div className="col-span-3">Customer</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-3">Phone</div>
          <div className="col-span-3 text-right">Action</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-neutral-500">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-sm text-neutral-500">No customers found.</div>
        ) : (
          rows.map((c) => {
            const name = `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Unnamed";
            const hasPhone = Boolean(c.phone);
            return (
              <div
                key={c.id}
                className="grid grid-cols-12 gap-3 px-4 py-3 text-sm border-t border-neutral-200 items-center"
              >
                <div className="col-span-3 font-medium">
                  <Link href={`/staff/customers/${c.id}`} className="hover:underline">
                    {name}
                  </Link>
                </div>
                <div className="col-span-3 text-neutral-600 truncate">{c.email || "—"}</div>
                <div className="col-span-3 text-neutral-600">{c.phone || "—"}</div>
                <div className="col-span-3 text-right">
                  <button
                    onClick={() => sendPickup(c)}
                    disabled={!hasPhone || sendingId === c.id}
                    className="rounded-lg bg-black text-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={hasPhone ? "Send pickup-ready SMS" : "No phone number on file"}
                  >
                    {sendingId === c.id ? "Sending…" : "Send Pickup SMS"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
