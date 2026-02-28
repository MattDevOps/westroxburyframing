"use client";

import { useState, useEffect } from "react";
import { Frame, Plus, X, DollarSign } from "lucide-react";
import type { IntakeData } from "./page";

interface PriceCode {
  id: string;
  code: string;
  name: string;
  category: string;
  formula: string;
  baseRate: number;
}

interface VendorCatalogItem {
  id: string;
  itemNumber: string;
  description: string | null;
  category: string;
  unitType: string;
  costPerUnit: number;
  retailPerUnit: number | null;
  vendor: {
    id: string;
    name: string;
    code: string;
  };
}

interface Step2Props {
  data: IntakeData;
  updateData: (updates: Partial<IntakeData>) => void;
  onNext: () => void;
  onBack: () => void;
}

type FrameSource = "priceCode" | "vendorItem";

interface InventoryCheck {
  vendorItemId: string;
  warning: string | null;
  isLowStock: boolean;
  isInsufficient: boolean;
}

export default function Step2FrameSelection({ data, updateData, onNext, onBack }: Step2Props) {
  const [priceCodes, setPriceCodes] = useState<PriceCode[]>([]);
  const [vendorItems, setVendorItems] = useState<VendorCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFrameId, setSelectedFrameId] = useState<string>("");
  const [frameSource, setFrameSource] = useState<FrameSource>("priceCode");
  const [inventoryChecks, setInventoryChecks] = useState<Map<string, InventoryCheck>>(new Map());
  const [checkingInventory, setCheckingInventory] = useState(false);

  useEffect(() => {
    async function loadFrames() {
      try {
        const [priceCodesRes, vendorItemsRes] = await Promise.all([
          fetch("/staff/api/price-codes?category=frame&active=true"),
          fetch("/staff/api/pricing/quick-price-check?category=moulding"),
        ]);

        if (priceCodesRes.ok) {
          const priceCodesData = await priceCodesRes.json();
          setPriceCodes(priceCodesData.priceCodes || []);
        }

        if (vendorItemsRes.ok) {
          const vendorItemsData = await vendorItemsRes.json();
          setVendorItems(vendorItemsData.items || []);
        }
      } catch (e) {
        console.error("Failed to load frames:", e);
      } finally {
        setLoading(false);
      }
    }
    loadFrames();
  }, []);

  // Check inventory when frames change
  useEffect(() => {
    const checkInventory = async () => {
      const vendorItemIds = data.frames
        .map((f) => f.vendorItemId)
        .filter((id): id is string => !!id);

      if (vendorItemIds.length === 0) {
        setInventoryChecks(new Map());
        return;
      }

      setCheckingInventory(true);
      try {
        const widthInches = data.units === "cm" ? data.width / 2.54 : data.width;
        const heightInches = data.units === "cm" ? data.height / 2.54 : data.height;

        const res = await fetch("/staff/api/inventory/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendorItemIds,
            width: widthInches,
            height: heightInches,
          }),
        });

        if (res.ok) {
          const { checks } = await res.json();
          const checksMap = new Map<string, InventoryCheck>();
          for (const check of checks) {
            checksMap.set(check.vendorItemId, {
              vendorItemId: check.vendorItemId,
              warning: check.warning,
              isLowStock: check.isLowStock || false,
              isInsufficient: check.isInsufficient || false,
            });
          }
          setInventoryChecks(checksMap);
        }
      } catch (e) {
        console.error("Failed to check inventory:", e);
      } finally {
        setCheckingInventory(false);
      }
    };

    if (data.width > 0 && data.height > 0) {
      checkInventory();
    }
  }, [data.frames, data.width, data.height, data.units]);

  const addFrame = () => {
    if (!selectedFrameId) return;

    if (frameSource === "priceCode") {
      const priceCode = priceCodes.find((pc) => pc.id === selectedFrameId);
      if (!priceCode) return;

      updateData({
        frames: [
          ...data.frames,
          {
            priceCodeId: priceCode.id,
            description: priceCode.name,
          },
        ],
      });
    } else {
      const vendorItem = vendorItems.find((vi) => vi.id === selectedFrameId);
      if (!vendorItem) return;

      // Find or create a matching price code for this vendor item
      // For now, we'll use the vendor item's retail price if available
      // In a full implementation, you'd want to link vendor items to price codes
      updateData({
        frames: [
          ...data.frames,
          {
            vendorItemId: vendorItem.id,
            description: vendorItem.description || `${vendorItem.vendor.code} ${vendorItem.itemNumber}`,
          },
        ],
      });
    }
    setSelectedFrameId("");
  };

  const removeFrame = (index: number) => {
    updateData({
      frames: data.frames.filter((_, i) => i !== index),
    });
  };

  const canProceed = data.frames.length > 0;

  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-100 mb-4">
          <Frame className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">Step 2: Frame Selection</h2>
        <p className="text-base text-neutral-600">
          Select one or more frames for this order. You can add multiple frames for stacked designs.
        </p>
      </div>

      {/* Frame Selection */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-base md:text-lg font-semibold text-neutral-900">
          <Frame className="w-5 h-5 text-purple-600" />
          Select Frame <span className="text-red-500">*</span>
        </label>

        {/* Source Toggle */}
        <div className="flex gap-2 p-1 bg-neutral-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setFrameSource("priceCode");
              setSelectedFrameId("");
            }}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              frameSource === "priceCode"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Price Codes ({priceCodes.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setFrameSource("vendorItem");
              setSelectedFrameId("");
            }}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              frameSource === "vendorItem"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Vendor Frames ({vendorItems.length})
          </button>
        </div>

        <div className="flex gap-3">
          <select
            value={selectedFrameId}
            onChange={(e) => setSelectedFrameId(e.target.value)}
            className="flex-1 rounded-2xl border-2 border-neutral-300 px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            disabled={loading}
          >
            <option value="">
              {frameSource === "priceCode"
                ? "Choose a price code..."
                : "Choose a vendor frame..."}
            </option>
            {frameSource === "priceCode"
              ? priceCodes.map((pc) => (
                  <option key={pc.id} value={pc.id}>
                    {pc.name} ({pc.code}) - ${(pc.baseRate / 100).toFixed(2)}/ft
                  </option>
                ))
              : vendorItems.map((vi) => (
                  <option key={vi.id} value={vi.id}>
                    {vi.vendor.code} {vi.itemNumber} - {vi.description || "No description"}
                    {vi.retailPerUnit && ` - $${(Number(vi.retailPerUnit) * 100 / 100).toFixed(2)}/${vi.unitType}`}
                  </option>
                ))}
          </select>
          <button
            onClick={addFrame}
            disabled={!selectedFrameId || loading}
            className="rounded-2xl bg-purple-600 px-6 py-4 text-white font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add
          </button>
        </div>
        {loading && (
          <p className="text-base text-neutral-500 text-center py-4">Loading frames...</p>
        )}
        {!loading && frameSource === "vendorItem" && vendorItems.length === 0 && (
          <div className="rounded-xl border-2 border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              <strong>No vendor frames found.</strong> Add frames by going to{" "}
              <a href="/staff/pricing/vendors" className="underline font-semibold">
                Pricing → Vendors
              </a>{" "}
              and adding catalog items with category "moulding".
            </p>
          </div>
        )}
      </div>

      {/* Selected Frames */}
      {data.frames.length > 0 && (
        <div className="space-y-3">
          <label className="block text-base md:text-lg font-semibold text-neutral-900">
            Selected Frames ({data.frames.length})
          </label>
          <div className="space-y-3">
            {data.frames.map((frame, index) => {
              const priceCode = frame.priceCodeId
                ? priceCodes.find((pc) => pc.id === frame.priceCodeId)
                : null;
              const vendorItem = frame.vendorItemId
                ? vendorItems.find((vi) => vi.id === frame.vendorItemId)
                : null;
              const inventoryCheck = frame.vendorItemId ? inventoryChecks.get(frame.vendorItemId) : null;
              
              return (
                <div
                  key={index}
                  className={`rounded-2xl border-2 p-5 shadow-sm ${
                    inventoryCheck?.isInsufficient
                      ? "border-red-300 bg-red-50"
                      : inventoryCheck?.isLowStock
                      ? "border-yellow-300 bg-yellow-50"
                      : "border-purple-200 bg-purple-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
                        <Frame className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-lg text-neutral-900">
                          {frame.description || priceCode?.name || vendorItem?.description || "Frame"}
                        </div>
                        {priceCode && (
                          <div className="text-sm text-neutral-600 flex items-center gap-2 mt-1">
                            <span>Price Code: {priceCode.code}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {(priceCode.baseRate / 100).toFixed(2)}/ft
                          </span>
                        </div>
                      )}
                      {vendorItem && (
                        <div className="text-sm text-neutral-600 flex items-center gap-2 mt-1">
                          <span>{vendorItem.vendor.code} {vendorItem.itemNumber}</span>
                          {vendorItem.retailPerUnit && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {(Number(vendorItem.retailPerUnit) * 100 / 100).toFixed(2)}/{vendorItem.unitType}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeFrame(index)}
                      className="w-10 h-10 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5 space-y-2">
        <p className="text-base text-blue-800">
          <strong>💡 Tip:</strong> For stacked frames, add multiple frames in order (outermost first).
          Pricing will be calculated based on the artwork size and frame perimeter.
        </p>
        <p className="text-sm text-blue-700">
          <strong>Where to add frames:</strong>{" "}
          <a href="/staff/pricing/price-codes" className="underline font-semibold">
            Price Codes
          </a>{" "}
          for pricing tiers, or{" "}
          <a href="/staff/pricing/vendors" className="underline font-semibold">
            Vendors → Catalog Items
          </a>{" "}
          for specific frame models from suppliers.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t-2 border-neutral-200">
        <button
          onClick={onBack}
          className="rounded-2xl border-2 border-neutral-300 px-8 py-4 text-neutral-700 text-base font-bold hover:bg-neutral-50 transition-all min-w-[150px]"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="rounded-2xl bg-black px-8 py-4 text-white text-base font-bold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl min-w-[200px]"
        >
          Next: Mats & Glass →
        </button>
      </div>
    </div>
  );
}
