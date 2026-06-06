"use client";

import { useEffect, useState } from "react";

export default function StaffResetPassword() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // Read the token from the URL on mount (avoids useSearchParams Suspense requirement).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/staff/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      setErr(data.error || "Could not reset password.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-neutral-200 p-6">
      <h1 className="text-2xl font-semibold">Choose a New Password</h1>
      {done ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm text-neutral-700">
            Your password has been reset. You can now sign in with your new password.
          </p>
          <a className="inline-block rounded-xl bg-black px-5 py-3 text-white" href="/staff/login">
            Go to login
          </a>
        </div>
      ) : !token ? (
        <p className="mt-5 text-sm text-red-600">
          Missing reset token. Please use the link from your email, or{" "}
          <a className="underline" href="/staff/forgot-password">
            request a new one
          </a>
          .
        </p>
      ) : (
        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <input
            className="w-full rounded-xl border p-3"
            placeholder="New password (min 8 characters)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="w-full rounded-xl border p-3"
            placeholder="Confirm new password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {err && <div className="text-sm text-red-600">{err}</div>}
          <button
            className="w-full rounded-xl bg-black px-5 py-3 text-white disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Saving…" : "Reset password"}
          </button>
        </form>
      )}
    </div>
  );
}
