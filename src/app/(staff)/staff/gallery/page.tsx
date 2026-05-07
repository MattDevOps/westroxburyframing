"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function uploadFile(file: File) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Use JPEG, PNG, WebP, or GIF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Max 10MB.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/staff/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Upload failed");
      }

      const data = await res.json();
      setImageUrl(data.url);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  async function handleSave() {
    if (!imageUrl.trim()) {
      setError("Image is required — upload a photo or paste a URL");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      if (editingItem) {
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setError(msg);
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

            {/* Image Upload Area */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Image *
              </label>

              {!imageUrl ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? "border-blue-400 bg-blue-50"
                      : "border-neutral-300 hover:border-neutral-400 bg-neutral-50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {uploading ? (
                    <div className="space-y-2">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-sm text-blue-600 font-medium">Uploading…</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <svg className="w-10 h-10 mx-auto text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-neutral-600">
                        <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-neutral-400">JPEG, PNG, WebP, or GIF — max 10MB</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative border border-neutral-200 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="relative w-32 h-40 bg-neutral-100 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={imageUrl}
                        alt={title || "Gallery preview"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-sm text-neutral-700 font-medium">Image uploaded ✓</p>
                      <p className="text-xs text-neutral-400 truncate">{imageUrl}</p>
                      <button
                        type="button"
                        onClick={() => { setImageUrl(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove and upload a different image
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback: paste URL manually */}
              {!imageUrl && (
                <div className="mt-2">
                  <details className="text-xs text-neutral-500">
                    <summary className="cursor-pointer hover:text-neutral-700">Or paste an image URL instead</summary>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full mt-2 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm"
                    />
                  </details>
                </div>
              )}
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

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || uploading}
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
                  unoptimized
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
