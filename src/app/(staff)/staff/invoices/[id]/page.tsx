"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  draft: "border-neutral-300 text-neutral-700 bg-neutral-50",
  sent: "border-blue-300 text-blue-700 bg-blue-50",
  partial: "border-amber-300 text-amber-700 bg-amber-50",
  paid: "border-emerald-300 text-emerald-700 bg-emerald-50",
  void: "border-red-300 text-red-700 bg-red-50",
  cancelled: "border-red-200 text-red-600 bg-red-50",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  partial: "Partially Paid",
  paid: "Paid in Full",
  void: "Voided",
  cancelled: "Cancelled",
};

const METHOD_LABELS: Record<string, string> = {
  square: "Square",
  cash: "Cash",
  check: "Check",
  other: "Other",
};

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payNote, setPayNote] = useState("");
  const [paying, setPaying] = useState(false);

  // Send to Square state
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<string | null>(null);
  
  // QuickBooks Online sync state
  const [syncingQBO, setSyncingQBO] = useState(false);
  const [qboSyncMsg, setQboSyncMsg] = useState<string | null>(null);

  // Email invoice state
  const [emailing, setEmailing] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function loadInvoice() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/staff/api/invoices/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setInvoice(data.invoice);
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function recordPayment() {
    const amountCents = Math.round(Number(payAmount) * 100);
    if (!amountCents || amountCents < 1) return;

    setPaying(true);
    try {
      const res = await fetch(`/staff/api/invoices/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountCents,
          method: payMethod,
          note: payNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Payment failed");
        return;
      }
      setPayAmount("");
      setPayNote("");
      setShowPaymentForm(false);
      await loadInvoice();
    } catch (e: any) {
      alert(e?.message || "Error");
    } finally {
      setPaying(false);
    }
  }

  async function sendToSquare(kind: "full" | "deposit") {
    setSending(true);
    setSendMsg(null);
    try {
      const res = await fetch(`/staff/api/invoices/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendMsg(data.error || "Send failed");
        return;
      }
      setSendMsg(`Sent! Invoice ID: ${data.invoiceId}`);
      if (data.publicUrl) {
        window.open(data.publicUrl, "_blank", "noopener,noreferrer");
      }
      await loadInvoice();
    } catch (e: any) {
      setSendMsg(e?.message || "Error");
    } finally {
      setSending(false);
    }
  }

  async function syncToQBO() {
    setSyncingQBO(true);
    setQboSyncMsg(null);
    try {
      const res = await fetch(`/staff/api/quickbooks/sync-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setQboSyncMsg(data.error || "Sync failed");
        return;
      }
      setQboSyncMsg(`Synced to QuickBooks! Invoice #${data.qboDocNumber || data.qboInvoiceId}`);
      await loadInvoice();
    } catch (e: any) {
      setQboSyncMsg(e?.message || "Error syncing to QuickBooks");
    } finally {
      setSyncingQBO(false);
    }
  }

  async function voidInvoice() {
    if (!confirm("Void this invoice? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/staff/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "void" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed");
        return;
      }
      await loadInvoice();
    } catch (e: any) {
      alert(e?.message || "Error");
    }
  }

  async function deleteInvoice() {
    if (!confirm("Permanently delete this invoice? This cannot be undone.")) return;
    try {
      const res = await fetch(`/staff/api/invoices/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed");
        return;
      }
      router.push("/staff/invoices");
    } catch (e: any) {
      alert(e?.message || "Error");
    }
  }

  async function emailInvoiceToCustomer() {
    setEmailing(true);
    setEmailMsg(null);
    try {
      const res = await fetch(`/staff/api/invoices/${id}/email`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setEmailMsg(data.error || "Failed to send email");
        return;
      }
      setEmailMsg(`✅ Invoice emailed to ${data.sentTo}`);
    } catch (e: any) {
      setEmailMsg(e?.message || "Error");
    } finally {
      setEmailing(false);
    }
  }

  function copyPayLink() {
    if (!invoice) return;
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/pay/${invoice.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function markSent() {
    try {
      const res = await fetch(`/staff/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sent" }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed");
        return;
      }
      await loadInvoice();
    } catch (e: any) {
      alert(e?.message || "Error");
    }
  }

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (loading) return <div className="p-6 text-neutral-500">Loading…</div>;
  if (error) return <div className="p-6 text-red-700">{error}</div>;
  if (!invoice) return <div className="p-6 text-neutral-500">Not found.</div>;

  const isPaid = invoice.status === "paid";
  const isVoid = invoice.status === "void" || invoice.status === "cancelled";
  const canPay = !isPaid && !isVoid;
  const canSend = canPay && invoice.customer.email;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900">{invoice.invoiceNumber}</h1>
            <span className={`text-sm px-3 py-1 rounded-full border ${STATUS_COLORS[invoice.status] || STATUS_COLORS.draft}`}>
              {STATUS_LABELS[invoice.status] || invoice.status}
            </span>
          </div>
          <div className="text-sm text-neutral-600 mt-1">
            <Link
              href={`/staff/customers/${invoice.customer.id}`}
              className="text-blue-600 hover:underline"
            >
              {invoice.customer.firstName} {invoice.customer.lastName}
            </Link>
            {invoice.customer.email && ` · ${invoice.customer.email}`}
            {invoice.customer.phone && ` · ${invoice.customer.phone}`}
          </div>
          <div className="text-xs text-neutral-400 mt-1">
            Created {new Date(invoice.createdAt).toLocaleDateString()}{" "}
            {invoice.createdBy?.name && `by ${invoice.createdBy.name}`}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {invoice.status === "draft" && (
            <button
              onClick={markSent}
              className="rounded-xl border border-blue-300 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
            >
              Mark as Sent
            </button>
          )}
          {canPay && (
            <button
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm hover:bg-emerald-700"
            >
              Record Payment
            </button>
          )}
          {!isPaid && !isVoid && (
            <button
              onClick={voidInvoice}
              className="rounded-xl border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              Void
            </button>
          )}
          <button
            onClick={deleteInvoice}
            className="rounded-xl bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700"
          >
            Delete
          </button>
          <a
            href={`/staff/api/invoices/${id}/pdf`}
            target="_blank"
            className="rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm hover:bg-neutral-800 transition-colors"
          >
            Download PDF
          </a>
          <button
            onClick={syncToQBO}
            disabled={syncingQBO || invoice.status === "draft"}
            className="rounded-xl border border-purple-300 px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title={invoice.status === "draft" ? "Invoice must be sent before syncing to QuickBooks" : "Sync to QuickBooks Online"}
          >
            {syncingQBO ? "Syncing..." : invoice.qboInvoiceId ? "Re-sync to QBO" : "Sync to QBO"}
          </button>
          <button
            onClick={() => router.back()}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            ← Back
          </button>
        </div>
      </div>

      {qboSyncMsg && (
        <div className={`rounded-xl border p-4 ${
          qboSyncMsg.includes("Synced") || qboSyncMsg.includes("success")
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {qboSyncMsg}
        </div>
      )}

      {invoice.qboInvoiceId && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
          <div className="text-sm font-medium text-purple-900 mb-1">QuickBooks Online</div>
          <div className="text-xs text-purple-700">
            Synced {invoice.qboSyncedAt ? new Date(invoice.qboSyncedAt).toLocaleString() : ""}
            {invoice.qboInvoiceId && ` • QBO ID: ${invoice.qboInvoiceId}`}
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-xs text-neutral-500 mb-1">Total</div>
          <div className="text-xl font-bold text-neutral-900">{fmt(invoice.totalAmount)}</div>
          {invoice.discountAmount > 0 && (
            <div className="text-xs text-red-600 mt-0.5">
              Discount: -{fmt(invoice.discountAmount)}
            </div>
          )}
        </div>
        {invoice.depositPercent && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
            <div className="text-xs text-blue-600 mb-1">Deposit ({invoice.depositPercent}%)</div>
            <div className="text-xl font-bold text-blue-700">{fmt(invoice.depositAmount)}</div>
          </div>
        )}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="text-xs text-emerald-600 mb-1">Paid</div>
          <div className="text-xl font-bold text-emerald-700">{fmt(invoice.amountPaid)}</div>
        </div>
        <div className={`rounded-2xl border p-4 ${invoice.balanceDue > 0 ? "border-amber-200 bg-amber-50/50" : "border-emerald-200 bg-emerald-50/50"}`}>
          <div className="text-xs mb-1" style={{ color: invoice.balanceDue > 0 ? "#b45309" : "#047857" }}>
            Balance Due
          </div>
          <div className="text-xl font-bold" style={{ color: invoice.balanceDue > 0 ? "#b45309" : "#047857" }}>
            {fmt(invoice.balanceDue)}
          </div>
        </div>
      </div>

      {/* Record Payment Form */}
      {showPaymentForm && canPay && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-4">
          <h3 className="font-semibold text-neutral-900">Record Payment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-neutral-700 mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder={(invoice.balanceDue / 100).toFixed(2)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-700 mb-1">Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm"
              >
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="square">Square</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-neutral-700 mb-1">Note (optional)</label>
              <input
                type="text"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                placeholder="e.g. Check #1234"
                className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {invoice.depositPercent && invoice.amountPaid === 0 && (
              <button
                type="button"
                onClick={() => setPayAmount((invoice.depositAmount / 100).toFixed(2))}
                className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100"
              >
                Apply deposit ({fmt(invoice.depositAmount)})
              </button>
            )}
            <button
              type="button"
              onClick={() => setPayAmount((invoice.balanceDue / 100).toFixed(2))}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100"
            >
              Pay full balance ({fmt(invoice.balanceDue)})
            </button>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowPaymentForm(false)}
              className="rounded-xl border border-neutral-300 px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={recordPayment}
              disabled={paying || !payAmount}
              className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm disabled:opacity-50"
            >
              {paying ? "Recording…" : "Record Payment"}
            </button>
          </div>
        </div>
      )}

      {/* Square Invoice Section */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
        <h3 className="font-semibold text-neutral-900">Square Invoice</h3>

        {invoice.squareInvoiceId ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-neutral-600">Invoice: {invoice.squareInvoiceId}</span>
            {invoice.squareInvoiceUrl && (
              <a
                href={invoice.squareInvoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View in Square →
              </a>
            )}
          </div>
        ) : canSend ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={sending}
              onClick={() => sendToSquare("full")}
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send Full Invoice"}
            </button>
            {invoice.depositPercent && (
              <button
                disabled={sending}
                onClick={() => sendToSquare("deposit")}
                className="rounded-xl border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
              >
                {sending ? "Sending…" : `Send Deposit (${invoice.depositPercent}%)`}
              </button>
            )}
            {!invoice.customer.email && (
              <span className="text-xs text-amber-600">Customer email required to send</span>
            )}
          </div>
        ) : (
          <div className="text-sm text-neutral-500">
            {!invoice.customer.email
              ? "Add customer email to send via Square."
              : "Invoice is already paid or voided."}
          </div>
        )}

        {sendMsg && (
          <div className="text-sm text-neutral-600">{sendMsg}</div>
        )}
      </div>

      {/* Online Payment Portal */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
        <h3 className="font-semibold text-neutral-900">Online Payment</h3>
        <p className="text-sm text-neutral-500">
          Send a branded payment link so customers can pay by credit card directly on your website.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {canSend && (
            <button
              disabled={emailing}
              onClick={emailInvoiceToCustomer}
              className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {emailing ? "Sending…" : "📧 Email Invoice to Customer"}
            </button>
          )}
          <button
            onClick={copyPayLink}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            {copied ? "✓ Copied!" : "🔗 Copy Pay Link"}
          </button>
          <a
            href={`/pay/${invoice.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Preview Pay Page ↗
          </a>
        </div>
        {emailMsg && (
          <div className="text-sm text-neutral-600">{emailMsg}</div>
        )}
      </div>

      {/* Linked Orders */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
        <h3 className="font-semibold text-neutral-900">
          Linked Orders ({invoice.orders?.length || 0})
        </h3>

        {(!invoice.orders || invoice.orders.length === 0) ? (
          <p className="text-sm text-neutral-500">No orders linked to this invoice.</p>
        ) : (
          <div className="space-y-2">
            {invoice.orders.map((o: any) => (
              <Link
                key={o.id}
                href={`/staff/orders/${o.id}`}
                className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 hover:bg-neutral-50 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-neutral-900">{o.orderNumber}</span>
                  <span className="text-xs text-neutral-500">{o.itemType}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    o.status === "completed" || o.status === "picked_up"
                      ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                      : "border-blue-200 text-blue-700 bg-blue-50"
                  }`}>
                    {o.status.replace(/_/g, " ")}
                  </span>
                </div>
                <span className="text-sm font-medium">{fmt(o.totalAmount)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Payment Timeline */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
        <h3 className="font-semibold text-neutral-900">
          Payment History ({invoice.payments?.length || 0})
        </h3>

        {(!invoice.payments || invoice.payments.length === 0) ? (
          <p className="text-sm text-neutral-500">No payments recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {invoice.payments.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    p.status === "paid"
                      ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                      : "border-red-200 text-red-700 bg-red-50"
                  }`}>
                    {p.status === "paid" ? "Paid" : "Refunded"}
                  </span>
                  <span className="text-sm text-neutral-600">
                    {METHOD_LABELS[p.method] || p.method}
                  </span>
                  {p.squarePaymentId && (
                    <span className="text-xs text-neutral-400">Square #{p.squarePaymentId.slice(-8)}</span>
                  )}
                  {p.note && (
                    <span className="text-xs text-neutral-500 italic">{p.note}</span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-neutral-900">{fmt(p.amount)}</div>
                  <div className="text-xs text-neutral-400">
                    {new Date(p.paidAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="font-semibold text-neutral-900 mb-2">Notes</h3>
          <p className="text-sm text-neutral-600 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
