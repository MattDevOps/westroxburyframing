"use client";

import { useState, useEffect } from "react";
import { Layers, Shield, Maximize, CheckSquare, X, Plus } from "lucide-react";
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
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 mb-4">
          <Layers className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">Step 3: Mats & Glass</h2>
        <p className="text-base text-neutral-600">
          Select mats (optional), glass type, mounting method, and any add-ons
        </p>
      </div>

      {/* Mats */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-base md:text-lg font-semibold text-neutral-900">
          <Layers className="w-5 h-5 text-indigo-600" />
          Mats (Optional)
        </label>
        <div className="flex gap-3">
          <select
            value={selectedMatId}
            onChange={(e) => setSelectedMatId(e.target.value)}
            className="flex-1 rounded-2xl border-2 border-neutral-300 px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
            className="rounded-2xl bg-indigo-600 px-6 py-4 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add
          </button>
        </div>

        {data.mats.length > 0 && (
          <div className="mt-3 space-y-3">
            {data.mats.map((mat, index) => {
              const priceCode = matPriceCodes.find((pc) => pc.id === mat.priceCodeId);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-4 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-base text-neutral-900">
                        {mat.description || priceCode?.name || "Mat"}
                      </div>
                      {priceCode && (
                        <div className="text-sm text-neutral-600">
                          {priceCode.code} • ${(priceCode.baseRate / 100).toFixed(2)}/sqft
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeMat(index)}
                    className="w-10 h-10 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Glass */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-base md:text-lg font-semibold text-neutral-900">
          <Shield className="w-5 h-5 text-indigo-600" />
          Glass Type <span className="text-red-500">*</span>
        </label>
        <select
          value={data.glassType || ""}
          onChange={(e) => updateData({ glassType: e.target.value || null })}
          className="w-full rounded-2xl border-2 border-neutral-300 px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-base md:text-lg font-semibold text-neutral-900">
          <Maximize className="w-5 h-5 text-indigo-600" />
          Mounting Method
        </label>
        <select
          value={data.mountingType || ""}
          onChange={(e) => updateData({ mountingType: e.target.value || null })}
          className="w-full rounded-2xl border-2 border-neutral-300 px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
        <label className="flex items-center gap-2 text-base md:text-lg font-semibold text-neutral-900">
          <CheckSquare className="w-5 h-5 text-indigo-600" />
          Add-ons (Optional)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 border-neutral-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
            <input
              type="checkbox"
              checked={data.addOns.spacers}
              onChange={(e) =>
                updateData({
                  addOns: { ...data.addOns, spacers: e.target.checked },
                })
              }
              className="w-6 h-6 rounded border-neutral-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-base font-medium text-neutral-700">Spacers</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 border-neutral-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
            <input
              type="checkbox"
              checked={data.addOns.shadowbox}
              onChange={(e) =>
                updateData({
                  addOns: { ...data.addOns, shadowbox: e.target.checked },
                })
              }
              className="w-6 h-6 rounded border-neutral-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-base font-medium text-neutral-700">Shadowbox</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 border-neutral-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
            <input
              type="checkbox"
              checked={data.addOns.stretching}
              onChange={(e) =>
                updateData({
                  addOns: { ...data.addOns, stretching: e.target.checked },
                })
              }
              className="w-6 h-6 rounded border-neutral-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-base font-medium text-neutral-700">Stretching</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 border-neutral-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
            <input
              type="checkbox"
              checked={data.addOns.fabricWrap}
              onChange={(e) =>
                updateData({
                  addOns: { ...data.addOns, fabricWrap: e.target.checked },
                })
              }
              className="w-6 h-6 rounded border-neutral-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-base font-medium text-neutral-700">Fabric Wrap</span>
          </label>
        </div>
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
          Next: Preview & Scenarios →
        </button>
      </div>
    </div>
  );
}
