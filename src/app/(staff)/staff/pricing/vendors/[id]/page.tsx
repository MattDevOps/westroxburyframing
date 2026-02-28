"use client";

import { useState, useEffect, use } from "react";
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
};

type CatalogItem = {
  id: string;
  itemNumber: string;
  description: string | null;
  category: string;
  unitType: string;
  costPerUnit: number;
  retailPerUnit: number | null;
  discontinued: boolean;
};

export default function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isAdmin } = useUserRole();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [itemNumber, setItemNumber] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("moulding");
  const [unitType, setUnitType] = useState("foot");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [retailPerUnit, setRetailPerUnit] = useState("");
  const [discontinued, setDiscontinued] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vendorRes, itemsRes] = await Promise.all([
        fetch(`/staff/api/vendors/${id}`),
        fetch(`/staff/api/vendors/${id}/catalog`),
      ]);

      if (!vendorRes.ok) throw new Error("Failed to load vendor");
      if (!itemsRes.ok) throw new Error("Failed to load catalog items");

      const vendorData = await vendorRes.json();
      const itemsData = await itemsRes.json();

      setVendor(vendorData.vendor);
      setItems(itemsData.items || []);
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  function openCreate() {
    setEditingItem(null);
    setItemNumber("");
    setDescription("");
    setCategory("moulding");
    setUnitType("foot");
    setCostPerUnit("");
    setRetailPerUnit("");
    setDiscontinued(false);
    setSaveError(null);
    setShowModal(true);
  }

  function openEdit(item: CatalogItem) {
    setEditingItem(item);
    setItemNumber(item.itemNumber);
    setDescription(item.description || "");
    setCategory(item.category);
    setUnitType(item.unitType);
    setCostPerUnit(item.costPerUnit.toString());
    setRetailPerUnit(item.retailPerUnit?.toString() || "");
    setDiscontinued(item.discontinued);
    setSaveError(null);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    try {
      const url = editingItem
        ? `/staff/api/vendors/catalog/${editingItem.id}`
        : `/staff/api/vendors/${id}/catalog`;
      const method = editingItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemNumber,
          description: description || null,
          category,
          unitType,
          costPerUnit: parseFloat(costPerUnit),
          retailPerUnit: retailPerUnit ? parseFloat(retailPerUnit) : null,
          discontinued,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save catalog item");

      setShowModal(false);
      load();
    } catch (e: any) {
      setSaveError(e.message || "Failed to save catalog item");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: CatalogItem) {
    if (!confirm(`Delete catalog item "${item.itemNumber}"?`)) return;

    try {
      const res = await fetch(`/staff/api/vendors/catalog/${item.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete item");
      }
      load();
    } catch (e: any) {
      alert(e.message || "Failed to delete item");
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="p-6">
        <div className="text-red-600">{error || "Vendor not found"}</div>
        <Link href="/staff/pricing/vendors" className="text-sm text-neutral-600 hover:text-neutral-900 mt-2 inline-block">
          ← Back to Vendors
        </Link>
      </div>
    );
  }

  const categories = ["moulding", "matboard", "glass", "mounting", "hardware", "backing", "other"];
  const unitTypes = ["foot", "sheet", "sqft", "each"];

  return (
    <div className="p-6 space-y-4">
      <div>
        <Link href="/staff/pricing/vendors" className="text-sm text-neutral-600 hover:text-neutral-900">
          ← Back to Vendors
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900 mt-2">{vendor.name}</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Code: <span className="font-mono">{vendor.code}</span>
          {vendor.email && ` • ${vendor.email}`}
          {vendor.phone && ` • ${vendor.phone}`}
        </p>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">Catalog Items</h2>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="rounded-xl border-2 border-blue-600 text-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-50"
            >
              📥 Import Prices
            </button>
            <button
              onClick={openCreate}
              className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
            >
              + Add Item
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <p className="text-neutral-600 mb-4">No catalog items yet</p>
          <button
            onClick={openCreate}
            className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
          >
            Add your first item
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                  Item #
                </th>
                <th className="text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                  Description
                </th>
                <th className="text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                  Category
                </th>
                <th className="text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                  Unit
                </th>
                <th className="text-right text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                  Cost
                </th>
                <th className="text-right text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                  Retail
                </th>
                <th className="text-right text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-neutral-50 ${item.discontinued ? "opacity-50" : ""}`}
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-medium text-neutral-900">{item.itemNumber}</span>
                    {item.discontinued && (
                      <span className="ml-2 text-xs text-red-600">(Discontinued)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-900">{item.description || "—"}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600 capitalize">{item.category}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{item.unitType}</td>
                  <td className="px-6 py-4 text-sm text-neutral-900 text-right">
                    ${item.costPerUnit.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-900 text-right">
                    {item.retailPerUnit ? `$${item.retailPerUnit.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openEdit(item)}
                            className="text-sm text-neutral-600 hover:text-neutral-900 px-2 py-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
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
              {editingItem ? "Edit Catalog Item" : "Add Catalog Item"}
            </h2>

            {saveError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {saveError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700">Item Number *</label>
              <input
                className="w-full rounded-xl border p-3 text-sm font-mono"
                value={itemNumber}
                onChange={(e) => setItemNumber(e.target.value)}
                required
                disabled={!!editingItem}
              />
              {editingItem && (
                <p className="text-xs text-neutral-500">Item number cannot be changed after creation</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700">Description</label>
              <input
                className="w-full rounded-xl border p-3 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Category *</label>
                <select
                  className="w-full rounded-xl border p-3 text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Unit Type *</label>
                <select
                  className="w-full rounded-xl border p-3 text-sm"
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value)}
                  required
                >
                  {unitTypes.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Cost Per Unit *</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-xl border p-3 text-sm"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Retail Per Unit</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-xl border p-3 text-sm"
                  value={retailPerUnit}
                  onChange={(e) => setRetailPerUnit(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="discontinued"
                checked={discontinued}
                onChange={(e) => setDiscontinued(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="discontinued" className="text-sm text-neutral-700">
                Discontinued
              </label>
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
                {saving ? "Saving..." : editingItem ? "Save Changes" : "Create Item"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
