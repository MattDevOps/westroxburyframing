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
        <div className="flex gap-3">
          <select
            value={selectedFrameId}
            onChange={(e) => setSelectedFrameId(e.target.value)}
            className="flex-1 rounded-2xl border-2 border-neutral-300 px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
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
            className="rounded-2xl bg-purple-600 px-6 py-4 text-white font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add
          </button>
        </div>
        {loading && (
          <p className="text-base text-neutral-500 text-center py-4">Loading frames...</p>
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
              const priceCode = priceCodes.find((pc) => pc.id === frame.priceCodeId);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-2xl border-2 border-purple-200 bg-purple-50 p-5 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
                      <Frame className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-lg text-neutral-900">
                        {frame.description || priceCode?.name || "Frame"}
                      </div>
                      {priceCode && (
                        <div className="text-sm text-neutral-600 flex items-center gap-2 mt-1">
                          <span>{priceCode.code}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {(priceCode.baseRate / 100).toFixed(2)}/ft
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFrame(index)}
                    className="w-10 h-10 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5">
        <p className="text-base text-blue-800">
          <strong>💡 Tip:</strong> For stacked frames, add multiple frames in order (outermost first).
          Pricing will be calculated based on the artwork size and frame perimeter.
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
