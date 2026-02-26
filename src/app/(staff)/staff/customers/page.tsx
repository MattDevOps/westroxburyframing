"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Shield, ChevronDown } from "lucide-react";

type Customer = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  preferredContact?: "email" | "call" | null;
  marketingOptIn?: boolean | null;
  createdAt?: string;
  _count?: { orders: number };
};

type Backup = {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
};

export default function CustomersPage() {
  const [q, setQ] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [tags, setTags] = useState<Array<{ id: string; name: string; color: string | null }>>([]);
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Export / backup state
  const [showActions, setShowActions] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [showBackups, setShowBackups] = useState(false);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);

  async function load(search?: string) {
    setLoading(true);
    setErr(null);

    const query = (search ?? q).trim();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedTagId) params.set("tagId", selectedTagId);

    try {
      const res = await fetch(`/staff/api/customers?${params.toString()}`, {
        cache: "no-store",
        credentials: "same-origin",
      });

      const raw = await res.text();

      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {}

      if (!res.ok) {
        const msg =
          data?.error ||
          (raw?.slice?.(0, 300) || "") ||
          `Request failed (${res.status})`;
        throw new Error(`[${res.status}] ${msg}`);
      }

      setRows(data?.customers || []);
    } catch (e: any) {
      setErr(e?.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTags();
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTagId]);

  async function loadTags() {
    try {
      const res = await fetch("/staff/api/customer-tags");
      if (res.ok) {
        const data = await res.json();
        setTags(data.tags || []);
      }
    } catch (e) {
      // Ignore
    }
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((c) => {
      const name = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase();
      const email = (c.email || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      return name.includes(needle) || email.includes(needle) || phone.includes(needle);
    });
  }, [q, rows]);

  async function handleBackup() {
    setBackingUp(true);
    setBackupMsg(null);
    try {
      const res = await fetch("/staff/api/customers/backup", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setBackupMsg(`Backup complete — ${data.backup.customerCount} customers saved.`);
      } else {
        setBackupMsg(`Backup failed: ${data.error || "Unknown error"}`);
      }
    } catch {
      setBackupMsg("Backup failed: network error.");
    } finally {
      setBackingUp(false);
    }
  }

  async function loadBackups() {
    setShowBackups(!showBackups);
    if (showBackups) return; // toggling off
    setLoadingBackups(true);
    try {
      const res = await fetch("/staff/api/customers/backup");
      const data = await res.json();
      setBackups(data.backups || []);
    } catch {
      setBackups([]);
    } finally {
      setLoadingBackups(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-neutral-600 text-sm mt-1">
            {rows.length > 0 && !loading ? `${rows.length} customers` : "Search and manage customer records."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export / Backup dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50"
            >
              <Download size={14} />
              Export
              <ChevronDown size={14} className={showActions ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>

            {showActions && (
              <div className="absolute right-0 mt-1 w-56 bg-white border border-neutral-200 rounded-xl shadow-lg z-20 py-1">
                <a
                  href="/staff/api/customers/export?format=csv"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-neutral-50 w-full"
                  onClick={() => setShowActions(false)}
                >
                  <FileText size={14} className="text-green-600" />
                  Download CSV
                </a>
                <a
                  href="/staff/api/customers/export?format=json"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-neutral-50 w-full"
                  onClick={() => setShowActions(false)}
                >
                  <FileText size={14} className="text-blue-600" />
                  Download JSON
                </a>
                <a
                  href="/staff/api/customers/export/pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-neutral-50 w-full"
                  onClick={() => setShowActions(false)}
                >
                  <FileText size={14} className="text-red-600" />
                  Print / Save as PDF
                </a>
                <div className="border-t border-neutral-200 my-1" />
                <button
                  onClick={() => { handleBackup(); setShowActions(false); }}
                  disabled={backingUp}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-neutral-50 w-full text-left"
                >
                  <Shield size={14} className="text-indigo-600" />
                  {backingUp ? "Backing up…" : "Backup Now"}
                </button>
                <button
                  onClick={() => { loadBackups(); setShowActions(false); }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-neutral-50 w-full text-left"
                >
                  <Shield size={14} className="text-neutral-500" />
                  View Past Backups
                </button>
              </div>
            )}
          </div>

          <a
            href="/staff/orders/new"
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm"
            title="Create a new order (customer created during order intake)"
          >
            New order
          </a>
        </div>
      </div>

      {/* Backup status message */}
      {backupMsg && (
        <div className={`rounded-xl border px-4 py-2.5 text-sm ${backupMsg.includes("failed") ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>
          {backupMsg}
          <button onClick={() => setBackupMsg(null)} className="ml-2 underline text-xs">dismiss</button>
        </div>
      )}

      {/* Past backups panel */}
      {showBackups && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Past Backups</h3>
            <button onClick={() => setShowBackups(false)} className="text-xs text-neutral-500 hover:text-neutral-700">Close</button>
          </div>
          {loadingBackups ? (
            <p className="text-sm text-neutral-500">Loading…</p>
          ) : backups.length === 0 ? (
            <p className="text-sm text-neutral-500">No backups found. Click &ldquo;Backup Now&rdquo; to create one.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {backups.map((b) => (
                <a
                  key={b.pathname}
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-sm hover:bg-white rounded px-2 py-1.5"
                >
                  <span className="text-neutral-700 truncate">
                    {new Date(b.uploadedAt).toLocaleString()}
                    {b.pathname.includes("-auto") && (
                      <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">auto</span>
                    )}
                  </span>
                  <span className="text-xs text-neutral-400">{(b.size / 1024).toFixed(1)} KB</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, phone…"
          className="flex-1 max-w-lg rounded-xl border border-neutral-300 bg-white/5 px-4 py-3 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") load(q);
          }}
        />
        <select
          value={selectedTagId}
          onChange={(e) => setSelectedTagId(e.target.value)}
          className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm"
        >
          <option value="">All Tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
        <button onClick={() => load(q)} className="rounded-xl bg-black text-white px-4 py-3 text-sm">
          Search
        </button>
        <button
          onClick={() => {
            setQ("");
            setSelectedTagId("");
            load("");
          }}
          className="rounded-xl border border-neutral-300 px-4 py-3 text-sm"
          title="Clear search and reload all customers"
        >
          Clear
        </button>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 whitespace-pre-wrap">
          {err}
        </div>
      ) : null}

      <div className="rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 bg-neutral-50 px-4 py-3 text-xs font-medium text-neutral-600">
          <div className="col-span-2">Customer</div>
          <div className="col-span-2">Email</div>
          <div className="col-span-2">Phone</div>
          <div className="col-span-1">Orders</div>
          <div className="col-span-2">Tags</div>
          <div className="col-span-2">Preferred</div>
          <div className="col-span-1 text-right">Opt-in</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-neutral-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-sm text-neutral-500">No customers found.</div>
        ) : (
          filtered.map((c) => {
            const name = `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Unnamed";
            const orderCount = c._count?.orders ?? 0;
            return (
              <Link
                key={c.id}
                href={`/staff/customers/${c.id}`}
                className="grid grid-cols-12 gap-3 px-4 py-3 text-sm border-t border-neutral-200 hover:bg-neutral-50"
              >
                <div className="col-span-2 font-medium">{name}</div>
                <div className="col-span-2 text-neutral-600">{c.email || "—"}</div>
                <div className="col-span-2 text-neutral-600">{c.phone || "—"}</div>
                <div className="col-span-1 text-neutral-600">{orderCount}</div>
                <div className="col-span-2">
                  <div className="flex flex-wrap gap-1">
                    {(c as any).tagAssignments?.slice(0, 2).map((assignment: any) => (
                      <span
                        key={assignment.tag.id}
                        className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium border"
                        style={{
                          backgroundColor: assignment.tag.color ? `${assignment.tag.color}20` : "#f3f4f6",
                          borderColor: assignment.tag.color || "#d1d5db",
                          color: assignment.tag.color || "#374151",
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: assignment.tag.color || "#6b7280" }}
                        />
                        {assignment.tag.name}
                      </span>
                    ))}
                    {(c as any).tagAssignments?.length > 2 && (
                      <span className="text-xs text-neutral-500">
                        +{((c as any).tagAssignments?.length || 0) - 2}
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-span-2 text-neutral-600">
                  {c.preferredContact === "call" ? "Call" : "Email"}
                </div>
                <div className="col-span-1 text-right text-neutral-600">
                  {c.marketingOptIn ? "Yes" : "No"}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
