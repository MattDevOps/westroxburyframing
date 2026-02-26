"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Shield, ChevronDown, Tag } from "lucide-react";

const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

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
  
  // Tag management state
  const [showTagManager, setShowTagManager] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [savingTag, setSavingTag] = useState(false);
  
  // Add customer state
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerFirstName, setNewCustomerFirstName] = useState("");
  const [newCustomerLastName, setNewCustomerLastName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerAddressLine1, setNewCustomerAddressLine1] = useState("");
  const [newCustomerAddressLine2, setNewCustomerAddressLine2] = useState("");
  const [newCustomerCity, setNewCustomerCity] = useState("");
  const [newCustomerState, setNewCustomerState] = useState("");
  const [newCustomerZip, setNewCustomerZip] = useState("");
  const [newCustomerPreferredContact, setNewCustomerPreferredContact] = useState<"email" | "call">("email");
  const [newCustomerMarketingOptIn, setNewCustomerMarketingOptIn] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);

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

  async function createTag() {
    if (!newTagName.trim()) {
      alert("Tag name is required");
      return;
    }

    setSavingTag(true);
    try {
      const res = await fetch("/staff/api/customer-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create tag");
      }

      setNewTagName("");
      setNewTagColor("#3b82f6");
      setShowCreateTag(false);
      await loadTags();
    } catch (e: any) {
      alert(e.message || "Failed to create tag");
    } finally {
      setSavingTag(false);
    }
  }

  async function updateTag(id: string, name: string, color: string | null) {
    setSavingTag(true);
    try {
      const res = await fetch(`/staff/api/customer-tags/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update tag");
      }

      setEditingTag(null);
      await loadTags();
    } catch (e: any) {
      alert(e.message || "Failed to update tag");
    } finally {
      setSavingTag(false);
    }
  }

  async function deleteTag(id: string) {
    if (!confirm("Are you sure you want to delete this tag? It will be removed from all customers.")) {
      return;
    }

    setSavingTag(true);
    try {
      const res = await fetch(`/staff/api/customer-tags/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete tag");
      }

      await loadTags();
      if (selectedTagId === id) {
        setSelectedTagId("");
      }
    } catch (e: any) {
      alert(e.message || "Failed to delete tag");
    } finally {
      setSavingTag(false);
    }
  }

  async function createCustomer() {
    if (!newCustomerFirstName.trim() || !newCustomerLastName.trim()) {
      setCustomerError("First and last name are required");
      return;
    }

    if (!newCustomerEmail.trim() && !newCustomerPhone.trim()) {
      setCustomerError("Email or phone is required");
      return;
    }

    setSavingCustomer(true);
    setCustomerError(null);

    try {
      const res = await fetch("/staff/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: newCustomerFirstName.trim(),
          last_name: newCustomerLastName.trim(),
          email: newCustomerEmail.trim() || null,
          phone: newCustomerPhone.trim() || null,
          address_line1: newCustomerAddressLine1.trim() || null,
          address_line2: newCustomerAddressLine2.trim() || null,
          city: newCustomerCity.trim() || null,
          state: newCustomerState.trim() || null,
          zip: newCustomerZip.trim() || null,
          preferred_contact: newCustomerPreferredContact,
          marketing_opt_in: newCustomerMarketingOptIn,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create customer");
      }

      // Reset form
      setNewCustomerFirstName("");
      setNewCustomerLastName("");
      setNewCustomerEmail("");
      setNewCustomerPhone("");
      setNewCustomerAddressLine1("");
      setNewCustomerAddressLine2("");
      setNewCustomerCity("");
      setNewCustomerState("");
      setNewCustomerZip("");
      setNewCustomerPreferredContact("email");
      setNewCustomerMarketingOptIn(false);
      setShowAddCustomer(false);

      // Reload customers list
      await load("");

      // Show success message
      if (data.existing) {
        alert(data.message || "Customer already exists and was updated");
      } else {
        alert("Customer created successfully!");
      }
    } catch (e: any) {
      setCustomerError(e.message || "Failed to create customer");
    } finally {
      setSavingCustomer(false);
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

          <button
            onClick={() => setShowAddCustomer(true)}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50"
            title="Add a new customer to the database"
          >
            + Add Customer
          </button>
          <a
            href="/staff/orders/new"
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm"
            title="Create a new order (customer created during order intake)"
          >
            New order
          </a>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-neutral-900">Add Customer</h2>
                <button
                  onClick={() => {
                    setShowAddCustomer(false);
                    setCustomerError(null);
                    setNewCustomerFirstName("");
                    setNewCustomerLastName("");
                    setNewCustomerEmail("");
                    setNewCustomerPhone("");
                    setNewCustomerAddressLine1("");
                    setNewCustomerAddressLine2("");
                    setNewCustomerCity("");
                    setNewCustomerState("");
                    setNewCustomerZip("");
                    setNewCustomerPreferredContact("email");
                    setNewCustomerMarketingOptIn(false);
                  }}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {customerError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {customerError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCustomerFirstName}
                  onChange={(e) => setNewCustomerFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCustomerLastName}
                  onChange={(e) => setNewCustomerLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Email <span className="text-neutral-400">(or phone required)</span>
                </label>
                <input
                  type="email"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Phone <span className="text-neutral-400">(or email required)</span>
                </label>
                <input
                  type="tel"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="e.g. 6175551234"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="pt-2 border-t border-neutral-200">
                <div className="text-xs font-medium text-neutral-700 mb-3">Address (Optional)</div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      value={newCustomerAddressLine1}
                      onChange={(e) => setNewCustomerAddressLine1(e.target.value)}
                      placeholder="Street address"
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={newCustomerAddressLine2}
                      onChange={(e) => setNewCustomerAddressLine2(e.target.value)}
                      placeholder="Apt, suite, unit, etc."
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={newCustomerCity}
                        onChange={(e) => setNewCustomerCity(e.target.value)}
                        placeholder="City"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={newCustomerState}
                        onChange={(e) => setNewCustomerState(e.target.value)}
                        placeholder="State"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={newCustomerZip}
                      onChange={(e) => setNewCustomerZip(e.target.value)}
                      placeholder="ZIP code"
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Preferred Contact
                </label>
                <select
                  value={newCustomerPreferredContact}
                  onChange={(e) => setNewCustomerPreferredContact(e.target.value as "email" | "call")}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="email">Email</option>
                  <option value="call">Phone Call</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={newCustomerMarketingOptIn}
                    onChange={(e) => setNewCustomerMarketingOptIn(e.target.checked)}
                    className="rounded text-black focus:ring-black"
                  />
                  Add to email list (marketing opt-in)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={createCustomer}
                  disabled={savingCustomer || !newCustomerFirstName.trim() || !newCustomerLastName.trim() || (!newCustomerEmail.trim() && !newCustomerPhone.trim())}
                  className="flex-1 rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingCustomer ? "Creating..." : "Create Customer"}
                </button>
                <button
                  onClick={() => {
                    setShowAddCustomer(false);
                    setCustomerError(null);
                    setNewCustomerFirstName("");
                    setNewCustomerLastName("");
                    setNewCustomerEmail("");
                    setNewCustomerPhone("");
                    setNewCustomerAddressLine1("");
                    setNewCustomerAddressLine2("");
                    setNewCustomerCity("");
                    setNewCustomerState("");
                    setNewCustomerZip("");
                    setNewCustomerPreferredContact("email");
                    setNewCustomerMarketingOptIn(false);
                  }}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        <button
          onClick={() => setShowTagManager(true)}
          className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm hover:bg-neutral-50"
          title="Manage tags"
        >
          Manage Tags
        </button>
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
                  {Boolean(c.marketingOptIn) ? "Yes" : "No"}
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Tag Management Modal */}
      {showTagManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-neutral-900">Manage Customer Tags</h2>
                <button
                  onClick={() => {
                    setShowTagManager(false);
                    setShowCreateTag(false);
                    setEditingTag(null);
                    setNewTagName("");
                  }}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Create new tag */}
              {showCreateTag ? (
                <div className="rounded-xl border border-neutral-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-4">Create New Tag</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">Tag Name</label>
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="e.g., VIP, Artist, Wholesale"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-2">Color</label>
                      <div className="flex gap-2 flex-wrap">
                        {DEFAULT_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewTagColor(color)}
                            className={`w-8 h-8 rounded-lg border-2 ${
                              newTagColor === color ? "border-neutral-900" : "border-neutral-300"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={createTag}
                        disabled={savingTag || !newTagName.trim()}
                        className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
                      >
                        {savingTag ? "Creating..." : "Create Tag"}
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateTag(false);
                          setNewTagName("");
                        }}
                        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateTag(true)}
                  className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800 flex items-center gap-2"
                >
                  <Tag size={16} />
                  Create New Tag
                </button>
              )}

              {/* Tags list */}
              {tags.length === 0 ? (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center">
                  <p className="text-neutral-600 text-sm mb-4">No tags yet</p>
                  <button
                    onClick={() => setShowCreateTag(true)}
                    className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
                  >
                    Create your first tag
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
                  <div className="divide-y divide-neutral-200">
                    {tags.map((tag) => (
                      <div key={tag.id} className="p-4 hover:bg-neutral-50">
                        {editingTag === tag.id ? (
                          <TagEditorInline
                            tag={tag}
                            onSave={(name, color) => updateTag(tag.id, name, color)}
                            onCancel={() => setEditingTag(null)}
                            saving={savingTag}
                          />
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block w-4 h-4 rounded-full"
                                style={{ backgroundColor: tag.color || "#6b7280" }}
                              />
                              <span className="font-medium text-neutral-900 text-sm">{tag.name}</span>
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={() => setEditingTag(tag.id)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteTag(tag.id)}
                                disabled={savingTag}
                                className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TagEditorInline({
  tag,
  onSave,
  onCancel,
  saving,
}: {
  tag: { id: string; name: string; color: string | null };
  onSave: (name: string, color: string | null) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color || DEFAULT_COLORS[0]);

  return (
    <div className="space-y-3">
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          autoFocus
        />
      </div>
      <div>
        <div className="text-xs text-neutral-600 mb-2">Color</div>
        <div className="flex gap-2 flex-wrap">
          {DEFAULT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded border-2 ${color === c ? "border-neutral-900" : "border-neutral-300"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(name, color)}
          disabled={saving || !name.trim()}
          className="rounded-lg bg-black text-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
