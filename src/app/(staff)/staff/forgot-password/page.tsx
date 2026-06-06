"use client";

import { useState } from "react";

export default function StaffForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/staff/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-neutral-200 p-6">
      <h1 className="text-2xl font-semibold">Reset Password</h1>
      {sent ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm text-neutral-700">
            If an account exists for <strong>{email}</strong>, a password reset link has been sent.
            Check your inbox — the link expires in 1 hour.
          </p>
          <a className="inline-block text-sm text-blue-600 underline" href="/staff/login">
            Back to login
          </a>
        </div>
      ) : (
        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <p className="text-sm text-neutral-600">
            Enter your staff email and we&apos;ll send you a link to reset your password.
          </p>
          <input
            className="w-full rounded-xl border p-3"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            className="w-full rounded-xl bg-black px-5 py-3 text-white disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
          <a className="block text-center text-sm text-blue-600 underline" href="/staff/login">
            Back to login
          </a>
        </form>
      )}
    </div>
  );
}
