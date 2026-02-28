"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Step components
import Step1CustomerArtwork from "./Step1CustomerArtwork";
import Step2FrameSelection from "./Step2FrameSelection";
import Step3MatsGlass from "./Step3MatsGlass";
import Step4PreviewScenarios from "./Step4PreviewScenarios";
import Step5ConfirmDeposit from "./Step5ConfirmDeposit";
import Step6Payment from "./Step6Payment";

export interface FrameSelection {
  priceCodeId?: string;
  vendorItemId?: string;
  description?: string;
}

export interface MatSelection {
  priceCodeId: string;
  vendorItemId?: string;
  description?: string;
}

export interface Scenario {
  id: string;
  label: string;
  frames: FrameSelection[];
  mats: MatSelection[];
  glassType: string | null;
  mountingType: string | null;
  addOns: {
    spacers: boolean;
    shadowbox: boolean;
    stretching: boolean;
    fabricWrap: boolean;
  };
  subtotal: number;
  total: number;
}

export interface IntakeData {
  // Step 1: Customer + Artwork
  customerId: string | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
  } | null;
  artworkType: string;
  width: number;
  height: number;
  units: "in" | "cm";
  itemDescription: string | null;
  photos: string[];

  // Step 2: Frame Selection
  frames: FrameSelection[];

  // Step 3: Mats + Glass
  mats: MatSelection[];
  glassType: string | null;
  mountingType: string | null;
  addOns: {
    spacers: boolean;
    shadowbox: boolean;
    stretching: boolean;
    fabricWrap: boolean;
  };

  // Step 4: Scenarios
  scenarios: Scenario[];
  selectedScenarioIndex: number | null;

  // Step 5: Pricing
  pricing: {
    subtotal: number;
    tax: number;
    total: number;
    lineItems: Array<{ description: string; lineTotal: number }>;
  } | null;
  discountType: "none" | "percent" | "fixed";
  discountValue: number;
  depositPercent: number;
  expectedCompletionDays: number;
  notesInternal: string | null;
  notesCustomer: string | null;
}

const INITIAL_DATA: IntakeData = {
  customerId: null,
  customer: null,
  artworkType: "",
  width: 0,
  height: 0,
  units: "in",
  itemDescription: null,
  photos: [],
  frames: [],
  mats: [],
  glassType: null,
  mountingType: null,
  addOns: {
    spacers: false,
    shadowbox: false,
    stretching: false,
    fabricWrap: false,
  },
  scenarios: [],
  selectedScenarioIndex: null,
  pricing: null,
  discountType: "none",
  discountValue: 0,
  depositPercent: 50,
  expectedCompletionDays: 10,
  notesInternal: null,
  notesCustomer: null,
};

export default function OrderIntakePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<IntakeData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [emailingReceipt, setEmailingReceipt] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const updateData = (updates: Partial<IntakeData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 2:
        return !!(
          data.customerId &&
          data.artworkType &&
          data.width > 0 &&
          data.height > 0
        );
      case 3:
        return data.frames.length > 0;
      case 4:
        return data.mats.length >= 0 && data.glassType !== null;
      case 5:
        return data.pricing !== null;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canProceedToStep(currentStep + 1)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      setError(null);
    } else {
      setError("Please complete all required fields before proceeding.");
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!data.customerId || !data.pricing) {
      setError("Please complete all steps before submitting.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build order components from selected scenario or current selections
      const activeScenario = data.selectedScenarioIndex !== null 
        ? data.scenarios[data.selectedScenarioIndex]
        : null;

      const frames = activeScenario?.frames || data.frames;
      const mats = activeScenario?.mats || data.mats;
      const glassType = activeScenario?.glassType || data.glassType;
      const mountingType = activeScenario?.mountingType || data.mountingType;
      const addOns = activeScenario?.addOns || data.addOns;

      // Build components array
      const components: any[] = [];
      
      // Add frames
      frames.forEach((frame, idx) => {
        components.push({
          category: "frame",
          position: idx,
          priceCodeId: frame.priceCodeId || null,
          vendorItemId: frame.vendorItemId || null,
          description: frame.description || null,
          quantity: 1,
        });
      });

      // Add mats
      mats.forEach((mat, idx) => {
        components.push({
          category: "mat",
          position: frames.length + idx,
          priceCodeId: mat.priceCodeId,
          vendorItemId: mat.vendorItemId || null,
          description: mat.description || null,
          quantity: 1,
        });
      });

      // Add glass
      if (glassType) {
        components.push({
          category: "glass",
          position: frames.length + mats.length,
          priceCodeId: glassType,
          quantity: 1,
        });
      }

      // Add mounting
      if (mountingType) {
        components.push({
          category: "mounting",
          position: components.length,
          priceCodeId: mountingType,
          quantity: 1,
        });
      }

      // Add add-ons
      if (addOns.spacers) {
        components.push({
          category: "extra",
          position: components.length,
          priceCodeId: "spacers",
          quantity: 1,
        });
      }
      if (addOns.shadowbox) {
        components.push({
          category: "extra",
          position: components.length,
          priceCodeId: "shadowbox",
          quantity: 1,
        });
      }
      if (addOns.stretching) {
        components.push({
          category: "extra",
          position: components.length,
          priceCodeId: "stretching",
          quantity: 1,
        });
      }
      if (addOns.fabricWrap) {
        components.push({
          category: "extra",
          position: components.length,
          priceCodeId: "fabric_wrap",
          quantity: 1,
        });
      }

      // Calculate final pricing with discount (already calculated in Step 5, use that)
      const finalSubtotal =
        data.discountType === "percent"
          ? Math.round(data.pricing.subtotal * (1 - data.discountValue / 100))
          : data.discountType === "fixed"
          ? Math.max(0, data.pricing.subtotal - Math.round(data.discountValue * 100))
          : data.pricing.subtotal;
      const finalTax = Math.round(finalSubtotal * 0.0625); // 6.25% MA tax
      const finalTotal = finalSubtotal + finalTax;

      // Convert units to inches for API (API expects inches)
      const widthInches = data.units === "cm" ? data.width / 2.54 : data.width;
      const heightInches = data.units === "cm" ? data.height / 2.54 : data.height;

      // Create order (API will recalculate pricing from components, but we provide discount info)
      const orderRes = await fetch("/staff/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: data.customerId,
          item_type: data.artworkType,
          item_description: data.itemDescription,
          width: widthInches,
          height: heightInches,
          units: "in", // API expects inches
          components: components,
          discount_type: data.discountType,
          discount_value: data.discountType === "none" ? 0 : data.discountValue,
          tax_rate: 0.0625, // 6.25% MA tax
          notes_internal: data.notesInternal,
          notes_customer: data.notesCustomer,
          intake_channel: "walk_in",
        }),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const orderData = await orderRes.json();
      const orderId = orderData.order.id;

      // Upload photos if any
      if (data.photos.length > 0) {
        for (const photoDataUrl of data.photos) {
          if (photoDataUrl.startsWith("data:image/")) {
            try {
              await fetch(`/staff/api/orders/${orderId}/photos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  url: photoDataUrl,
                  caption: "Uploaded during intake",
                }),
              });
            } catch (photoErr) {
              console.error("Failed to upload photo:", photoErr);
              // Don't fail the order creation if photo upload fails
            }
          }
        }
      }

      // Create deposit invoice if deposit percent > 0
      if (data.depositPercent > 0) {
        const depositAmount = Math.round((finalTotal * data.depositPercent) / 100);
        
        const invoiceRes = await fetch(`/staff/api/orders/${orderId}/invoice/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "deposit",
            depositPercent: data.depositPercent,
          }),
        });

        if (!invoiceRes.ok) {
          console.warn("Failed to create deposit invoice:", await invoiceRes.json());
        }
      }

      // Show payment step if deposit is required
      if (data.depositPercent > 0) {
        setShowPayment(true);
        setCreatedOrderId(orderId);
        setCurrentStep(6);
      } else {
        // Set created order ID to show success message
        setCreatedOrderId(orderId);
        // Navigate to order detail after a short delay
        setTimeout(() => {
          router.push(`/staff/orders/${orderId}`);
        }, 3000);
      }
      setLoading(false);
    } catch (e: any) {
      setError(e.message || "Failed to create order");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900">New Order Intake</h1>
          <p className="text-sm sm:text-base md:text-lg text-neutral-600 mt-2">
            Walk your customer through the framing process step by step
          </p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-between py-4 sm:py-6 md:py-8">
            {[1, 2, 3, 4, 5, 6].map((step) => {
              // Hide step 6 if payment not needed
              if (step === 6 && !showPayment && currentStep < 6) return null;
              
              return (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full border-2 font-bold text-sm sm:text-base md:text-lg transition-all touch-manipulation ${
                      currentStep === step
                        ? "bg-black text-white border-black shadow-lg scale-110"
                        : currentStep > step
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white text-neutral-400 border-neutral-300"
                    }`}
                  >
                    {step}
                  </div>
                  {step < 6 && (
                    <div
                      className={`flex-1 h-1 mx-2 sm:mx-3 md:mx-4 transition-colors ${
                        currentStep > step ? "bg-neutral-900" : "bg-neutral-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between pb-4 sm:pb-6 text-xs sm:text-sm md:text-base text-neutral-600 font-medium">
            <span className="text-center flex-1 px-1">Customer & Artwork</span>
            <span className="text-center flex-1 px-1">Frame</span>
            <span className="text-center flex-1 px-1">Mats & Glass</span>
            <span className="text-center flex-1 px-1">Preview</span>
            <span className="text-center flex-1 px-1">Confirm</span>
            {showPayment && <span className="text-center flex-1 px-1">Payment</span>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12">
        {createdOrderId && (
          <div className="mb-6 rounded-2xl border-2 border-green-200 bg-green-50 p-6 md:p-8 text-green-800 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-bold text-xl mb-2">✅ Order Created Successfully!</div>
                <div className="text-base mb-4">
                  Order #{createdOrderId.slice(0, 8)}... has been created. Redirecting to order details...
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={`/staff/api/orders/${createdOrderId}/receipt`}
                    target="_blank"
                    className="rounded-xl bg-green-600 text-white px-6 py-3 text-base font-semibold hover:bg-green-700 transition-all shadow-lg"
                  >
                    🧾 Print Receipt
                  </a>
                  {data.customer?.email && (
                    <button
                      onClick={async () => {
                        setEmailingReceipt(true);
                        try {
                          const res = await fetch(`/staff/api/orders/${createdOrderId}/email-receipt`, {
                            method: "POST",
                          });
                          const result = await res.json();
                          if (res.ok) {
                            alert(`Receipt emailed to ${data.customer?.email}`);
                          } else {
                            alert(result.error || "Failed to email receipt");
                          }
                        } catch (e: any) {
                          alert("Failed to email receipt: " + e.message);
                        } finally {
                          setEmailingReceipt(false);
                        }
                      }}
                      disabled={emailingReceipt}
                      className="rounded-xl bg-blue-600 text-white px-6 py-3 text-base font-semibold hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50"
                    >
                      {emailingReceipt ? "Sending..." : "📧 Email Receipt"}
                    </button>
                  )}
                  <a
                    href={`/staff/orders/${createdOrderId}`}
                    className="rounded-xl border-2 border-green-600 text-green-700 px-6 py-3 text-base font-semibold hover:bg-green-100 transition-all"
                  >
                    View Order
                  </a>
                </div>
                {!data.customer?.email && (
                  <div className="mt-3 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                    ⚠️ Customer doesn't have an email address. Cannot send receipt via email.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 rounded-2xl border-2 border-red-200 bg-red-50 p-5 md:p-6 text-red-800 shadow-sm">
            <div className="font-semibold text-lg mb-1">Error</div>
            <div>{error}</div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg p-4 sm:p-6 md:p-8 lg:p-10">
          {currentStep === 1 && (
            <Step1CustomerArtwork
              data={data}
              updateData={updateData}
              onNext={handleNext}
            />
          )}
          {currentStep === 2 && (
            <Step2FrameSelection
              data={data}
              updateData={updateData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && (
            <Step3MatsGlass
              data={data}
              updateData={updateData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 4 && (
            <Step4PreviewScenarios
              data={data}
              updateData={updateData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 5 && (
            <Step5ConfirmDeposit
              data={data}
              updateData={updateData}
              onSubmit={handleSubmit}
              onBack={handleBack}
              loading={loading}
            />
          )}
          {currentStep === 6 && createdOrderId && (
            <Step6Payment
              data={data}
              orderId={createdOrderId}
              totalAmount={data.pricing ? data.pricing.total : 0}
              depositAmount={
                data.pricing && data.depositPercent > 0
                  ? Math.round((data.pricing.total * data.depositPercent) / 100)
                  : 0
              }
              onPaymentComplete={() => {
                setCreatedOrderId(createdOrderId);
                setTimeout(() => {
                  router.push(`/staff/orders/${createdOrderId}`);
                }, 1000);
              }}
              onSkip={() => {
                setCreatedOrderId(createdOrderId);
                setTimeout(() => {
                  router.push(`/staff/orders/${createdOrderId}`);
                }, 1000);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
