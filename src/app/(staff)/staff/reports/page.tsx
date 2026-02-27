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
  const [reportType, setReportType] = useState<"sales" | "orders" | "open-orders" | "customers" | "ar-aging" | "moulding" | "vendor-spending" | "top-materials">("sales");
  const [salesPeriod, setSalesPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [salesData, setSalesData] = useState<any>(null);
  const [loadingSales, setLoadingSales] = useState(false);
  const [openOrdersGroupBy, setOpenOrdersGroupBy] = useState<"status" | "staff" | "aging">("status");
  const [openOrdersData, setOpenOrdersData] = useState<any>(null);
  const [loadingOpenOrders, setLoadingOpenOrders] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerFrom, setCustomerFrom] = useState<string>("");
  const [customerTo, setCustomerTo] = useState<string>("");
  const [arAgingData, setArAgingData] = useState<any>(null);
  const [loadingArAging, setLoadingArAging] = useState(false);
  const [vendorSpendingPeriod, setVendorSpendingPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [vendorSpendingData, setVendorSpendingData] = useState<any>(null);
  const [loadingVendorSpending, setLoadingVendorSpending] = useState(false);
  const [vendorSpendingStatus, setVendorSpendingStatus] = useState<string>("received");
  const [topMaterialsData, setTopMaterialsData] = useState<any>(null);
  const [loadingTopMaterials, setLoadingTopMaterials] = useState(false);
  const [topMaterialsCategory, setTopMaterialsCategory] = useState<string>("all");
  const [emailing, setEmailing] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
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

  const loadCustomerReport = useCallback(async () => {
    if (reportType !== "customers") {
      setCustomerData(null);
      return;
    }
    setLoadingCustomers(true);
    try {
      const params = new URLSearchParams();
      if (customerFrom) params.set("from", customerFrom);
      if (customerTo) params.set("to", customerTo);

      const res = await fetch(`/staff/api/reports/customers?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setCustomerData(null);
        return;
      }
      setCustomerData(data);
    } catch {
      setCustomerData(null);
    } finally {
      setLoadingCustomers(false);
    }
  }, [reportType, customerFrom, customerTo]);

  useEffect(() => {
    loadCustomerReport();
  }, [loadCustomerReport]);

  const loadArAgingReport = useCallback(async () => {
    if (reportType !== "ar-aging") {
      setArAgingData(null);
      return;
    }
    setLoadingArAging(true);
    try {
      const res = await fetch(`/staff/api/reports/ar-aging`);
      const data = await res.json();
      if (!res.ok) {
        setArAgingData(null);
        return;
      }
      setArAgingData(data);
    } catch {
      setArAgingData(null);
    } finally {
      setLoadingArAging(false);
    }
  }, [reportType]);

  useEffect(() => {
    loadArAgingReport();
  }, [loadArAgingReport]);

  const loadVendorSpendingReport = useCallback(async () => {
    if (reportType !== "vendor-spending") {
      setVendorSpendingData(null);
      return;
    }
    setLoadingVendorSpending(true);
    try {
      const params = new URLSearchParams();
      params.set("period", vendorSpendingPeriod);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (vendorSpendingStatus) params.set("status", vendorSpendingStatus);

      const res = await fetch(`/staff/api/reports/vendor-spending?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setVendorSpendingData(null);
        return;
      }
      setVendorSpendingData(data);
    } catch {
      setVendorSpendingData(null);
    } finally {
      setLoadingVendorSpending(false);
    }
  }, [reportType, vendorSpendingPeriod, from, to, vendorSpendingStatus]);

  useEffect(() => {
    loadVendorSpendingReport();
  }, [loadVendorSpendingReport]);

  const loadTopMaterialsReport = useCallback(async () => {
    if (reportType !== "top-materials") {
      setTopMaterialsData(null);
      return;
    }
    setLoadingTopMaterials(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (topMaterialsCategory && topMaterialsCategory !== "all") params.set("category", topMaterialsCategory);

      const res = await fetch(`/staff/api/reports/top-materials?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setTopMaterialsData(null);
        return;
      }
      setTopMaterialsData(data);
    } catch {
      setTopMaterialsData(null);
    } finally {
      setLoadingTopMaterials(false);
    }
  }, [reportType, from, to, topMaterialsCategory]);

  useEffect(() => {
    loadTopMaterialsReport();
  }, [loadTopMaterialsReport]);

  async function handleEmailReport() {
    if (!emailTo) return;
    setEmailing(true);
    setEmailMessage(null);
    try {
      const body: any = {
        reportType: currentReportType,
        emailTo,
      };

      // Add report-specific params
      if (currentReportType === "sales") {
        body.period = salesPeriod;
        if (from) body.from = from;
        if (to) body.to = to;
      } else if (currentReportType === "open-orders") {
        body.groupBy = openOrdersGroupBy;
      } else if (currentReportType === "customers") {
        if (customerFrom) body.from = customerFrom;
        if (customerTo) body.to = customerTo;
      } else if (currentReportType === "vendor-spending") {
        body.period = vendorSpendingPeriod;
        if (from) body.from = from;
        if (to) body.to = to;
        if (vendorSpendingStatus) body.status = vendorSpendingStatus;
      } else if (currentReportType === "top-materials") {
        if (from) body.from = from;
        if (to) body.to = to;
        if (topMaterialsCategory && topMaterialsCategory !== "all") body.category = topMaterialsCategory;
      }

      const res = await fetch("/staff/api/reports/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setEmailMessage(`Error: ${data.error || "Failed to send email"}`);
        return;
      }

      setEmailMessage(`Report sent to ${emailTo}`);
      setTimeout(() => {
        setShowEmailForm(false);
        setEmailTo("");
        setEmailMessage(null);
      }, 3000);
    } catch (e: any) {
      setEmailMessage(`Error: ${e?.message || "Failed to send email"}`);
    } finally {
      setEmailing(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      let url = "";
      let filename = "";

      if (reportType === "sales") {
        const params = new URLSearchParams();
        params.set("period", salesPeriod);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        url = `/staff/api/reports/sales/export?${params.toString()}`;
        filename = `sales-report-${salesPeriod}-${new Date().toISOString().split("T")[0]}.csv`;
      } else if (reportType === "open-orders") {
        const params = new URLSearchParams();
        params.set("groupBy", openOrdersGroupBy);
        url = `/staff/api/reports/open-orders/export?${params.toString()}`;
        filename = `open-orders-report-${openOrdersGroupBy}-${new Date().toISOString().split("T")[0]}.csv`;
      } else if (reportType === "customers") {
        const params = new URLSearchParams();
        if (customerFrom) params.set("from", customerFrom);
        if (customerTo) params.set("to", customerTo);
        url = `/staff/api/reports/customers/export?${params.toString()}`;
        filename = `customer-report-${new Date().toISOString().split("T")[0]}.csv`;
      } else if (reportType === "ar-aging") {
        url = `/staff/api/reports/ar-aging/export`;
        filename = `ar-aging-report-${new Date().toISOString().split("T")[0]}.csv`;
      } else if (reportType === "vendor-spending") {
        const params = new URLSearchParams();
        params.set("period", vendorSpendingPeriod);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (vendorSpendingStatus) params.set("status", vendorSpendingStatus);
        url = `/staff/api/reports/vendor-spending/export?${params.toString()}`;
        filename = `vendor-spending-${vendorSpendingPeriod}-${new Date().toISOString().split("T")[0]}.csv`;
      } else if (reportType === "top-materials") {
        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (topMaterialsCategory && topMaterialsCategory !== "all") params.set("category", topMaterialsCategory);
        url = `/staff/api/reports/top-materials/export?${params.toString()}`;
        filename = `top-materials-${new Date().toISOString().split("T")[0]}.csv`;
      } else {
        // orders or customers (legacy)
        const params = new URLSearchParams({ type: reportType });
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        selectedStatuses.forEach((s) => params.append("status", s));
        url = `/staff/api/reports/export?${params.toString()}`;
        filename =
          reportType === "orders"
            ? `orders-export-${from || "all"}-to-${to || "now"}.csv`
            : `customers-export-${from || "all"}-to-${to || "now"}.csv`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Export failed");
        return;
      }

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
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

  // TypeScript now knows reportType is "sales" | "orders" | "open-orders" | "customers" | "ar-aging" | "vendor-spending" | "top-materials" after the early return
  const currentReportType: "sales" | "orders" | "open-orders" | "customers" | "ar-aging" | "vendor-spending" | "top-materials" = reportType;

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
          <button
            onClick={() => setReportType("vendor-spending")}
            className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
              currentReportType === "vendor-spending"
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
            }`}
          >
            Vendor Spending
          </button>
          <button
            onClick={() => setReportType("top-materials")}
            className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
              currentReportType === "top-materials"
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
            }`}
          >
            Top Materials
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

        {/* Period and Status selector for Vendor Spending Report */}
        {currentReportType === "vendor-spending" && (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Period
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setVendorSpendingPeriod("daily")}
                  className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${
                    vendorSpendingPeriod === "daily"
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setVendorSpendingPeriod("weekly")}
                  className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${
                    vendorSpendingPeriod === "weekly"
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setVendorSpendingPeriod("monthly")}
                  className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${
                    vendorSpendingPeriod === "monthly"
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Status Filter
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setVendorSpendingStatus("received")}
                  className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${
                    vendorSpendingStatus === "received"
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  Received Only
                </button>
                <button
                  onClick={() => setVendorSpendingStatus("all")}
                  className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${
                    vendorSpendingStatus === "all"
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  All Statuses
                </button>
              </div>
            </div>
          </>
        )}

        {/* Category selector for Top Materials Report */}
        {currentReportType === "top-materials" && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Category Filter
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setTopMaterialsCategory("all")}
                className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${
                  topMaterialsCategory === "all"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                All Categories
              </button>
              {["moulding", "mat", "glass", "mounting", "hardware", "extra"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setTopMaterialsCategory(cat)}
                  className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${
                    topMaterialsCategory === cat
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
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

        {/* Export button (for orders and vendor-spending reports) */}
        {currentReportType === "orders" && (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="rounded-xl bg-black text-white px-6 py-3 text-sm font-medium disabled:opacity-50 hover:bg-neutral-800 transition-colors"
          >
            {exporting ? "Exporting…" : "Export Orders CSV"}
          </button>
        )}

        {currentReportType === "vendor-spending" && (
          <button
            onClick={handleExport}
            disabled={exporting || !vendorSpendingData}
            className="rounded-xl bg-black text-white px-4 py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-neutral-800 transition-colors"
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        )}

        {currentReportType === "top-materials" && (
          <button
            onClick={handleExport}
            disabled={exporting || !topMaterialsData}
            className="rounded-xl bg-black text-white px-4 py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-neutral-800 transition-colors"
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        )}

        {/* Email report button */}
        {currentReportType !== "orders" && currentReportType !== "vendor-spending" && currentReportType !== "top-materials" && (
          <div className="flex items-center gap-2">
            {showEmailForm ? (
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="Email address"
                  className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm flex-1 min-w-[200px]"
                />
                <button
                  onClick={handleEmailReport}
                  disabled={emailing || !emailTo}
                  className="rounded-xl bg-blue-600 text-white px-4 py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
                >
                  {emailing ? "Sending…" : "Send"}
                </button>
                <button
                  onClick={() => {
                    setShowEmailForm(false);
                    setEmailTo("");
                    setEmailMessage(null);
                  }}
                  className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowEmailForm(true)}
                className="rounded-xl bg-blue-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                📧 Email Report
              </button>
            )}
            {emailMessage && (
              <span className={`text-sm ${emailMessage.includes("error") || emailMessage.includes("Failed") ? "text-red-600" : "text-green-600"}`}>
                {emailMessage}
              </span>
            )}
          </div>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">
              Open Orders Report ({openOrdersGroupBy})
              {loadingOpenOrders && (
                <span className="text-sm font-normal text-neutral-400 ml-2">
                  Loading…
                </span>
              )}
            </h2>
            <button
              onClick={handleExport}
              disabled={exporting || !openOrdersData}
              className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-neutral-800 transition-colors"
            >
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>

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

      {/* Customer Report */}
      {currentReportType === "customers" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">
              Customer Report
              {loadingCustomers && (
                <span className="text-sm font-normal text-neutral-400 ml-2">
                  Loading…
                </span>
              )}
            </h2>
            <button
              onClick={handleExport}
              disabled={exporting || !customerData}
              className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-neutral-800 transition-colors"
            >
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>

          {customerData ? (
            <>
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Total Customers
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {customerData.summary.totalCustomers}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    New Customers
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {customerData.summary.newCustomers}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Returning Customers
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {customerData.summary.returningCustomers}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Total Lifetime Value
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    ${(customerData.summary.totalLifetimeValue / 100).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Avg Lifetime Value
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    ${(customerData.summary.avgLifetimeValue / 100).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Avg Frequency
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {customerData.summary.avgFrequency.toFixed(1)} orders/yr
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Total Orders
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {customerData.summary.totalOrders}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Avg Order Value
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {customerData.summary.totalOrders > 0
                      ? `$${((customerData.summary.totalLifetimeValue / customerData.summary.totalOrders) / 100).toFixed(2)}`
                      : "$0.00"}
                  </div>
                </div>
              </div>

              {/* Segments */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border border-neutral-200 p-4">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                    Lifetime Value Segments
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">High Value ($1000+)</span>
                      <span className="font-medium text-neutral-900">
                        {customerData.summary.valueSegments.high}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Medium Value ($500-$999)</span>
                      <span className="font-medium text-neutral-900">
                        {customerData.summary.valueSegments.medium}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Low Value ($1-$499)</span>
                      <span className="font-medium text-neutral-900">
                        {customerData.summary.valueSegments.low}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">No Value ($0)</span>
                      <span className="font-medium text-neutral-900">
                        {customerData.summary.valueSegments.none}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                    Frequency Segments
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Frequent (2+ orders/yr)</span>
                      <span className="font-medium text-neutral-900">
                        {customerData.summary.frequencySegments.frequent}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Occasional (0.5-2 orders/yr)</span>
                      <span className="font-medium text-neutral-900">
                        {customerData.summary.frequencySegments.occasional}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Rare (&lt;0.5 orders/yr)</span>
                      <span className="font-medium text-neutral-900">
                        {customerData.summary.frequencySegments.rare}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Inactive (0 orders)</span>
                      <span className="font-medium text-neutral-900">
                        {customerData.summary.frequencySegments.inactive}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Customers Table */}
              <div className="border border-neutral-200 rounded-xl p-4">
                <h3 className="font-semibold text-neutral-900 mb-3">
                  Top Customers by Lifetime Value
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-2 text-neutral-500 font-medium">Customer</th>
                        <th className="text-left py-2 text-neutral-500 font-medium">Contact</th>
                        <th className="text-right py-2 text-neutral-500 font-medium">Orders</th>
                        <th className="text-right py-2 text-neutral-500 font-medium">Lifetime Value</th>
                        <th className="text-right py-2 text-neutral-500 font-medium">Avg Order</th>
                        <th className="text-right py-2 text-neutral-500 font-medium">Frequency</th>
                        <th className="text-left py-2 text-neutral-500 font-medium">First Order</th>
                        <th className="text-left py-2 text-neutral-500 font-medium">Last Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerData.customers.slice(0, 50).map((customer: any) => (
                        <tr key={customer.id} className="border-b border-neutral-100">
                          <td className="py-2 text-neutral-700">
                            {customer.firstName} {customer.lastName}
                          </td>
                          <td className="py-2 text-neutral-600 text-xs">
                            {customer.email || customer.phone || "—"}
                          </td>
                          <td className="py-2 text-right text-neutral-700">
                            {customer.totalOrders} ({customer.completedOrders})
                          </td>
                          <td className="py-2 text-right text-neutral-900 font-medium">
                            ${(customer.lifetimeValue / 100).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-2 text-right text-neutral-600">
                            ${(customer.avgOrderValue / 100).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-2 text-right text-neutral-600">
                            {customer.frequency.toFixed(1)}/yr
                          </td>
                          <td className="py-2 text-neutral-600 text-xs">
                            {new Date(customer.firstOrderDate).toLocaleDateString()}
                          </td>
                          <td className="py-2 text-neutral-600 text-xs">
                            {new Date(customer.lastOrderDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {customerData.customers.length > 50 && (
                  <p className="text-xs text-neutral-400 mt-3">
                    Showing top 50 customers. Total: {customerData.customers.length}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-400">
              {loadingCustomers ? "Calculating…" : "No customer data found."}
            </p>
          )}
        </div>
      )}

      {/* A/R Aging Report */}
      {currentReportType === "ar-aging" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">
              Accounts Receivable Aging Report
              {loadingArAging && (
                <span className="text-sm font-normal text-neutral-400 ml-2">
                  Loading…
                </span>
              )}
            </h2>
            <button
              onClick={handleExport}
              disabled={exporting || !arAgingData}
              className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-neutral-800 transition-colors"
            >
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>

          {arAgingData ? (
            <>
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Outstanding Invoices
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {arAgingData.summary.totalInvoices}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Total Outstanding
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    ${(arAgingData.summary.totalOutstanding / 100).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Avg Days Old
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {arAgingData.summary.avgDaysOld}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Oldest Invoice
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {arAgingData.summary.oldestDays} days
                  </div>
                </div>
              </div>

              {/* Aging Buckets */}
              <div className="space-y-6">
                {arAgingData.buckets.map((bucket: any) => (
                  <div key={bucket.bucket} className="border border-neutral-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-neutral-900">
                        {bucket.bucket} ({bucket.count} invoices)
                      </h3>
                      <div className="text-sm text-neutral-600">
                        ${(bucket.totalBalance / 100).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    {bucket.invoices.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-neutral-200">
                              <th className="text-left py-2 text-neutral-500 font-medium">Invoice #</th>
                              <th className="text-left py-2 text-neutral-500 font-medium">Customer</th>
                              <th className="text-left py-2 text-neutral-500 font-medium">Contact</th>
                              <th className="text-left py-2 text-neutral-500 font-medium">Order #</th>
                              <th className="text-right py-2 text-neutral-500 font-medium">Total</th>
                              <th className="text-right py-2 text-neutral-500 font-medium">Balance Due</th>
                              <th className="text-right py-2 text-neutral-500 font-medium">Days Old</th>
                              <th className="text-left py-2 text-neutral-500 font-medium">Status</th>
                              <th className="text-left py-2 text-neutral-500 font-medium">Invoice Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bucket.invoices.map((invoice: any) => (
                              <tr key={invoice.id} className="border-b border-neutral-100">
                                <td className="py-2 text-neutral-700 font-mono">{invoice.invoiceNumber}</td>
                                <td className="py-2 text-neutral-700">{invoice.customerName}</td>
                                <td className="py-2 text-neutral-600 text-xs">
                                  {invoice.customerEmail || invoice.customerPhone || "—"}
                                </td>
                                <td className="py-2 text-neutral-600 text-xs">{invoice.orderNumbers || "—"}</td>
                                <td className="py-2 text-right text-neutral-600">
                                  ${(invoice.totalAmount / 100).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="py-2 text-right text-neutral-900 font-medium">
                                  ${(invoice.balanceDue / 100).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="py-2 text-right text-neutral-600">{invoice.daysOld}</td>
                                <td className="py-2 text-neutral-600">
                                  <span className={`px-2 py-0.5 rounded text-xs ${
                                    invoice.status === "partial" 
                                      ? "bg-yellow-100 text-yellow-800"
                                      : invoice.status === "sent"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}>
                                    {invoice.status}
                                  </span>
                                </td>
                                <td className="py-2 text-neutral-600 text-xs">
                                  {new Date(invoice.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-400 py-4">No invoices in this age bucket.</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-400">
              {loadingArAging ? "Calculating…" : "No outstanding invoices found."}
            </p>
          )}
        </div>
      )}

      {/* Vendor Spending Report */}
      {currentReportType === "vendor-spending" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">
              Vendor Spending Report ({vendorSpendingPeriod})
              {loadingVendorSpending && (
                <span className="text-sm font-normal text-neutral-400 ml-2">
                  Loading…
                </span>
              )}
            </h2>
          </div>

          {vendorSpendingData ? (
            <>
              {/* Overall Totals */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Total Vendors
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {vendorSpendingData.overallTotals.totalVendors}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Total Purchase Orders
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {vendorSpendingData.overallTotals.totalPOs.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Total Spent
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    ${(vendorSpendingData.overallTotals.totalSpent / 100).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Avg PO Value
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    ${(vendorSpendingData.overallTotals.avgPOValue / 100).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Vendor Totals */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                  Spending by Vendor
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-2 text-neutral-500 font-medium">Vendor</th>
                        <th className="text-left py-2 text-neutral-500 font-medium">Code</th>
                        <th className="text-right py-2 text-neutral-500 font-medium">Purchase Orders</th>
                        <th className="text-right py-2 text-neutral-500 font-medium">Total Spent</th>
                        <th className="text-right py-2 text-neutral-500 font-medium">Avg PO Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorSpendingData.vendorTotals.map((vendor: any) => (
                        <tr key={vendor.vendorId} className="border-b border-neutral-100">
                          <td className="py-2 text-neutral-700 font-medium">{vendor.vendorName}</td>
                          <td className="py-2 text-neutral-600 text-xs font-mono">{vendor.vendorCode}</td>
                          <td className="py-2 text-right text-neutral-700">{vendor.totalPOs}</td>
                          <td className="py-2 text-right text-neutral-900 font-medium">
                            ${(vendor.totalSpent / 100).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-2 text-right text-neutral-600">
                            ${(vendor.avgPOValue / 100).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Period Breakdown by Vendor */}
              <div className="space-y-6">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Period Breakdown by Vendor
                </h3>
                {vendorSpendingData.vendorTotals.map((vendor: any) => {
                  const vendorPeriods = vendorSpendingData.vendorPeriods.filter(
                    (vp: any) => vp.vendorId === vendor.vendorId
                  );
                  if (vendorPeriods.length === 0) return null;

                  return (
                    <div key={vendor.vendorId} className="border border-neutral-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-neutral-900">
                          {vendor.vendorName} ({vendor.vendorCode})
                        </h4>
                        <div className="text-sm text-neutral-600">
                          Total: ${(vendor.totalSpent / 100).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-neutral-200">
                              <th className="text-left py-2 text-neutral-500 font-medium">Period</th>
                              <th className="text-right py-2 text-neutral-500 font-medium">POs</th>
                              <th className="text-right py-2 text-neutral-500 font-medium">Total Spent</th>
                              <th className="text-right py-2 text-neutral-500 font-medium">Avg PO Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vendorPeriods.map((vp: any) => (
                              <tr key={`${vp.vendorId}-${vp.period}`} className="border-b border-neutral-100">
                                <td className="py-2 text-neutral-700">
                                  {vendorSpendingPeriod === "daily"
                                    ? new Date(vp.period).toLocaleDateString()
                                    : vendorSpendingPeriod === "weekly"
                                    ? `Week of ${new Date(vp.period).toLocaleDateString()}`
                                    : new Date(vp.date).toLocaleDateString("en-US", {
                                        month: "long",
                                        year: "numeric",
                                      })}
                                </td>
                                <td className="py-2 text-right text-neutral-700">{vp.poCount}</td>
                                <td className="py-2 text-right text-neutral-900 font-medium">
                                  ${(vp.totalSpent / 100).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="py-2 text-right text-neutral-600">
                                  ${(vp.avgPOValue / 100).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-400">
              {loadingVendorSpending ? "Calculating…" : "No vendor spending data found."}
            </p>
          )}
        </div>
      )}

      {/* Top Materials Report */}
      {currentReportType === "top-materials" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">
              Top Materials Report
              {loadingTopMaterials && (
                <span className="text-sm font-normal text-neutral-400 ml-2">
                  Loading…
                </span>
              )}
            </h2>
          </div>

          {topMaterialsData ? (
            <>
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Total Materials
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {topMaterialsData.summary.totalMaterials}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Total Usage
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {topMaterialsData.summary.totalUsage.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Total Revenue
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    ${(topMaterialsData.summary.totalRevenue / 100).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                    Avg Revenue/Material
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    ${topMaterialsData.summary.totalMaterials > 0
                      ? ((topMaterialsData.summary.totalRevenue / topMaterialsData.summary.totalMaterials) / 100).toFixed(2)
                      : "0.00"}
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              {Object.keys(topMaterialsData.summary.categoryBreakdown).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                    Usage by Category
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(topMaterialsData.summary.categoryBreakdown)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([category, count]) => (
                        <div key={category} className="rounded-xl border border-neutral-200 p-3">
                          <div className="text-xs text-neutral-500 uppercase">{category}</div>
                          <div className="text-lg font-bold text-neutral-900 mt-1">{count as number}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Top Materials Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-2 text-neutral-500 font-medium">Rank</th>
                      <th className="text-left py-2 text-neutral-500 font-medium">Material</th>
                      <th className="text-left py-2 text-neutral-500 font-medium">Category</th>
                      <th className="text-left py-2 text-neutral-500 font-medium">Vendor</th>
                      <th className="text-left py-2 text-neutral-500 font-medium">Item #</th>
                      <th className="text-right py-2 text-neutral-500 font-medium">Usage Count</th>
                      <th className="text-right py-2 text-neutral-500 font-medium">Total Qty</th>
                      <th className="text-right py-2 text-neutral-500 font-medium">Total Revenue</th>
                      <th className="text-right py-2 text-neutral-500 font-medium">Avg Order Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topMaterialsData.materials.map((material: any, idx: number) => (
                      <tr key={material.id} className="border-b border-neutral-100">
                        <td className="py-2 text-neutral-600 font-medium">{idx + 1}</td>
                        <td className="py-2 text-neutral-900 font-medium">{material.name}</td>
                        <td className="py-2 text-neutral-600">
                          <span className="px-2 py-0.5 rounded text-xs bg-neutral-100">
                            {material.category}
                          </span>
                        </td>
                        <td className="py-2 text-neutral-600 text-xs">
                          {material.vendor || "—"}
                        </td>
                        <td className="py-2 text-neutral-600 text-xs font-mono">
                          {material.itemNumber || material.priceCode || "—"}
                        </td>
                        <td className="py-2 text-right text-neutral-700">{material.usageCount}</td>
                        <td className="py-2 text-right text-neutral-600">
                          {material.totalQuantity.toFixed(2)}
                        </td>
                        <td className="py-2 text-right text-neutral-900 font-medium">
                          ${(material.totalRevenue / 100).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-2 text-right text-neutral-600">
                          ${(material.avgOrderValue / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-400">
              {loadingTopMaterials ? "Calculating…" : "No materials data found."}
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
