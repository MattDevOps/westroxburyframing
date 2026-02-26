"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS_LABEL, ORDER_STATUSES } from "@/lib/orderStatus";

interface SummaryData {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  statusBreakdown: { status: string; count: number; revenue: number }[];
}

export default function ReportsPage() {
  const router = useRouter();
  const [reportType, setReportType] = useState<"sales" | "orders" | "open-orders" | "customers" | "moulding">("sales");
  const [salesPeriod, setSalesPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [salesData, setSalesData] = useState<any>(null);
  const [loadingSales, setLoadingSales] = useState(false);
  const [openOrdersGroupBy, setOpenOrdersGroupBy] = useState<"status" | "staff" | "aging">("status");
  const [openOrdersData, setOpenOrdersData] = useState<any>(null);
  const [loadingOpenOrders, setLoadingOpenOrders] = useState(false);
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const loadSummary = useCallback(async () => {
    if (reportType !== "orders") {
      setSummary(null);
      return;
    }
    setLoadingSummary(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      selectedStatuses.forEach((s) => params.append("status", s));
      params.set("limit", "5000");

      const res = await fetch(`/staff/api/orders?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.orders) {
        setSummary(null);
        return;
      }

      const orders = data.orders as {
        status: string;
        total_cents: number;
      }[];

      const statusMap = new Map<string, { count: number; revenue: number }>();
      let totalRevenue = 0;

      for (const o of orders) {
        totalRevenue += o.total_cents;
        const existing = statusMap.get(o.status) || { count: 0, revenue: 0 };
        existing.count++;
        existing.revenue += o.total_cents;
        statusMap.set(o.status, existing);
      }

      setSummary({
        totalOrders: orders.length,
        totalRevenue,
        avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        statusBreakdown: Array.from(statusMap.entries())
          .map(([status, data]) => ({
            status,
            count: data.count,
            revenue: data.revenue,
          }))
          .sort((a, b) => b.count - a.count),
      });
    } catch {
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }, [reportType, from, to, selectedStatuses]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const loadSalesReport = useCallback(async () => {
    if (reportType !== "sales") {
      setSalesData(null);
      return;
    }
    setLoadingSales(true);
    try {
      const params = new URLSearchParams();
      params.set("period", salesPeriod);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/staff/api/reports/sales?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setSalesData(null);
        return;
      }
      setSalesData(data);
    } catch {
      setSalesData(null);
    } finally {
      setLoadingSales(false);
    }
  }, [reportType, salesPeriod, from, to]);

  useEffect(() => {
    loadSalesReport();
  }, [loadSalesReport]);

  const loadOpenOrdersReport = useCallback(async () => {
    if (reportType !== "open-orders") {
      setOpenOrdersData(null);
      return;
    }
    setLoadingOpenOrders(true);
    try {
      const params = new URLSearchParams();
      params.set("groupBy", openOrdersGroupBy);

      const res = await fetch(`/staff/api/reports/open-orders?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setOpenOrdersData(null);
        return;
      }
      setOpenOrdersData(data);
    } catch {
      setOpenOrdersData(null);
    } finally {
      setLoadingOpenOrders(false);
    }
  }, [reportType, openOrdersGroupBy]);

  useEffect(() => {
    loadOpenOrdersReport();
  }, [loadOpenOrdersReport]);

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams({ type: reportType });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      selectedStatuses.forEach((s) => params.append("status", s));

      const res = await fetch(`/staff/api/reports/export?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Export failed");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        reportType === "orders"
          ? `orders-export-${from || "all"}-to-${to || "now"}.csv`
          : `customers-export-${from || "all"}-to-${to || "now"}.csv`;
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

  const toggleStatus = (s: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  useEffect(() => {
    if (reportType === "moulding") {
      router.push("/staff/reports/moulding-usage");
    }
  }, [reportType, router]);

  if (reportType === "moulding") {
    return null; // Will redirect
  }

  // TypeScript now knows reportType is "sales" | "orders" | "open-orders" | "customers" after the early return
  const currentReportType: "sales" | "orders" | "open-orders" | "customers" = reportType;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-neutral-900">Reports & Export</h1>

      {/* Controls */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
        {/* Report type */}
        <div className="flex gap-3">
          <button
            onClick={() => setReportType("sales")}
            className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
              currentReportType === "sales"
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
            }`}
          >
            Sales Report
          </button>
          <button
            onClick={() => setReportType("orders")}
            className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
              currentReportType === "orders"
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setReportType("open-orders")}
            className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
              currentReportType === "open-orders"
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
            }`}
          >
            Open Orders
          </button>
          <button
            onClick={() => setReportType("customers")}
            className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
              currentReportType === "customers"
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => setReportType("moulding")}
            className="px-4 py-2 text-sm rounded-xl border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Moulding Usage
          </button>
        </div>

        {/* Period selector for Sales Report */}
        {currentReportType === "sales" && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Period
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSalesPeriod("daily")}
                className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${
                  salesPeriod === "daily"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setSalesPeriod("weekly")}
                className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${
                  salesPeriod === "weekly"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setSalesPeriod("monthly")}
                className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${
                  salesPeriod === "monthly"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
        )}

        {/* Group by selector for Open Orders Report */}
        {currentReportType === "open-orders" && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Group By
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setOpenOrdersGroupBy("status")}
                className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${
                  openOrdersGroupBy === "status"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                Status
              </button>
              <button
                onClick={() => setOpenOrdersGroupBy("staff")}
                className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${
                  openOrdersGroupBy === "staff"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                Staff
              </button>
              <button
                onClick={() => setOpenOrdersGroupBy("aging")}
                className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${
                  openOrdersGroupBy === "aging"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                Aging
              </button>
            </div>
          </div>
        )}

        {/* Date range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              From
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              To
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm"
            />
          </div>
        </div>

        {/* Status filters (orders only) */}
        {currentReportType === "orders" && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Filter by Status (leave empty for all)
            </label>
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${
                    selectedStatuses.includes(s)
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  {ORDER_STATUS_LABEL[s as keyof typeof ORDER_STATUS_LABEL]}
                </button>
              ))}
              {selectedStatuses.length > 0 && (
                <button
                  onClick={() => setSelectedStatuses([])}
                  className="px-3 py-1.5 text-xs rounded-xl border border-neutral-300 text-neutral-500 hover:bg-neutral-50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Export button */}
        {currentReportType !== "sales" && (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="rounded-xl bg-black text-white px-6 py-3 text-sm font-medium disabled:opacity-50"
          >
            {exporting ? "Exporting…" : `Export ${currentReportType === "orders" ? "Orders" : "Customers"} CSV`}
          </button>
        )}
      </div>

      {/* Sales Report */}
      {currentReportType === "sales" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Sales Report ({salesPeriod})
            {loadingSales && (
              <span className="text-sm font-normal text-neutral-400 ml-2">
                Loading…
              </span>
            )}
          </h2>

          {salesData ? (
            <>
              {/* Totals */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Total Orders
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {salesData.totals.totalOrders.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Total Revenue
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    ${(salesData.totals.totalRevenue / 100).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Paid Revenue
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    ${(salesData.totals.totalPaidRevenue / 100).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Avg Order Value
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    ${(salesData.totals.avgOrderValue / 100).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Period breakdown table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-2 text-neutral-500 font-medium">
                        Period
                      </th>
                      <th className="text-right py-2 text-neutral-500 font-medium">
                        Orders
                      </th>
                      <th className="text-right py-2 text-neutral-500 font-medium">
                        Revenue
                      </th>
                      <th className="text-right py-2 text-neutral-500 font-medium">
                        Paid
                      </th>
                      <th className="text-right py-2 text-neutral-500 font-medium">
                        Avg Order
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.periods.map((p: any, idx: number) => (
                      <tr
                        key={idx}
                        className="border-b border-neutral-100"
                      >
                        <td className="py-2 text-neutral-700">
                          {salesPeriod === "daily"
                            ? new Date(p.period).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : salesPeriod === "weekly"
                            ? `Week of ${new Date(p.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}`
                            : new Date(p.date).toLocaleDateString("en-US", {
                                month: "long",
                                year: "numeric",
                              })}
                        </td>
                        <td className="py-2 text-right text-neutral-900 font-medium">
                          {p.orderCount}
                        </td>
                        <td className="py-2 text-right text-neutral-900 font-medium">
                          ${(p.revenue / 100).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-2 text-right text-neutral-600">
                          ${(p.paidRevenue / 100).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-2 text-right text-neutral-600">
                          ${(p.avgOrderValue / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-400">
              {loadingSales ? "Calculating…" : "No data for the selected range."}
            </p>
          )}
        </div>
      )}

      {/* Open Orders Report */}
      {currentReportType === "open-orders" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Open Orders Report ({openOrdersGroupBy})
            {loadingOpenOrders && (
              <span className="text-sm font-normal text-neutral-400 ml-2">
                Loading…
              </span>
            )}
          </h2>

          {openOrdersData ? (
            <>
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Total Open Orders
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {openOrdersData.summary.totalOrders}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Total Value
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    ${(openOrdersData.summary.totalValue / 100).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Avg Days Open
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {Math.round(openOrdersData.summary.avgDaysOpen)}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Oldest Order
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {openOrdersData.summary.oldestOrderDays} days
                  </div>
                </div>
              </div>

              {/* Groups */}
              <div className="space-y-6">
                {openOrdersData.groups.map((group: any) => (
                  <div key={group.key} className="border border-neutral-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-neutral-900">
                        {group.key} ({group.count} orders)
                      </h3>
                      <div className="text-sm text-neutral-600">
                        ${(group.totalValue / 100).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })} • Avg {Math.round(group.avgDaysOpen)} days
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-neutral-200">
                            <th className="text-left py-2 text-neutral-500 font-medium">Order #</th>
                            <th className="text-left py-2 text-neutral-500 font-medium">Customer</th>
                            {openOrdersGroupBy !== "status" && (
                              <th className="text-left py-2 text-neutral-500 font-medium">Status</th>
                            )}
                            {openOrdersGroupBy !== "staff" && (
                              <th className="text-left py-2 text-neutral-500 font-medium">Staff</th>
                            )}
                            {openOrdersGroupBy !== "aging" && (
                              <th className="text-right py-2 text-neutral-500 font-medium">Days Open</th>
                            )}
                            <th className="text-right py-2 text-neutral-500 font-medium">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.orders.map((order: any) => (
                            <tr key={order.id} className="border-b border-neutral-100">
                              <td className="py-2 text-neutral-700 font-mono">{order.orderNumber}</td>
                              <td className="py-2 text-neutral-700">{order.customerName}</td>
                              {openOrdersGroupBy !== "status" && (
                                <td className="py-2 text-neutral-600">
                                  {ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] || order.status}
                                </td>
                              )}
                              {openOrdersGroupBy !== "staff" && (
                                <td className="py-2 text-neutral-600">{order.createdBy}</td>
                              )}
                              {openOrdersGroupBy !== "aging" && (
                                <td className="py-2 text-right text-neutral-600">{order.daysOpen}</td>
                              )}
                              <td className="py-2 text-right text-neutral-900 font-medium">
                                ${(order.totalAmount / 100).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-400">
              {loadingOpenOrders ? "Calculating…" : "No open orders found."}
            </p>
          )}
        </div>
      )}

      {/* Summary panel (orders) */}
      {currentReportType === "orders" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Quick Summary
            {loadingSummary && (
              <span className="text-sm font-normal text-neutral-400 ml-2">
                Loading…
              </span>
            )}
          </h2>

          {summary ? (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Orders
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {summary.totalOrders.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Revenue
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    ${(summary.totalRevenue / 100).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Avg Order
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    ${(summary.avgOrderValue / 100).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Status breakdown table */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-2 text-neutral-500 font-medium">
                      Status
                    </th>
                    <th className="text-right py-2 text-neutral-500 font-medium">
                      Count
                    </th>
                    <th className="text-right py-2 text-neutral-500 font-medium">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summary.statusBreakdown.map((s) => (
                    <tr
                      key={s.status}
                      className="border-b border-neutral-100"
                    >
                      <td className="py-2 text-neutral-700">
                        {ORDER_STATUS_LABEL[
                          s.status as keyof typeof ORDER_STATUS_LABEL
                        ] || s.status}
                      </td>
                      <td className="py-2 text-right text-neutral-900 font-medium">
                        {s.count}
                      </td>
                      <td className="py-2 text-right text-neutral-900 font-medium">
                        ${(s.revenue / 100).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="text-sm text-neutral-400">
              {loadingSummary
                ? "Calculating…"
                : "No data for the selected range."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
