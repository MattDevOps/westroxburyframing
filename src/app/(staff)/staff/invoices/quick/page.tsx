"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Quick Invoice — type a price and a message, get a shareable pay link.
 * No customer, no order, no line items. Everything else (invoice number,
 * date, business details) is filled in automatically.
 */
export default function QuickInvoicePage() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const amountCents = Math.round(Number(amount) * 100);
  const valid = Number.isFinite(amountCents) && amountCents >= 100;

  async function create() {
    if (!valid) {
      setError("Enter an amount of $1.00 or more.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/staff/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtotalAmount: amountCents,
          taxAmount: 0,
          discountAmount: 0,
          notes: message.trim() || null,
          status: "sent",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create invoice");
      const inv = data.invoice;
      setInvoiceId(inv.id);
      setInvoiceNumber(inv.invoiceNumber);
      setPayUrl(`${window.location.origin}/pay/${inv.id}`);
    } catch (e: any) {
      setError(e?.message || "Failed to create invoice");
    } finally {
      setCreating(false);
    }
  }

  function copy() {
    if (!payUrl) return;
    navigator.clipboard.writeText(payUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function reset() {
    setAmount("");
    setMessage("");
    setPayUrl(null);
    setInvoiceId(null);
    setInvoiceNumber(null);
    setError(null);
  }

  /* ── Done: show the link ─────────────────────────────── */
  if (payUrl) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 space-y-5">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h1 className="text-lg font-semibold text-emerald-900">
            Invoice {invoiceNumber} created
          </h1>
          <p className="text-sm text-emerald-800 mt-1">
            Send this link to your customer. They can pay by card on the page.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Payment link
          </label>
          <input
            readOnly
            value={payUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm font-mono"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={copy}
              className="rounded-xl bg-black text-white px-5 py-2.5 text-sm"
            >
              {copied ? "✓ Copied!" : "🔗 Copy Link"}
            </button>
            <a
              href={payUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-neutral-300 px-5 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Preview ↗
            </a>
            <a
              href={`sms:?&body=${encodeURIComponent(
                `West Roxbury Framing invoice ${invoiceNumber}: ${payUrl}`
              )}`}
              className="rounded-xl border border-neutral-300 px-5 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Text it
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={reset}
            className="rounded-xl border border-neutral-300 px-5 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            + Another Quick Invoice
          </button>
          <Link
            href={`/staff/invoices/${invoiceId}`}
            className="rounded-xl border border-neutral-300 px-5 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Open Invoice
          </Link>
          <Link
            href="/staff/invoices"
            className="rounded-xl border border-neutral-300 px-5 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            All Invoices
          </Link>
        </div>
      </div>
    );
  }

  /* ── Form ────────────────────────────────────────────── */
  return (
    <div className="mx-auto max-w-xl px-4 py-10 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Quick Invoice</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Enter an amount and a note. We fill in the invoice number, date and
          shop details, and give you a link to send.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-neutral-800 mb-1.5">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-lg">
              $
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-neutral-300 pl-9 pr-4 py-3 text-lg"
            />
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Total the customer pays. Enter it tax-included.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-800 mb-1.5">
            Message
          </label>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What is this for? e.g. Custom frame, 24x36 walnut with museum glass — balance due on pickup."
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm"
          />
          <p className="text-xs text-neutral-400 mt-1">
            Shown to the customer on the payment page.
          </p>
        </div>

        {error && <div className="text-sm text-red-700">{error}</div>}

        <div className="flex gap-2">
          <button
            onClick={create}
            disabled={!valid || creating}
            className="rounded-xl bg-black text-white px-6 py-3 text-sm disabled:opacity-40"
          >
            {creating ? "Creating…" : "Create & Get Link"}
          </button>
          <Link
            href="/staff/invoices"
            className="rounded-xl border border-neutral-300 px-6 py-3 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
