"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type CatalogItem = {
  id: string;
  itemNumber: string;
  description: string | null;
  category: string;
  unitType: string;
  costPerUnit: number;
  retailPerUnit: number | null;
  vendor: {
    id: string;
    name: string;
    code: string;
  };
};

export default function QuickPriceCheckPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    if (!searchQuery.trim() && !category) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (category) params.set("category", category);

      const res = await fetch(`/staff/api/pricing/quick-price-check?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to search");
      }

      const data = await res.json();
      setItems(data.items || []);
    } catch (e: any) {
      setError(e.message || "Failed to search");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, category]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, searchQuery, category]);

  function formatPrice(price: number | null): string {
    if (price === null || price === undefined) return "—";
    return `$${Number(price).toFixed(2)}`;
  }

  function formatUnitType(unitType: string): string {
    const unitMap: Record<string, string> = {
      foot: "per foot",
      sqft: "per sq ft",
      sheet: "per sheet",
      each: "each",
    };
    return unitMap[unitType] || unitType;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href="/staff/pricing" className="text-sm text-neutral-600 hover:text-neutral-900">
          ← Back to Pricing
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900 mt-2">Quick Price Check</h1>
        <p className="text-neutral-600 text-sm mt-1">
          Instantly look up retail prices for moulding and other catalog items
        </p>
      </div>

      {/* Search Form */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-700">Search</label>
            <input
              type="text"
              className="w-full rounded-xl border border-neutral-300 p-3 text-sm"
              placeholder="Item number or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-700">Category (optional)</label>
            <select
              className="w-full rounded-xl border border-neutral-300 p-3 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              <option value="moulding">Moulding</option>
              <option value="matboard">Matboard</option>
              <option value="glass">Glass</option>
              <option value="mounting">Mounting</option>
              <option value="hardware">Hardware</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <div className="text-neutral-600">Searching...</div>
        </div>
      )}

      {!loading && !error && items.length === 0 && (searchQuery || category) && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <p className="text-neutral-600">No items found</p>
          <p className="text-sm text-neutral-500 mt-1">Try adjusting your search terms</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-3">
            <div className="text-sm font-semibold text-neutral-700">
              Found {items.length} item{items.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                    Vendor
                  </th>
                  <th className="text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                    Item Number
                  </th>
                  <th className="text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                    Description
                  </th>
                  <th className="text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                    Category
                  </th>
                  <th className="text-right text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                    Retail Price
                  </th>
                  <th className="text-right text-xs font-semibold text-neutral-700 uppercase tracking-wide px-6 py-3">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900">{item.vendor.name}</div>
                      <div className="text-xs text-neutral-500 font-mono">{item.vendor.code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium text-neutral-900">
                        {item.itemNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {item.description || <span className="text-neutral-400">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-800 capitalize">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-semibold text-neutral-900">
                        {formatPrice(item.retailPerUnit)}
                      </div>
                      <div className="text-xs text-neutral-500">{formatUnitType(item.unitType)}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-neutral-600">
                      {formatPrice(item.costPerUnit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && !searchQuery && !category && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <p className="text-neutral-600 mb-2">Start typing to search for items</p>
          <p className="text-sm text-neutral-500">
            Search by item number, description, or filter by category
          </p>
        </div>
      )}
    </div>
  );
}
