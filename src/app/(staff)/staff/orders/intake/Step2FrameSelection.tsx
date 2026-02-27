"use client";

import { useState, useEffect } from "react";
import type { IntakeData } from "./page";

interface PriceCode {
  id: string;
  code: string;
  name: string;
  category: string;
  formula: string;
  baseRate: number;
}

interface Step2Props {
  data: IntakeData;
  updateData: (updates: Partial<IntakeData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2FrameSelection({ data, updateData, onNext, onBack }: Step2Props) {
  const [priceCodes, setPriceCodes] = useState<PriceCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFrameId, setSelectedFrameId] = useState<string>("");

  useEffect(() => {
    async function loadPriceCodes() {
      try {
        const res = await fetch("/staff/api/price-codes?category=frame&active=true");
        if (res.ok) {
          const result = await res.json();
          setPriceCodes(result.priceCodes || []);
        }
      } catch (e) {
        console.error("Failed to load price codes:", e);
      } finally {
        setLoading(false);
      }
    }
    loadPriceCodes();
  }, []);

  const addFrame = () => {
    if (!selectedFrameId) return;

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
    setSelectedFrameId("");
  };

  const removeFrame = (index: number) => {
    updateData({
      frames: data.frames.filter((_, i) => i !== index),
    });
  };

  const canProceed = data.frames.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Step 2: Frame Selection</h2>
        <p className="text-sm text-neutral-600">
          Select one or more frames for this order. You can add multiple frames for stacked designs.
        </p>
      </div>

      {/* Frame Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700">
          Select Frame <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <select
            value={selectedFrameId}
            onChange={(e) => setSelectedFrameId(e.target.value)}
            className="flex-1 rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Choose a frame...</option>
            {priceCodes.map((pc) => (
              <option key={pc.id} value={pc.id}>
                {pc.name} ({pc.code}) - ${(pc.baseRate / 100).toFixed(2)}/ft
              </option>
            ))}
          </select>
          <button
            onClick={addFrame}
            disabled={!selectedFrameId || loading}
            className="rounded-xl bg-black px-6 py-2 text-white font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Frame
          </button>
        </div>
        {loading && (
          <p className="text-sm text-neutral-500">Loading frames...</p>
        )}
      </div>

      {/* Selected Frames */}
      {data.frames.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">
            Selected Frames ({data.frames.length})
          </label>
          <div className="space-y-2">
            {data.frames.map((frame, index) => {
              const priceCode = priceCodes.find((pc) => pc.id === frame.priceCodeId);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4"
                >
                  <div>
                    <div className="font-medium text-neutral-900">
                      {frame.description || priceCode?.name || "Frame"}
                    </div>
                    {priceCode && (
                      <div className="text-sm text-neutral-500">
                        {priceCode.code} • ${(priceCode.baseRate / 100).toFixed(2)}/ft
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFrame(index)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> For stacked frames, add multiple frames in order (outermost first).
          Pricing will be calculated based on the artwork size and frame perimeter.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-neutral-200">
        <button
          onClick={onBack}
          className="rounded-xl border border-neutral-300 px-6 py-3 text-neutral-700 font-medium hover:bg-neutral-50"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="rounded-xl bg-black px-6 py-3 text-white font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Mats & Glass →
        </button>
      </div>
    </div>
  );
}
