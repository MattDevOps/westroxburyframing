"use client";

import { useMemo, useState } from "react";

type Kind = "full" | "deposit";

export default function SquareInvoiceButtons(props: {
  orderId: string;
  defaultDepositPercent?: number;
  existingInvoiceId?: string; // Optional: if provided, show duplicate button
  customerName?: string;
  customerEmail?: string;
  totalCents?: number;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [lastInvoiceUrl, setLastInvoiceUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<Kind | null>(null);

  const depositPercent = props.defaultDepositPercent ?? 50;

  const amounts = useMemo(() => {
    const total = props.totalCents ?? 0;
    const deposit = Math.round((total * depositPercent) / 100);
    return { total, deposit };
  }, [props.totalCents, depositPercent]);

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  async function send(kind: Kind) {
    setMsg(null);
    setLoading(kind);
    setPreviewKind(null);

    try {
      const res = await fetch(`/staff/api/orders/${props.orderId}/invoice/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, depositPercent }),
      });

      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        // Not JSON
      }

      if (!res.ok) {
        const errMsg =
          data?.error ||
          data?.message ||
          (raw?.slice?.(0, 300) || `Request failed (${res.status})`);
        throw new Error(errMsg);
      }

      if (!data?.invoiceId) {
        throw new Error(
          `Expected JSON with invoiceId, got: ${raw ? raw.slice(0, 200) : "(empty response)"}`
        );
      }

      if (data.publicUrl) {
        setLastInvoiceUrl(data.publicUrl);
        const newWindow = window.open(data.publicUrl, "_blank", "noopener,noreferrer");
        if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
          console.warn("Popup blocked, invoice URL:", data.publicUrl);
        }
      } else {
        console.warn("No publicUrl in response:", data);
        setLastInvoiceUrl(null);
      }

      if (data.message?.includes("already exists")) {
        setMsg(data.message || "Invoice already exists");
        if (data.publicUrl) setLastInvoiceUrl(data.publicUrl);
      } else {
        setMsg(`Sent! Invoice id: ${data.invoiceId}`);
      }
    } catch (e: any) {
      setMsg(e?.message || "Error");
    } finally {
      setLoading(null);
    }
  }

  async function duplicate() {
    if (!props.existingInvoiceId) return;

    setMsg(null);
    setLoading("duplicate");

    try {
      const res = await fetch(`/staff/api/orders/${props.orderId}/invoice/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: props.existingInvoiceId }),
      });

      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        // Not JSON
      }

      if (!res.ok) {
        const errMsg =
          data?.error ||
          data?.message ||
          (raw?.slice?.(0, 300) || `Request failed (${res.status})`);
        throw new Error(errMsg);
      }

      if (!data?.invoiceId) {
        throw new Error(
          `Expected JSON with invoiceId, got: ${raw ? raw.slice(0, 200) : "(empty response)"}`
        );
      }

      setMsg(data.message || `Duplicated! New invoice: ${data.invoiceNumber}`);

      if (data.publicUrl) {
        setLastInvoiceUrl(data.publicUrl);
        const newWindow = window.open(data.publicUrl, "_blank", "noopener,noreferrer");
        if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
          console.warn("Popup blocked, invoice URL:", data.publicUrl);
        }
      }
    } catch (e: any) {
      setMsg(e?.message || "Error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="rounded-xl bg-neutral-900 text-white px-3 py-2 text-sm hover:bg-neutral-800 disabled:opacity-50"
          disabled={!!loading}
          onClick={() => setPreviewKind("full")}
          title="Preview and send the full invoice"
        >
          {loading === "full" ? "Sending…" : "Send Full Invoice"}
        </button>
        <button
          className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-100 disabled:opacity-50"
          disabled={!!loading}
          onClick={() => setPreviewKind("deposit")}
          title={`Preview and send a ${depositPercent}% deposit request`}
        >
          {loading === "deposit" ? "Sending…" : `Send ${depositPercent}% Deposit`}
        </button>
        {props.existingInvoiceId && (
          <button
            className="rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            disabled={!!loading}
            onClick={duplicate}
            title="Create a duplicate of the existing invoice"
          >
            {loading === "duplicate" ? "Duplicating…" : "Duplicate Invoice"}
          </button>
        )}
      </div>

      {msg ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-neutral-600">{msg}</span>
          {loading === null && lastInvoiceUrl && (
            <button
              onClick={() => {
                window.open(lastInvoiceUrl, "_blank", "noopener,noreferrer");
              }}
              className="text-blue-600 hover:underline"
            >
              Open Invoice ↗
            </button>
          )}
        </div>
      ) : null}

      {/* Preview / Confirm Modal */}
      {previewKind && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreviewKind(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200">
              <h3 className="font-semibold text-neutral-900">
                {previewKind === "full" ? "Send Full Invoice" : `Send ${depositPercent}% Deposit`}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewKind(null)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-900">
                The customer receives an email from Square with a secure link to pay
                by credit or debit card.
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Customer</span>
                  <span className="text-neutral-900 font-medium">
                    {props.customerName || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Email</span>
                  <span className="text-neutral-900 font-medium">
                    {props.customerEmail || "—"}
                  </span>
                </div>
                {props.totalCents !== undefined && (
                  <>
                    <div className="flex justify-between pt-2 border-t border-neutral-200">
                      <span className="text-neutral-500">Order total</span>
                      <span className="text-neutral-900 font-medium">
                        {fmt(amounts.total)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-700 font-semibold">
                        Amount to invoice
                      </span>
                      <span className="text-neutral-900 font-bold text-base">
                        {previewKind === "full"
                          ? fmt(amounts.total)
                          : `${fmt(amounts.deposit)} (${depositPercent}%)`}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {!props.customerEmail && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
                  ⚠ No customer email on file — Square will not be able to deliver
                  the invoice.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-neutral-200 bg-neutral-50">
              <button
                type="button"
                onClick={() => setPreviewKind(null)}
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => send(previewKind)}
                disabled={!props.customerEmail}
                className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
              >
                Send via Square
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
