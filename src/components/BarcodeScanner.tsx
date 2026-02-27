"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface BarcodeResult {
  id: string;
  type: "product" | "inventory" | "catalog";
  name: string;
  sku?: string;
  itemNumber?: string;
  barcode?: string;
  price?: number;
  quantity?: number;
  vendor?: string;
  url: string;
}

interface BarcodeLookupResponse {
  products: BarcodeResult[];
  inventoryItems: BarcodeResult[];
  catalogItems: BarcodeResult[];
}

interface BarcodeScannerProps {
  onScan?: (barcode: string) => void;
  onResult?: (results: BarcodeLookupResponse) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function BarcodeScanner({
  onScan,
  onResult,
  placeholder = "Scan or type barcode...",
  autoFocus = true,
}: BarcodeScannerProps) {
  const router = useRouter();
  const [barcode, setBarcode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<BarcodeLookupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  // Handle barcode scanner input (scanners typically send Enter after the code)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter" && barcode.trim()) {
        handleLookup(barcode.trim());
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [barcode]);

  async function handleLookup(code: string) {
    if (!code) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch(`/staff/api/barcode/lookup?barcode=${encodeURIComponent(code)}`);
      if (!res.ok) throw new Error("Lookup failed");

      const data = await res.json();
      setResults(data);

      if (onScan) onScan(code);
      if (onResult) onResult(data);

      // Auto-navigate if single result
      const allResults = [...data.products, ...data.inventoryItems, ...data.catalogItems];
      if (allResults.length === 1) {
        router.push(allResults[0].url);
      }
    } catch (e: any) {
      setError(e.message || "Failed to lookup barcode");
    } finally {
      setLoading(false);
    }
  }

  async function startCameraScan() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
      }
    } catch (e: any) {
      setError("Camera access denied or not available");
    }
  }

  function stopCameraScan() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }

  const allResults = results
    ? [...results.products, ...results.inventoryItems, ...results.catalogItems]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && barcode.trim()) {
                e.preventDefault();
                handleLookup(barcode.trim());
              }
            }}
            placeholder={placeholder}
            className="w-full rounded-xl border border-neutral-300 px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus={autoFocus}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              Searching...
            </div>
          )}
        </div>
        <button
          onClick={() => {
            if (barcode.trim()) {
              handleLookup(barcode.trim());
            }
          }}
          disabled={loading || !barcode.trim()}
          className="rounded-xl bg-black px-4 py-2 text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Lookup
        </button>
        {!scanning ? (
          <button
            onClick={startCameraScan}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-50"
            title="Scan with camera"
          >
            📷
          </button>
        ) : (
          <button
            onClick={stopCameraScan}
            className="rounded-xl border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50"
          >
            Stop
          </button>
        )}
      </div>

      {scanning && (
        <div className="rounded-xl border border-neutral-200 bg-black overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-64 object-cover"
          />
          <div className="p-2 text-center text-white text-sm">
            Point camera at barcode (manual entry also works)
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {results && allResults.length === 0 && !loading && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center text-neutral-500">
          No items found with barcode "{barcode}"
        </div>
      )}

      {results && allResults.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2">
          <div className="text-sm font-semibold text-neutral-700 mb-3">
            Found {allResults.length} item{allResults.length !== 1 ? "s" : ""}:
          </div>
          {allResults.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => router.push(result.url)}
              className="w-full text-left rounded-lg border border-neutral-200 p-3 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-neutral-900 truncate">{result.name}</div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {result.type === "product" && result.sku && `SKU: ${result.sku}`}
                    {result.type === "inventory" && result.sku && `SKU: ${result.sku}`}
                    {result.type === "catalog" && result.itemNumber && `Item #: ${result.itemNumber}`}
                    {result.vendor && ` • ${result.vendor}`}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {result.price && (
                    <div className="font-semibold text-neutral-900">
                      ${(result.price / 100).toFixed(2)}
                    </div>
                  )}
                  {result.quantity !== undefined && (
                    <div className="text-xs text-neutral-500">
                      Qty: {Number(result.quantity).toFixed(0)}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
