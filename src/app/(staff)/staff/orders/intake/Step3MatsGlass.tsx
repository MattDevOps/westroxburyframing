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

interface Step3Props {
  data: IntakeData;
  updateData: (updates: Partial<IntakeData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const MOUNTING_TYPES = [
  { value: "standard", label: "Standard Mounting" },
  { value: "conservation", label: "Conservation Mounting" },
  { value: "dry_mount", label: "Dry Mount" },
  { value: "stretch", label: "Stretch Canvas" },
];

export default function Step3MatsGlass({ data, updateData, onNext, onBack }: Step3Props) {
  const [matPriceCodes, setMatPriceCodes] = useState<PriceCode[]>([]);
  const [glassPriceCodes, setGlassPriceCodes] = useState<PriceCode[]>([]);
  const [mountingPriceCodes, setMountingPriceCodes] = useState<PriceCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatId, setSelectedMatId] = useState<string>("");

  useEffect(() => {
    async function loadPriceCodes() {
      try {
        const [matRes, glassRes, mountRes] = await Promise.all([
          fetch("/staff/api/price-codes?category=mat&active=true"),
          fetch("/staff/api/price-codes?category=glass&active=true"),
          fetch("/staff/api/price-codes?category=mounting&active=true"),
        ]);

        if (matRes.ok) {
          const matData = await matRes.json();
          setMatPriceCodes(matData.priceCodes || []);
        }
        if (glassRes.ok) {
          const glassData = await glassRes.json();
          setGlassPriceCodes(glassData.priceCodes || []);
        }
        if (mountRes.ok) {
          const mountData = await mountRes.json();
          setMountingPriceCodes(mountData.priceCodes || []);
        }
      } catch (e) {
        console.error("Failed to load price codes:", e);
      } finally {
        setLoading(false);
      }
    }
    loadPriceCodes();
  }, []);

  const addMat = () => {
    if (!selectedMatId) return;

    const priceCode = matPriceCodes.find((pc) => pc.id === selectedMatId);
    if (!priceCode) return;

    updateData({
      mats: [
        ...data.mats,
        {
          priceCodeId: priceCode.id,
          description: priceCode.name,
        },
      ],
    });
    setSelectedMatId("");
  };

  const removeMat = (index: number) => {
    updateData({
      mats: data.mats.filter((_, i) => i !== index),
    });
  };

  const canProceed = data.glassType !== null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Step 3: Mats & Glass</h2>
        <p className="text-sm text-neutral-600">
          Select mats (optional), glass type, mounting method, and any add-ons
        </p>
      </div>

      {/* Mats */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700">
          Mats (Optional)
        </label>
        <div className="flex gap-2">
          <select
            value={selectedMatId}
            onChange={(e) => setSelectedMatId(e.target.value)}
            className="flex-1 rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Choose a mat (optional)...</option>
            {matPriceCodes.map((pc) => (
              <option key={pc.id} value={pc.id}>
                {pc.name} ({pc.code}) - ${(pc.baseRate / 100).toFixed(2)}/sqft
              </option>
            ))}
          </select>
          <button
            onClick={addMat}
            disabled={!selectedMatId || loading}
            className="rounded-xl bg-black px-6 py-2 text-white font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Mat
          </button>
        </div>

        {data.mats.length > 0 && (
          <div className="mt-2 space-y-2">
            {data.mats.map((mat, index) => {
              const priceCode = matPriceCodes.find((pc) => pc.id === mat.priceCodeId);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3"
                >
                  <div>
                    <div className="font-medium text-neutral-900">
                      {mat.description || priceCode?.name || "Mat"}
                    </div>
                    {priceCode && (
                      <div className="text-sm text-neutral-500">
                        {priceCode.code} • ${(priceCode.baseRate / 100).toFixed(2)}/sqft
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeMat(index)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Glass */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700">
          Glass Type <span className="text-red-500">*</span>
        </label>
        <select
          value={data.glassType || ""}
          onChange={(e) => updateData({ glassType: e.target.value || null })}
          className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="">Select glass type...</option>
          {glassPriceCodes.map((pc) => (
            <option key={pc.id} value={pc.id}>
              {pc.name} ({pc.code}) - ${(pc.baseRate / 100).toFixed(2)}/sqft
            </option>
          ))}
        </select>
      </div>

      {/* Mounting */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700">
          Mounting Method
        </label>
        <select
          value={data.mountingType || ""}
          onChange={(e) => updateData({ mountingType: e.target.value || null })}
          className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select mounting method...</option>
          {mountingPriceCodes.map((pc) => (
            <option key={pc.id} value={pc.id}>
              {pc.name} ({pc.code})
            </option>
          ))}
        </select>
      </div>

      {/* Add-ons */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-neutral-700">
          Add-ons (Optional)
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.addOns.spacers}
              onChange={(e) =>
                updateData({
                  addOns: { ...data.addOns, spacers: e.target.checked },
                })
              }
              className="w-5 h-5 rounded border-neutral-300 text-black focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-neutral-700">Spacers</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.addOns.shadowbox}
              onChange={(e) =>
                updateData({
                  addOns: { ...data.addOns, shadowbox: e.target.checked },
                })
              }
              className="w-5 h-5 rounded border-neutral-300 text-black focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-neutral-700">Shadowbox</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.addOns.stretching}
              onChange={(e) =>
                updateData({
                  addOns: { ...data.addOns, stretching: e.target.checked },
                })
              }
              className="w-5 h-5 rounded border-neutral-300 text-black focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-neutral-700">Stretching</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.addOns.fabricWrap}
              onChange={(e) =>
                updateData({
                  addOns: { ...data.addOns, fabricWrap: e.target.checked },
                })
              }
              className="w-5 h-5 rounded border-neutral-300 text-black focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-neutral-700">Fabric Wrap</span>
          </label>
        </div>
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
          Next: Preview & Scenarios →
        </button>
      </div>
    </div>
  );
}
