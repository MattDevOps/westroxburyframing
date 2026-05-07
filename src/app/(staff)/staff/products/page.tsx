"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import BarcodeScanner from "@/components/BarcodeScanner";

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  type: string;
  cost: number;
  retailPrice: number;
  quantityOnHand: number;
  reorderPoint: number;
  imageUrl: string | null;
  barcode: string | null;
  published: boolean;
  artist: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [searchQuery, categoryFilter, typeFilter, showLowStock]);

  async function loadProducts() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (categoryFilter) params.set("category", categoryFilter);
      if (typeFilter) params.set("type", typeFilter);
      if (showLowStock) params.set("lowStock", "true");

      const res = await fetch(`/staff/api/products?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to load products");
      }
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e: any) {
      console.error("Error loading products:", e);
      setError(e.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  const categories = Array.from(new Set(products.map((p) => p.category))).sort();
  const lowStockCount = products.filter(
    (p) => Number(p.quantityOnHand) <= Number(p.reorderPoint)
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          href="/staff/products/new"
          className="rounded-xl bg-black px-4 py-2 text-white hover:bg-neutral-800"
        >
          + Add Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-500 mb-1">Total Products</div>
          <div className="text-2xl font-bold">{products.length}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-500 mb-1">Low Stock</div>
          <div className="text-2xl font-bold text-amber-600">{lowStockCount}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-500 mb-1">Total Value</div>
          <div className="text-2xl font-bold">
            $
            {(
              products.reduce((sum, p) => sum + (p.retailPrice * Number(p.quantityOnHand)) / 100, 0)
            ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Barcode Scanner */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-700 mb-3">Barcode Scanner</h2>
        <BarcodeScanner />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search by SKU, name, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:col-span-2 rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="retail">Retail</option>
            <option value="consignment">Consignment</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="lowStock"
            checked={showLowStock}
            onChange={(e) => setShowLowStock(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="lowStock" className="text-sm text-neutral-700">
            Show low stock only
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-semibold mb-1">Error loading products</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className="text-center py-10 text-neutral-500">Loading...</div>
      ) : error ? null : products.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">
          <p className="text-lg mb-2">No products found</p>
          <p className="text-sm">Add your first product to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => {
            const isLowStock = Number(product.quantityOnHand) <= Number(product.reorderPoint);
            return (
              <Link
                key={product.id}
                href={`/staff/products/${product.id}`}
                className="rounded-xl border border-neutral-200 bg-white overflow-hidden hover:shadow-lg transition-shadow"
              >
                {product.imageUrl && (
                  <div className="relative w-full h-48 bg-neutral-100">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-neutral-900 truncate">{product.name}</div>
                      <div className="text-xs text-neutral-500 font-mono">{product.sku}</div>
                    </div>
                    {!product.published && (
                      <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-xs shrink-0 ml-2">
                        Draft
                      </span>
                    )}
                  </div>
                  {product.description && (
                    <div className="text-sm text-neutral-600 mb-2 line-clamp-2">
                      {product.description}
                    </div>
                  )}
                  {product.artist && (
                    <div className="text-xs text-neutral-500 mb-2">
                      Artist: {product.artist.firstName} {product.artist.lastName}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">
                        ${(product.retailPrice / 100).toFixed(2)}
                      </div>
                      <div className="text-xs text-neutral-500">
                        Qty: {Number(product.quantityOnHand).toFixed(0)}
                      </div>
                    </div>
                    {isLowStock && (
                      <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                        Low Stock
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
