"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";

interface Appointment {
  id: string;
  provider: string;
  externalEventId: string;
  name: string;
  email: string;
  phone: string;
  startTime: string;
  endTime: string;
  notes: string;
  customerId: string | null;
  customerName: string | null;
  createdAt: string;
}

type ViewMode = "upcoming" | "today" | "week" | "all";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("upcoming");
  const [searchQ, setSearchQ] = useState("");

  const getDateRange = useCallback(
    (mode: ViewMode): { from?: string; to?: string } => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (mode) {
        case "today":
          return {
            from: today.toISOString(),
            to: new Date(
              today.getTime() + 24 * 60 * 60 * 1000 - 1
            ).toISOString(),
          };
        case "week": {
          const endOfWeek = new Date(
            today.getTime() + 7 * 24 * 60 * 60 * 1000
          );
          return {
            from: today.toISOString(),
            to: endOfWeek.toISOString(),
          };
        }
        case "upcoming":
          return { from: today.toISOString() };
        case "all":
          return {};
      }
    },
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const range = getDateRange(viewMode);
      if (range.from) params.set("from", range.from);
      if (range.to) params.set("to", range.to);
      if (searchQ.trim()) params.set("q", searchQ.trim());

      const res = await fetch(
        `/staff/api/appointments?${params.toString()}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load appointments");
        return;
      }
      setAppointments(data.appointments || []);
    } catch (e: any) {
      setError(e?.message || "Error loading appointments");
    } finally {
      setLoading(false);
    }
  }, [viewMode, searchQ, getDateRange]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  // Group appointments by date
  const groupedByDate = useMemo(() => {
    const groups = new Map<string, Appointment[]>();
    for (const apt of appointments) {
      const dateKey = new Date(apt.startTime).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      if (!groups.has(dateKey)) groups.set(dateKey, []);
      groups.get(dateKey)!.push(apt);
    }
    return groups;
  }, [appointments]);

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-neutral-900">Appointments</h1>
        <button
          onClick={load}
          className="text-sm rounded-xl border border-neutral-300 px-3 py-2 text-neutral-600 hover:bg-neutral-100"
        >
          Refresh
        </button>
      </div>

      {/* View mode tabs */}
      <div className="flex flex-wrap gap-2">
        {(["today", "upcoming", "week", "all"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
              viewMode === mode
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
            }`}
          >
            {mode === "today"
              ? "Today"
              : mode === "upcoming"
                ? "Upcoming"
                : mode === "week"
                  ? "This Week"
                  : "All"}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, email, or phone…"
        value={searchQ}
        onChange={(e) => setSearchQ(e.target.value)}
        className="w-full max-w-md rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none"
      />

      {error && (
        <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
          {error}
        </div>
      )}

      {loading && (
        <p className="text-neutral-500 text-sm">Loading appointments…</p>
      )}

      {!loading && appointments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-neutral-500 text-lg">No appointments found.</p>
          <p className="text-neutral-400 text-sm mt-1">
            {viewMode === "today"
              ? "No appointments scheduled for today."
              : "Appointments booked through Cal.com will appear here."}
          </p>
        </div>
      )}

      {/* Appointment list grouped by date */}
      {!loading && appointments.length > 0 && (
        <div className="space-y-6">
          {Array.from(groupedByDate.entries()).map(([dateLabel, apts]) => (
            <div key={dateLabel}>
              <h2
                className={`text-sm font-semibold uppercase tracking-wide mb-3 ${
                  dateLabel === todayStr
                    ? "text-blue-600"
                    : "text-neutral-500"
                }`}
              >
                {dateLabel === todayStr ? "📅 Today" : dateLabel}
                <span className="ml-2 font-normal">({apts.length})</span>
              </h2>

              <div className="space-y-3">
                {apts.map((apt) => {
                  const start = new Date(apt.startTime);
                  const end = new Date(apt.endTime);
                  const isPast = end < new Date();
                  const timeStr = `${start.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })} – ${end.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}`;

                  return (
                    <div
                      key={apt.id}
                      className={`rounded-2xl border bg-white p-5 ${
                        isPast
                          ? "border-neutral-200 opacity-60"
                          : "border-neutral-200 hover:border-neutral-300"
                      } transition-colors`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-neutral-900">
                              {apt.name}
                            </span>
                            {isPast && (
                              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 font-medium">
                                Past
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-neutral-600">
                            <span className="font-medium text-blue-700">
                              🕐 {timeStr}
                            </span>
                            {apt.email && (
                              <a
                                href={`mailto:${apt.email}`}
                                className="hover:underline"
                              >
                                📧 {apt.email}
                              </a>
                            )}
                            {apt.phone && (
                              <a
                                href={`tel:${apt.phone}`}
                                className="hover:underline"
                              >
                                📱 {apt.phone}
                              </a>
                            )}
                          </div>
                          {apt.notes && (
                            <p className="text-sm text-neutral-500 mt-1 italic">
                              &quot;{apt.notes}&quot;
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {apt.customerId ? (
                            <Link
                              href={`/staff/customers/${apt.customerId}`}
                              className="text-xs rounded-xl border border-blue-200 bg-blue-50 text-blue-700 px-3 py-1.5 hover:bg-blue-100"
                            >
                              View Customer
                            </Link>
                          ) : (
                            <Link
                              href={`/staff/orders/new?name=${encodeURIComponent(apt.name)}&email=${encodeURIComponent(apt.email)}&phone=${encodeURIComponent(apt.phone)}`}
                              className="text-xs rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-1.5 hover:bg-emerald-100"
                            >
                              + Create Order
                            </Link>
                          )}
                          <span className="text-[10px] text-neutral-400 uppercase">
                            {apt.provider}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
