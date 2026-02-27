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
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera access not supported in this browser. Please use Chrome, Firefox, Safari, or Edge.");
        return;
      }

      // Check if we're on HTTPS (required for camera access in most browsers)
      if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
        setError("Camera access requires HTTPS. Please access this site over HTTPS.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
        setError(null);
        
        // Start scanning for barcodes
        startBarcodeDetection();
      }
    } catch (e: any) {
      console.error("Camera error:", e);
      let errorMessage = "Camera access denied or not available.";
      
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        errorMessage = "Camera permission denied. Please allow camera access in your browser settings and try again.";
      } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
        errorMessage = "No camera found. Please connect a camera and try again.";
      } else if (e.name === "NotReadableError" || e.name === "TrackStartError") {
        errorMessage = "Camera is already in use by another application. Please close other apps using the camera.";
      } else if (e.name === "OverconstrainedError") {
        errorMessage = "Camera doesn't support the required settings. Trying with default settings...";
        // Try again with default settings
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setScanning(true);
            setError(null);
            startBarcodeDetection();
            return;
          }
        } catch (retryError: any) {
          errorMessage = "Could not access camera. Please check your camera permissions.";
        }
      }
      
      setError(errorMessage);
    }
  }

  function startBarcodeDetection() {
    // Simple barcode detection using canvas and manual scanning
    // For production, you'd want to use a library like @zxing/library
    const scanInterval = setInterval(() => {
      if (!videoRef.current || !scanning) {
        clearInterval(scanInterval);
        return;
      }

      const video = videoRef.current;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Create canvas to capture frame
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Note: Actual barcode detection would require a library like @zxing/library
          // For now, we'll just show the video feed and let users manually enter barcodes
          // or use a USB barcode scanner (which works via keyboard input)
        }
      }
    }, 500); // Check every 500ms

    // Store interval ID for cleanup
    (videoRef.current as any).scanInterval = scanInterval;
  }

  function stopCameraScan() {
    // Clear scanning interval if it exists
    if (videoRef.current && (videoRef.current as any).scanInterval) {
      clearInterval((videoRef.current as any).scanInterval);
      (videoRef.current as any).scanInterval = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
    setError(null);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCameraScan();
    };
  }, []);

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
            muted
            className="w-full h-64 object-cover"
          />
          <div className="p-2 text-center text-white text-sm">
            Camera active - Use a USB barcode scanner or manually type barcodes above
          </div>
          <div className="p-2 text-center text-white text-xs text-neutral-400">
            Note: Automatic barcode detection from camera requires additional setup
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
