"use client";

import { useState, useEffect } from "react";
import { Eye, Copy, CheckCircle, DollarSign, Calculator } from "lucide-react";
import type { IntakeData } from "./page";

interface Step4Props {
  data: IntakeData;
  updateData: (updates: Partial<IntakeData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step4PreviewScenarios({
  data,
  updateData,
  onNext,
  onBack,
}: Step4Props) {
  const [calculating, setCalculating] = useState(false);

  // Calculate pricing for current design
  useEffect(() => {
    if (data.width > 0 && data.height > 0 && data.frames.length > 0 && data.glassType) {
      calculatePricing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.width, data.height, data.frames.length, data.mats.length, data.glassType, data.mountingType]);

  const calculatePricing = async () => {
    setCalculating(true);
    try {
      // Build components array
      const components: any[] = [];

      // Add frames
      data.frames.forEach((frame) => {
        components.push({
          category: "frame",
          priceCodeId: frame.priceCodeId,
          vendorItemId: frame.vendorItemId,
          quantity: 1,
          width: data.units === "cm" ? data.width / 2.54 : data.width,
          height: data.units === "cm" ? data.height / 2.54 : data.height,
        });
      });

      // Add mats
      data.mats.forEach((mat) => {
        components.push({
          category: "mat",
          priceCodeId: mat.priceCodeId,
          vendorItemId: mat.vendorItemId,
          quantity: 1,
          width: data.units === "cm" ? data.width / 2.54 : data.width,
          height: data.units === "cm" ? data.height / 2.54 : data.height,
        });
      });

      // Add glass
      if (data.glassType) {
        components.push({
          category: "glass",
          priceCodeId: data.glassType,
          quantity: 1,
          width: data.units === "cm" ? data.width / 2.54 : data.width,
          height: data.units === "cm" ? data.height / 2.54 : data.height,
        });
      }

      // Add mounting
      if (data.mountingType) {
        components.push({
          category: "mounting",
          priceCodeId: data.mountingType,
          quantity: 1,
          width: data.units === "cm" ? data.width / 2.54 : data.width,
          height: data.units === "cm" ? data.height / 2.54 : data.height,
        });
      }

      // Add add-ons
      if (data.addOns.spacers) {
        components.push({
          category: "extra",
          priceCodeId: "spacers",
          quantity: 1,
        });
      }
      if (data.addOns.shadowbox) {
        components.push({
          category: "extra",
          priceCodeId: "shadowbox",
          quantity: 1,
        });
      }
      if (data.addOns.stretching) {
        components.push({
          category: "extra",
          priceCodeId: "stretching",
          quantity: 1,
        });
      }
      if (data.addOns.fabricWrap) {
        components.push({
          category: "extra",
          priceCodeId: "fabric_wrap",
          quantity: 1,
        });
      }

      const res = await fetch("/staff/api/pricing/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          width: data.units === "cm" ? data.width / 2.54 : data.width,
          height: data.units === "cm" ? data.height / 2.54 : data.height,
          components,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        const tax = Math.round(result.subtotal * 0.0625); // 6.25% MA tax
        updateData({
          pricing: {
            subtotal: result.subtotal,
            tax,
            total: result.subtotal + tax,
            lineItems: result.lineItems || [],
          },
        });
      }
    } catch (e) {
      console.error("Failed to calculate pricing:", e);
    } finally {
      setCalculating(false);
    }
  };

  const saveAsScenario = () => {
    if (!data.pricing) return;

    const scenarioLabel = `Option ${String.fromCharCode(65 + data.scenarios.length)}`;
    const newScenario = {
      id: `scenario-${Date.now()}`,
      label: scenarioLabel,
      frames: [...data.frames],
      mats: [...data.mats],
      glassType: data.glassType,
      mountingType: data.mountingType,
      addOns: { ...data.addOns },
      subtotal: data.pricing.subtotal,
      total: data.pricing.total,
    };

    updateData({
      scenarios: [...data.scenarios, newScenario],
      selectedScenarioIndex: data.scenarios.length,
    });
  };

  const loadScenario = (index: number) => {
    const scenario = data.scenarios[index];
    if (!scenario) return;

    updateData({
      frames: [...scenario.frames],
      mats: [...scenario.mats],
      glassType: scenario.glassType,
      mountingType: scenario.mountingType,
      addOns: { ...scenario.addOns },
      selectedScenarioIndex: index,
    });
  };

  const duplicateScenario = (index: number) => {
    const scenario = data.scenarios[index];
    if (!scenario) return;

    const newLabel = `Option ${String.fromCharCode(65 + data.scenarios.length)}`;
    const newScenario = {
      ...scenario,
      id: `scenario-${Date.now()}`,
      label: newLabel,
    };

    updateData({
      scenarios: [...data.scenarios, newScenario],
      selectedScenarioIndex: data.scenarios.length,
    });
  };

  const canProceed = data.pricing !== null;

  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 mb-4">
          <Eye className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">Step 4: Preview & Scenarios</h2>
        <p className="text-base text-neutral-600">
          Review the design and pricing. Create multiple options to compare side-by-side.
        </p>
      </div>

      {/* Current Design Preview */}
      {data.pricing && (
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 md:p-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <Calculator className="w-6 h-6 text-emerald-600" />
              Current Design
            </h3>
            <button
              onClick={saveAsScenario}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-white text-base font-bold hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2"
            >
              <Copy className="w-5 h-5" />
              Save as Scenario
            </button>
          </div>

          {/* Design Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-xs text-neutral-500 mb-1">Size</div>
              <div className="font-bold text-lg">{data.width} × {data.height}</div>
              <div className="text-xs text-neutral-500">{data.units}</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-xs text-neutral-500 mb-1">Frames</div>
              <div className="font-bold text-2xl">{data.frames.length}</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-xs text-neutral-500 mb-1">Mats</div>
              <div className="font-bold text-2xl">{data.mats.length || 0}</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-xs text-neutral-500 mb-1">Glass</div>
              <div className="font-bold text-lg">{data.glassType ? "Yes" : "No"}</div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="border-t-2 border-emerald-200 pt-6 space-y-3">
            <div className="flex justify-between text-base">
              <span className="text-neutral-600">Subtotal:</span>
              <span className="font-semibold text-lg">${(data.pricing.subtotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-neutral-600">Tax (6.25%):</span>
              <span className="font-semibold text-lg">${(data.pricing.tax / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold border-t-2 border-emerald-200 pt-3">
              <span className="flex items-center gap-2">
                <DollarSign className="w-6 h-6" />
                Total:
              </span>
              <span className="text-emerald-600">${(data.pricing.total / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {calculating && (
        <div className="text-center py-8 text-neutral-500 text-lg">Calculating pricing...</div>
      )}

      {/* Scenarios */}
      {data.scenarios.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-neutral-900">Design Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.scenarios.map((scenario, index) => (
              <div
                key={scenario.id}
                className={`rounded-2xl border-2 p-6 transition-all ${
                  data.selectedScenarioIndex === index
                    ? "border-emerald-500 bg-emerald-50 shadow-lg scale-105"
                    : "border-neutral-200 bg-white hover:border-emerald-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-xl text-neutral-900">{scenario.label}</h4>
                  {data.selectedScenarioIndex === index && (
                    <span className="flex items-center gap-1 text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-semibold">
                      <CheckCircle className="w-4 h-4" />
                      Selected
                    </span>
                  )}
                </div>
                <div className="space-y-2 mb-5 text-base">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Frames:</span>
                    <span className="font-semibold">{scenario.frames.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Mats:</span>
                    <span className="font-semibold">{scenario.mats.length || "None"}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
                    <span className="text-neutral-600 font-semibold">Total:</span>
                    <span className="font-bold text-2xl text-emerald-600">
                      ${(scenario.total / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => loadScenario(index)}
                    className="flex-1 rounded-xl bg-black px-4 py-3 text-white text-base font-bold hover:bg-neutral-800 transition-all shadow-lg"
                  >
                    Select
                  </button>
                  <button
                    onClick={() => duplicateScenario(index)}
                    className="rounded-xl border-2 border-neutral-300 px-4 py-3 text-base text-neutral-700 font-semibold hover:bg-neutral-50 transition-all"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5">
        <p className="text-base text-blue-800">
          <strong>💡 Tip:</strong> Create multiple scenarios to show customers different design options.
          You can modify the current design and save it as a new scenario, or duplicate an existing
          scenario and make changes.
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
          Next: Confirm & Deposit →
        </button>
      </div>
    </div>
  );
}
