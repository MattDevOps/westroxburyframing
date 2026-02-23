"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Phone, MapPin, Clock, CheckCircle, Package, Paintbrush, Search, AlertCircle } from "lucide-react";

type OrderResult = {
  orderNumber: string;
  customerFirstName: string;
  itemType: string;
  itemDescription: string | null;
  status: string;
  statusKey: string;
  statusDescription: string;
  statusStep: number;
  dueDate: string | null;
  paymentStatus: string;
  paymentLink: string | null;
  createdAt: string;
};

const PROGRESS_STEPS = [
  { label: "Received", icon: Package },
  { label: "Materials", icon: Search },
  { label: "Production", icon: Paintbrush },
  { label: "Quality Check", icon: CheckCircle },
  { label: "Ready!", icon: MapPin },
];

export default function OrderStatusPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [contactMethod, setContactMethod] = useState<"email" | "phone">("email");
  const [contactValue, setContactValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrderResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const body: Record<string, string> = {
        order_number: orderNumber.trim(),
      };
      if (contactMethod === "email") body.email = contactValue.trim();
      else body.phone = contactValue.trim();

      const res = await fetch("/api/public/order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setResult(data.order);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Map statusStep (1-5) to progress bar index (0-4)
  function getProgressIndex(step: number): number {
    if (step <= 0) return -1; // estimate, on_hold, cancelled
    if (step === 1) return 0; // new_design = received
    if (step === 2) return 1; // awaiting_materials
    if (step === 3) return 2; // in_production
    if (step === 4) return 3; // quality_check
    return 4; // ready_for_pickup, picked_up, completed
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-32 pb-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4"
          >
            Track Your <span className="text-gold">Order</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg"
          >
            Enter your order number and the email or phone on file to check your order status.
          </motion.p>
        </div>
      </section>

      {/* Lookup Form */}
      <section className="py-16">
        <div className="max-w-xl mx-auto px-6">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="bg-card border border-border rounded-sm p-8 space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Order Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. WRF-001234"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 text-lg tracking-wide uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Verify your identity
              </label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => { setContactMethod("email"); setContactValue(""); }}
                  className={`px-4 py-2 text-sm rounded-sm border transition-colors ${
                    contactMethod === "email"
                      ? "bg-gold text-primary-foreground border-gold"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => { setContactMethod("phone"); setContactValue(""); }}
                  className={`px-4 py-2 text-sm rounded-sm border transition-colors ${
                    contactMethod === "phone"
                      ? "bg-gold text-primary-foreground border-gold"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Phone
                </button>
              </div>
              <input
                type={contactMethod === "email" ? "email" : "tel"}
                required
                placeholder={contactMethod === "email" ? "your@email.com" : "617-555-1234"}
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3.5 bg-gold text-primary-foreground font-semibold tracking-wide uppercase text-sm rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Looking up…" : "Check Order Status"}
            </button>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-sm"
              >
                <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}
          </motion.form>
        </div>
      </section>

      {/* Result */}
      {result && (
        <section className="pb-24">
          <div className="max-w-2xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-sm overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-2xl text-foreground font-bold">
                      Order {result.orderNumber}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      Hi {result.customerFirstName}! Here&apos;s the latest on your order.
                    </p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wide ${
                    result.statusKey === "ready_for_pickup" || result.statusKey === "picked_up" || result.statusKey === "completed"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : result.statusKey === "cancelled"
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : result.statusKey === "on_hold"
                          ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                          : "bg-gold/20 text-gold border border-gold/30"
                  }`}>
                    {result.status}
                  </div>
                </div>
              </div>

              {/* Status message */}
              <div className="p-6 border-b border-border">
                <p className="text-foreground">{result.statusDescription}</p>
              </div>

              {/* Progress tracker (only for active orders with steps 1-5) */}
              {result.statusStep > 0 && result.statusStep <= 6 && (
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between relative">
                    {/* Background line */}
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
                    <div
                      className="absolute top-5 left-0 h-0.5 bg-gold transition-all duration-700"
                      style={{ width: `${Math.min(getProgressIndex(result.statusStep) / (PROGRESS_STEPS.length - 1) * 100, 100)}%` }}
                    />

                    {PROGRESS_STEPS.map((step, i) => {
                      const current = getProgressIndex(result.statusStep);
                      const done = i <= current;
                      const Icon = step.icon;
                      return (
                        <div key={step.label} className="relative flex flex-col items-center z-10">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                              done
                                ? "bg-gold text-primary-foreground"
                                : "bg-secondary text-muted-foreground border border-border"
                            }`}
                          >
                            <Icon size={18} />
                          </div>
                          <span className={`text-[10px] mt-2 font-medium text-center leading-tight ${
                            done ? "text-gold" : "text-muted-foreground"
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Details grid */}
              <div className="p-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Item</span>
                  <span className="text-foreground font-medium">{result.itemType}</span>
                  {result.itemDescription && (
                    <span className="text-muted-foreground block text-xs mt-0.5">{result.itemDescription}</span>
                  )}
                </div>

                {result.dueDate && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Estimated Ready</span>
                    <span className="text-foreground font-medium">
                      {new Date(result.dueDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-muted-foreground block mb-1">Payment</span>
                  <span className={`font-medium ${
                    result.paymentStatus === "Paid in full" ? "text-emerald-400" : "text-gold"
                  }`}>
                    {result.paymentStatus}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block mb-1">Order Date</span>
                  <span className="text-foreground font-medium">
                    {new Date(result.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Payment link */}
              {result.paymentLink && result.paymentStatus !== "Paid in full" && (
                <div className="p-6 border-t border-border">
                  <a
                    href={result.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-6 py-3 bg-gold text-primary-foreground font-semibold tracking-wide uppercase text-sm rounded-sm hover:opacity-90 transition-opacity"
                  >
                    Pay Your Invoice Online
                  </a>
                </div>
              )}

              {/* Pickup CTA */}
              {result.statusKey === "ready_for_pickup" && (
                <div className="p-6 border-t border-border bg-emerald-500/5">
                  <div className="text-center space-y-3">
                    <p className="text-emerald-300 font-semibold">Your order is ready!</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <a
                        href="tel:16173273890"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gold text-gold text-sm font-medium rounded-sm hover:bg-gold hover:text-primary-foreground transition-colors"
                      >
                        <Phone size={16} /> Call Us
                      </a>
                      <a
                        href="https://www.google.com/maps/dir/?api=1&destination=West+Roxbury+Framing,+1741+Centre+St,+West+Roxbury,+MA+02132"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gold text-gold text-sm font-medium rounded-sm hover:bg-gold hover:text-primary-foreground transition-colors"
                      >
                        <MapPin size={16} /> Get Directions
                      </a>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
                      <Clock size={14} />
                      Mon–Fri 9:30am–6pm · Sun 10:30am–4:30pm
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Search again */}
            <div className="text-center mt-6">
              <button
                onClick={() => { setResult(null); setOrderNumber(""); setContactValue(""); }}
                className="text-sm text-gold hover:opacity-80 transition-opacity"
              >
                Look up another order
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Help section */}
      {!result && (
        <section className="pb-24">
          <div className="max-w-xl mx-auto px-6 text-center">
            <p className="text-muted-foreground text-sm">
              Can&apos;t find your order?{" "}
              <Link href="/contact" className="text-gold hover:opacity-80">Contact us</Link>
              {" "}or call <a href="tel:16173273890" className="text-gold hover:opacity-80">617-327-3890</a>.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
