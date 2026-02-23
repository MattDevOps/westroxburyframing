"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

interface GalleryItem {
  id: string;
  title: string | null;
  description: string | null;
  category: string;
  imageUrl: string;
  sortOrder: number;
  published: boolean;
}

const CATEGORIES = [
  { value: "custom_framing", label: "Custom Framing" },
  { value: "memorabilia", label: "Memorabilia / Sports" },
  { value: "restoration", label: "Restoration" },
  { value: "diploma", label: "Diploma / Certificate" },
  { value: "mirror", label: "Mirror" },
  { value: "other", label: "Other" },
];

export default function GalleryManagementPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("custom_framing");
  const [imageUrl, setImageUrl] = useState("");
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/staff/api/gallery");
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setError("Failed to load gallery items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setCategory("custom_framing");
    setImageUrl("");
    setPublished(true);
    setEditingItem(null);
    setShowForm(false);
    setError(null);
  }

  function startEdit(item: GalleryItem) {
    setEditingItem(item);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setCategory(item.category);
    setImageUrl(item.imageUrl);
    setPublished(item.published);
    setShowForm(true);
  }

  async function handleSave() {
    if (!imageUrl.trim()) {
      setError("Image URL is required");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      if (editingItem) {
        // Update
        const res = await fetch(`/staff/api/gallery/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, category, imageUrl, published }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Update failed");
        }
      } else {
        // Create
        const res = await fetch("/staff/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, category, imageUrl, published }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Create failed");
        }
      }

      resetForm();
      await loadItems();
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this gallery item?")) return;

    try {
      const res = await fetch(`/staff/api/gallery/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Delete failed");
        return;
      }
      await loadItems();
    } catch {
      alert("Delete failed");
    }
  }

  async function togglePublished(item: GalleryItem) {
    try {
      await fetch(`/staff/api/gallery/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !item.published }),
      });
      await loadItems();
    } catch {
      alert("Failed to update");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Gallery Management</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-xl bg-black text-white px-5 py-2.5 text-sm"
        >
          + Add Item
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            {editingItem ? "Edit Gallery Item" : "New Gallery Item"}
          </h2>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Title (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Framed Tom Brady Jersey"
                className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Image URL *
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/framed-art/example.webp or https://..."
                className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Use a path like /framed-art/image.webp for local images, or a full URL for external images.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the piece..."
                rows={2}
                className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-neutral-700">Published (visible on website)</span>
            </div>
          </div>

          {/* Preview */}
          {imageUrl && (
            <div className="border border-neutral-200 rounded-xl p-4">
              <p className="text-xs text-neutral-500 mb-2">Preview</p>
              <div className="relative w-48 h-60 bg-neutral-100 rounded-xl overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={title || "Gallery preview"}
                  fill
                  className="object-cover"
                  unoptimized={imageUrl.startsWith("http")}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-black text-white px-5 py-2.5 text-sm disabled:opacity-50"
            >
              {saving ? "Saving…" : editingItem ? "Update" : "Add Item"}
            </button>
            <button
              onClick={resetForm}
              className="rounded-xl border border-neutral-300 px-5 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      {loading ? (
        <p className="text-neutral-500">Loading…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <p className="text-lg">No gallery items yet.</p>
          <p className="text-sm mt-1">Click &quot;+ Add Item&quot; to add your first piece.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border bg-white overflow-hidden ${
                item.published ? "border-neutral-200" : "border-orange-200 opacity-60"
              }`}
            >
              <div className="relative aspect-[4/5] bg-neutral-100">
                <Image
                  src={item.imageUrl}
                  alt={item.title || "Gallery item"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  unoptimized={item.imageUrl.startsWith("http")}
                />
                {!item.published && (
                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                    DRAFT
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-neutral-900 truncate">
                      {item.title || "Untitled"}
                    </h3>
                    <span className="text-xs text-neutral-500">
                      {CATEGORIES.find((c) => c.value === item.category)?.label || item.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 shrink-0">
                    #{item.sortOrder}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(item)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => togglePublished(item)}
                    className="text-xs text-neutral-500 hover:underline"
                  >
                    {item.published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
