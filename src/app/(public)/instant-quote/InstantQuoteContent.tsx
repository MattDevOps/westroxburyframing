"use client";

import { useState } from "react";
import { Upload, Loader2, AlertTriangle } from "lucide-react";

interface QuoteResult {
  identifiedItem: string;
  projectCategory: string;
  recommendedConstruction: string;
  estimatedPriceBand: string;
  priceDrivers: string;
  bringInForExactQuote: string;
  callToAction: string;
}

export default function InstantQuoteContent() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(f: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!f) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      if (description.trim()) fd.append("description", description.trim());

      const res = await fetch("/api/public/instant-quote", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || `Sorry — something went wrong (HTTP ${res.status}).`);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:py-16">
      <header className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-stone-900">Instant Quote</h1>
        <p className="mt-3 text-stone-600">
          Snap a photo of whatever you want framed (a jersey, diploma, art piece, memorial item) and we&apos;ll
          give you a ballpark estimate in seconds. For an exact number, bring the piece by 1741 Centre St.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Photo of the item</span>
          <div className="mt-2 rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 p-6">
            {previewUrl ? (
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Item preview"
                  className="h-40 w-40 object-cover rounded border border-stone-200 bg-white"
                />
                <div className="flex-1 text-sm text-stone-700">
                  <div className="font-medium truncate">{file?.name}</div>
                  <button
                    type="button"
                    onClick={() => handleFileChange(null)}
                    className="mt-2 text-xs text-stone-500 hover:text-stone-900 underline"
                  >
                    Choose a different photo
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center cursor-pointer text-center">
                <Upload className="w-10 h-10 text-stone-400" />
                <span className="mt-2 text-sm font-medium text-stone-700">
                  Tap to take or choose a photo
                </span>
                <span className="mt-1 text-xs text-stone-500">JPEG / PNG / WebP / GIF, up to 10 MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">
            Anything we should know? <span className="text-stone-400 font-normal">(optional)</span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="e.g. autographed jersey, want it shadowboxed; diploma in school colors; family photo from the 60s; etc."
            className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={!file || loading}
          className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Estimating…
            </>
          ) : (
            "Get estimate"
          )}
        </button>
      </form>

      {error && (
        <div className="mt-6 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {result && (
        <div className="mt-8 rounded-lg border border-stone-200 bg-white p-6 space-y-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">What we see</div>
            <p className="mt-1 text-stone-800">{result.identifiedItem}</p>
            {result.projectCategory && result.projectCategory !== "Cannot determine" && (
              <p className="mt-1 text-sm text-stone-500">Category: {result.projectCategory}</p>
            )}
          </div>

          {result.estimatedPriceBand && result.estimatedPriceBand !== "n/a" && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Estimated ballpark
              </div>
              <p className="mt-1 text-3xl font-bold text-stone-900">{result.estimatedPriceBand}</p>
              {result.priceDrivers && (
                <p className="mt-1 text-sm text-stone-600">{result.priceDrivers}</p>
              )}
            </div>
          )}

          {result.recommendedConstruction && result.recommendedConstruction !== "n/a" && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                What we&apos;d build
              </div>
              <p className="mt-1 text-stone-800">{result.recommendedConstruction}</p>
            </div>
          )}

          {result.bringInForExactQuote && (
            <div className="rounded-md bg-stone-50 border border-stone-200 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                For an exact quote
              </div>
              <p className="mt-1 text-sm text-stone-700">{result.bringInForExactQuote}</p>
            </div>
          )}

          {result.callToAction && (
            <div className="border-t border-stone-100 pt-4">
              <p className="text-stone-800 font-medium">{result.callToAction}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <a
                  href="tel:6173273890"
                  className="inline-flex items-center rounded-md bg-stone-900 px-4 py-2 font-medium text-white hover:bg-stone-800"
                >
                  Call (617) 327-3890
                </a>
                <a
                  href="/contact"
                  className="inline-flex items-center rounded-md border border-stone-300 px-4 py-2 font-medium text-stone-800 hover:bg-stone-50"
                >
                  Send a message
                </a>
                <a
                  href="/book"
                  className="inline-flex items-center rounded-md border border-stone-300 px-4 py-2 font-medium text-stone-800 hover:bg-stone-50"
                >
                  Book an appointment
                </a>
              </div>
            </div>
          )}

          <p className="text-xs text-stone-400 pt-2">
            This is an estimate based on a photo. Real pricing requires the piece in person.
          </p>
        </div>
      )}
    </div>
  );
}
