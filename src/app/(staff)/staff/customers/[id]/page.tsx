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
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tags, setTags] = useState<Array<{ id: string; name: string; color: string | null }>>([]);
  const [allTags, setAllTags] = useState<Array<{ id: string; name: string; color: string | null }>>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [stats, setStats] = useState<{
    lifetimeValueCents: number;
    totalOrders: number;
    arBalance: number;
    totalCollected: number;
    totalInvoices: number;
  } | null>(null);
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
      setInvoices(data.invoices || []);
      setStats(data.stats || null);
      setTags((data.customer?.tagAssignments || []).map((a: any) => a.tag));
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    loadTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadTags() {
    try {
      const res = await fetch("/staff/api/customer-tags");
      if (res.ok) {
        const data = await res.json();
        setAllTags(data.tags || []);
      }
    } catch (e) {
      // Ignore errors
    }
  }

  async function assignTag(tagId: string) {
    try {
      const res = await fetch(`/staff/api/customers/${id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });
      if (res.ok) {
        await load();
        setShowTagPicker(false);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to assign tag");
      }
    } catch (e: any) {
      alert(e.message || "Failed to assign tag");
    }
  }

  async function removeTag(tagId: string) {
    try {
      const res = await fetch(`/staff/api/customers/${id}/tags?tagId=${tagId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await load();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove tag");
      }
    } catch (e: any) {
      alert(e.message || "Failed to remove tag");
    }
  }

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
            <div className="flex flex-wrap gap-4 mt-2">
              <span className="text-sm font-medium text-neutral-900">
                Lifetime value: <span className="text-emerald-700">${(stats.lifetimeValueCents / 100).toFixed(2)}</span>
              </span>
              <span className="text-sm text-neutral-600">
                {stats.totalOrders} order{stats.totalOrders !== 1 ? "s" : ""}
              </span>
              {stats.arBalance > 0 && (
                <span className="text-sm font-medium text-amber-700">
                  A/R Balance: ${(stats.arBalance / 100).toFixed(2)}
                </span>
              )}
              {stats.totalCollected > 0 && (
                <span className="text-sm text-emerald-600">
                  Collected: ${(stats.totalCollected / 100).toFixed(2)}
                </span>
              )}
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
          <button
            onClick={() => setShowTagPicker(true)}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50"
          >
            {tags.length > 0 ? "Manage Tags" : "+ Add Tag"}
          </button>
          <a
            href={`/staff/orders/new?customerId=${customer.id}`}
            className="rounded-xl bg-black text-white px-4 py-2 text-sm"
          >
            New order
          </a>
        </div>
      </div>

      {/* Tag Picker Modal */}
      {showTagPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Manage Tags</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {allTags.map((tag) => {
                const isAssigned = tags.some((t) => t.id === tag.id);
                return (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color || "#6b7280" }}
                      />
                      <span className="text-sm font-medium text-neutral-900">{tag.name}</span>
                    </div>
                    <button
                      onClick={() => (isAssigned ? removeTag(tag.id) : assignTag(tag.id))}
                      className={`text-xs px-3 py-1 rounded-lg ${
                        isAssigned
                          ? "bg-red-50 text-red-700 hover:bg-red-100"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      {isAssigned ? "Remove" : "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200">
              <a
                href="/staff/settings/tags"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Manage All Tags →
              </a>
              <button
                onClick={() => setShowTagPicker(false)}
                className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div className="rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          {msg}
        </div>
      )}

      {/* A/R & Invoices Summary Bar */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-3">
            <div className="text-xs text-neutral-500">Total Invoiced</div>
            <div className="text-lg font-bold text-neutral-900">
              ${(invoices.filter((i: any) => i.status !== "void" && i.status !== "cancelled").reduce((s: number, i: any) => s + i.totalAmount, 0) / 100).toFixed(2)}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
            <div className="text-xs text-emerald-600">Collected</div>
            <div className="text-lg font-bold text-emerald-700">
              ${((stats?.totalCollected || 0) / 100).toFixed(2)}
            </div>
          </div>
          <div className={`rounded-xl border p-3 ${(stats?.arBalance || 0) > 0 ? "border-amber-200 bg-amber-50/50" : "border-emerald-200 bg-emerald-50/50"}`}>
            <div className="text-xs" style={{ color: (stats?.arBalance || 0) > 0 ? "#b45309" : "#047857" }}>Outstanding</div>
            <div className="text-lg font-bold" style={{ color: (stats?.arBalance || 0) > 0 ? "#b45309" : "#047857" }}>
              ${((stats?.arBalance || 0) / 100).toFixed(2)}
            </div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-3">
            <div className="text-xs text-neutral-500">Invoices</div>
            <div className="text-lg font-bold text-neutral-900">{stats?.totalInvoices || 0}</div>
          </div>
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
      {/* Invoices */}
      {invoices.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">Invoices</div>
            <a
              href={`/staff/invoices/new?customerId=${customer.id}`}
              className="text-xs text-blue-600 hover:underline"
            >
              + New Invoice
            </a>
          </div>

          <div className="space-y-2">
            {invoices.map((inv: any) => {
              const statusColor: Record<string, string> = {
                draft: "border-neutral-300 text-neutral-600 bg-neutral-50",
                sent: "border-blue-300 text-blue-700 bg-blue-50",
                partial: "border-amber-300 text-amber-700 bg-amber-50",
                paid: "border-emerald-300 text-emerald-700 bg-emerald-50",
                void: "border-red-200 text-red-600 bg-red-50",
              };

              return (
                <a
                  key={inv.id}
                  href={`/staff/invoices/${inv.id}`}
                  className="block rounded-xl border border-neutral-200 px-4 py-3 hover:bg-neutral-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{inv.invoiceNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[inv.status] || statusColor.draft}`}>
                        {inv.status === "partial" ? "Partial" : inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </div>
                    <span className="text-sm font-medium">${(inv.totalAmount / 100).toFixed(2)}</span>
                  </div>
                  {inv.balanceDue > 0 && inv.status !== "paid" && (
                    <div className="text-xs text-amber-700 mt-1">Balance: ${(inv.balanceDue / 100).toFixed(2)}</div>
                  )}
                  <div className="flex gap-1 mt-1">
                    {inv.orders?.map((o: any) => (
                      <span key={o.id} className="text-xs text-neutral-400">{o.orderNumber}</span>
                    ))}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
