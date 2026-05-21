"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Gift,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CreditCard,
} from "lucide-react";

const PRESET_AMOUNTS = [25, 50, 100, 200];
const MIN_AMOUNT = 10;
const MAX_AMOUNT = 1000;
const MAX_MESSAGE = 300;

interface SuccessState {
  certificateNumber: string;
  amount: string;
  recipientEmail: string;
  deliverAt: string | null;
}

export default function GiftCardsContent() {
  // Form state
  const [amountChoice, setAmountChoice] = useState<number | "custom">(100);
  const [customAmount, setCustomAmount] = useState("");
  const [purchasedByName, setPurchasedByName] = useState("");
  const [purchasedByEmail, setPurchasedByEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientMessage, setRecipientMessage] = useState("");
  const [deliverAt, setDeliverAt] = useState(""); // empty = immediate

  // UI state
  const [cardReady, setCardReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  // Square SDK refs
  const cardRef = useRef<any>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  const amountCents = (() => {
    if (amountChoice === "custom") {
      const n = parseFloat(customAmount);
      return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
    }
    return amountChoice * 100;
  })();
  const amountValid = amountCents >= MIN_AMOUNT * 100 && amountCents <= MAX_AMOUNT * 100;

  // Init Square Web Payments SDK
  useEffect(() => {
    if (success) return;
    let destroyed = false;

    async function init() {
      try {
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
          setSdkError("Payments are not configured. Please call the shop at (617) 327-3890 to purchase by phone.");
          return;
        }

        const payments = (window as any).Square.payments(appId, locationId);
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
      } catch (e: any) {
        console.error("Square init error", e);
        setSdkError("Could not load the payment form. Please refresh and try again.");
      }
    }
    init();

    return () => {
      destroyed = true;
      if (cardRef.current) {
        try {
          cardRef.current.destroy();
        } catch {}
        cardRef.current = null;
      }
    };
  }, [success]);

  function validateForm(): string | null {
    if (!amountValid) return `Choose an amount between $${MIN_AMOUNT} and $${MAX_AMOUNT}.`;
    if (purchasedByName.trim().length < 2) return "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(purchasedByEmail.trim())) return "Please enter a valid email for yourself.";
    if (recipientName.trim().length < 2) return "Please enter the recipient's name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) return "Please enter a valid recipient email.";
    if (recipientMessage.length > MAX_MESSAGE) return `Message must be ${MAX_MESSAGE} characters or fewer.`;
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }
    if (!cardRef.current) {
      setFormError("Payment form is still loading. Please wait a moment.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const tokenResult = await cardRef.current.tokenize();
      if (tokenResult.status !== "OK") {
        setFormError(
          tokenResult.errors?.[0]?.message || "Please check your card details and try again."
        );
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/gift-cards/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: tokenResult.token,
          amountCents,
          purchasedByName: purchasedByName.trim(),
          purchasedByEmail: purchasedByEmail.trim(),
          recipientName: recipientName.trim(),
          recipientEmail: recipientEmail.trim(),
          recipientMessage: recipientMessage.trim() || undefined,
          deliverAt: deliverAt || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Purchase failed. Please try again.");
        setSubmitting(false);
        return;
      }
      setSuccess({
        certificateNumber: data.certificateNumber,
        amount: data.amount,
        recipientEmail: data.recipientEmail,
        deliverAt: data.deliverAt,
      });
    } catch (e: any) {
      console.error(e);
      setFormError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Success ─────────────────────────────────────────────── */
  if (success) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-24">
        <div className="max-w-lg mx-auto px-6">
          <div className="bg-card border border-emerald-500/30 rounded-lg p-8 text-center">
            <CheckCircle2 className="mx-auto text-emerald-400 mb-4" size={56} />
            <h1 className="font-serif text-2xl text-foreground mb-2">Gift Card Sent!</h1>
            <p className="text-muted-foreground mb-6">
              We&apos;ve charged your card{" "}
              <span className="text-foreground font-semibold">{success.amount}</span> and issued
              certificate{" "}
              <span className="text-foreground font-semibold">{success.certificateNumber}</span>.
            </p>
            <div className="bg-secondary/40 border border-border rounded-md p-4 text-sm text-left text-muted-foreground space-y-2">
              {success.deliverAt ? (
                <p>
                  <span className="text-foreground font-medium">Scheduled delivery:</span>{" "}
                  We&apos;ll email the certificate (with printable PDF) to{" "}
                  <span className="text-foreground">{success.recipientEmail}</span> on{" "}
                  {new Date(success.deliverAt).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  .
                </p>
              ) : (
                <p>
                  We&apos;ve emailed the gift certificate (with a printable PDF) to{" "}
                  <span className="text-foreground">{success.recipientEmail}</span>.
                </p>
              )}
              <p>A receipt has been sent to your inbox.</p>
            </div>

            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 text-gold hover:opacity-80 transition-opacity text-sm"
            >
              <ArrowLeft size={14} /> Back to West Roxbury Framing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-32 pb-12 bg-secondary">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Gift className="mx-auto text-gold mb-4" size={40} />
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4">
              Gift <span className="text-gold">Cards</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The perfect gift for anyone with a photo, painting, jersey, or piece of memorabilia
              waiting to be framed. Emailed instantly as a printable PDF — never expires.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="py-16">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-6 space-y-8">
          {/* Amount */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">Choose an amount</h2>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setAmountChoice(amt);
                    setCustomAmount("");
                  }}
                  className={`rounded-md py-3 text-base font-semibold border transition-colors ${
                    amountChoice === amt
                      ? "border-gold bg-gold/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/40"
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
            <div className={`rounded-md border p-3 ${amountChoice === "custom" ? "border-gold bg-gold/5" : "border-border"}`}>
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="amount-choice"
                  checked={amountChoice === "custom"}
                  onChange={() => setAmountChoice("custom")}
                  className="accent-gold"
                />
                <span className="text-sm text-foreground">Custom amount</span>
                <div className="flex-1 flex items-center gap-1">
                  <span className="text-muted-foreground">$</span>
                  <input
                    type="number"
                    min={MIN_AMOUNT}
                    max={MAX_AMOUNT}
                    step="1"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setAmountChoice("custom");
                    }}
                    placeholder={`${MIN_AMOUNT} – ${MAX_AMOUNT}`}
                    className="flex-1 bg-transparent text-foreground border-b border-border focus:outline-none focus:border-gold py-1"
                  />
                </div>
              </label>
            </div>
            {!amountValid && (amountChoice === "custom" && customAmount) && (
              <p className="text-xs text-amber-400 mt-2">
                Amount must be between ${MIN_AMOUNT} and ${MAX_AMOUNT}.
              </p>
            )}
          </div>

          {/* Buyer */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">Your information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">Your name</label>
                <input
                  type="text"
                  value={purchasedByName}
                  onChange={(e) => setPurchasedByName(e.target.value)}
                  className="mt-1 w-full bg-secondary/40 border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-gold"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">Your email</label>
                <input
                  type="email"
                  value={purchasedByEmail}
                  onChange={(e) => setPurchasedByEmail(e.target.value)}
                  className="mt-1 w-full bg-secondary/40 border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-gold"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">We&apos;ll email you a receipt.</p>
              </div>
            </div>
          </div>

          {/* Recipient */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">Who&apos;s it for?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">Recipient name</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="mt-1 w-full bg-secondary/40 border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-gold"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">Recipient email</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="mt-1 w-full bg-secondary/40 border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-gold"
                  required
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Personal message (optional)
              </label>
              <textarea
                value={recipientMessage}
                onChange={(e) => setRecipientMessage(e.target.value.slice(0, MAX_MESSAGE))}
                rows={3}
                placeholder="Happy birthday! Use this for that running bib you've been meaning to frame."
                className="mt-1 w-full bg-secondary/40 border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-gold resize-none"
              />
              <div className="text-xs text-muted-foreground text-right mt-1">
                {recipientMessage.length}/{MAX_MESSAGE}
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Schedule delivery (optional)
              </label>
              <input
                type="date"
                value={deliverAt}
                min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                onChange={(e) => setDeliverAt(e.target.value)}
                className="mt-1 w-full md:w-auto bg-secondary/40 border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-gold"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to send right away.
              </p>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-serif text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="text-gold" size={20} /> Payment
            </h2>
            {sdkError ? (
              <div className="rounded-md bg-red-500/10 border border-red-500/30 p-4 flex items-start gap-3">
                <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-red-300">{sdkError}</p>
              </div>
            ) : (
              <>
                <div
                  ref={cardContainerRef}
                  className="min-h-[52px] bg-secondary/40 border border-border rounded-md p-2"
                />
                {!cardReady && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                    <Loader2 className="animate-spin" size={12} /> Loading secure card form…
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-3">
                  Secured by Square — your card details are encrypted end-to-end.
                </p>
              </>
            )}
          </div>

          {formError && (
            <div className="rounded-md bg-red-500/10 border border-red-500/30 p-4 flex items-start gap-3">
              <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-300">{formError}</p>
            </div>
          )}

          <div className="flex flex-col items-center">
            <button
              type="submit"
              disabled={submitting || !cardReady || !amountValid}
              className="w-full md:w-auto px-10 py-4 bg-gold text-primary-foreground font-semibold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Processing…
                </>
              ) : (
                <>Send {amountValid ? `$${(amountCents / 100).toFixed(2)} ` : ""}Gift Card</>
              )}
            </button>
            <p className="text-xs text-muted-foreground mt-3 max-w-md text-center">
              No sales tax on gift cards. Massachusetts sales tax applies only when the
              certificate is redeemed on taxable goods or services.
            </p>
          </div>
        </form>
      </section>

      {/* FAQ */}
      <section className="py-12 bg-secondary/30 border-t border-border">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6 text-center">
            Common questions
          </h2>
          <div className="space-y-5 text-sm">
            <div>
              <p className="text-foreground font-semibold">Do gift certificates expire?</p>
              <p className="text-muted-foreground">
                No. Massachusetts law protects gift cards from expiration, and ours never expire.
              </p>
            </div>
            <div>
              <p className="text-foreground font-semibold">How does the recipient redeem it?</p>
              <p className="text-muted-foreground">
                They bring the printed certificate, or just the redemption code on their phone, to
                our shop at 1741 Centre Street. We&apos;ll apply the credit to their order.
              </p>
            </div>
            <div>
              <p className="text-foreground font-semibold">Can it be used for anything?</p>
              <p className="text-muted-foreground">
                Custom framing, photo restoration, plaques, ready-made framed art — anything we
                offer.
              </p>
            </div>
            <div>
              <p className="text-foreground font-semibold">What if it doesn&apos;t arrive?</p>
              <p className="text-muted-foreground">
                Check the recipient&apos;s spam folder first. If it&apos;s not there, call us at
                (617) 327-3890 and we&apos;ll resend it.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
