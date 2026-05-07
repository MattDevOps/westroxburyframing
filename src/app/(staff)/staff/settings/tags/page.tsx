"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CustomerTag {
  id: string;
  name: string;
  color: string | null;
  _count?: { assignments: number };
}

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

export default function TagsSettingsPage() {
  const [tags, setTags] = useState<CustomerTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(DEFAULT_COLORS[0]);

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/staff/api/customer-tags");
      if (!res.ok) throw new Error("Failed to load tags");
      const data = await res.json();
      setTags(data.tags || []);
    } catch (e: any) {
      setError(e.message || "Failed to load tags");
    } finally {
      setLoading(false);
    }
  }

  async function createTag() {
    if (!newTagName.trim()) {
      alert("Tag name is required");
      return;
    }

    setSaving(true);
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
      setShowCreate(false);
      await loadTags();
    } catch (e: any) {
      alert(e.message || "Failed to create tag");
    } finally {
      setSaving(false);
    }
  }

  async function updateTag(id: string, name: string, color: string | null) {
    setSaving(true);
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

      setEditing(null);
      await loadTags();
    } catch (e: any) {
      alert(e.message || "Failed to update tag");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTag(id: string) {
    if (!confirm("Are you sure you want to delete this tag? It will be removed from all customers.")) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/staff/api/customer-tags/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete tag");
      }

      await loadTags();
    } catch (e: any) {
      alert(e.message || "Failed to delete tag");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-neutral-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href="/staff/customers" className="text-sm text-neutral-600 hover:text-neutral-900">
          ← Back to Customers
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900 mt-2">Customer Tags</h1>
        <p className="text-neutral-600 text-sm mt-1">Manage tags for customer segmentation</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Create new tag */}
      {showCreate ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Create New Tag</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Tag Name</label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g., VIP, Artist, Wholesale"
                className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    className={`w-10 h-10 rounded-lg border-2 ${
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
                disabled={saving || !newTagName.trim()}
                className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Tag"}
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
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
          onClick={() => setShowCreate(true)}
          className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
        >
          + Create Tag
        </button>
      )}

      {/* Tags list */}
      {tags.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <p className="text-neutral-600 mb-4">No tags yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
          >
            Create your first tag
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                  Tag
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                  Customers
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    {editing === tag.id ? (
                      <TagEditor
                        tag={tag}
                        onSave={(name, color) => updateTag(tag.id, name, color)}
                        onCancel={() => setEditing(null)}
                        saving={saving}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-4 h-4 rounded-full"
                          style={{ backgroundColor: tag.color || "#6b7280" }}
                        />
                        <span className="font-medium text-neutral-900">{tag.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {tag._count?.assignments || 0} customer{(tag._count?.assignments || 0) !== 1 ? "s" : ""}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editing === tag.id ? null : (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditing(tag.id)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteTag(tag.id)}
                          disabled={saving}
                          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TagEditor({
  tag,
  onSave,
  onCancel,
  saving,
}: {
  tag: CustomerTag;
  onSave: (name: string, color: string | null) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color || DEFAULT_COLORS[0]);

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
        autoFocus
      />
      <div className="flex gap-2">
        {DEFAULT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={`w-6 h-6 rounded border ${
              color === c ? "border-neutral-900" : "border-neutral-300"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(name, color)}
          disabled={saving || !name.trim()}
          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          Save
        </button>
        <button onClick={onCancel} className="text-xs text-neutral-600 hover:text-neutral-800">
          Cancel
        </button>
      </div>
    </div>
  );
}
