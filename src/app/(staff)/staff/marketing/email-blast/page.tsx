"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type CustomerTag = {
  id: string;
  name: string;
  color: string | null;
};

type Customer = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

export default function EmailBlastPage() {
  const router = useRouter();
  const [tags, setTags] = useState<CustomerTag[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [includeUnsubscribed, setIncludeUnsubscribed] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    sent: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTags();
    loadCustomers();
  }, []);

  async function loadTags() {
    try {
      const res = await fetch("/staff/api/customer-tags", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setTags(data.tags || []);
      }
    } catch (e) {
      console.error("Failed to load tags:", e);
    }
  }

  async function loadCustomers() {
    try {
      const res = await fetch("/staff/api/customers?limit=1000", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setCustomers((data.customers || []).filter((c: Customer) => c.email));
      }
    } catch (e) {
      console.error("Failed to load customers:", e);
    }
  }

  async function handleSend() {
    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required");
      return;
    }

    if (!selectedTagId && selectedCustomerIds.length === 0) {
      setError("Please select a tag or specific customers");
      return;
    }

    setSending(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/staff/api/email-blast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          tagId: selectedTagId || null,
          customerIds: selectedCustomerIds.length > 0 ? selectedCustomerIds : null,
          includeUnsubscribed,
        }),
      });

      let data;
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("Failed to parse response:", parseError, "Response:", text);
        setError(`Server error: ${res.status} ${res.statusText}. Response: ${text.slice(0, 200)}`);
        return;
      }

      if (res.ok) {
        setResult(data);
        setSubject("");
        setMessage("");
        setSelectedTagId("");
        setSelectedCustomerIds([]);
      } else {
        setError(data.error || `Failed to send email blast (${res.status})`);
      }
    } catch (e: any) {
      console.error("Email blast error:", e);
      setError(e.message || "Failed to send email blast");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Email Blast</h1>
        <button
          onClick={() => router.back()}
          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Back
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <div className="font-semibold mb-2">Email Blast Results:</div>
          <div>Total recipients: {result.total}</div>
          <div>Sent: {result.sent}</div>
          <div>Failed: {result.failed}</div>
          {result.errors.length > 0 && (
            <div className="mt-2">
              <div className="font-semibold">Errors:</div>
              <ul className="list-disc list-inside">
                {result.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-6">
        {/* Recipients */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Recipients
          </label>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-neutral-600 mb-1">Send to Tag:</label>
              <select
                value={selectedTagId}
                onChange={(e) => {
                  setSelectedTagId(e.target.value);
                  setSelectedCustomerIds([]);
                }}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm"
              >
                <option value="">Select a tag...</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-neutral-500">OR</div>
            <div>
              <label className="block text-xs text-neutral-600 mb-1">Select Specific Customers:</label>
              <select
                multiple
                value={selectedCustomerIds}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, (opt) => opt.value);
                  setSelectedCustomerIds(values);
                  setSelectedTagId("");
                }}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm min-h-[120px]"
                size={5}
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName} ({customer.email})
                  </option>
                ))}
              </select>
              <div className="text-xs text-neutral-500 mt-1">
                Hold Ctrl/Cmd to select multiple customers
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={includeUnsubscribed}
                  onChange={(e) => setIncludeUnsubscribed(e.target.checked)}
                  className="rounded text-black focus:ring-black"
                />
                Include customers who opted out of marketing emails
              </label>
            </div>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject line"
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Email message. Use {{name}} to personalize with customer name."
            rows={10}
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm"
          />
          <div className="text-xs text-neutral-500 mt-1">
            Tip: Use {"{{name}}"} to personalize the message with each customer's name
          </div>
        </div>

        {/* Send Button */}
        <div>
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !message.trim()}
            className="rounded-xl bg-black text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Sending..." : "Send Email Blast"}
          </button>
        </div>
      </div>
    </div>
  );
}
