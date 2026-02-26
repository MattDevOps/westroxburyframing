"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const [emailInput, setEmailInput] = useState("");
  const [emailSearchResults, setEmailSearchResults] = useState<Array<{ email: string; found: boolean; customerId?: string; name?: string }>>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState<number>(20);
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

  async function searchCustomersByEmail() {
    if (!emailInput.trim()) {
      setEmailSearchResults([]);
      return;
    }

    // Parse emails (comma or newline separated)
    const emails = emailInput
      .split(/[,\n]/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0);

    if (emails.length === 0) {
      setEmailSearchResults([]);
      return;
    }

    try {
      const res = await fetch(`/staff/api/customers?emails=${encodeURIComponent(emails.join(","))}`, { cache: "no-store" });
      const data = await res.json();
      
      if (res.ok) {
        const foundCustomers = data.customers || [];
        
        const results = emails.map(email => {
          const customer = foundCustomers.find((c: Customer) => 
            c.email?.toLowerCase() === email
          );
          if (customer) {
            return {
              email,
              found: true,
              customerId: customer.id,
              name: `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Customer",
            };
          }
          return {
            email,
            found: false,
          };
        });
        
        setEmailSearchResults(results);
        
        // Auto-add found customers to selected list
        const newCustomerIds = foundCustomers
          .map((c: Customer) => c.id)
          .filter((id: string) => !selectedCustomerIds.includes(id));
        
        if (newCustomerIds.length > 0) {
          setSelectedCustomerIds([...selectedCustomerIds, ...newCustomerIds]);
          setSelectedTagId(""); // Clear tag selection
        }
      }
    } catch (e) {
      console.error("Failed to search customers by email:", e);
    }
  }

  function applyTemplate(template: string, discount: number) {
    if (template === "holiday") {
      setSubject(`Holiday Special — ${discount}% Off Custom Framing!`);
      setMessage(`Hi {{name}},

We hope this holiday season brings you joy and beautiful moments to frame!

As a thank you for being a valued customer, we're offering you ${discount}% off all custom framing services this holiday season.

Whether you're looking to frame a special gift, preserve a cherished memory, or create the perfect present, our expert team is here to help.

This special offer is valid through the end of the year. Stop by our shop or give us a call to get started!

West Roxbury Framing
1741 Centre Street, West Roxbury, MA 02132
(617) 327-3890

Happy Holidays!`);
    } else if (template === "blackfriday") {
      setSubject(`Black Friday Special — ${discount}% Off All Framing!`);
      setMessage(`Hi {{name}},

Black Friday is here, and we have an exclusive offer just for you!

Get ${discount}% off all custom framing services this Black Friday weekend. This is the perfect time to frame those special pieces you've been meaning to get done.

From artwork to photos, certificates to memorabilia—we'll help you preserve what matters most.

This offer is valid Friday through Sunday. Don't miss out!

West Roxbury Framing
1741 Centre Street, West Roxbury, MA 02132
(617) 327-3890

We look forward to seeing you!`);
    } else {
      setSubject("");
      setMessage("");
    }
  }

  async function handleSend() {
    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required");
      return;
    }

    // Note: We allow sending to all customers if no tag or specific customers are selected
    // The API will handle filtering by opt-in status

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
          discountPercent: selectedTemplate ? discountPercent : null,
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
        setSelectedTemplate("");
        setDiscountPercent(20);
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
        {/* Email Templates */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Email Templates
          </label>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-neutral-600 mb-1">Select Template:</label>
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  const template = e.target.value;
                  setSelectedTemplate(template);
                  applyTemplate(template, discountPercent);
                }}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm"
              >
                <option value="">No template (custom message)</option>
                <option value="holiday">Holiday Special</option>
                <option value="blackfriday">Black Friday Sale</option>
              </select>
            </div>
            {selectedTemplate && (
              <div>
                <label className="block text-xs text-neutral-600 mb-1">
                  Discount Percentage (15-30%):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="15"
                    max="30"
                    value={discountPercent}
                    onChange={(e) => {
                      const percent = parseInt(e.target.value);
                      setDiscountPercent(percent);
                      applyTemplate(selectedTemplate, percent);
                    }}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-neutral-900 w-12 text-right">
                    {discountPercent}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recipients */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Recipients
          </label>
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-3">
            <div className="text-xs font-medium text-blue-900 mb-1">📧 Email Opt-In Policy</div>
            <div className="text-xs text-blue-800">
              By default, emails are only sent to customers who have opted in for marketing emails. 
              You can override this below if needed.
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-neutral-600 mb-1">
                Send to Customer Segment (Tag):
              </label>
              <select
                value={selectedTagId}
                onChange={(e) => {
                  setSelectedTagId(e.target.value);
                  setSelectedCustomerIds([]);
                }}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm"
              >
                <option value="">All customers (no tag filter)</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name} (customer segment)
                  </option>
                ))}
              </select>
              <div className="text-xs text-neutral-500 mt-1">
                Customer tags are used to segment customers (e.g., "VIP", "Regular Customer", "First-time"). 
                <Link href="/staff/settings/tags" className="text-blue-600 hover:text-blue-800 ml-1">
                  Manage tags →
                </Link>
              </div>
            </div>
            <div className="text-xs text-neutral-500 text-center">OR</div>
            <div>
              <label className="block text-xs text-neutral-600 mb-1">Add Customers by Email:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      searchCustomersByEmail();
                    }
                  }}
                  placeholder="Enter email addresses (comma or newline separated)"
                  className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={searchCustomersByEmail}
                  className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 whitespace-nowrap"
                >
                  Search
                </button>
              </div>
              {emailSearchResults.length > 0 && (
                <div className="mt-2 space-y-1">
                  {emailSearchResults.map((result, idx) => (
                    <div
                      key={idx}
                      className={`text-xs p-2 rounded ${
                        result.found
                          ? "bg-green-50 text-green-800 border border-green-200"
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}
                    >
                      {result.found ? (
                        <span>
                          ✓ {result.email} - {result.name} (added)
                        </span>
                      ) : (
                        <span>✗ {result.email} - Not found in database</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="text-xs text-neutral-500 mt-1">
                Enter one or more email addresses separated by commas or new lines
              </div>
            </div>
            <div className="text-xs text-neutral-500 text-center">OR</div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-neutral-600">Select from Customer List:</label>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedCustomerIds.length === customers.length) {
                      setSelectedCustomerIds([]);
                    } else {
                      setSelectedCustomerIds(customers.map(c => c.id));
                      setSelectedTagId("");
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {selectedCustomerIds.length === customers.length ? "Deselect All" : "Select All"}
                </button>
              </div>
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
                {selectedCustomerIds.length > 0 && (
                  <span className="font-medium text-neutral-700">
                    {selectedCustomerIds.length} customer{selectedCustomerIds.length !== 1 ? "s" : ""} selected.{" "}
                  </span>
                )}
                Hold Ctrl/Cmd to select multiple customers, or use "Select All"
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <label className="flex items-start gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={includeUnsubscribed}
                  onChange={(e) => setIncludeUnsubscribed(e.target.checked)}
                  className="rounded text-black focus:ring-black mt-0.5"
                />
                <div>
                  <div className="font-medium">Include customers who opted out</div>
                  <div className="text-xs text-neutral-600 mt-0.5">
                    ⚠️ Only check this if you have explicit permission. Sending to opted-out customers may violate email regulations.
                  </div>
                </div>
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
