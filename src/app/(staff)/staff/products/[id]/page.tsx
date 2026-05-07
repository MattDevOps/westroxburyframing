"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
  notes: string | null;
  published: boolean;
  artist: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  } | null;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      loadProduct(p.id);
    });
  }, [params]);

  async function loadProduct(prodId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/staff/api/products/${prodId}`);
      if (!res.ok) throw new Error("Failed to load product");
      const data = await res.json();
      setProduct(data.product);
    } catch (e: any) {
      console.error("Error loading product:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!product) return;
    setSaving(true);
    try {
      const res = await fetch(`/staff/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      if (!res.ok) throw new Error("Failed to save");
      setEditing(false);
      loadProduct(product.id);
    } catch (e: any) {
      console.error("Error saving product:", e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-10 text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <div className="text-center py-10 text-red-500">Product not found</div>
      </div>
    );
  }

  const isLowStock = Number(product.quantityOnHand) <= Number(product.reorderPoint);
  const totalValue = (product.retailPrice * Number(product.quantityOnHand)) / 100;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">{product.name}</h1>
          <p className="text-sm text-neutral-600">SKU: {product.sku}</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-black px-4 py-2 text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  loadProduct(product.id);
                }}
                className="rounded-xl border border-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="rounded-xl bg-black px-4 py-2 text-white hover:bg-neutral-800"
            >
              Edit
            </button>
          )}
          <Link
            href="/staff/products"
            className="rounded-xl border border-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-50"
          >
            ← Back
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {product.imageUrl && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="relative w-full h-64 bg-neutral-100 rounded-lg overflow-hidden">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}

          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold mb-4">Product Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-neutral-500 mb-1">Category</div>
                  <div className="font-medium">
                    {product.category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-500 mb-1">Type</div>
                  <div className="font-medium capitalize">{product.type}</div>
                </div>
              </div>

              {product.description && (
                <div>
                  <div className="text-sm text-neutral-500 mb-1">Description</div>
                  <div className="text-neutral-700">{product.description}</div>
                </div>
              )}

              {product.artist && (
                <div>
                  <div className="text-sm text-neutral-500 mb-1">Artist</div>
                  <Link
                    href={`/staff/customers/${product.artist.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {product.artist.firstName} {product.artist.lastName}
                  </Link>
                </div>
              )}

              {product.barcode && (
                <div>
                  <div className="text-sm text-neutral-500 mb-1">Barcode</div>
                  <div className="font-mono text-sm">{product.barcode}</div>
                </div>
              )}

              {product.notes && (
                <div>
                  <div className="text-sm text-neutral-500 mb-1">Notes</div>
                  <div className="text-neutral-700 whitespace-pre-wrap">{product.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing & Inventory */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold mb-4">Pricing & Inventory</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-neutral-500 mb-1">Cost</div>
                <div className="text-lg font-semibold">${(product.cost / 100).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-neutral-500 mb-1">Retail Price</div>
                <div className="text-lg font-semibold text-green-600">
                  ${(product.retailPrice / 100).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-500 mb-1">Quantity on Hand</div>
                <div className={`text-lg font-semibold ${isLowStock ? "text-amber-600" : ""}`}>
                  {Number(product.quantityOnHand).toFixed(0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-500 mb-1">Reorder Point</div>
                <div className="text-lg font-semibold">{Number(product.reorderPoint).toFixed(0)}</div>
              </div>
              <div className="pt-4 border-t border-neutral-200">
                <div className="text-sm text-neutral-500 mb-1">Total Value</div>
                <div className="text-xl font-bold">${totalValue.toFixed(2)}</div>
              </div>
              {isLowStock && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <div className="text-sm font-medium text-amber-800">⚠️ Low Stock Alert</div>
                  <div className="text-xs text-amber-700 mt-1">
                    Quantity is below reorder point
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold mb-4">Status</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Published</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.published
                      ? "bg-green-100 text-green-700"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {product.published ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
