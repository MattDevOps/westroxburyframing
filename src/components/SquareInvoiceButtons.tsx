"use client";

import { useState } from "react";

export default function SquareInvoiceButtons(props: {
  orderId: string;
  defaultDepositPercent?: number;
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
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send invoice");
      setMsg(`Sent! Invoice id: ${data.invoiceId}`);
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
      {msg ? <span className="text-sm text-neutral-500">{msg}</span> : null}
    </div>
  );
}
