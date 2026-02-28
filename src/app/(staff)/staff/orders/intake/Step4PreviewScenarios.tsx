"use client";

import { useState, useEffect } from "react";
import { Eye, Copy, CheckCircle, DollarSign, Calculator, Save, BookOpen } from "lucide-react";
import type { IntakeData } from "./page";
import { saveTemplate, loadTemplates, deleteTemplate, applyTemplate, type OrderTemplate } from "./utils/templates";

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
  const [templates, setTemplates] = useState<OrderTemplate[]>([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");

  // Load templates on mount
  useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

  // Calculate pricing for current design
  useEffect(() => {
    if (data.width > 0 && data.height > 0 && data.frames.length > 0 && data.glassType) {
      calculatePricing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.width, data.height, data.frames.length, data.mats.length, data.glassType, data.mountingType]);

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert("Please enter a template name");
      return;
    }
    saveTemplate(templateName.trim(), templateDescription.trim() || undefined, data);
    setTemplates(loadTemplates());
    setShowSaveTemplate(false);
    setTemplateName("");
    setTemplateDescription("");
    alert(`Template "${templateName}" saved successfully!`);
  };

  const handleLoadTemplate = (template: OrderTemplate) => {
    const updated = applyTemplate(template, data);
    updateData(updated);
    setShowTemplateModal(false);
  };

  const handleDeleteTemplate = (templateId: string, templateName: string) => {
    if (confirm(`Delete template "${templateName}"?`)) {
      deleteTemplate(templateId);
      setTemplates(loadTemplates());
    }
  };

  const calculatePricing = async () => {
    setCalculating(true);
    try {
      // Build components array
      const components: any[] = [];

      // Add frames
      data.frames.forEach((frame) => {
        components.push({
          category: "frame",
          priceCodeId: frame.priceCodeId || undefined,
          vendorItemId: frame.vendorItemId || undefined,
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

      {/* Templates */}
      <div className="flex gap-3 items-center justify-center pt-4 border-t-2 border-neutral-200">
        <button
          onClick={() => setShowTemplateModal(true)}
          className="flex items-center gap-2 rounded-xl border-2 border-neutral-300 px-4 py-2 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-all"
        >
          <BookOpen className="w-4 h-4" />
          Load Template
        </button>
        <button
          onClick={() => setShowSaveTemplate(true)}
          className="flex items-center gap-2 rounded-xl border-2 border-blue-300 bg-blue-50 px-4 py-2 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-all"
        >
          <Save className="w-4 h-4" />
          Save as Template
        </button>
      </div>

      {/* Save Template Modal */}
      {showSaveTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold mb-4">Save as Template</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full rounded-xl border-2 border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Standard Photo Frame"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full rounded-xl border-2 border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Brief description of this template..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveTemplate}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-white text-base font-semibold hover:bg-blue-700 transition-all"
                >
                  Save Template
                </button>
                <button
                  onClick={() => {
                    setShowSaveTemplate(false);
                    setTemplateName("");
                    setTemplateDescription("");
                  }}
                  className="px-4 py-3 rounded-xl border-2 border-neutral-300 text-base text-neutral-700 font-medium hover:bg-neutral-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Load Template</h3>
            {templates.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
                <p>No templates saved yet.</p>
                <p className="text-sm mt-2">Save your current configuration as a template to reuse it later.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border-2 border-neutral-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-bold text-lg text-neutral-900">{template.name}</div>
                        {template.description && (
                          <div className="text-sm text-neutral-600 mt-1">{template.description}</div>
                        )}
                        <div className="text-xs text-neutral-500 mt-2">
                          Saved {new Date(template.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadTemplate(template)}
                          className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition-all"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id, template.name)}
                          className="rounded-lg border-2 border-red-300 text-red-700 px-4 py-2 text-sm font-semibold hover:bg-red-50 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="rounded-xl border-2 border-neutral-300 px-6 py-3 text-base text-neutral-700 font-medium hover:bg-neutral-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5">
        <p className="text-base text-blue-800">
          <strong>💡 Tip:</strong> Create multiple scenarios to show customers different design options.
          You can modify the current design and save it as a new scenario, or duplicate an existing
          scenario and make changes. Save templates to quickly reuse common configurations.
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
