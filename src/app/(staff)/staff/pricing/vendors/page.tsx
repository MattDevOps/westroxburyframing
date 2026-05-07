"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useUserRole } from "@/hooks/useUserRole";

type Vendor = {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  notes: string | null;
  catalogItems: Array<{ id: string; itemNumber: string; description: string | null; category: string }>;
};

export default function VendorsPage() {
  const { isAdmin } = useUserRole();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/staff/api/vendors");
      if (!res.ok) throw new Error("Failed to load vendors");
      const data = await res.json();
      setVendors(data.vendors || []);
    } catch (e: any) {
      setError(e.message || "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingVendor(null);
    setName("");
    setCode("");
    setPhone("");
    setEmail("");
    setWebsite("");
    setNotes("");
    setSaveError(null);
    setShowModal(true);
  }

  function openEdit(vendor: Vendor) {
    setEditingVendor(vendor);
    setName(vendor.name);
    setCode(vendor.code);
    setPhone(vendor.phone || "");
    setEmail(vendor.email || "");
    setWebsite(vendor.website || "");
    setNotes(vendor.notes || "");
    setSaveError(null);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    try {
      const url = editingVendor ? `/staff/api/vendors/${editingVendor.id}` : "/staff/api/vendors";
      const method = editingVendor ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code,
          phone: phone || null,
          email: email || null,
          website: website || null,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save vendor");

      setShowModal(false);
      load();
    } catch (e: any) {
      setSaveError(e.message || "Failed to save vendor");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(vendor: Vendor) {
    if (!confirm(`Delete vendor "${vendor.name}"? This will also delete all catalog items.`)) return;

    try {
      const res = await fetch(`/staff/api/vendors/${vendor.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete vendor");
      }
      load();
    } catch (e: any) {
      alert(e.message || "Failed to delete vendor");
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-neutral-600">Loading vendors...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/staff/pricing" className="text-sm text-neutral-600 hover:text-neutral-900">
            ← Back to Pricing
          </Link>
          <h1 className="text-2xl font-semibold text-neutral-900 mt-2">Vendors</h1>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
          >
            + Add Vendor
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {vendors.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <p className="text-neutral-600 mb-4">No vendors yet</p>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
            >
              Add your first vendor
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                  Code
                </th>
                <th className="text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                  Contact
                </th>
                <th className="text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                  Items
                </th>
                <th className="text-right text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-medium text-neutral-900">{vendor.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-neutral-900">{vendor.name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {vendor.email && <div>{vendor.email}</div>}
                    {vendor.phone && <div>{vendor.phone}</div>}
                    {!vendor.email && !vendor.phone && <span className="text-neutral-400">—</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {vendor.catalogItems.length} item{vendor.catalogItems.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/staff/pricing/vendors/${vendor.id}`}
                        className="text-sm text-neutral-600 hover:text-neutral-900 px-2 py-1"
                      >
                        View
                      </Link>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openEdit(vendor)}
                            className="text-sm text-neutral-600 hover:text-neutral-900 px-2 py-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(vendor)}
                            className="text-sm text-red-600 hover:text-red-800 px-2 py-1"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-bold text-neutral-900">
              {editingVendor ? "Edit Vendor" : "Add Vendor"}
            </h2>

            {saveError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {saveError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700">Name *</label>
              <input
                className="w-full rounded-xl border p-3 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700">Code *</label>
              <input
                className="w-full rounded-xl border p-3 text-sm font-mono"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. LJ, ROMA"
                required
                disabled={!!editingVendor}
              />
              {editingVendor && (
                <p className="text-xs text-neutral-500">Code cannot be changed after creation</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Phone</label>
                <input
                  type="tel"
                  className="w-full rounded-xl border p-3 text-sm"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Email</label>
                <input
                  type="email"
                  className="w-full rounded-xl border p-3 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700">Website</label>
              <input
                type="url"
                className="w-full rounded-xl border p-3 text-sm"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700">Notes</label>
              <textarea
                className="w-full rounded-xl border p-3 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? "Saving..." : editingVendor ? "Save Changes" : "Create Vendor"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
