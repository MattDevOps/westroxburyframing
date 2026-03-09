"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Receipt,
  ArrowLeft,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────── */

interface InvoiceOrder {
  orderNumber: string;
  itemType: string;
  description: string | null;
  amount: number;
}

interface InvoicePayment {
  id: string;
  amount: number;
  method: string;
  paidAt: string;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string | null;
  status: string;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  depositAmount: number;
  depositPercent: number | null;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  squareInvoiceUrl: string | null;
  notes: string | null;
  createdAt: string;
  orders: InvoiceOrder[];
  payments: InvoicePayment[];
}

/* ── Helpers ───────────────────────────────────────────────── */

function cents(n: number) {
  return "$" + (n / 100).toFixed(2);
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  partial: "Partially Paid",
  paid: "Paid",
  void: "Voided",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-neutral-500/20 text-neutral-400",
  sent: "bg-blue-500/20 text-blue-400",
  partial: "bg-amber-500/20 text-amber-400",
  paid: "bg-emerald-500/20 text-emerald-400",
  void: "bg-red-500/20 text-red-400",
  cancelled: "bg-red-500/20 text-red-400",
};

/* ── Component ─────────────────────────────────────────────── */

export default function PaymentContent() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment states
  const [cardReady, setCardReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState<{
    paymentId: string;
    amount: number;
    receiptUrl: string | null;
  } | null>(null);

  // Square SDK refs
  const cardRef = useRef<any>(null);
  const paymentsRef = useRef<any>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  const loadInvoice = useCallback(async () => {
    try {
      const res = await fetch(`/api/pay/${id}`);
      if (!res.ok) {
        setError(res.status === 404 ? "Invoice not found" : "Failed to load invoice");
        return;
      }
      const data = await res.json();
      setInvoice(data);
    } catch {
      setError("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load invoice
  useEffect(() => {
    if (id) loadInvoice();
  }, [id, loadInvoice]);

  // Initialize Square Web Payments SDK
  useEffect(() => {
    if (!invoice || invoice.status === "paid" || invoice.status === "void" || invoice.status === "cancelled") {
      return;
    }
    if (invoice.balanceDue < 100) return;

    let destroyed = false;

    async function initSquare() {
      // Load the Square SDK script if not already loaded
      if (!(window as any).Square) {
        const script = document.createElement("script");
        const env = process.env.NEXT_PUBLIC_SQUARE_ENV || "sandbox";
        script.src =
          env === "production"
            ? "https://web.squarecdn.com/v1/square.js"
            : "https://sandbox.web.squarecdn.com/v1/square.js";
        script.async = true;
        document.head.appendChild(script);
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Square SDK"));
        });
      }

      if (destroyed) return;

      const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
      const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

      if (!appId || !locationId) {
        setPayError("Payment system not configured. Please contact the shop.");
        return;
      }

      try {
        const payments = (window as any).Square.payments(appId, locationId);
        paymentsRef.current = payments;

        const card = await payments.card();
        if (destroyed) {
          await card.destroy();
          return;
        }

        cardRef.current = card;

        if (cardContainerRef.current) {
          await card.attach(cardContainerRef.current);
          setCardReady(true);
        }
      } catch (err: any) {
        console.error("Square SDK init error:", err);
        setPayError("Could not initialize payment form. Please try refreshing.");
      }
    }

    initSquare();

    return () => {
      destroyed = true;
      if (cardRef.current) {
        try {
          cardRef.current.destroy();
        } catch {}
        cardRef.current = null;
      }
    };
  }, [invoice]);

  async function handlePay() {
    if (!cardRef.current || !invoice) return;

    setProcessing(true);
    setPayError(null);

    try {
      // Tokenize the card
      const result = await cardRef.current.tokenize();

      if (result.status !== "OK") {
        setPayError(
          result.errors?.[0]?.message || "Please check your card details and try again."
        );
        return;
      }

      const sourceId = result.token;

      // Process the payment via our API
      const res = await fetch(`/api/pay/${id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPayError(data.error || "Payment failed. Please try again.");
        return;
      }

      setPaySuccess({
        paymentId: data.paymentId,
        amount: data.amountPaid,
        receiptUrl: data.receiptUrl,
      });

      // Refresh invoice data
      await loadInvoice();
    } catch (err: any) {
      setPayError(err?.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  /* ── Render: Loading ───────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-24">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }

  /* ── Render: Error ─────────────────────────────────────── */
  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-background pt-32">
        <div className="max-w-lg mx-auto px-6 text-center">
          <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
          <h1 className="font-serif text-2xl text-foreground mb-2">
            {error || "Invoice Not Found"}
          </h1>
          <p className="text-muted-foreground mb-6">
            This invoice may have expired or doesn&apos;t exist.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gold hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === "paid";
  const isVoid = invoice.status === "void" || invoice.status === "cancelled";
  const canPay = !isPaid && !isVoid && invoice.balanceDue >= 100;

  /* ── Render: Success ───────────────────────────────────── */
  if (paySuccess) {
    return (
      <div className="min-h-screen bg-background pt-32">
        <div className="max-w-lg mx-auto px-6">
          <div className="bg-card border border-emerald-500/30 rounded-lg p-8 text-center">
            <CheckCircle2 className="mx-auto text-emerald-400 mb-4" size={56} />
            <h1 className="font-serif text-2xl text-foreground mb-2">
              Payment Successful!
            </h1>
            <p className="text-muted-foreground mb-6">
              Thank you for your payment of{" "}
              <span className="text-emerald-400 font-semibold">
                {cents(paySuccess.amount)}
              </span>{" "}
              for invoice{" "}
              <span className="text-foreground font-semibold">
                #{invoice.invoiceNumber}
              </span>
              .
            </p>

            {paySuccess.receiptUrl && (
              <a
                href={paySuccess.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-primary-foreground font-semibold text-sm rounded-sm hover:opacity-90 transition-opacity mb-4"
              >
                <Receipt size={16} /> View Receipt
              </a>
            )}

            <div className="mt-6 pt-6 border-t border-border space-y-2 text-sm text-muted-foreground">
              <p>A confirmation has been sent to your email.</p>
              {invoice.balanceDue > 0 && invoice.balanceDue > paySuccess.amount && (
                <p className="text-amber-400">
                  Remaining balance: {cents(invoice.balanceDue - paySuccess.amount)}
                </p>
              )}
            </div>

            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-gold hover:opacity-80 transition-opacity text-sm"
              >
                <ArrowLeft size={14} /> Back to West Roxbury Framing
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Render: Invoice + Payment Form ──────────────────── */
  return (
    <div className="min-h-screen bg-background pt-28 pb-16">
      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-foreground mb-1">
            West Roxbury <span className="text-gold">Framing</span>
          </h1>
          <p className="text-muted-foreground text-sm">Pay Invoice Online</p>
        </div>

        {/* Invoice Card */}
        <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
          {/* Invoice header */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-foreground font-semibold text-lg">
                Invoice #{invoice.invoiceNumber}
              </h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                {invoice.customerName}
              </p>
            </div>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                STATUS_COLORS[invoice.status] || "bg-neutral-500/20 text-neutral-400"
              }`}
            >
              {STATUS_LABELS[invoice.status] || invoice.status}
            </span>
          </div>

          {/* Line items */}
          {invoice.orders.length > 0 && (
            <div className="p-6 border-b border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Items
              </h3>
              <div className="space-y-3">
                {invoice.orders.map((order) => (
                  <div
                    key={order.orderNumber}
                    className="flex items-start justify-between"
                  >
                    <div>
                      <p className="text-foreground text-sm font-medium">
                        {order.itemType}
                      </p>
                      {order.description && (
                        <p className="text-muted-foreground text-xs mt-0.5">
                          {order.description}
                        </p>
                      )}
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Order #{order.orderNumber}
                      </p>
                    </div>
                    <span className="text-foreground text-sm font-medium ml-4">
                      {cents(order.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="p-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">{cents(invoice.subtotalAmount)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-emerald-400">
                  −{cents(invoice.discountAmount)}
                </span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="text-foreground">{cents(invoice.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">{cents(invoice.totalAmount)}</span>
            </div>
            {invoice.amountPaid > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid</span>
                <span className="text-emerald-400">
                  −{cents(invoice.amountPaid)}
                </span>
              </div>
            )}
            {!isPaid && (
              <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                <span className="text-foreground">Balance Due</span>
                <span className="text-gold">{cents(invoice.balanceDue)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment history */}
        {invoice.payments.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Payment History
            </h3>
            <div className="space-y-2">
              {invoice.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-400" size={14} />
                    <span className="text-muted-foreground">
                      {new Date(p.paidAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-muted-foreground/60 text-xs capitalize">
                      ({p.method})
                    </span>
                  </div>
                  <span className="text-emerald-400 font-medium">{cents(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paid banner */}
        {isPaid && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6 text-center">
            <CheckCircle2 className="mx-auto text-emerald-400 mb-3" size={40} />
            <h3 className="text-foreground font-semibold text-lg">
              This invoice is fully paid
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              Thank you for your payment!
            </p>
          </div>
        )}

        {/* Void/Cancelled banner */}
        {isVoid && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <AlertCircle className="mx-auto text-red-400 mb-3" size={40} />
            <h3 className="text-foreground font-semibold text-lg">
              This invoice has been {invoice.status}
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              Please contact us if you have questions.
            </p>
          </div>
        )}

        {/* Payment form */}
        {canPay && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-foreground font-semibold text-lg mb-1">
              Pay {cents(invoice.balanceDue)}
            </h3>
            <p className="text-muted-foreground text-sm mb-5">
              Enter your card details below to pay securely.
            </p>

            {/* Square card element */}
            <div className="mb-5">
              <div
                ref={cardContainerRef}
                className="min-h-[44px] bg-[#1a1a1a] rounded-md border border-border"
              />
              {!cardReady && !payError && (
                <div className="flex items-center justify-center py-3 text-muted-foreground text-sm">
                  <Loader2 className="animate-spin mr-2" size={14} />
                  Loading payment form...
                </div>
              )}
            </div>

            {payError && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-md mb-4">
                <AlertCircle className="text-red-400 mt-0.5 flex-shrink-0" size={16} />
                <p className="text-red-400 text-sm">{payError}</p>
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={!cardReady || processing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gold text-primary-foreground font-semibold text-sm uppercase tracking-wide rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  Pay {cents(invoice.balanceDue)}
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground/60 text-xs">
              <Shield size={12} />
              Secured by Square — your card details are encrypted end-to-end
            </div>
          </div>
        )}

        {/* Also offer Square hosted link if available */}
        {canPay && invoice.squareInvoiceUrl && (
          <div className="mt-4 text-center">
            <p className="text-muted-foreground text-xs mb-2">Or pay via Square directly:</p>
            <a
              href={invoice.squareInvoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold text-sm hover:underline"
            >
              Open Square Invoice →
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center space-y-2 text-muted-foreground/60 text-xs">
          <p>
            West Roxbury Framing · 1741 Centre Street, West Roxbury, MA 02132
          </p>
          <p>(617) 327-3890 · westroxburyframing.com</p>
          <Link href="/" className="text-gold hover:underline">
            Visit Our Website
          </Link>
        </div>
      </div>
    </div>
  );
}
