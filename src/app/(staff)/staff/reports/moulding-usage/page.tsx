"use client";

import { useState, useEffect } from "react";

interface UsageEntry {
  key: string;
  name: string;
  vendor?: string;
  vendorCode?: string;
  category?: string;
  totalFeet: number;
  roundedFeet: number;
  orderCount: number;
  orders: Array<{ orderNumber: string; feet: number }>;
}

interface MouldingUsageData {
  usage: UsageEntry[];
  summary: {
    totalFeet: number;
    totalRoundedFeet: number;
    totalOrders: number;
    groupBy: string;
    from: string | null;
    to: string | null;
  };
}

export default function MouldingUsageReportPage() {
  const [data, setData] = useState<MouldingUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [groupBy, setGroupBy] = useState<"category" | "vendor" | "item">("category");

  useEffect(() => {
    loadReport();
  }, [from, to, groupBy]);

  async function loadReport() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("groupBy", groupBy);

      const res = await fetch(`/staff/api/reports/moulding-usage?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load report");
      const data = await res.json();
      setData(data);
    } catch (e: any) {
      setError(e.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("groupBy", groupBy);

      const res = await fetch(`/staff/api/reports/moulding-usage/export?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Export failed");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `moulding-usage-${groupBy}-${from || "all"}-to-${to || "now"}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Moulding Usage Report</h1>
        <p className="text-neutral-600 text-sm mt-1">
          Track moulding usage by category, vendor, or item. Rounded to nearest half foot.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">From Date</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              max={today}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <button
              onClick={() => setFrom(firstOfMonth)}
              className="mt-1 text-xs text-blue-600 hover:underline"
            >
              This month
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">To Date</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              max={today}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <button
              onClick={() => setTo(today)}
              className="mt-1 text-xs text-blue-600 hover:underline"
            >
              Today
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as "category" | "vendor" | "item")}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="category">Category</option>
              <option value="vendor">Vendor</option>
              <option value="item">Item</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleExport}
              disabled={exporting || loading}
              className="w-full rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
            >
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-neutral-600">Loading...</div>
      ) : data ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="text-xs text-neutral-600 uppercase mb-1">Total Feet</div>
              <div className="text-2xl font-bold text-neutral-900">
                {data.summary.totalFeet.toFixed(2)}
              </div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="text-xs text-neutral-600 uppercase mb-1">Rounded Feet</div>
              <div className="text-2xl font-bold text-neutral-900">
                {data.summary.totalRoundedFeet.toFixed(1)}
              </div>
              <div className="text-xs text-neutral-500 mt-1">(nearest 0.5)</div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="text-xs text-neutral-600 uppercase mb-1">Orders</div>
              <div className="text-2xl font-bold text-neutral-900">{data.summary.totalOrders}</div>
            </div>
          </div>

          {/* Usage Table */}
          {data.usage.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
              <p className="text-neutral-600">No moulding usage found for the selected period.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                      {groupBy === "category"
                        ? "Category"
                        : groupBy === "vendor"
                          ? "Vendor"
                          : "Item"}
                    </th>
                    {groupBy !== "vendor" && (
                      <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                        Vendor
                      </th>
                    )}
                    {groupBy !== "category" && (
                      <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                        Category
                      </th>
                    )}
                    <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                      Total Feet
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                      Rounded Feet
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                      Orders
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {data.usage.map((entry) => (
                    <tr key={entry.key} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-neutral-900">{entry.name}</div>
                        {entry.vendorCode && (
                          <div className="text-xs text-neutral-500 mt-1">
                            Code: {entry.vendorCode}
                          </div>
                        )}
                      </td>
                      {groupBy !== "vendor" && (
                        <td className="px-6 py-4 text-sm text-neutral-700">
                          {entry.vendor || "—"}
                        </td>
                      )}
                      {groupBy !== "category" && (
                        <td className="px-6 py-4 text-sm text-neutral-700">
                          {entry.category || "—"}
                        </td>
                      )}
                      <td className="px-6 py-4 text-right text-sm font-medium text-neutral-900">
                        {entry.totalFeet.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-neutral-900">
                        {entry.roundedFeet.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-neutral-700">
                        {entry.orderCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-neutral-50 border-t-2 border-neutral-300">
                  <tr>
                    <td
                      colSpan={
                        groupBy === "category" ? 2 : groupBy === "vendor" ? 1 : 3
                      }
                      className="px-6 py-4 text-right text-sm font-semibold text-neutral-700"
                    >
                      Total:
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-neutral-900">
                      {data.summary.totalFeet.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-neutral-900">
                      {data.summary.totalRoundedFeet.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-neutral-900">
                      {data.summary.totalOrders}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
