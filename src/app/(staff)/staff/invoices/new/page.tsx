"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface CustomerOption {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
}

interface OrderOption {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  itemType: string;
  invoiceId: string | null;
}

export default function NewInvoicePageWrapper() {
  return (
    <Suspense fallback={<div className="p-6 text-neutral-500">Loading…</div>}>
      <NewInvoicePage />
    </Suspense>
  );
}

function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get("customerId");
  const preselectedOrderId = searchParams.get("orderId");

  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>(
    preselectedOrderId ? [preselectedOrderId] : []
  );
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [depositPercent, setDepositPercent] = useState<number | null>(50);
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search customers
  useEffect(() => {
    if (preselectedCustomerId) {
      // Load specific customer
      fetch(`/staff/api/customers/${preselectedCustomerId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.customer) {
            setSelectedCustomer(data.customer);
          }
        })
        .catch(() => null);
      return;
    }

    if (!customerSearch.trim()) {
      setCustomers([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoadingCustomers(true);
      try {
        const res = await fetch(`/staff/api/customers?search=${encodeURIComponent(customerSearch.trim())}`);
        const data = await res.json();
        setCustomers(data.customers || []);
      } catch {
        // ignore
      } finally {
        setLoadingCustomers(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [customerSearch, preselectedCustomerId]);

  // Load customer's orders when selected
  useEffect(() => {
    if (!selectedCustomer) {
      setOrders([]);
      return;
    }

    setLoadingOrders(true);
    fetch(`/staff/api/orders?customerId=${selectedCustomer.id}`)
      .then((r) => r.json())
      .then((data) => {
        const o = (data.orders || []).filter(
          (o: any) => o.status !== "cancelled" && o.status !== "estimate"
        );
        setOrders(o);
      })
      .catch(() => null)
      .finally(() => setLoadingOrders(false));
  }, [selectedCustomer]);

  const toggleOrder = (oid: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(oid) ? prev.filter((id) => id !== oid) : [...prev, oid]
    );
  };

  const selectedOrders = orders.filter((o) => selectedOrderIds.includes(o.id));
  const totalCents = selectedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const depositCents = depositPercent ? Math.round(totalCents * depositPercent / 100) : 0;

  async function handleCreate() {
    if (!selectedCustomer) return;
    if (selectedOrderIds.length === 0) {
      setError("Select at least one order");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/staff/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          orderIds: selectedOrderIds,
          depositPercent,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create invoice");
        return;
      }

      router.push(`/staff/invoices/${data.invoice.id}`);
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setCreating(false);
    }
  }

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Create Invoice</h1>
        <a
          href="/staff/invoices"
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          ← Back to invoices
        </a>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Step 1: Select Customer */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
        <h2 className="font-semibold text-neutral-900">1. Customer</h2>

        {selectedCustomer ? (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="text-sm">
              <span className="font-medium">
                {selectedCustomer.firstName} {selectedCustomer.lastName}
              </span>
              {selectedCustomer.email && (
                <span className="text-neutral-600 ml-2">{selectedCustomer.email}</span>
              )}
              {selectedCustomer.phone && (
                <span className="text-neutral-500 ml-2">{selectedCustomer.phone}</span>
              )}
            </div>
            <button
              className="text-xs text-neutral-500 hover:text-neutral-800"
              onClick={() => {
                setSelectedCustomer(null);
                setSelectedOrderIds([]);
                setCustomerSearch("");
              }}
            >
              Change
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or phone…"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm"
            />
            {loadingCustomers && (
              <div className="text-xs text-neutral-500 mt-1">Searching…</div>
            )}
            {customers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setCustomerSearch("");
                      setCustomers([]);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-b-0"
                  >
                    <span className="font-medium">
                      {c.firstName} {c.lastName}
                    </span>
                    {c.phone && (
                      <span className="text-neutral-500 ml-2">{c.phone}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Select Orders */}
      {selectedCustomer && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
          <h2 className="font-semibold text-neutral-900">2. Select Orders</h2>

          {loadingOrders ? (
            <p className="text-sm text-neutral-500">Loading orders…</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No active orders for this customer.{" "}
              <a href={`/staff/orders/new?customerId=${selectedCustomer.id}`} className="text-blue-600 hover:underline">
                Create one
              </a>
            </p>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => {
                const selected = selectedOrderIds.includes(o.id);
                const alreadyInvoiced = !!o.invoiceId && !selected;

                return (
                  <button
                    key={o.id}
                    disabled={alreadyInvoiced}
                    onClick={() => toggleOrder(o.id)}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition ${
                      selected
                        ? "border-blue-400 bg-blue-50"
                        : alreadyInvoiced
                        ? "border-neutral-200 bg-neutral-50 opacity-50 cursor-not-allowed"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selected}
                          readOnly
                          className="rounded"
                        />
                        <span className="text-sm font-medium">{o.orderNumber}</span>
                        <span className="text-xs text-neutral-500">{o.itemType}</span>
                        {alreadyInvoiced && (
                          <span className="text-xs text-amber-600">(already invoiced)</span>
                        )}
                      </div>
                      <span className="text-sm font-medium">{fmt(o.totalAmount)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedOrderIds.length > 0 && (
            <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
              <span className="text-sm text-neutral-600">
                {selectedOrderIds.length} order{selectedOrderIds.length !== 1 ? "s" : ""} selected
              </span>
              <span className="text-lg font-semibold">{fmt(totalCents)}</span>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Deposit & Notes */}
      {selectedOrderIds.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
          <h2 className="font-semibold text-neutral-900">3. Deposit & Notes</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-700 mb-1">Deposit Required</label>
              <select
                value={depositPercent === null ? "none" : String(depositPercent)}
                onChange={(e) =>
                  setDepositPercent(e.target.value === "none" ? null : Number(e.target.value))
                }
                className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm"
              >
                <option value="none">No deposit (full payment)</option>
                <option value="25">25% deposit</option>
                <option value="50">50% deposit</option>
                <option value="75">75% deposit</option>
              </select>
            </div>

            {depositPercent && (
              <div className="flex items-end">
                <div className="text-sm text-neutral-700">
                  Deposit: <span className="font-semibold text-blue-700">{fmt(depositCents)}</span>
                  <br />
                  Balance: <span className="font-semibold">{fmt(totalCents - depositCents)}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-neutral-700 mb-1">Invoice Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for this invoice…"
              rows={3}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm"
            />
          </div>

          {/* Summary */}
          <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4 space-y-2">
            <div className="text-sm font-semibold text-neutral-800">Summary</div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Total</span>
              <span className="font-semibold">{fmt(totalCents)}</span>
            </div>
            {depositPercent && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Deposit ({depositPercent}%)</span>
                  <span className="text-blue-700 font-medium">{fmt(depositCents)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Balance due after deposit</span>
                  <span className="font-medium">{fmt(totalCents - depositCents)}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <a
              href="/staff/invoices"
              className="rounded-xl border border-neutral-300 px-5 py-2.5 text-sm text-neutral-700"
            >
              Cancel
            </a>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="rounded-xl bg-black text-white px-5 py-2.5 text-sm disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create Invoice"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
