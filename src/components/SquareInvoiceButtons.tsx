"use client";

import { useState } from "react";

export default function SquareInvoiceButtons(props: {
  orderId: string;
  defaultDepositPercent?: number;
  existingInvoiceId?: string; // Optional: if provided, show duplicate button
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function send(kind: "full" | "deposit") {
    setMsg(null);
    setLoading(kind);
  
    try {
      const res = await fetch(`/staff/api/orders/${props.orderId}/invoice/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          depositPercent: props.defaultDepositPercent ?? 50,
        }),
      });
  
      const raw = await res.text(); // <-- key change (don’t assume JSON)
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        // Not JSON (could be HTML error or empty)
      }
  
      if (!res.ok) {
        const msg =
          data?.error ||
          data?.message ||
          (raw?.slice?.(0, 300) || `Request failed (${res.status})`);
        throw new Error(msg);
      }

      if (!data?.invoiceId) {
        throw new Error(
          `Expected JSON with invoiceId, got: ${raw ? raw.slice(0, 200) : "(empty response)"}`
        );
      }

      // Show appropriate message
      if (data.message?.includes("already exists")) {
        setMsg(data.message || "Invoice already exists");
      } else {
        setMsg(`Sent! Invoice id: ${data.invoiceId}`);
      }
      
      if (data.publicUrl) window.open(data.publicUrl, "_blank", "noopener,noreferrer");
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
        body: JSON.stringify({
          invoiceId: props.existingInvoiceId,
        }),
      });
  
      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        // Not JSON
      }
  
      if (!res.ok) {
        const msg =
          data?.error ||
          data?.message ||
          (raw?.slice?.(0, 300) || `Request failed (${res.status})`);
        throw new Error(msg);
      }

      if (!data?.invoiceId) {
        throw new Error(
          `Expected JSON with invoiceId, got: ${raw ? raw.slice(0, 200) : "(empty response)"}`
        );
      }

      setMsg(data.message || `Duplicated! New invoice: ${data.invoiceNumber}`);
      
      if (data.publicUrl) window.open(data.publicUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setMsg(e?.message || "Error");
    } finally {
      setLoading(null);
    }
  }
  
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
        disabled={!!loading}
        onClick={() => send("full")}
      >
        {loading === "full" ? "Sending..." : "Send invoice (full)"}
      </button>
      <button
        className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
        disabled={!!loading}
        onClick={() => send("deposit")}
      >
        {loading === "deposit" ? "Sending..." : "Send deposit (50%)"}
      </button>
      {props.existingInvoiceId && (
        <button
          className="rounded-xl border border-blue-300 px-3 py-2 text-sm text-blue-300 hover:bg-blue-900/20"
          disabled={!!loading}
          onClick={duplicate}
        >
          {loading === "duplicate" ? "Duplicating..." : "Duplicate Invoice"}
        </button>
      )}
      {msg ? <span className="text-sm text-neutral-500">{msg}</span> : null}
    </div>
  );
}
