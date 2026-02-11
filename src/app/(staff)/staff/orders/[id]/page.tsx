"use client";

import SquareInvoiceButtons from "@/components/SquareInvoiceButtons";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-neutral-800">{label}</label>
      {children}
    </div>
  );
}

const STATUS_FLOW = [
  "new_design",
  "awaiting_materials",
  "in_production",
  "quality_check",
  "ready_for_pickup",
  "picked_up",
  "completed",
] as const;

const STATUS_LABEL: Record<string, string> = {
  new_design: "New / Design",
  awaiting_materials: "Awaiting Materials",
  in_production: "In Production",
  quality_check: "Quality Check",
  ready_for_pickup: "Ready for Pickup",
  picked_up: "Picked Up",
  completed: "Completed",
  cancelled: "Cancelled",
};

function typeLabel(t: string) {
  if (t === "status_change") return "Status";
  if (t === "edit") return "Edit";
  if (t === "note") return "Note";
  if (t === "payment") return "Payment";
  if (t === "invoice_sent") return "Invoice";
  return t;
}

function typeBadge(t: string) {
  const base = "text-xs px-2 py-1 rounded-lg border";
  if (t === "status_change") return `${base} border-blue-700/40 text-blue-300 bg-blue-900/10`;
  if (t === "edit") return `${base} border-neutral-600 text-neutral-200 bg-neutral-900/20`;
  if (t === "note") return `${base} border-amber-700/40 text-amber-300 bg-amber-900/10`;
  if (t === "payment") return `${base} border-green-700/40 text-green-300 bg-green-900/10`;
  if (t === "invoice_sent") return `${base} border-purple-700/40 text-purple-300 bg-purple-900/10`;
  return `${base} border-neutral-600 text-neutral-200 bg-neutral-900/20`;
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");

  const [data, setData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const [note, setNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  async function refresh() {
    if (!id) return;
    const res = await fetch(`/staff/api/orders/${id}`, { cache: "no-store" });
    const raw = await res.text();
    let out: any = null;
    try {
      out = raw ? JSON.parse(raw) : null;
    } catch {
      out = null;
    }
    setData(out);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const order = data?.order;
  const activity = useMemo(() => (order?.activity || []) as any[], [order]);

  if (!order) return <div className="p-6 text-neutral-700">Loading...</div>;

  async function setStatus(next: string) {
    const res = await fetch(`/staff/api/orders/${order.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) return alert(out.error || "Failed to update status");
    await refresh();
  }

  async function addNote() {
    const msg = note.trim();
    if (!msg) return;

    setAddingNote(true);
    try {
      const res = await fetch(`/staff/api/orders/${order.id}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "note", message: msg }),
      });

      const raw = await res.text();
      let out: any = null;
      try {
        out = raw ? JSON.parse(raw) : null;
      } catch {}

      if (!res.ok) {
        alert(out?.error || raw || "Failed to add note");
        return;
      }

      setNote("");
      await refresh();
    } finally {
      setAddingNote(false);
    }
  }

  function startEdit() {
    setEditData({
      status: order.status,
      intakeChannel: order.intakeChannel || "walk_in",
      dueDate: order.dueDate ? new Date(order.dueDate).toISOString().slice(0, 10) : "",
      itemType: order.itemType,
      itemDescription: order.itemDescription || "",
      width: order.width ? Number(order.width) : "",
      height: order.height ? Number(order.height) : "",
      units: order.units || "in",
      notesInternal: order.notesInternal || "",
      notesCustomer: order.notesCustomer || "",
      subtotalAmount: (order.subtotalAmount / 100).toFixed(2),
      taxAmount: (order.taxAmount / 100).toFixed(2),
      totalAmount: (order.totalAmount / 100).toFixed(2),
      currency: order.currency || "USD",
      paidInFull: order.paidInFull ?? true,
      customerFirstName: order.customer.firstName || "",
      customerLastName: order.customer.lastName || "",
      customerPhone: order.customer.phone || "",
      customerEmail: order.customer.email || "",
    });
    setIsEditing(true);
  }

  async function saveEdit() {
    const res = await fetch(`/staff/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: editData.status,
        intakeChannel: editData.intakeChannel,
        dueDate: editData.dueDate || null,
        itemType: editData.itemType,
        itemDescription: editData.itemDescription || null,
        width: editData.width ? Number(editData.width) : null,
        height: editData.height ? Number(editData.height) : null,
        units: editData.units,
        notesInternal: editData.notesInternal || null,
        notesCustomer: editData.notesCustomer || null,
        subtotalAmount: Math.round(Number(editData.subtotalAmount) * 100),
        taxAmount: Math.round(Number(editData.taxAmount) * 100),
        totalAmount: Math.round(Number(editData.totalAmount) * 100),
        currency: editData.currency,
        paidInFull: editData.paidInFull,
        customerFirstName: editData.customerFirstName,
        customerLastName: editData.customerLastName,
        customerPhone: editData.customerPhone,
        customerEmail: editData.customerEmail,
      }),
    });

    const out = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(out.error || "Failed to update order");
      return;
    }
    setIsEditing(false);
    await refresh();
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{order.orderNumber}</h1>
          <div className="text-neutral-700">
            {order.customer.firstName} {order.customer.lastName}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-900 bg-white hover:bg-neutral-100"
            onClick={startEdit}
          >
            Edit Order
          </button>

          <a
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-900 bg-white hover:bg-neutral-100"
            href="/staff/orders"
          >
            Back to orders
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
            value={order.status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <button
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-900 bg-white hover:bg-neutral-100"
            onClick={() => {
              const idx = STATUS_FLOW.indexOf(order.status);
              if (idx < 0 || idx === STATUS_FLOW.length - 1) return;
              setStatus(STATUS_FLOW[idx + 1]);
            }}
          >
            Next stage →
          </button>

          <button
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-900 bg-white hover:bg-neutral-100"
            onClick={() => {
              const idx = STATUS_FLOW.indexOf(order.status);
              if (idx <= 0) return;
              setStatus(STATUS_FLOW[idx - 1]);
            }}
          >
            ← Back
          </button>
        </div>

        <div className="text-neutral-800">
          <span className="font-medium">Item:</span> {order.itemType}
        </div>
        <div className="text-neutral-800">
          <span className="font-medium">Total:</span> ${(order.totalAmount / 100).toFixed(2)}
        </div>
      </div>

      {/* Activity timeline (A) */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-neutral-900 font-semibold">Activity</div>
          <button
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-900 bg-white hover:bg-neutral-100"
            onClick={refresh}
            title="Refresh"
          >
            Refresh
          </button>
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add an internal note (e.g., “Ordered museum glass from Larson”)…"
            onKeyDown={(e) => {
              if (e.key === "Enter") addNote();
            }}
          />
          <button
            className="rounded-xl bg-black text-white px-4 py-2 text-sm disabled:opacity-50"
            disabled={addingNote || !note.trim()}
            onClick={addNote}
          >
            {addingNote ? "Adding…" : "Add note"}
          </button>
        </div>

        {activity.length === 0 ? (
          <div className="text-sm text-neutral-600">No activity yet.</div>
        ) : (
          <div className="space-y-2">
            {activity.map((a) => {
              const who = a.createdBy?.name || a.createdBy?.email || "Staff";
              const when = a.createdAt ? new Date(a.createdAt).toLocaleString() : "";
              return (
                <div key={a.id} className="rounded-xl border border-neutral-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={typeBadge(a.type)}>{typeLabel(a.type)}</span>
                      <div className="text-sm text-neutral-900 font-medium">{a.message}</div>
                    </div>
                    <div className="text-xs text-neutral-500 whitespace-nowrap">{when}</div>
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">by {who}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-neutral-900 font-semibold">Payment</div>
          {order.squareInvoiceId && (
            <span
              className={`text-sm px-2 py-1 rounded-lg border ${
                order.squareInvoiceStatus?.toUpperCase() === "PAID"
                  ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                  : order.squareInvoiceStatus?.toUpperCase() === "PARTIALLY_PAID"
                    ? "border-blue-300 text-blue-700 bg-blue-50"
                    : "border-amber-300 text-amber-700 bg-amber-50"
              }`}
            >
              {order.squareInvoiceStatus?.toUpperCase() === "PAID"
                ? "Paid"
                : order.squareInvoiceStatus?.toUpperCase() === "PARTIALLY_PAID"
                  ? "Deposit received"
                  : "Unpaid"}
            </span>
          )}
        </div>

        <SquareInvoiceButtons orderId={order.id} existingInvoiceId={order.squareInvoiceId || undefined} />

        {order.squareInvoiceId && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-700 mt-2">
            <span>Invoice: {order.squareInvoiceId}</span>
            {order.squareInvoiceUrl && (
              <a
                href={order.squareInvoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View →
              </a>
            )}
            <button
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-neutral-700 hover:bg-neutral-50"
              onClick={async () => {
                try {
                  const res = await fetch(`/staff/api/orders/${order.id}/invoice/sync`, {
                    method: "POST",
                  });
                  const raw = await res.text();
                  let out: any = {};
                  try {
                    out = raw ? JSON.parse(raw) : {};
                  } catch {}
                  if (!res.ok) {
                    alert(out.error || raw || `Sync failed (${res.status})`);
                    return;
                  }
                  await refresh();
                } catch (e: any) {
                  alert(e?.message || "Sync failed - check console");
                }
              }}
            >
              Sync payment status
            </button>
          </div>
        )}
      </div>

      {/* Edit modal (unchanged) */}
      {isEditing && editData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Edit Order</h2>
              <button className="text-neutral-400 hover:text-white" onClick={() => setIsEditing(false)}>
                ✕
              </button>
            </div>

            <div className="border-b border-neutral-700 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-white mb-3">Customer Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="First Name">
                  <input
                    className="rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100"
                    value={editData.customerFirstName}
                    onChange={(e) => setEditData({ ...editData, customerFirstName: e.target.value })}
                    placeholder="First name"
                  />
                </Field>

                <Field label="Last Name">
                  <input
                    className="rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100"
                    value={editData.customerLastName}
                    onChange={(e) => setEditData({ ...editData, customerLastName: e.target.value })}
                    placeholder="Last name"
                  />
                </Field>

                <Field label="Phone">
                  <input
                    className="rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100"
                    value={editData.customerPhone}
                    onChange={(e) => setEditData({ ...editData, customerPhone: e.target.value })}
                    placeholder="Phone number"
                  />
                </Field>

                <Field label="Email">
                  <input
                    className="rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100"
                    type="email"
                    value={editData.customerEmail}
                    onChange={(e) => setEditData({ ...editData, customerEmail: e.target.value })}
                    placeholder="Email address"
                  />
                </Field>
              </div>
            </div>

            <div className="border-b border-neutral-700 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-white mb-3">Order Information</h3>
            </div>

            {/* (Keep your existing modal fields as-is) */}

            <div className="flex gap-2 justify-end pt-4">
              <button
                className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button className="rounded-xl bg-white text-black px-4 py-2 text-sm hover:bg-neutral-200" onClick={saveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
