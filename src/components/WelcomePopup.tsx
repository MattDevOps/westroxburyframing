"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Copy, Check } from "lucide-react";
import Link from "next/link";

const PROMO_CODE = "WELCOME10";
const DISMISSED_KEY = "wrx_popup_dismissed";

export default function WelcomePopup() {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Don't show if already dismissed, on staff pages, or on invoice payment
    // pages (a marketing popup must never overlay the checkout / card form).
    if (typeof window === "undefined") return;
    const path = window.location.pathname;
    if (path.startsWith("/staff") || path.startsWith("/pay")) return;

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    // Show after a short delay so the page feels loaded
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  function handleCopy() {
    navigator.clipboard.writeText(PROMO_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/promo-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company: honeypot }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        return;
      }
      // Email captured — reveal the code and never re-show the popup.
      localStorage.setItem(DISMISSED_KEY, "1");
      setStep("code");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-card border border-gold/30 rounded-sm shadow-2xl w-full max-w-md p-8 pointer-events-auto relative">
              {/* Close button */}
              <button
                onClick={dismiss}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close popup"
              >
                <X size={20} />
              </button>

              {/* Content */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Gift className="text-gold" size={32} />
                </div>

                <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Get <span className="text-gold">10% Off</span>
                </h2>

                {step === "email" ? (
                  <>
                    <p className="text-muted-foreground text-sm mb-6">
                      Welcome to West Roxbury Framing! Enter your email and
                      we&apos;ll unlock a code for 10% off your first order.
                    </p>

                    <form onSubmit={handleSubmit} noValidate>
                      {/* Honeypot: invisible to humans, bots fill it in */}
                      <input
                        type="text"
                        name="company"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                        className="absolute -left-[9999px] top-0 h-0 w-0 opacity-0"
                      />

                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        aria-label="Email address"
                        className="w-full px-4 py-3 mb-3 bg-background border border-border rounded-sm text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/60"
                      />

                      {error && (
                        <p className="text-sm text-red-400 mb-3">{error}</p>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 px-6 py-3 bg-gold text-primary-foreground font-semibold text-sm uppercase tracking-wide rounded-sm hover:opacity-90 transition-opacity text-center disabled:opacity-60"
                        >
                          {submitting ? "One moment..." : "Get My 10% Off"}
                        </button>
                        <button
                          type="button"
                          onClick={dismiss}
                          className="flex-1 px-6 py-3 border border-border text-muted-foreground font-semibold text-sm uppercase tracking-wide rounded-sm hover:text-foreground hover:border-foreground/30 transition-colors text-center"
                        >
                          Maybe Later
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground text-sm mb-6">
                      Here&apos;s your code! Use it at checkout online or
                      mention it in-store for 10% off your first order.
                    </p>

                    {/* Promo Code */}
                    <div className="bg-background border border-border rounded-sm p-4 mb-6">
                      <p className="text-xs text-muted-foreground mb-1">Your promo code</p>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl font-bold text-gold tracking-widest">
                          {PROMO_CODE}
                        </span>
                        <button
                          onClick={handleCopy}
                          className="p-2 rounded-sm hover:bg-card transition-colors text-muted-foreground hover:text-gold"
                          title="Copy code"
                        >
                          {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link
                        href="/book"
                        onClick={dismiss}
                        className="flex-1 px-6 py-3 bg-gold text-primary-foreground font-semibold text-sm uppercase tracking-wide rounded-sm hover:opacity-90 transition-opacity text-center"
                      >
                        Book a Free Consultation
                      </Link>
                      <button
                        onClick={dismiss}
                        className="flex-1 px-6 py-3 border border-border text-muted-foreground font-semibold text-sm uppercase tracking-wide rounded-sm hover:text-foreground hover:border-foreground/30 transition-colors text-center"
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}

                <p className="text-xs text-muted-foreground mt-4">
                  Valid for first-time customers. Cannot be combined with other offers.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
