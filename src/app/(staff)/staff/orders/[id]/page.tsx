"use client";

import SquareInvoiceButtons from "@/components/SquareInvoiceButtons";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-neutral-300">{label}</label>
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

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");
  const [data, setData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  async function refresh() {
    if (!id) return;
    const out = await fetch(`/staff/api/orders/${id}`, { cache: "no-store" }).then((r) => r.json());
    setData(out);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!data?.order) return <div className="p-6 text-neutral-300">Loading...</div>;
  const order = data.order;

  async function setStatus(next: string) {
    const res = await fetch(`/staff/api/orders/${order.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const out = await res.json();
    if (!res.ok) return alert(out.error || "Failed to update status");
    await refresh();
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
      // Customer fields
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
        // Customer fields
        customerFirstName: editData.customerFirstName,
        customerLastName: editData.customerLastName,
        customerPhone: editData.customerPhone,
        customerEmail: editData.customerEmail,
      }),
    });
    const out = await res.json();
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
          <h1 className="text-2xl font-semibold text-white">{order.orderNumber}</h1>
          <div className="text-neutral-400">
            {order.customer.firstName} {order.customer.lastName}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
            onClick={startEdit}
          >
            Edit Order
          </button>
          <button
            className="rounded-xl border border-red-700/50 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20"
            onClick={async () => {
              if (!confirm(`Are you sure you want to delete order ${order.orderNumber}? This action cannot be undone.`)) {
                return;
              }
              const res = await fetch(`/staff/api/orders/${order.id}`, {
                method: "DELETE",
              });
              const out = await res.json();
              if (!res.ok) {
                alert(out.error || "Failed to delete order");
                return;
              }
              window.location.href = "/staff/orders";
            }}
          >
            Delete Order
          </button>
          <a
            className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
            href="/staff/orders"
          >
            Back to orders
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/30 p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100"
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
            className="rounded-xl border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
            onClick={() => {
              const idx = STATUS_FLOW.indexOf(order.status);
              if (idx < 0 || idx === STATUS_FLOW.length - 1) return;
              setStatus(STATUS_FLOW[idx + 1]);
            }}
          >
            Next stage →
          </button>

          <button
            className="rounded-xl border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
            onClick={() => {
              const idx = STATUS_FLOW.indexOf(order.status);
              if (idx <= 0) return;
              setStatus(STATUS_FLOW[idx - 1]);
            }}
          >
            ← Back
          </button>
        </div>

        <div className="text-neutral-200">
          <span className="font-medium">Item:</span> {order.itemType}
        </div>
        <div className="text-neutral-200">
          <span className="font-medium">Total:</span> ${(order.totalAmount / 100).toFixed(2)}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/30 p-5 space-y-3">
        <div className="text-white font-semibold">Payment</div>
        <button
          className="rounded-xl bg-white text-black px-4 py-2 text-sm hover:bg-neutral-200"
          onClick={async () => {
            const res = await fetch(`/staff/api/orders/${order.id}/payments/create`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amount_cents: order.totalAmount }),
            });
            const out = await res.json();
            alert(res.ok ? "Payment attached (Square stub). Check logs for details." : out.error || "Error");
            await refresh();
          }}
        >
          {/* Take Payment (Square) */}


          <SquareInvoiceButtons orderId={order.id} />

        </button>
      </div>

      {isEditing && editData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Edit Order</h2>
              <button
                className="text-neutral-400 hover:text-white"
                onClick={() => setIsEditing(false)}
              >
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

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Status">
                <select
                  className="rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100"
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                >
                  {Object.entries(STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Intake Channel">
                <select
                  className="rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100"
                  value={editData.intakeChannel}
                  onChange={(e) => setEditData({ ...editData, intakeChannel: e.target.value })}
                >
                  <option value="walk_in">Walk In</option>
                  <option value="appointment">Appointment</option>
                  <option value="web_lead">Web Lead</option>
                </select>
              </Field>

              <Field label="Due Date">
                <input
                  className="rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100"
                  type="date"
                  value={editData.dueDate}
                  onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                />
              </Field>

              <Field label="Item Type">
                <select
                  className="rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100"
                  value={editData.itemType}
                  onChange={(e) => setEditData({ ...editData, itemType: e.target.value })}
                >
                  <option value="art">Art / Print</option>
                  <option value="photo">Photo</option>
                  <option value="diploma">Diploma / Certificate</option>
                  <option value="object">Object / Shadowbox</option>
                  <option value="memorabilia">Memorabilia / Jersey</option>
                </select>
              </Field>

              <Field label="Item Description">
                <input
                  className="rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100"
                  value={editData.itemDescription}
                  onChange={(e) => setEditData({ ...editData, itemDescription: e.target.value })}
                  placeholder="Optional description"
                />
              </Field>

              <Field label="Width">
                <input
                  className="rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100"
                  type="number"
                  step="0.01"
                  value={editData.width}
                  onChange={(e) => setEditData({ ...editData, width: e.target.value })}
                  placeholder="Width"
                />
              </Field>

              <Field label="Height">
                <input
                  className="rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100"
                  type="number"
                  step="0.01"
                  value={editData.height}
                  onChange={(e) => setEditData({ ...editData, height: e.target.value })}
                  placeholder="Height"
                />
              </Field>

              <Field label="Units">
                <select
                  className="rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100"
                  value={editData.units}
                  onChange={(e) => setEditData({ ...editData, units: e.target.value })}
                >
                  <option value="in">Inches</option>
                  <option value="cm">Centimeters</option>
                </select>
              </Field>
            </div>

            <div className="space-y-2">
              <Field label="Internal Notes">
                <textarea
                  className="rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 w-full min-h-[80px]"
                  value={editData.notesInternal}
                  onChange={(e) => setEditData({ ...editData, notesInternal: e.target.value })}
                  placeholder="Internal notes (not visible to customer)"
                />
              </Field>

              <Field label="Customer Notes">
                <textarea
                  className="rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 w-full min-h-[80px]"
                  value={editData.notesCustomer}
                  onChange={(e) => setEditData({ ...editData, notesCustomer: e.target.value })}
                  placeholder="Customer-facing notes"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Subtotal ($)">
                <input
                  className="rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100"
                  type="number"
                  step="0.01"
                  value={editData.subtotalAmount}
                  onChange={(e) => setEditData({ ...editData, subtotalAmount: e.target.value })}
                />
              </Field>

              <Field label="Tax ($)">
                <input
                  className="rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100"
                  type="number"
                  step="0.01"
                  value={editData.taxAmount}
                  onChange={(e) => setEditData({ ...editData, taxAmount: e.target.value })}
                />
              </Field>

              <Field label="Total ($)">
                <input
                  className="rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100"
                  type="number"
                  step="0.01"
                  value={editData.totalAmount}
                  onChange={(e) => setEditData({ ...editData, totalAmount: e.target.value })}
                />
              </Field>

              <Field label="Currency">
                <select
                  className="rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100"
                  value={editData.currency}
                  onChange={(e) => setEditData({ ...editData, currency: e.target.value })}
                >
                  <option value="USD">USD</option>
                  <option value="CAD">CAD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </Field>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-neutral-300">
                <input
                  type="checkbox"
                  checked={editData.paidInFull}
                  onChange={(e) => setEditData({ ...editData, paidInFull: e.target.checked })}
                  className="rounded border-neutral-700"
                />
                Paid in Full
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <button
                className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-white text-black px-4 py-2 text-sm hover:bg-neutral-200"
                onClick={saveEdit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
