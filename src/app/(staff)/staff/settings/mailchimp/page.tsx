"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MailchimpSettingsPage() {
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    updated: number;
    skipped: number;
    total: number;
    errors: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    if (!confirm("This will import all subscribed members from your Mailchimp audience. Continue?")) {
      return;
    }

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/staff/api/mailchimp/import", {
        method: "POST",
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Failed to import from Mailchimp");
      }
    } catch (e: any) {
      setError(e.message || "Failed to import from Mailchimp");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Mailchimp Integration</h1>
          <p className="text-neutral-600 text-sm mt-1">
            Sync customers with your Mailchimp audience
          </p>
        </div>
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
          <div className="font-semibold mb-2">Import Complete:</div>
          <div>Total members: {result.total}</div>
          <div>Imported: {result.imported}</div>
          <div>Updated: {result.updated}</div>
          <div>Skipped: {result.skipped}</div>
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

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">Import from Mailchimp</h2>
          <p className="text-sm text-neutral-600 mb-4">
            Import all subscribed members from your Mailchimp audience. This will:
          </p>
          <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 mb-4">
            <li>Create new customers for members not in the system</li>
            <li>Update existing customers with Mailchimp data</li>
            <li>Sync Mailchimp tags as customer tags</li>
          </ul>
          <button
            onClick={handleImport}
            disabled={importing}
            className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? "Importing..." : "Import from Mailchimp"}
          </button>
        </div>

        <div className="pt-4 border-t border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900 mb-2">Configuration</h3>
          <p className="text-xs text-neutral-600">
            Configure Mailchimp in your environment variables:
          </p>
          <ul className="list-disc list-inside text-xs text-neutral-600 mt-2 space-y-1">
            <li><code className="bg-neutral-100 px-1 rounded">MAILCHIMP_API_KEY</code></li>
            <li><code className="bg-neutral-100 px-1 rounded">MAILCHIMP_AUDIENCE_ID</code></li>
            <li><code className="bg-neutral-100 px-1 rounded">MAILCHIMP_SERVER_PREFIX</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
