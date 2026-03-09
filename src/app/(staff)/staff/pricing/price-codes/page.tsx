"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type PriceCode = {
  id: string;
  code: string;
  name: string;
  category: string;
  formula: string;
  baseRate: number;
  minCharge: number;
  wastePercent: number;
  multiplier: number;
  notes: string | null;
  active: boolean;
};

export default function PriceCodesPage() {
  const [priceCodes, setPriceCodes] = useState<PriceCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState<PriceCode | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("moulding");
  const [formula, setFormula] = useState("per_foot");
  const [baseRate, setBaseRate] = useState("");
  const [minCharge, setMinCharge] = useState("0");
  const [wastePercent, setWastePercent] = useState("0");
  const [multiplier, setMultiplier] = useState("1");
  const [notes, setNotes] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filterCategory ? `/staff/api/price-codes?category=${filterCategory}` : "/staff/api/price-codes";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load price codes");
      const data = await res.json();
      setPriceCodes(data.priceCodes || []);
    } catch (e: any) {
      setError(e.message || "Failed to load price codes");
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingCode(null);
    setCode("");
    setName("");
    setCategory("moulding");
    setFormula("per_foot");
    setBaseRate("");
    setMinCharge("0");
    setWastePercent("0");
    setMultiplier("1");
    setNotes("");
    setActive(true);
    setSaveError(null);
    setShowModal(true);
  }

  function openEdit(pc: PriceCode) {
    setEditingCode(pc);
    setCode(pc.code);
    setName(pc.name);
    setCategory(pc.category);
    setFormula(pc.formula);
    setBaseRate(pc.baseRate.toString());
    setMinCharge(pc.minCharge.toString());
    setWastePercent(pc.wastePercent.toString());
    setMultiplier(pc.multiplier.toString());
    setNotes(pc.notes || "");
    setActive(pc.active);
    setSaveError(null);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    try {
      const url = editingCode ? `/staff/api/price-codes/${editingCode.id}` : "/staff/api/price-codes";
      const method = editingCode ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name,
          category,
          formula,
          baseRate: parseFloat(baseRate),
          minCharge: parseFloat(minCharge),
          wastePercent: parseFloat(wastePercent),
          multiplier: parseFloat(multiplier),
          notes: notes || null,
          active,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save price code");

      setShowModal(false);
      load();
    } catch (e: any) {
      setSaveError(e.message || "Failed to save price code");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(pc: PriceCode) {
    if (!confirm(`Delete price code "${pc.code}"?`)) return;

    try {
      const res = await fetch(`/staff/api/price-codes/${pc.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete price code");
      }
      load();
    } catch (e: any) {
      alert(e.message || "Failed to delete price code");
    }
  }

  const categories = ["moulding", "mat", "glass", "mounting", "labor", "extra", "hardware", "fitting"];
  const formulas = [
    { value: "per_foot", label: "Per Foot" },
    { value: "per_sqft", label: "Per Square Foot" },
    { value: "per_sheet", label: "Per Sheet" },
    { value: "per_inch", label: "Per Inch" },
    { value: "fixed", label: "Fixed Price" },
  ];

  const filtered = filterCategory
    ? priceCodes.filter((pc) => pc.category === filterCategory)
    : priceCodes;

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-neutral-600">Loading price codes...</div>
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
          <h1 className="text-2xl font-semibold text-neutral-900 mt-2">Price Codes</h1>
        </div>
        <button
          onClick={openCreate}
          className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
        >
          + Add Price Code
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-neutral-700">Filter by category:</label>
        <select
          className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <p className="text-neutral-600 mb-4">No price codes yet</p>
          <button
            onClick={openCreate}
            className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
          >
            Add your first price code
          </button>
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
                  Category
                </th>
                <th className="text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                  Formula
                </th>
                <th className="text-right text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                  Base Rate
                </th>
                <th className="text-right text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                  Status
                </th>
                <th className="text-right text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filtered.map((pc) => (
                <tr key={pc.id} className={`hover:bg-neutral-50 ${!pc.active ? "opacity-50" : ""}`}>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-medium text-neutral-900">{pc.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-neutral-900">{pc.name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600 capitalize">{pc.category}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {formulas.find((f) => f.value === pc.formula)?.label || pc.formula}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-900 text-right">
                    ${pc.baseRate.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        pc.active
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                      }`}
                    >
                      {pc.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(pc)}
                        className="text-sm text-neutral-600 hover:text-neutral-900 px-2 py-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(pc)}
                        className="text-sm text-red-600 hover:text-red-800 px-2 py-1"
                      >
                        Delete
                      </button>
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
              {editingCode ? "Edit Price Code" : "Add Price Code"}
            </h2>

            {saveError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {saveError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Code *</label>
                <input
                  className="w-full rounded-xl border p-3 text-sm font-mono"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  disabled={!!editingCode}
                />
                {editingCode && (
                  <p className="text-xs text-neutral-500">Code cannot be changed after creation</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Name *</label>
                <input
                  className="w-full rounded-xl border p-3 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
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
                <label className="text-sm font-medium text-neutral-700">Formula *</label>
                <select
                  className="w-full rounded-xl border p-3 text-sm"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  required
                >
                  {formulas.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700">Base Rate *</label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-xl border p-3 text-sm"
                value={baseRate}
                onChange={(e) => setBaseRate(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Min Charge</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-xl border p-3 text-sm"
                  value={minCharge}
                  onChange={(e) => setMinCharge(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Waste %</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full rounded-xl border p-3 text-sm"
                  value={wastePercent}
                  onChange={(e) => setWastePercent(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Multiplier</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-xl border p-3 text-sm"
                  value={multiplier}
                  onChange={(e) => setMultiplier(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700">Notes</label>
              <textarea
                className="w-full rounded-xl border p-3 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="active" className="text-sm text-neutral-700">
                Active
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
                {saving ? "Saving..." : editingCode ? "Save Changes" : "Create Price Code"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
