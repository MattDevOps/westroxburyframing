"use client";

import { useState, useEffect } from "react";
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Step 4: Preview & Scenarios</h2>
        <p className="text-sm text-neutral-600">
          Review the design and pricing. Create multiple options to compare side-by-side.
        </p>
      </div>

      {/* Current Design Preview */}
      {data.pricing && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Current Design</h3>
            <button
              onClick={saveAsScenario}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700"
            >
              Save as Scenario
            </button>
          </div>

          {/* Design Summary */}
          <div className="space-y-3 mb-4">
            <div className="text-sm">
              <span className="font-medium">Size:</span> {data.width} × {data.height} {data.units}
            </div>
            <div className="text-sm">
              <span className="font-medium">Frames:</span> {data.frames.length}
            </div>
            <div className="text-sm">
              <span className="font-medium">Mats:</span> {data.mats.length || "None"}
            </div>
            <div className="text-sm">
              <span className="font-medium">Glass:</span> {data.glassType ? "Selected" : "None"}
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="border-t border-neutral-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Subtotal:</span>
              <span className="font-medium">${(data.pricing.subtotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Tax (6.25%):</span>
              <span className="font-medium">${(data.pricing.tax / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-neutral-200 pt-2">
              <span>Total:</span>
              <span>${(data.pricing.total / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {calculating && (
        <div className="text-center py-4 text-neutral-500">Calculating pricing...</div>
      )}

      {/* Scenarios */}
      {data.scenarios.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-neutral-900">Design Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.scenarios.map((scenario, index) => (
              <div
                key={scenario.id}
                className={`rounded-xl border-2 p-4 ${
                  data.selectedScenarioIndex === index
                    ? "border-black bg-neutral-50"
                    : "border-neutral-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-neutral-900">{scenario.label}</h4>
                  {data.selectedScenarioIndex === index && (
                    <span className="text-xs bg-black text-white px-2 py-1 rounded">
                      Selected
                    </span>
                  )}
                </div>
                <div className="space-y-2 mb-4 text-sm">
                  <div>Frames: {scenario.frames.length}</div>
                  <div>Mats: {scenario.mats.length || "None"}</div>
                  <div className="font-bold text-lg">
                    ${(scenario.total / 100).toFixed(2)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadScenario(index)}
                    className="flex-1 rounded-lg bg-black px-3 py-2 text-white text-sm font-medium hover:bg-neutral-800"
                  >
                    Select
                  </button>
                  <button
                    onClick={() => duplicateScenario(index)}
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    Duplicate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Create multiple scenarios to show customers different design options.
          You can modify the current design and save it as a new scenario, or duplicate an existing
          scenario and make changes.
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
          Next: Confirm & Deposit →
        </button>
      </div>
    </div>
  );
}
