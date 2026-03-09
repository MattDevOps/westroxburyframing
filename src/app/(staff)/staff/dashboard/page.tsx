"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface OverdueOrder {
  id: string;
  orderNumber: string;
  status: string;
  dueDate: string | null;
  itemType: string;
  totalCents: number;
  customerName: string;
}

interface ReadyForPickupOrder {
  id: string;
  orderNumber: string;
  totalCents: number;
  customerName: string;
  customerPhone: string | null;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  orderNumber: string | null;
  orderId: string;
  userName: string;
  createdAt: string;
}

interface DashboardData {
  totalOrders: number;
  ordersThisMonth: number;
  ordersToday: number;
  totalRevenue: number;
  revenueThisMonth: number;
  revenueToday: number;
  avgTurnaround: number;
  totalCustomers: number;
  byStatus: { status: string; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  overdueOrders: OverdueOrder[];
  overdueCount: number;
  readyForPickup: ReadyForPickupOrder[];
  estimatesCount: number;
  onHoldCount: number;
  arBalance: number;
  invoicesPending: number;
  recentActivity: ActivityItem[];
  topCustomers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    orderCount: number;
    lifetimeValue: number;
  }>;
  lowStockItems: Array<{
    id: string;
    sku: string;
    name: string;
    quantityOnHand: number;
    reorderPoint: number;
    unitType: string;
  }>;
  lowStockCount: number;
  revenueByDay: Array<{ date: string; revenue: number }>;
  topMaterials: Array<{ name: string; category: string; count: number }>;
  depositCollectionRate: number;
  totalDepositsDue: number;
  totalDepositsCollected: number;
}

const STATUS_LABELS: Record<string, string> = {
  estimate: "Estimate",
  new_design: "New / Design",
  awaiting_materials: "Awaiting Materials",
  in_production: "In Production",
  quality_check: "Quality Check",
  ready_for_pickup: "Ready for Pickup",
  picked_up: "Picked Up",
  completed: "Completed",
  cancelled: "Cancelled",
  on_hold: "On Hold",
};

const STATUS_COLORS: Record<string, string> = {
  estimate: "bg-purple-500",
  new_design: "bg-blue-500",
  awaiting_materials: "bg-amber-500",
  in_production: "bg-indigo-500",
  quality_check: "bg-cyan-500",
  ready_for_pickup: "bg-emerald-500",
  picked_up: "bg-teal-500",
  completed: "bg-green-600",
  cancelled: "bg-neutral-400",
  on_hold: "bg-orange-500",
};

const ACTIVITY_ICONS: Record<string, string> = {
  status_change: "🔄",
  edit: "✏️",
  email_sent: "📧",
  invoice_sent: "💳",
  payment: "💰",
  note: "📝",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/staff/api/dashboard");
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="text-neutral-500">Loading dashboard…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="text-red-500">Failed to load dashboard data.</div>
      </div>
    );
  }

  const maxRevenue = Math.max(
    ...data.revenueByMonth.map((m) => m.revenue),
    1
  );
  const totalStatusCount =
    data.byStatus.reduce((sum, s) => sum + s.count, 0) || 1;

  // Count active in-progress orders (not completed, picked_up, cancelled, estimate)
  const activeStatuses = [
    "new_design",
    "awaiting_materials",
    "in_production",
    "quality_check",
    "ready_for_pickup",
  ];
  const activeCount = data.byStatus
    .filter((s) => activeStatuses.includes(s.status))
    .reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <button
          onClick={load}
          className="text-sm rounded-xl border border-neutral-300 px-3 py-2 text-neutral-600 hover:bg-neutral-100"
        >
          Refresh
        </button>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="Today's Revenue" value={`$${(data.revenueToday / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`} accent="blue" />
        <KPICard label="Open Orders" value={activeCount.toString()} accent="blue" />
        <KPICard
          label="Overdue Orders"
          value={data.overdueCount.toString()}
          accent={data.overdueCount > 0 ? "red" : undefined}
        />
        <KPICard
          label="Ready for Pickup"
          value={data.readyForPickup.length.toString()}
          accent={data.readyForPickup.length > 0 ? "amber" : undefined}
        />
        <KPICard
          label="Total Revenue"
          value={`$${(data.totalRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
        />
        <KPICard
          label="Revenue (Month)"
          value={`$${(data.revenueThisMonth / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
        />
      </div>

      {/* KPI Cards - Row 2 (quick status overview) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Active Orders"
          value={activeCount.toString()}
          accent="blue"
        />
        <KPICard
          label="Overdue"
          value={data.overdueCount.toString()}
          accent={data.overdueCount > 0 ? "red" : undefined}
        />
        <KPICard
          label="Estimates"
          value={data.estimatesCount.toString()}
          accent="purple"
        />
        <KPICard
          label="On Hold"
          value={data.onHoldCount.toString()}
          accent={data.onHoldCount > 0 ? "amber" : undefined}
        />
        <KPICard
          label="A/R Balance"
          value={`$${(data.arBalance / 100).toFixed(0)}`}
          accent={data.arBalance > 0 ? "amber" : undefined}
        />
        <KPICard
          label="Invoices Pending"
          value={data.invoicesPending.toString()}
          accent={data.invoicesPending > 0 ? "blue" : undefined}
        />
        <KPICard
          label="Deposit Collection"
          value={`${data.depositCollectionRate}%`}
          accent={data.depositCollectionRate < 80 ? "amber" : "blue"}
        />
        <KPICard
          label="Avg Ticket"
          value={`$${data.ordersThisMonth > 0 ? ((data.revenueThisMonth / data.ordersThisMonth) / 100).toFixed(0) : "0"}`}
        />
      </div>

      {/* Overdue alert */}
      {data.overdueOrders.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <h2 className="text-base font-semibold text-red-800 mb-3 flex items-center gap-2">
            ⚠️ Overdue Orders ({data.overdueCount})
          </h2>
          <div className="space-y-2">
            {data.overdueOrders.map((o) => {
              const daysOverdue = o.dueDate
                ? Math.ceil(
                    (Date.now() - new Date(o.dueDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 0;
              return (
                <Link
                  key={o.id}
                  href={`/staff/orders/${o.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl bg-white border border-red-100 px-4 py-2.5 hover:bg-red-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-neutral-900">
                      #{o.orderNumber}
                    </span>
                    <span className="text-sm text-neutral-600">
                      {o.customerName}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-red-600">
                    {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders by Status */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Orders by Status
          </h2>
          <div className="space-y-3">
            {data.byStatus
              .sort((a, b) => b.count - a.count)
              .map((s) => (
                <div key={s.status} className="flex items-center gap-3">
                  <div className="w-28 text-sm text-neutral-600 truncate">
                    {STATUS_LABELS[s.status] || s.status}
                  </div>
                  <div className="flex-1 bg-neutral-100 rounded-full h-5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${STATUS_COLORS[s.status] || "bg-neutral-400"}`}
                      style={{
                        width: `${(s.count / totalStatusCount) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="w-8 text-sm font-semibold text-neutral-900 text-right">
                    {s.count}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Revenue by Month */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Revenue (Last 6 Months)
          </h2>
          <div className="flex items-end gap-3 h-48">
            {data.revenueByMonth.map((m) => (
              <div
                key={m.month}
                className="flex-1 flex flex-col items-center justify-end h-full"
              >
                <div className="text-xs font-semibold text-neutral-700 mb-1">
                  {m.revenue > 0
                    ? `$${(m.revenue / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    : "$0"}
                </div>
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all min-h-[4px]"
                  style={{
                    height: `${Math.max((m.revenue / maxRevenue) * 100, 2)}%`,
                  }}
                />
                <div className="text-[10px] text-neutral-500 mt-2 text-center leading-tight">
                  {m.month}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Trends & Top Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Day (Last 7 Days) */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Revenue Trends (Last 7 Days)
          </h2>
          {data.revenueByDay && data.revenueByDay.length > 0 ? (
            <div className="flex items-end gap-2 h-40">
              {data.revenueByDay.map((d) => {
                const dayMax = Math.max(...data.revenueByDay.map((r) => r.revenue), 1);
                return (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col items-center justify-end h-full"
                  >
                    <div className="text-xs font-semibold text-neutral-700 mb-1">
                      {d.revenue > 0
                        ? `$${((d.revenue / 100).toFixed(0))}`
                        : "$0"}
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t transition-all min-h-[4px]"
                      style={{
                        height: `${Math.max((d.revenue / dayMax) * 100, 2)}%`,
                      }}
                    />
                    <div className="text-[10px] text-neutral-500 mt-2 text-center">
                      {new Date(d.date).toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">No revenue data available.</p>
          )}
        </div>

        {/* Top Materials */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Top Materials (Last 30 Days)
          </h2>
          {data.topMaterials && data.topMaterials.length > 0 ? (
            <div className="space-y-3">
              {data.topMaterials.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-neutral-900">{m.name}</div>
                    <div className="text-xs text-neutral-500">{m.category}</div>
                  </div>
                  <div className="text-sm font-semibold text-neutral-700">
                    {m.count} {m.count === 1 ? "use" : "uses"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">No material usage data available.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ready for Pickup */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">
              Ready for Pickup ({data.readyForPickup.length})
            </h2>
            <Link
              href="/staff/orders/incomplete"
              className="text-xs text-blue-600 hover:underline"
            >
              View all →
            </Link>
          </div>
          {data.readyForPickup.length === 0 ? (
            <p className="text-sm text-neutral-400">
              No orders waiting for pickup.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.readyForPickup.map((o) => {
                const waitDays = Math.ceil(
                  (Date.now() - new Date(o.createdAt).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                return (
                  <Link
                    key={o.id}
                    href={`/staff/orders/${o.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 px-4 py-2.5 hover:bg-neutral-50 transition-colors"
                  >
                    <div>
                      <span className="text-sm font-semibold text-neutral-900">
                        #{o.orderNumber}
                      </span>
                      <span className="text-sm text-neutral-500 ml-2">
                        {o.customerName}
                      </span>
                      {o.customerPhone && (
                        <span className="text-xs text-neutral-400 ml-2">
                          {o.customerPhone}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-neutral-900">
                        ${(o.totalCents / 100).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {waitDays}d ago
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Customers */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">
              Top Customers
            </h2>
            <Link
              href="/staff/reports?reportType=customers"
              className="text-xs text-blue-600 hover:underline"
            >
              View report →
            </Link>
          </div>
          {!data.topCustomers || data.topCustomers.length === 0 ? (
            <p className="text-sm text-neutral-400">No customer data available.</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {data.topCustomers.map((c, idx) => (
                <Link
                  key={c.id}
                  href={`/staff/customers/${c.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 px-4 py-2.5 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-600">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">
                        {c.firstName} {c.lastName}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {c.orderCount} order{c.orderCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-neutral-900">
                      ${(c.lifetimeValue / 100).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                      })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Recent Activity
          </h2>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-neutral-400">No recent activity.</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {data.recentActivity.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 text-sm"
                >
                  <span className="text-base shrink-0 mt-0.5">
                    {ACTIVITY_ICONS[a.type] || "📋"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-700">
                      {a.orderNumber && (
                        <Link
                          href={`/staff/orders/${a.orderId}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          #{a.orderNumber}
                        </Link>
                      )}{" "}
                      {a.message}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {a.userName} ·{" "}
                      {new Date(a.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Phase 4A: Low Stock Alerts */}
      {data.lowStockCount > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-lg font-semibold text-amber-900">
                ⚠️ Low Stock Alert
              </div>
              <div className="text-sm text-amber-700">
                {data.lowStockCount} item{data.lowStockCount !== 1 ? "s" : ""} below reorder point
              </div>
            </div>
            <Link
              href="/staff/inventory?lowStock=true"
              className="text-sm px-4 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.lowStockItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-amber-200 bg-white p-3"
              >
                <div className="font-medium text-neutral-900">{item.name}</div>
                <div className="text-sm text-neutral-600 mt-1">
                  <span className="font-mono">{item.sku}</span>
                </div>
                <div className="text-sm text-red-700 mt-2">
                  {item.quantityOnHand.toFixed(2)} {item.unitType} on hand
                  <span className="text-neutral-500"> (reorder at {item.reorderPoint.toFixed(2)})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "red" | "blue" | "purple" | "amber";
}) {
  const accentStyles: Record<string, string> = {
    red: "border-red-200 bg-red-50",
    blue: "border-blue-200 bg-blue-50",
    purple: "border-purple-200 bg-purple-50",
    amber: "border-amber-200 bg-amber-50",
  };
  const valueStyles: Record<string, string> = {
    red: "text-red-700",
    blue: "text-blue-700",
    purple: "text-purple-700",
    amber: "text-amber-700",
  };

  return (
    <div
      className={`rounded-2xl border p-4 ${accent ? accentStyles[accent] : "border-neutral-200 bg-white"}`}
    >
      <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
        {label}
      </div>
      <div
        className={`text-xl font-bold ${accent ? valueStyles[accent] : "text-neutral-900"}`}
      >
        {value}
      </div>
    </div>
  );
}
