"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Customer = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  preferredContact?: "email" | "call" | null;
  marketingOptIn?: boolean | null;
  createdAt?: string;
};

export default function CustomersPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load(search?: string) {
    setLoading(true);
    setErr(null);

    const query = (search ?? q).trim();

    try {
      const res = await fetch(`/staff/api/customers?q=${encodeURIComponent(query)}`, {
        cache: "no-store",
        credentials: "same-origin", // ensure cookie is included
      });

      const raw = await res.text();

      // Try parse JSON but keep raw no matter what
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {}

      if (!res.ok) {
        // show status + server message
        const msg =
          data?.error ||
          (raw?.slice?.(0, 300) || "") ||
          `Request failed (${res.status})`;
        throw new Error(`[${res.status}] ${msg}`);
      }

      setRows(data?.customers || []);
    } catch (e: any) {
      // This will catch true network failures too
      setErr(e?.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((c) => {
      const name = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase();
      const email = (c.email || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      return name.includes(needle) || email.includes(needle) || phone.includes(needle);
    });
  }, [q, rows]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-neutral-600 text-sm mt-1">Search and manage customer records.</p>
        </div>

        <a
          href="/staff/orders/new"
          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm"
          title="Create a new order (customer created during order intake)"
        >
          New order
        </a>
      </div>

      <div className="flex gap-3 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, phone…"
          className="w-full max-w-lg rounded-xl border border-neutral-300 bg-white/5 px-4 py-3 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") load(q);
          }}
        />
        <button onClick={() => load(q)} className="rounded-xl bg-black text-white px-4 py-3 text-sm">
          Search
        </button>
        <button
          onClick={() => {
            setQ("");
            load(""); // Clear means: reload the full list
          }}
          className="rounded-xl border border-neutral-300 px-4 py-3 text-sm"
          title="Clear search and reload all customers"
        >
          Clear
        </button>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 whitespace-pre-wrap">
          {err}
        </div>
      ) : null}

      <div className="rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 bg-neutral-50 px-4 py-3 text-xs font-medium text-neutral-600">
          <div className="col-span-4">Customer</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Phone</div>
          <div className="col-span-2">Preferred</div>
          <div className="col-span-1 text-right">Opt-in</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-neutral-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-sm text-neutral-500">No customers found.</div>
        ) : (
          filtered.map((c) => {
            const name = `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Unnamed";
            return (
              <Link
                key={c.id}
                href={`/staff/customers/${c.id}`}
                className="grid grid-cols-12 gap-3 px-4 py-3 text-sm border-t border-neutral-200 hover:bg-neutral-50"
              >
                <div className="col-span-4 font-medium">{name}</div>
                <div className="col-span-3 text-neutral-600">{c.email || "—"}</div>
                <div className="col-span-2 text-neutral-600">{c.phone || "—"}</div>
                <div className="col-span-2 text-neutral-600">
                  {c.preferredContact === "call" ? "Call" : "Email"}
                </div>
                <div className="col-span-1 text-right text-neutral-600">
                  {c.marketingOptIn ? "Yes" : "No"}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
