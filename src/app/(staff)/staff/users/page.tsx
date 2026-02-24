"use client";

import { useEffect, useState, useCallback } from "react";

interface StaffUser {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

export default function StaffUsersPage() {
    const [users, setUsers] = useState<StaffUser[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState<StaffUser | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("staff");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        const res = await fetch("/staff/api/users");
        if (res.ok) {
            const data = await res.json();
            setUsers(data.users);
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    function openCreate() {
        setEditUser(null);
        setName("");
        setEmail("");
        setPassword("");
        setRole("staff");
        setError(null);
        setShowModal(true);
    }

    function openEdit(u: StaffUser) {
        setEditUser(u);
        setName(u.name);
        setEmail(u.email);
        setPassword("");
        setRole(u.role);
        setError(null);
        setShowModal(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            const url = editUser ? `/staff/api/users/${editUser.id}` : "/staff/api/users";
            const method = editUser ? "PATCH" : "POST";

            const body: Record<string, string> = { name, email, role };
            if (password) body.password = password;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to save user");
                return;
            }

            setShowModal(false);
            await load();
        } catch {
            setError("Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    async function deleteUser(u: StaffUser) {
        if (!confirm(`Delete user ${u.name}? This cannot be undone.`)) return;

        const res = await fetch(`/staff/api/users/${u.id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error || "Failed to delete user");
            return;
        }
        await load();
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-neutral-900">Staff Users</h1>
                <button
                    onClick={openCreate}
                    className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
                >
                    + Add User
                </button>
            </div>

            {loading ? (
                <div className="text-neutral-500">Loading…</div>
            ) : users.length === 0 ? (
                <div className="text-neutral-500">No users found.</div>
            ) : (
                <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-neutral-200 bg-neutral-50">
                                <th className="px-4 py-3 text-left font-medium text-neutral-600">Name</th>
                                <th className="px-4 py-3 text-left font-medium text-neutral-600">Email</th>
                                <th className="px-4 py-3 text-left font-medium text-neutral-600">Role</th>
                                <th className="px-4 py-3 text-left font-medium text-neutral-600">Created</th>
                                <th className="px-4 py-3 text-right font-medium text-neutral-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} className="border-b border-neutral-100 last:border-0">
                                    <td className="px-4 py-3 text-neutral-900 font-medium">{u.name}</td>
                                    <td className="px-4 py-3 text-neutral-600">{u.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${u.role === "admin" ? "bg-amber-100 text-amber-800" : "bg-neutral-100 text-neutral-700"
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-neutral-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <button onClick={() => openEdit(u)} className="text-blue-600 hover:underline text-xs">
                                            Edit
                                        </button>
                                        {u.role !== "admin" && (
                                            <button onClick={() => deleteUser(u)} className="text-red-600 hover:underline text-xs">
                                                Delete
                                            </button>
                                        )}
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
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
                    >
                        <h2 className="text-lg font-bold text-neutral-900">
                            {editUser ? "Edit User" : "Add Staff User"}
                        </h2>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-neutral-700">Name</label>
                            <input
                                className="w-full rounded-xl border p-3 text-sm"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-neutral-700">Email</label>
                            <input
                                type="email"
                                className="w-full rounded-xl border p-3 text-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-neutral-700">
                                {editUser ? "New Password (leave blank to keep)" : "Password"}
                            </label>
                            <input
                                type="password"
                                className="w-full rounded-xl border p-3 text-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={editUser ? 0 : 6}
                                required={!editUser}
                                placeholder={editUser ? "Leave blank to keep current" : "Min 6 characters"}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-neutral-700">Role</label>
                            <select
                                className="w-full rounded-xl border p-3 text-sm"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="staff">Staff</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        {error && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:bg-neutral-800 disabled:opacity-50"
                            >
                                {saving ? "Saving..." : editUser ? "Update" : "Create"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
