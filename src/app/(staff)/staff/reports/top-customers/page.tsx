"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { Download, TrendingUp } from "lucide-react";

type TopCustomer = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  organization: string | null;
  city: string | null;
  marketingOptIn: boolean | null;
  smsOptIn: boolean | null;
  createdAt: string;
  lifetimeSpendCents: number;
  orderCount: number;
  lastOrderAt: string | null;
};

export default function TopCustomersReport() {
  const [customers, setCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [limit, setLimit] = useState(50);
  const [minDollars, setMinDollars] = useState(0);
  const [lapsedMonths, setLapsedMonths] = useState(0);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (minDollars > 0) params.set("minCents", String(minDollars * 100));
    if (lapsedMonths > 0) params.set("lapsedMonths", String(lapsedMonths));
    if (marketingOptIn) params.set("marketingOptIn", "true");

    try {
      const res = await fetch(`/staff/api/reports/top-customers?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCustomers(data.customers || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, minDollars, lapsedMonths, marketingOptIn]);

  const totalSpend = useMemo(
    () => customers.reduce((sum, c) => sum + c.lifetimeSpendCents, 0),
    [customers]
  );
  const totalOrders = useMemo(
    () => customers.reduce((sum, c) => sum + c.orderCount, 0),
    [customers]
  );

  function exportCsv() {
    const headers = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "organization",
      "city",
      "lifetimeSpendUsd",
      "orderCount",
      "lastOrderAt",
      "marketingOptIn",
      "smsOptIn",
    ];
    const rows = customers.map((c) =>
      [
        c.firstName || "",
        c.lastName || "",
        c.email || "",
        c.phone || "",
        c.organization || "",
        c.city || "",
        (c.lifetimeSpendCents / 100).toFixed(2),
        String(c.orderCount),
        c.lastOrderAt ? new Date(c.lastOrderAt).toISOString().slice(0, 10) : "",
        c.marketingOptIn ? "true" : "false",
        c.smsOptIn ? "true" : "false",
      ]
        .map((v) => (/[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v))
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `top-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Link href="/staff/reports" className="text-sm text-stone-500 hover:text-stone-900">
          ← Reports
        </Link>
        <div className="flex items-start justify-between mt-1 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-2">
              <TrendingUp size={28} /> Top Customers by Lifetime Spend
            </h1>
            <p className="text-stone-600 text-sm mt-1">
              Ranked by total $ across all orders. Use filters to surface VIPs, recall candidates,
              or marketing-opt-in segments.
            </p>
          </div>
          <button
            onClick={exportCsv}
            disabled={customers.length === 0}
            className="px-4 py-2 bg-stone-900 text-white rounded text-sm font-medium hover:bg-stone-800 inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-stone-200 rounded p-4 mb-6 flex flex-wrap gap-4 text-sm">
          <FilterField label="Show top">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-1.5 border border-stone-300 rounded bg-white"
            >
              {[20, 50, 100, 200, 500].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Min spend">
            <select
              value={minDollars}
              onChange={(e) => setMinDollars(Number(e.target.value))}
              className="px-3 py-1.5 border border-stone-300 rounded bg-white"
            >
              <option value={0}>Any</option>
              <option value={100}>$100+</option>
              <option value={250}>$250+</option>
              <option value={500}>$500+</option>
              <option value={1000}>$1,000+</option>
              <option value={2500}>$2,500+</option>
              <option value={5000}>$5,000+</option>
            </select>
          </FilterField>
          <FilterField label="Last order">
            <select
              value={lapsedMonths}
              onChange={(e) => setLapsedMonths(Number(e.target.value))}
              className="px-3 py-1.5 border border-stone-300 rounded bg-white"
            >
              <option value={0}>Any</option>
              <option value={3}>3+ months ago (recall candidates)</option>
              <option value={6}>6+ months ago</option>
              <option value={12}>1+ year ago</option>
              <option value={24}>2+ years ago (long-lapsed)</option>
            </select>
          </FilterField>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
            />
            <span>Marketing opt-in only</span>
          </label>
        </div>

        {/* Summary */}
        {!loading && customers.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <SummaryCard label="Customers shown" value={String(customers.length)} />
            <SummaryCard
              label="Combined lifetime spend"
              value={`$${(totalSpend / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
              accent="text-emerald-700"
            />
            <SummaryCard label="Total orders" value={String(totalOrders)} />
            <SummaryCard
              label="Avg per customer"
              value={`$${(totalSpend / customers.length / 100).toFixed(0)}`}
            />
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-stone-200 rounded overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-stone-500 text-sm">Loading…</div>
          ) : error ? (
            <div className="p-12 text-center text-rose-600 text-sm">{error}</div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center text-stone-500 text-sm">
              No customers match these filters.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-600">
                <tr>
                  <th className="px-4 py-3 text-left w-10">#</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-right">Lifetime spend</th>
                  <th className="px-4 py-3 text-right">Orders</th>
                  <th className="px-4 py-3 text-left">Last order</th>
                  <th className="px-4 py-3 text-left">Recall?</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => {
                  const name =
                    [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email || "(unnamed)";
                  const lastOrderDate = c.lastOrderAt ? new Date(c.lastOrderAt) : null;
                  const monthsAgo = lastOrderDate
                    ? Math.floor(
                        (Date.now() - lastOrderDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
                      )
                    : null;
                  return (
                    <tr
                      key={c.id}
                      className="border-t border-stone-100 hover:bg-stone-50 cursor-pointer"
                      onClick={() => (window.location.href = `/staff/customers/${c.id}`)}
                    >
                      <td className="px-4 py-3 text-stone-400 font-mono text-xs">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-stone-900">{name}</div>
                        {c.organization && (
                          <div className="text-xs text-stone-500 mt-0.5">{c.organization}</div>
                        )}
                        {c.city && (
                          <div className="text-xs text-stone-500">{c.city}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-stone-700 text-xs">
                          {c.email || <span className="text-stone-400">—</span>}
                        </div>
                        <div className="text-stone-500 text-xs mt-0.5">
                          {c.phone || ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-stone-900">
                          ${(c.lifetimeSpendCents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-stone-700">{c.orderCount}</td>
                      <td className="px-4 py-3 text-stone-600 text-xs">
                        {lastOrderDate ? (
                          <>
                            {lastOrderDate.toLocaleDateString()}
                            {monthsAgo != null && monthsAgo > 0 && (
                              <span className="text-stone-400 ml-1">
                                ({monthsAgo}mo ago)
                              </span>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {monthsAgo != null && monthsAgo >= 6 && c.marketingOptIn ? (
                          <span className="inline-block px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-900 font-medium">
                            Email recall
                          </span>
                        ) : monthsAgo != null && monthsAgo >= 6 ? (
                          <span className="inline-block px-2 py-0.5 rounded text-xs bg-stone-100 text-stone-600">
                            Lapsed (no opt-in)
                          </span>
                        ) : (
                          <span className="text-stone-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 text-xs text-stone-500">
          Spend is summed from <code>Order.totalAmount</code> across all orders. The CSV export
          includes <strong>marketingOptIn</strong> so you can paste it straight into Email Blast
          for a recall campaign.
        </div>
      </div>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-stone-700">{label}:</span>
      {children}
    </label>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded p-4">
      <div className="text-xs text-stone-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent || "text-stone-900"}`}>{value}</div>
    </div>
  );
}
