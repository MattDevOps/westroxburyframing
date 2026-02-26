"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SMSOptInPage() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!phone.trim() && !email.trim()) {
      setError("Please provide either a phone number or email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/public/sms-opt-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          email: email.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to opt in to SMS messages");
      }

      setSuccess(true);
      setPhone("");
      setEmail("");
    } catch (e: any) {
      setError(e.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-8 md:p-12"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Phone className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Opt In to Text Messages
            </h1>
            <p className="text-neutral-600">
              Receive order updates, pickup reminders, and special offers via SMS
            </p>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
                You're all set!
              </h2>
              <p className="text-neutral-600 mb-6">
                You've successfully opted in to receive text messages from West Roxbury Framing.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Return to homepage
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(617) 555-1234"
                  required
                  className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  We'll send text messages to this number. Message and data rates may apply.
                </p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                  Email Address (Optional)
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Help us find your account if you're already a customer.
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>By opting in, you agree to receive automated text messages</strong> from West Roxbury Framing at the phone number provided. You can opt out at any time by replying STOP to any message. Message frequency varies. Message and data rates may apply.
                </p>
                <p className="text-xs text-blue-800 mt-2">
                  By submitting this form, you also agree to our{" "}
                  <Link href="/terms" className="underline hover:text-blue-900">
                    Terms & Conditions
                  </Link>
                  {" "}and{" "}
                  <Link href="/policies" className="underline hover:text-blue-900">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || (!phone.trim() && !email.trim())}
                className="w-full bg-black text-white rounded-lg px-6 py-3 text-base font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Processing..." : "Opt In to Text Messages"}
              </button>

              <p className="text-center text-xs text-neutral-500">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </motion.div>

        <div className="mt-8 text-center text-sm text-neutral-500">
          <p>
            Need to opt out? Reply <strong>STOP</strong> to any message, or{" "}
            <Link href="/contact" className="text-blue-600 hover:underline">
              contact us
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
