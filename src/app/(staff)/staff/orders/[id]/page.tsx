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
  estimate: "Estimate",
  new_design: "New / Design",
  awaiting_materials: "Awaiting Materials",
  in_production: "In Production",
  quality_check: "Quality Check",
  ready_for_pickup: "Ready for Pickup",
  on_hold: "On Hold",
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
  if (t === "refund") return "Refund";
  return t;
}

function typeBadge(t: string) {
  const base = "text-xs px-2 py-1 rounded-lg border";
  if (t === "status_change") return `${base} border-blue-700/40 text-blue-300 bg-blue-900/10`;
  if (t === "edit") return `${base} border-neutral-600 text-neutral-200 bg-neutral-900/20`;
  if (t === "note") return `${base} border-amber-700/40 text-amber-300 bg-amber-900/10`;
  if (t === "payment") return `${base} border-green-700/40 text-green-300 bg-green-900/10`;
  if (t === "invoice_sent") return `${base} border-purple-700/40 text-purple-300 bg-purple-900/10`;
  if (t === "refund") return `${base} border-red-700/40 text-red-300 bg-red-900/10`;
  return `${base} border-neutral-600 text-neutral-200 bg-neutral-900/20`;
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");

  const [data, setData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [blindPrint, setBlindPrint] = useState(false);

  const [note, setNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [refunding, setRefunding] = useState<string | null>(null);

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

  const isEstimate = order.status === "estimate";
  const isOnHold = order.status === "on_hold";

  // Discount display helpers
  const discountType = order.discountType || "none";
  const discountValue = Number(order.discountValue || 0);
  const hasDiscount = discountType !== "none" && discountValue > 0;
  const discountAmountCents = discountType === "percent"
    ? Math.round(order.subtotalAmount * discountValue / 100)
    : discountType === "fixed"
      ? Math.round(discountValue * 100)
      : 0;

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
      } catch { }

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
      discountType: order.discountType || "none",
      discountValue: discountType === "fixed" ? discountValue.toFixed(2) : String(discountValue),
      customerFirstName: order.customer.firstName || "",
      customerLastName: order.customer.lastName || "",
      customerPhone: order.customer.phone || "",
      customerEmail: order.customer.email || "",
    });
    setIsEditing(true);
  }

  // Recalculate total when discount changes in edit mode
  function recalcWithDiscount(ed: any) {
    const sub = Math.round(Number(ed.subtotalAmount) * 100);
    const dType = ed.discountType || "none";
    const dVal = Number(ed.discountValue) || 0;
    let discCents = 0;
    if (dType === "percent") discCents = Math.round(sub * dVal / 100);
    else if (dType === "fixed") discCents = Math.round(dVal * 100);
    const afterDiscount = Math.max(0, sub - discCents);
    const taxRate = sub > 0 ? (Math.round(Number(ed.taxAmount) * 100) / sub) : 0;
    const tax = Math.round(afterDiscount * taxRate);
    return {
      ...ed,
      totalAmount: ((afterDiscount + tax) / 100).toFixed(2),
      taxAmount: (tax / 100).toFixed(2),
    };
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
        discountType: editData.discountType,
        discountValue: Number(editData.discountValue) || 0,
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

  function handlePrint() {
    window.print();
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 print:mb-0">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {order.orderNumber}
            {isEstimate && (
              <span className="ml-3 text-sm font-medium px-2 py-1 rounded-lg border border-red-300 text-red-700 bg-red-50">
                ESTIMATE
              </span>
            )}
            {isOnHold && (
              <span className="ml-3 text-sm font-medium px-2 py-1 rounded-lg border border-orange-300 text-orange-700 bg-orange-50">
                ON HOLD
              </span>
            )}
          </h1>
          <div className="text-neutral-700">
            {order.customer.firstName} {order.customer.lastName}
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          {isEstimate && (
            <button
              className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm hover:bg-emerald-700"
              onClick={() => {
                if (confirm("Activate this estimate? It will become an active order.")) {
                  setStatus("new_design");
                }
              }}
            >
              Activate Estimate
            </button>
          )}
          <button
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-900 bg-white hover:bg-neutral-100"
            onClick={startEdit}
          >
            Edit Order
          </button>
          <button
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-900 bg-white hover:bg-neutral-100"
            onClick={handlePrint}
            title="Print work order"
          >
            🖨️ Print
          </button>
          <a
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-900 bg-white hover:bg-neutral-100"
            href="/staff/orders"
          >
            Back to orders
          </a>
        </div>
      </div>

      {/* Status controls */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3 print:border-0 print:p-0">
        <div className="flex flex-wrap items-center gap-2 print:hidden">
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
              const idx = STATUS_FLOW.indexOf(order.status as any);
              if (idx < 0 || idx === STATUS_FLOW.length - 1) return;
              setStatus(STATUS_FLOW[idx + 1]);
            }}
          >
            Next stage →
          </button>

          <button
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-900 bg-white hover:bg-neutral-100"
            onClick={() => {
              const idx = STATUS_FLOW.indexOf(order.status as any);
              if (idx <= 0) return;
              setStatus(STATUS_FLOW[idx - 1]);
            }}
          >
            ← Back
          </button>

          {!isOnHold && !isEstimate && order.status !== "completed" && order.status !== "cancelled" && order.status !== "picked_up" && (
            <button
              className="rounded-xl border border-orange-300 px-3 py-2 text-sm text-orange-700 bg-orange-50 hover:bg-orange-100"
              onClick={() => setStatus("on_hold")}
            >
              Put On Hold
            </button>
          )}
        </div>

        {/* Order info grid — visible in print */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="font-medium text-neutral-600">Status:</span>{" "}
            <span className="text-neutral-900">{STATUS_LABEL[order.status] || order.status}</span>
          </div>
          <div>
            <span className="font-medium text-neutral-600">Item:</span>{" "}
            <span className="text-neutral-900">{order.itemType}</span>
          </div>
          <div>
            <span className="font-medium text-neutral-600">Subtotal:</span>{" "}
            <span className="text-neutral-900">${(order.subtotalAmount / 100).toFixed(2)}</span>
          </div>
          {hasDiscount && (
            <div>
              <span className="font-medium text-neutral-600">Discount:</span>{" "}
              <span className="text-red-600 font-medium">
                {discountType === "percent" ? `${discountValue}%` : `$${discountValue.toFixed(2)}`}
                {" "}(-${(discountAmountCents / 100).toFixed(2)})
              </span>
            </div>
          )}
          <div>
            <span className="font-medium text-neutral-600">Tax:</span>{" "}
            <span className="text-neutral-900">${(order.taxAmount / 100).toFixed(2)}</span>
          </div>
          <div>
            <span className="font-medium text-neutral-600">Total:</span>{" "}
            <span className="text-neutral-900 font-semibold">${(order.totalAmount / 100).toFixed(2)}</span>
          </div>
          {order.dueDate && (
            <div>
              <span className="font-medium text-neutral-600">Due:</span>{" "}
              <span className="text-neutral-900">{new Date(order.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          <div>
            <span className="font-medium text-neutral-600">Channel:</span>{" "}
            <span className="text-neutral-900">
              {order.intakeChannel === "walk_in" ? "Walk-in" : order.intakeChannel === "appointment" ? "Appointment" : "Web Lead"}
            </span>
          </div>
          {(order.width || order.height) && (
            <div>
              <span className="font-medium text-neutral-600">Size:</span>{" "}
              <span className="text-neutral-900">
                {order.width ? Number(order.width) : "—"} × {order.height ? Number(order.height) : "—"} {order.units || "in"}
              </span>
            </div>
          )}
          {order.itemDescription && (
            <div className="col-span-2">
              <span className="font-medium text-neutral-600">Description:</span>{" "}
              <span className="text-neutral-900">{order.itemDescription}</span>
            </div>
          )}
          <div className="print:block hidden">
            <span className="font-medium text-neutral-600">Customer:</span>{" "}
            <span className="text-neutral-900">
              {order.customer.firstName} {order.customer.lastName}
              {order.customer.phone && ` · ${order.customer.phone}`}
              {order.customer.email && ` · ${order.customer.email}`}
            </span>
          </div>
        </div>

        {(order.notesInternal || order.notesCustomer) && (
          <div className="border-t border-neutral-100 pt-3 space-y-2 text-sm">
            {order.notesInternal && !blindPrint && (
              <div className="blind-hide">
                <span className="font-medium text-neutral-600">Internal notes:</span>{" "}
                <span className="text-neutral-800">{order.notesInternal}</span>
              </div>
            )}
            {order.notesCustomer && (
              <div>
                <span className="font-medium text-neutral-600">Customer notes:</span>{" "}
                <span className="text-neutral-800">{order.notesCustomer}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Specs */}
      {order.specs && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3 print:border-0 print:p-0 print:mt-2">
          <div className="text-neutral-900 font-semibold">Frame Specs</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {order.specs.frameCode && (
              <div>
                <span className="font-medium text-neutral-600">Frame:</span>{" "}
                <span className={`text-neutral-900 ${blindPrint ? "blind-hide" : ""}`}>{order.specs.frameCode}</span>
              </div>
            )}
            {order.specs.frameVendor && (
              <div className={blindPrint ? "blind-hide" : ""}>
                <span className="font-medium text-neutral-600">Vendor:</span>{" "}
                <span className="text-neutral-900">{order.specs.frameVendor}</span>
              </div>
            )}
            {order.specs.mat1Code && (
              <div>
                <span className="font-medium text-neutral-600">Mat 1:</span>{" "}
                <span className={`text-neutral-900 ${blindPrint ? "blind-hide" : ""}`}>{order.specs.mat1Code}</span>
              </div>
            )}
            {order.specs.mat2Code && (
              <div>
                <span className="font-medium text-neutral-600">Mat 2:</span>{" "}
                <span className={`text-neutral-900 ${blindPrint ? "blind-hide" : ""}`}>{order.specs.mat2Code}</span>
              </div>
            )}
            {order.specs.glassType && (
              <div><span className="font-medium text-neutral-600">Glass:</span> <span className="text-neutral-900">{order.specs.glassType}</span></div>
            )}
            {order.specs.mountType && (
              <div><span className="font-medium text-neutral-600">Mount:</span> <span className="text-neutral-900">{order.specs.mountType}</span></div>
            )}
            {order.specs.backingType && (
              <div><span className="font-medium text-neutral-600">Backing:</span> <span className="text-neutral-900">{order.specs.backingType}</span></div>
            )}
            {order.specs.spacers && (
              <div><span className="font-medium text-neutral-600">Spacers:</span> <span className="text-neutral-900">Yes</span></div>
            )}
            {order.specs.specialtyType && (
              <div><span className="font-medium text-neutral-600">Specialty:</span> <span className="text-neutral-900">{order.specs.specialtyType}</span></div>
            )}
            {!order.specs.frameCode && !order.specs.glassType && !order.specs.mountType && !order.specs.mat1Code && (
              <div className="col-span-full text-neutral-500">No specs entered yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Print options — only visible on screen */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3 print:hidden">
        <div className="text-neutral-900 font-semibold">Print Options</div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={blindPrint}
              onChange={(e) => setBlindPrint(e.target.checked)}
              className="rounded"
            />
            Blind estimate (hide item codes & vendor info on print)
          </label>
          <button
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-900 bg-white hover:bg-neutral-100"
            onClick={handlePrint}
          >
            🖨️ Print Work Order
          </button>
        </div>
      </div>

      {/* Photos */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3 print:hidden">
        <div className="flex items-center justify-between">
          <div className="text-neutral-900 font-semibold">Photos</div>
          <label className="rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-900 bg-white hover:bg-neutral-100 cursor-pointer">
            Upload Photo
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = e.target.files;
                if (!files) return;
                for (const file of Array.from(files)) {
                  if (file.size > 5 * 1024 * 1024) {
                    alert(`File ${file.name} is too large (max 5MB)`);
                    continue;
                  }
                  const reader = new FileReader();
                  reader.onload = async () => {
                    const dataUrl = reader.result as string;
                    try {
                      const res = await fetch(`/staff/api/orders/${order.id}/photos`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: dataUrl, caption: file.name }),
                      });
                      if (!res.ok) {
                        const out = await res.json().catch(() => ({}));
                        alert(out.error || "Upload failed");
                      }
                      await refresh();
                    } catch {
                      alert("Upload failed");
                    }
                  };
                  reader.readAsDataURL(file);
                }
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {(!order.photos || order.photos.length === 0) ? (
          <div className="text-sm text-neutral-500">No photos uploaded yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {order.photos.map((p: any) => (
              <div key={p.id} className="relative group rounded-lg overflow-hidden border border-neutral-200">
                <img
                  src={p.url}
                  alt={p.caption || "Order photo"}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    className="rounded-lg bg-red-600 text-white px-3 py-1.5 text-xs"
                    onClick={async () => {
                      if (!confirm("Delete this photo?")) return;
                      try {
                        await fetch(`/staff/api/orders/${order.id}/photos`, {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ photo_id: p.id }),
                        });
                        await refresh();
                      } catch {
                        alert("Failed to delete photo");
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
                {p.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                    {p.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity timeline */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4 print:hidden">
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
            placeholder="Add an internal note…"
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
            {activity.map((a: any) => {
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

      {/* Invoice Link */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3 print:hidden">
        <div className="flex items-center justify-between">
          <div className="text-neutral-900 font-semibold">Invoice</div>
          {!order.invoice && (
            <a
              href={`/staff/invoices/new?customerId=${order.customer.id}&orderId=${order.id}`}
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Create Invoice
            </a>
          )}
        </div>

        {order.invoice ? (
          <a
            href={`/staff/invoices/${order.invoice.id}`}
            className="block rounded-xl border border-blue-200 bg-blue-50/50 p-4 hover:bg-blue-50 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-neutral-900">{order.invoice.invoiceNumber}</span>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${
                  order.invoice.status === "paid"
                    ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                    : order.invoice.status === "partial"
                    ? "border-amber-300 text-amber-700 bg-amber-50"
                    : order.invoice.status === "sent"
                    ? "border-blue-300 text-blue-700 bg-blue-50"
                    : "border-neutral-300 text-neutral-600 bg-neutral-50"
                }`}>
                  {order.invoice.status === "paid" ? "Paid" : order.invoice.status === "partial" ? "Partial" : order.invoice.status === "sent" ? "Sent" : "Draft"}
                </span>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold">${(order.invoice.totalAmount / 100).toFixed(2)}</div>
                {order.invoice.balanceDue > 0 && (
                  <div className="text-xs text-amber-700">Due: ${(order.invoice.balanceDue / 100).toFixed(2)}</div>
                )}
              </div>
            </div>
            {order.invoice.depositPercent && order.invoice.amountPaid > 0 && order.invoice.amountPaid < order.invoice.totalAmount && (
              <div className="mt-2 w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (order.invoice.amountPaid / order.invoice.totalAmount) * 100)}%` }}
                />
              </div>
            )}
          </a>
        ) : (
          <p className="text-sm text-neutral-500">No invoice linked. Create one to track deposits and payments.</p>
        )}
      </div>

      {/* Payment */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3 print:hidden">
        <div className="flex items-center justify-between">
          <div className="text-neutral-900 font-semibold">Square Payment</div>
          {order.squareInvoiceId && (
            <span
              className={`text-sm px-2 py-1 rounded-lg border ${order.squareInvoiceStatus?.toUpperCase() === "PAID"
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
                  } catch { }
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

        {((order.squareInvoiceStatus?.toUpperCase() === "PARTIALLY_PAID") ||
          (order.squareInvoiceStatus?.toUpperCase() === "PAID")) && (
            <div className="flex flex-wrap items-center gap-2 text-sm mt-3 pt-3 border-t border-neutral-200">
              <button
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-neutral-600 hover:bg-neutral-50"
                onClick={async () => {
                  if (!confirm("Mark this invoice as unpaid? This only updates our records, not Square.")) return;
                  try {
                    const res = await fetch(`/staff/api/orders/${order.id}/invoice/mark-unpaid`, {
                      method: "POST",
                    });
                    const raw = await res.text();
                    let out: any = {};
                    try { out = raw ? JSON.parse(raw) : {}; } catch { }
                    if (!res.ok) { alert(out.error || raw || "Failed"); return; }
                    await refresh();
                  } catch (e: any) { alert(e?.message || "Failed"); }
                }}
              >
                Mark as unpaid
              </button>
              <span className="text-neutral-400">|</span>
              <span className="text-neutral-600 font-medium">Refund:</span>
              <button
                className="rounded-lg border border-red-300 px-3 py-1.5 text-red-700 hover:bg-red-50 disabled:opacity-50"
                disabled={!!refunding}
                onClick={async () => {
                  if (!confirm("Refund the deposit? This cannot be undone.")) return;
                  setRefunding("deposit");
                  try {
                    const res = await fetch(`/staff/api/orders/${order.id}/refund`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ kind: "deposit" }),
                    });
                    const raw = await res.text();
                    let out: any = {};
                    try { out = raw ? JSON.parse(raw) : {}; } catch { }
                    if (!res.ok) { alert(out.error || raw || "Refund failed"); return; }
                    alert(out.totalRefundedFormatted ? `Refunded ${out.totalRefundedFormatted}` : "Refund complete");
                    await fetch(`/staff/api/orders/${order.id}/invoice/sync`, { method: "POST" });
                    await refresh();
                  } catch (e: any) { alert(e?.message || "Refund failed"); }
                  finally { setRefunding(null); }
                }}
              >
                {refunding === "deposit" ? "Refunding…" : "Refund deposit"}
              </button>
              {order.squareInvoiceStatus?.toUpperCase() === "PAID" && (
                <button
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-red-700 hover:bg-red-50 disabled:opacity-50"
                  disabled={!!refunding}
                  onClick={async () => {
                    if (!confirm("Refund the full invoice (or balance)? This cannot be undone.")) return;
                    setRefunding("full");
                    try {
                      const res = await fetch(`/staff/api/orders/${order.id}/refund`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ kind: "full" }),
                      });
                      const raw = await res.text();
                      let out: any = {};
                      try { out = raw ? JSON.parse(raw) : {}; } catch { }
                      if (!res.ok) { alert(out.error || raw || "Refund failed"); return; }
                      alert(out.totalRefundedFormatted ? `Refunded ${out.totalRefundedFormatted}` : "Refund complete");
                      await fetch(`/staff/api/orders/${order.id}/invoice/sync`, { method: "POST" });
                      await refresh();
                    } catch (e: any) { alert(e?.message || "Refund failed"); }
                    finally { setRefunding(null); }
                  }}
                >
                  {refunding === "full" ? "Refunding…" : "Refund full invoice"}
                </button>
              )}
            </div>
          )}
      </div>

      {/* Edit modal */}
      {isEditing && editData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-neutral-900">Edit Order</h2>
              <button className="text-neutral-500 hover:text-neutral-900" onClick={() => setIsEditing(false)}>
                ✕
              </button>
            </div>

            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Customer Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="First Name">
                  <input
                    className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                    value={editData.customerFirstName}
                    onChange={(e) => setEditData({ ...editData, customerFirstName: e.target.value })}
                    placeholder="First name"
                  />
                </Field>

                <Field label="Last Name">
                  <input
                    className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                    value={editData.customerLastName}
                    onChange={(e) => setEditData({ ...editData, customerLastName: e.target.value })}
                    placeholder="Last name"
                  />
                </Field>

                <Field label="Phone">
                  <input
                    className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                    value={editData.customerPhone}
                    onChange={(e) => setEditData({ ...editData, customerPhone: e.target.value })}
                    placeholder="Phone number"
                  />
                </Field>

                <Field label="Email">
                  <input
                    className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                    type="email"
                    value={editData.customerEmail}
                    onChange={(e) => setEditData({ ...editData, customerEmail: e.target.value })}
                    placeholder="Email address"
                  />
                </Field>
              </div>
            </div>

            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Order Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Status">
                  <select
                    className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  >
                    {Object.entries(STATUS_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Intake Channel">
                  <select
                    className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                    value={editData.intakeChannel}
                    onChange={(e) => setEditData({ ...editData, intakeChannel: e.target.value })}
                  >
                    <option value="walk_in">Walk-in</option>
                    <option value="appointment">Appointment</option>
                    <option value="web_lead">Web Lead</option>
                  </select>
                </Field>

                <Field label="Item Type">
                  <input
                    className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                    value={editData.itemType}
                    onChange={(e) => setEditData({ ...editData, itemType: e.target.value })}
                    placeholder="e.g. art, photo, diploma"
                  />
                </Field>

                <Field label="Due Date">
                  <input
                    type="date"
                    className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                    value={editData.dueDate}
                    onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                  />
                </Field>

                <Field label="Width">
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                    value={editData.width}
                    onChange={(e) => setEditData({ ...editData, width: e.target.value })}
                    placeholder="Width"
                  />
                </Field>

                <Field label="Height">
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                    value={editData.height}
                    onChange={(e) => setEditData({ ...editData, height: e.target.value })}
                    placeholder="Height"
                  />
                </Field>

                <Field label="Units">
                  <select
                    className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                    value={editData.units}
                    onChange={(e) => setEditData({ ...editData, units: e.target.value })}
                  >
                    <option value="in">Inches</option>
                    <option value="cm">Centimeters</option>
                  </select>
                </Field>

                <Field label="Item Description">
                  <input
                    className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                    value={editData.itemDescription}
                    onChange={(e) => setEditData({ ...editData, itemDescription: e.target.value })}
                    placeholder="Description of the piece"
                  />
                </Field>
              </div>
            </div>

            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Pricing</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Subtotal ($)">
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                    value={editData.subtotalAmount}
                    onChange={(e) => {
                      const updated = { ...editData, subtotalAmount: e.target.value };
                      setEditData(recalcWithDiscount(updated));
                    }}
                  />
                </Field>

                <Field label="Tax ($)">
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                    value={editData.taxAmount}
                    onChange={(e) => setEditData({ ...editData, taxAmount: e.target.value })}
                  />
                </Field>

                <Field label="Total ($)">
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 font-semibold"
                    value={editData.totalAmount}
                    onChange={(e) => setEditData({ ...editData, totalAmount: e.target.value })}
                  />
                </Field>
              </div>

              {/* Discount */}
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <h4 className="text-sm font-semibold text-neutral-800 mb-3">Discount</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Discount Type">
                    <select
                      className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                      value={editData.discountType}
                      onChange={(e) => {
                        const updated = { ...editData, discountType: e.target.value, discountValue: "0" };
                        setEditData(recalcWithDiscount(updated));
                      }}
                    >
                      <option value="none">No discount</option>
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed amount ($)</option>
                    </select>
                  </Field>

                  {editData.discountType !== "none" && (
                    <Field label={editData.discountType === "percent" ? "Discount (%)" : "Discount ($)"}>
                      <input
                        type="number"
                        step={editData.discountType === "percent" ? "1" : "0.01"}
                        min="0"
                        className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                        value={editData.discountValue}
                        onChange={(e) => {
                          const updated = { ...editData, discountValue: e.target.value };
                          setEditData(recalcWithDiscount(updated));
                        }}
                      />
                    </Field>
                  )}

                  {editData.discountType !== "none" && Number(editData.discountValue) > 0 && (
                    <div className="flex items-end">
                      <div className="text-sm text-red-600 font-medium pb-2">
                        Saves: ${(() => {
                          const sub = Math.round(Number(editData.subtotalAmount) * 100);
                          const dVal = Number(editData.discountValue) || 0;
                          if (editData.discountType === "percent") return (sub * dVal / 100 / 100).toFixed(2);
                          return dVal.toFixed(2);
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pb-4 mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Notes</h3>
              <div className="grid gap-4">
                <Field label="Internal Notes (staff only)">
                  <textarea
                    className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 min-h-[80px]"
                    value={editData.notesInternal}
                    onChange={(e) => setEditData({ ...editData, notesInternal: e.target.value })}
                    placeholder="Internal notes visible only to staff"
                  />
                </Field>

                <Field label="Customer Notes">
                  <textarea
                    className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 min-h-[80px]"
                    value={editData.notesCustomer}
                    onChange={(e) => setEditData({ ...editData, notesCustomer: e.target.value })}
                    placeholder="Notes from or for the customer"
                  />
                </Field>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <button
                className="rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button className="rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm hover:bg-neutral-800" onClick={saveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
