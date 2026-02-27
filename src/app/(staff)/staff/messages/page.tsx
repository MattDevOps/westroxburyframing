"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface StaffMessage {
  id: string;
  subject: string;
  body: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  fromUser: {
    id: string;
    name: string;
    email: string;
  };
  toUser: {
    id: string;
    name: string;
    email: string;
  };
}

export default function MessagesPage() {
  const [folder, setFolder] = useState<"inbox" | "sent">("inbox");
  const [messages, setMessages] = useState<StaffMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<StaffMessage | null>(null);

  useEffect(() => {
    loadMessages();
  }, [folder]);

  async function loadMessages() {
    setLoading(true);
    try {
      const res = await fetch(`/staff/api/messages?folder=${folder}`);
      if (!res.ok) throw new Error("Failed to load messages");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (e: any) {
      console.error("Error loading messages:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleMessageClick(message: StaffMessage) {
    setSelectedMessage(message);
    // Mark as read if viewing inbox
    if (folder === "inbox" && !message.read) {
      await fetch(`/staff/api/messages/${message.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ read: true }) });
      loadMessages(); // Refresh to update read status
    }
  }

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <button
          onClick={() => setShowCompose(true)}
          className="rounded-xl bg-black px-4 py-2 text-white hover:bg-neutral-800"
        >
          + New Message
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  setFolder("inbox");
                  setSelectedMessage(null);
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  folder === "inbox"
                    ? "bg-black text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                Inbox {folder === "inbox" && unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-white text-black text-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setFolder("sent");
                  setSelectedMessage(null);
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  folder === "sent"
                    ? "bg-black text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                Sent
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            {loading ? (
              <div className="p-4 text-center text-neutral-500">Loading...</div>
            ) : messages.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 text-sm">
                No messages in {folder}
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 max-h-[600px] overflow-y-auto">
                {messages.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => handleMessageClick(message)}
                    className={`w-full text-left p-4 hover:bg-neutral-50 transition-colors ${
                      selectedMessage?.id === message.id ? "bg-blue-50" : ""
                    } ${!message.read && folder === "inbox" ? "font-semibold" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-neutral-900 truncate">
                          {folder === "inbox" ? message.fromUser.name : message.toUser.name}
                        </div>
                        <div className="text-xs text-neutral-500 truncate">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {!message.read && folder === "inbox" && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                      )}
                    </div>
                    <div className="text-sm text-neutral-700 truncate">{message.subject}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="mb-4 pb-4 border-b border-neutral-200">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-xl font-bold">{selectedMessage.subject}</h2>
                  {!selectedMessage.read && folder === "inbox" && (
                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                      Unread
                    </span>
                  )}
                </div>
                <div className="text-sm text-neutral-600 space-y-1">
                  <div>
                    <span className="font-medium">From:</span> {selectedMessage.fromUser.name} ({selectedMessage.fromUser.email})
                  </div>
                  <div>
                    <span className="font-medium">To:</span> {selectedMessage.toUser.name} ({selectedMessage.toUser.email})
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {new Date(selectedMessage.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-neutral-700">{selectedMessage.body}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center text-neutral-500">
              <p className="text-lg mb-2">Select a message to view</p>
              <p className="text-sm">Choose a message from the list to read it</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <ComposeModal
          onClose={() => {
            setShowCompose(false);
            loadMessages();
          }}
        />
      )}
    </div>
  );
}

function ComposeModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [formData, setFormData] = useState({
    toUserId: "",
    subject: "",
    body: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await fetch("/staff/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error("Error loading users:", e);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/staff/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-xl font-bold">Compose Message</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 border-b border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              To <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.toUserId}
              onChange={(e) => setFormData({ ...formData, toUserId: e.target.value })}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select recipient...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Message subject..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={8}
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your message..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-black px-4 py-2 text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
