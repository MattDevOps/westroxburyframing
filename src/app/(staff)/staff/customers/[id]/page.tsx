"use client";

import { useEffect, useState, use } from "react";

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

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<{ lifetimeValueCents: number; totalOrders: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch(`/staff/api/customers/${id}`, {
        cache: "no-store",
      });

      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {}

      if (!res.ok) throw new Error(data?.error || raw || "Failed to load customer");

      if (!data?.customer)
        throw new Error("Bad response from server (missing customer)");

      setCustomer(data.customer);
      setOrders(data.orders || []);
      setStats(data.stats || null);
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function save(e: any) {
    e.preventDefault();
    if (!customer) return;

    setSaving(true);
    setMsg(null);
    setErr(null);

    const form = new FormData(e.currentTarget);

    const payload = {
      first_name: String(form.get("first_name") || ""),
      last_name: String(form.get("last_name") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || ""),
      preferred_contact: String(form.get("preferred_contact") || "email"),
      marketing_opt_in: Boolean(form.get("marketing_opt_in")),
    };

    try {
      const res = await fetch(`/staff/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {}

      if (!res.ok) throw new Error(data?.error || raw || "Save failed");

      setMsg("Saved.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Error saving");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-neutral-500">Loading…</div>;
  if (err) return <div className="p-6 text-sm text-red-700">{err}</div>;
  if (!customer) return <div className="p-6 text-sm text-neutral-500">Not found.</div>;

  const name =
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    "Customer";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{name}</h1>
          <p className="text-neutral-600 text-sm mt-1">
            {customer.email || "—"} · {customer.phone || "—"}
          </p>
          {stats && (
            <div className="flex gap-4 mt-2">
              <span className="text-sm font-medium text-neutral-900">
                Lifetime value: <span className="text-emerald-700">${(stats.lifetimeValueCents / 100).toFixed(2)}</span>
              </span>
              <span className="text-sm text-neutral-600">
                {stats.totalOrders} order{stats.totalOrders !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <a
            href="/staff/customers"
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm"
          >
            Back
          </a>
          <a
            href={`/staff/orders/new?customerId=${customer.id}`}
            className="rounded-xl bg-black text-white px-4 py-2 text-sm"
          >
            New order
          </a>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer info */}
        <div className="rounded-2xl border border-neutral-200 p-4">
          <div className="text-sm font-medium mb-3">Customer info</div>

          <form onSubmit={save} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-600 mb-1">
                  First name
                </label>
                <input
                  name="first_name"
                  defaultValue={customer.firstName || ""}
                  className="w-full rounded-xl border border-neutral-300 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-600 mb-1">
                  Last name
                </label>
                <input
                  name="last_name"
                  defaultValue={customer.lastName || ""}
                  className="w-full rounded-xl border border-neutral-300 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-600 mb-1">Phone</label>
              <input
                name="phone"
                defaultValue={customer.phone || ""}
                className="w-full rounded-xl border border-neutral-300 bg-white/5 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-600 mb-1">Email</label>
              <input
                name="email"
                defaultValue={customer.email || ""}
                className="w-full rounded-xl border border-neutral-300 bg-white/5 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-xs text-neutral-600 mb-1">
                  Preferred contact
                </label>
                <select
                  name="preferred_contact"
                  defaultValue={customer.preferredContact || "email"}
                  className="w-full rounded-xl border border-neutral-300 bg-white/5 px-3 py-2 text-sm"
                >
                  <option value="email">Email</option>
                  <option value="call">Call</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  name="marketing_opt_in"
                  defaultChecked={Boolean(customer.marketingOptIn)}
                />
                Marketing opt-in
              </label>
            </div>

            <button
              disabled={saving}
              className="rounded-xl bg-black text-white px-4 py-2 text-sm"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </form>
        </div>

        {/* Orders */}
        <div className="rounded-2xl border border-neutral-200 p-4">
          <div className="text-sm font-medium mb-3">Orders</div>

          {orders.length === 0 ? (
            <div className="text-sm text-neutral-500">No orders yet.</div>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => {
                const totalCents = Number(o.totalAmount ?? 0);
                const totalDollars = totalCents / 100;
                const statusLabel: Record<string, string> = {
                  estimate: "Estimate",
                  new_design: "New / Design",
                  awaiting_materials: "Awaiting Materials",
                  in_production: "In Production",
                  quality_check: "Quality Check",
                  ready_for_pickup: "Ready for Pickup",
                  on_hold: "On Hold",
                  picked_up: "Picked Up",
                  completed: "Completed",
                  cancelled: "Cancelled",
                };

                const isEstimate = o.status === "estimate";

                return (
                  <a
                    key={o.id}
                    href={`/staff/orders/${o.id}`}
                    className={`block rounded-xl border px-4 py-3 hover:bg-neutral-50 ${
                      isEstimate ? "border-red-200 bg-red-50/30" : "border-neutral-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {o.orderNumber ? `#${o.orderNumber}` : "Order"}
                        {isEstimate && <span className="ml-2 text-xs text-red-600 font-normal">(Estimate)</span>}
                      </div>
                      <div className="text-sm font-medium text-neutral-900">
                        ${totalDollars.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        o.status === "estimate" ? "border-red-300 text-red-700 bg-red-50" :
                        o.status === "on_hold" ? "border-orange-300 text-orange-700 bg-orange-50" :
                        o.status === "cancelled" ? "border-red-200 text-red-700 bg-red-50" :
                        o.status === "completed" || o.status === "picked_up" ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
                        "border-blue-200 text-blue-700 bg-blue-50"
                      }`}>
                        {statusLabel[o.status] || o.status}
                      </span>
                      {o.itemType && (
                        <span className="text-xs text-neutral-500">{o.itemType}</span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">
                      {o.createdAt
                        ? new Date(o.createdAt).toLocaleDateString()
                        : ""}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
