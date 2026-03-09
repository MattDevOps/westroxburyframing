"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  depositPercent: number | null;
  depositAmount: number;
  currency: string;
  squareInvoiceId: string | null;
  squareInvoiceUrl: string | null;
  notes: string | null;
  createdAt: string;
  customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    email: string | null;
  };
  orders: { id: string; orderNumber: string; totalAmount: number; status: string }[];
  payments: { id: string; amount: number; method: string; paidAt: string }[];
  createdBy: { name: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "border-neutral-300 text-neutral-700 bg-neutral-50",
  sent: "border-blue-300 text-blue-700 bg-blue-50",
  partial: "border-amber-300 text-amber-700 bg-amber-50",
  paid: "border-emerald-300 text-emerald-700 bg-emerald-50",
  void: "border-red-300 text-red-700 bg-red-50",
  cancelled: "border-red-200 text-red-600 bg-red-50",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  partial: "Partially Paid",
  paid: "Paid",
  void: "Voided",
  cancelled: "Cancelled",
};

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "partial", label: "Partial" },
  { key: "paid", label: "Paid" },
];

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/staff/api/invoices?${params}`);
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  // Summary stats
  const totalOutstanding = invoices
    .filter((i) => i.status !== "paid" && i.status !== "void" && i.status !== "cancelled")
    .reduce((sum, i) => sum + i.balanceDue, 0);
  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Invoices</h1>
          <div className="flex gap-4 mt-1 text-sm">
            <span className="text-neutral-600">
              Outstanding: <span className="font-semibold text-amber-700">{fmt(totalOutstanding)}</span>
            </span>
            <span className="text-neutral-600">
              Collected: <span className="font-semibold text-emerald-700">{fmt(totalPaid)}</span>
            </span>
          </div>
        </div>
        <Link
          href="/staff/invoices/new"
          className="rounded-xl bg-black text-white px-5 py-2.5 text-sm text-center"
        >
          + New Invoice
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search invoices, customers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm"
        />
        <div className="flex gap-1 overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-lg px-3 py-2 text-sm whitespace-nowrap transition ${
                statusFilter === tab.key
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      {loading ? (
        <p className="text-neutral-500 text-sm">Loading…</p>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <p className="text-lg">No invoices found.</p>
          <p className="text-sm mt-1">Create your first invoice to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <Link
              key={inv.id}
              href={`/staff/invoices/${inv.id}`}
              className="block rounded-2xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 hover:shadow-sm transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Left side */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-900">{inv.invoiceNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[inv.status] || STATUS_COLORS.draft}`}>
                      {STATUS_LABELS[inv.status] || inv.status}
                    </span>
                  </div>
                  <div className="text-sm text-neutral-600">
                    {inv.customer.firstName} {inv.customer.lastName}
                    {inv.customer.phone && ` · ${inv.customer.phone}`}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {inv.orders.map((o) => (
                      <span
                        key={o.id}
                        className="text-xs px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-600"
                      >
                        {o.orderNumber}
                      </span>
                    ))}
                    {inv.orders.length === 0 && (
                      <span className="text-xs text-neutral-400">No linked orders</span>
                    )}
                  </div>
                </div>

                {/* Right side — amounts */}
                <div className="text-right space-y-0.5">
                  <div className="text-lg font-semibold text-neutral-900">{fmt(inv.totalAmount)}</div>
                  {inv.amountPaid > 0 && inv.status !== "paid" && (
                    <div className="text-sm text-emerald-700">Paid: {fmt(inv.amountPaid)}</div>
                  )}
                  {inv.balanceDue > 0 && inv.status !== "paid" && (
                    <div className="text-sm text-amber-700 font-medium">Due: {fmt(inv.balanceDue)}</div>
                  )}
                  <div className="text-xs text-neutral-400">
                    {new Date(inv.createdAt).toLocaleDateString()}
                    {inv.createdBy?.name && ` · ${inv.createdBy.name}`}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
