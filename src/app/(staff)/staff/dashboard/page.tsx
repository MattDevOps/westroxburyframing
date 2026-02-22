"use client";

import { useEffect, useState, useCallback } from "react";

interface DashboardData {
    totalOrders: number;
    ordersThisMonth: number;
    totalRevenue: number;
    revenueThisMonth: number;
    avgTurnaround: number;
    totalCustomers: number;
    byStatus: { status: string; count: number }[];
    revenueByMonth: { month: string; revenue: number }[];
}

const STATUS_LABELS: Record<string, string> = {
    new_design: "New / Design",
    awaiting_materials: "Awaiting Materials",
    in_production: "In Production",
    ready_for_pickup: "Ready for Pickup",
    picked_up: "Picked Up",
    completed: "Completed",
    cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
    new_design: "bg-blue-500",
    awaiting_materials: "bg-amber-500",
    in_production: "bg-purple-500",
    ready_for_pickup: "bg-emerald-500",
    picked_up: "bg-teal-500",
    completed: "bg-green-600",
    cancelled: "bg-neutral-400",
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

    useEffect(() => { load(); }, [load]);

    if (loading) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-10">
                <div className="text-neutral-500">Loading dashboard…</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-10">
                <div className="text-red-500">Failed to load dashboard data.</div>
            </div>
        );
    }

    const maxRevenue = Math.max(...data.revenueByMonth.map((m) => m.revenue), 1);
    const totalStatusCount = data.byStatus.reduce((sum, s) => sum + s.count, 0) || 1;

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
            <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <KPICard label="Total Orders" value={data.totalOrders.toLocaleString()} />
                <KPICard label="This Month" value={data.ordersThisMonth.toLocaleString()} />
                <KPICard label="Total Revenue" value={`$${(data.totalRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`} />
                <KPICard label="Revenue (Month)" value={`$${(data.revenueThisMonth / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`} />
                <KPICard label="Avg Turnaround" value={`${data.avgTurnaround} days`} />
                <KPICard label="Total Customers" value={data.totalCustomers.toLocaleString()} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders by Status */}
                <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-4">Orders by Status</h2>
                    <div className="space-y-3">
                        {data.byStatus
                            .sort((a, b) => b.count - a.count)
                            .map((s) => (
                                <div key={s.status} className="flex items-center gap-3">
                                    <div className="w-32 text-sm text-neutral-600 truncate">
                                        {STATUS_LABELS[s.status] || s.status}
                                    </div>
                                    <div className="flex-1 bg-neutral-100 rounded-full h-6 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${STATUS_COLORS[s.status] || "bg-neutral-400"}`}
                                            style={{ width: `${(s.count / totalStatusCount) * 100}%` }}
                                        />
                                    </div>
                                    <div className="w-10 text-sm font-semibold text-neutral-900 text-right">
                                        {s.count}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Revenue by Month */}
                <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-4">Revenue (Last 6 Months)</h2>
                    <div className="flex items-end gap-3 h-48">
                        {data.revenueByMonth.map((m) => (
                            <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full">
                                <div className="text-xs font-semibold text-neutral-700 mb-1">
                                    {m.revenue > 0 ? `$${(m.revenue / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "$0"}
                                </div>
                                <div
                                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all min-h-[4px]"
                                    style={{ height: `${Math.max((m.revenue / maxRevenue) * 100, 2)}%` }}
                                />
                                <div className="text-[10px] text-neutral-500 mt-2 text-center leading-tight">
                                    {m.month}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">{label}</div>
            <div className="text-xl font-bold text-neutral-900">{value}</div>
        </div>
    );
}
