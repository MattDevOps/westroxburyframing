"use client";

import { useState } from "react";

export default function StaffLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/staff/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setErr("Invalid login");
      return;
    }
    window.location.href = "/staff";
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-neutral-200 p-6">
      <h1 className="text-2xl font-semibold">Staff Login</h1>
      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        <input className="w-full rounded-xl border p-3" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="w-full rounded-xl border p-3" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="w-full rounded-xl bg-black px-5 py-3 text-white">Sign in</button>
      </form>
    </div>
  );
}
