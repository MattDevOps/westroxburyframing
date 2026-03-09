"use client";

import { useState, useEffect, useRef } from "react";
import { CreditCard, CheckCircle, X, AlertCircle, Radio } from "lucide-react";
import type { IntakeData } from "./page";

interface Step6Props {
  data: IntakeData;
  orderId: string;
  totalAmount: number;
  depositAmount: number;
  onPaymentComplete: () => void;
  onSkip: () => void;
}

export default function Step6Payment({
  data,
  orderId,
  totalAmount,
  depositAmount,
  onPaymentComplete,
  onSkip,
}: Step6Props) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "skip">("card");
  const [cardEntryMethod, setCardEntryMethod] = useState<"manual" | "reader">("manual");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardReady, setCardReady] = useState(false);
  const [readerReady, setReaderReady] = useState(false);
  const [readerConnected, setReaderConnected] = useState(false);
  const [readerStatus, setReaderStatus] = useState<string>("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<any>(null);
  const paymentsRef = useRef<any>(null);

  // Initialize Square Web Payments SDK (for both manual entry and reader)
  useEffect(() => {
    if (paymentMethod !== "card" || !cardContainerRef.current) return;

    let destroyed = false;

    async function initSquare() {
      // Load Square SDK if not already loaded
      if (!(window as any).Square) {
        const script = document.createElement("script");
        const env = process.env.NEXT_PUBLIC_SQUARE_ENV || "sandbox";
        script.src =
          env === "production"
            ? "https://web.squarecdn.com/v1/square.js"
            : "https://sandbox.web.squarecdn.com/v1/square.js";
        script.async = true;
        document.head.appendChild(script);
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Square SDK"));
        });
      }

      if (destroyed) return;

      const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
      const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

      if (!appId || !locationId) {
        setError("Payment system not configured. Please contact support.");
        return;
      }

      try {
        const payments = (window as any).Square.payments(appId, locationId);
        paymentsRef.current = payments;

        const card = await payments.card();
        if (destroyed) {
          await card.destroy();
          return;
        }

        cardRef.current = card;

        if (cardContainerRef.current) {
          await card.attach(cardContainerRef.current);
          setCardReady(true);
        }
      } catch (err: any) {
        console.error("Square SDK init error:", err);
        setError("Could not initialize payment form. Please try refreshing.");
      }
    }

    initSquare();

    return () => {
      destroyed = true;
      if (cardRef.current) {
        try {
          cardRef.current.destroy();
        } catch {}
        cardRef.current = null;
      }
    };
  }, [paymentMethod]);

  // Check for USB card reader (keyboard emulator)
  useEffect(() => {
    if (paymentMethod !== "card" || cardEntryMethod !== "reader") {
      setReaderConnected(false);
      setReaderReady(false);
      return;
    }

    // Most USB card readers work as keyboard emulators
    // They will auto-fill the card form when swiped/inserted
    // We just need to ensure the form is ready and focused
    setReaderStatus("Ready for card swipe/insert. The reader will auto-fill the form below.");
    setReaderReady(true);
    setReaderConnected(true); // Assume connected if user selected reader mode

    // Focus the card container when reader mode is selected
    if (cardContainerRef.current) {
      const input = cardContainerRef.current.querySelector("input");
      if (input) {
        setTimeout(() => input.focus(), 500);
      }
    }
  }, [paymentMethod, cardEntryMethod]);

  const handleCardPayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      let sourceId: string;

      if (cardEntryMethod === "manual") {
        // Manual entry - tokenize card
        if (!cardRef.current) {
          setError("Payment form not ready. Please wait...");
          setProcessing(false);
          return;
        }

        const result = await cardRef.current.tokenize();

        if (result.status !== "OK") {
          setError(
            result.errors?.[0]?.message || "Please check your card details and try again."
          );
          setProcessing(false);
          return;
        }

        sourceId = result.token;
      } else {
        // Card reader mode - USB readers typically work as keyboard emulators
        // They auto-fill the card form, so we use the same tokenization flow
        if (!cardRef.current) {
          setError("Payment form not ready. Please wait...");
          setProcessing(false);
          return;
        }

        setReaderStatus("Processing card from reader...");

        // Tokenize the card (reader has already filled the form)
        const result = await cardRef.current.tokenize();

        if (result.status !== "OK") {
          setError(
            result.errors?.[0]?.message || "Please check your card and try again."
          );
          setProcessing(false);
          setReaderStatus("Card read failed. Please try again.");
          return;
        }

        sourceId = result.token;
        // Continue with normal payment processing below
      }

      // Process payment via API (for manual entry)
      const res = await fetch(`/staff/api/orders/${orderId}/process-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          amount: depositAmount > 0 ? depositAmount : totalAmount,
          paymentMethod: "card",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      setPaymentSuccess(true);
      setTimeout(() => {
        onPaymentComplete();
      }, 2000);
    } catch (e: any) {
      setError(e.message || "Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  const handleCashPayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      const res = await fetch(`/staff/api/orders/${orderId}/process-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: depositAmount > 0 ? depositAmount : totalAmount,
          paymentMethod: "cash",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to record payment");
      }

      setPaymentSuccess(true);
      setTimeout(() => {
        onPaymentComplete();
      }, 2000);
    } catch (e: any) {
      setError(e.message || "Failed to record payment");
      setProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="space-y-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-600 mb-4">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-neutral-900">Payment Successful!</h2>
        <p className="text-lg text-neutral-600">Redirecting to receipt...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 mb-4">
          <CreditCard className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">Payment</h2>
        <p className="text-base text-neutral-600">
          Process payment for this order
        </p>
      </div>

      {/* Payment Summary */}
      <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 md:p-8">
        <div className="space-y-3">
          <div className="flex justify-between text-lg">
            <span className="text-neutral-600">Order Total:</span>
            <span className="font-bold text-2xl">${(totalAmount / 100).toFixed(2)}</span>
          </div>
          {depositAmount > 0 && (
            <>
              <div className="flex justify-between text-base">
                <span className="text-neutral-600">Deposit ({data.depositPercent}%):</span>
                <span className="font-semibold text-xl text-blue-600">
                  ${(depositAmount / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-blue-200">
                <span className="text-neutral-600">Balance Due:</span>
                <span className="font-semibold">
                  ${((totalAmount - depositAmount) / 100).toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-3">
        <label className="block text-base md:text-lg font-semibold text-neutral-900">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setPaymentMethod("card")}
            className={`rounded-2xl border-2 p-6 text-center transition-all ${
              paymentMethod === "card"
                ? "border-blue-600 bg-blue-50"
                : "border-neutral-200 bg-white hover:border-blue-300"
            }`}
          >
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="font-semibold text-base">Card</div>
            <div className="text-sm text-neutral-600 mt-1">Credit/Debit</div>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("cash")}
            className={`rounded-2xl border-2 p-6 text-center transition-all ${
              paymentMethod === "cash"
                ? "border-green-600 bg-green-50"
                : "border-neutral-200 bg-white hover:border-green-300"
            }`}
          >
            <div className="w-8 h-8 mx-auto mb-2 text-2xl">💵</div>
            <div className="font-semibold text-base">Cash</div>
            <div className="text-sm text-neutral-600 mt-1">Record payment</div>
          </button>
        </div>
      </div>

      {/* Card Payment Form */}
      {paymentMethod === "card" && (
        <div className="space-y-4">
          {/* Card Entry Method Selection */}
          <div className="space-y-3">
            <label className="block text-base md:text-lg font-semibold text-neutral-900">
              Card Entry Method
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setCardEntryMethod("manual")}
                className={`rounded-2xl border-2 p-4 text-center transition-all ${
                  cardEntryMethod === "manual"
                    ? "border-blue-600 bg-blue-50"
                    : "border-neutral-200 bg-white hover:border-blue-300"
                }`}
              >
                <CreditCard className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <div className="font-semibold text-sm">Manual Entry</div>
                <div className="text-xs text-neutral-600 mt-1">Type card number</div>
              </button>
              <button
                type="button"
                onClick={() => setCardEntryMethod("reader")}
                className={`rounded-2xl border-2 p-4 text-center transition-all ${
                  cardEntryMethod === "reader"
                    ? "border-green-600 bg-green-50"
                    : "border-neutral-200 bg-white hover:border-green-300"
                }`}
              >
                <Radio className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <div className="font-semibold text-sm">Card Reader</div>
                <div className="text-xs text-neutral-600 mt-1">USB reader</div>
              </button>
            </div>
          </div>

          {/* Manual Entry Form */}
          {cardEntryMethod === "manual" && (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-neutral-200 bg-white p-6">
                <label className="block text-base font-semibold text-neutral-900 mb-4">
                  Card Information
                </label>
                <div
                  ref={cardContainerRef}
                  className="min-h-[200px] rounded-xl border-2 border-neutral-300 p-4"
                />
                {!cardReady && (
                  <div className="text-center py-8 text-neutral-500">
                    Loading payment form...
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-red-800 text-sm">{error}</div>
                </div>
              )}

              <button
                onClick={handleCardPayment}
                disabled={!cardReady || processing}
                className="w-full rounded-2xl bg-blue-600 px-8 py-5 text-white text-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3"
              >
                {processing ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-6 h-6" />
                    Process Card Payment
                  </>
                )}
              </button>
            </div>
          )}

          {/* Card Reader Form */}
          {cardEntryMethod === "reader" && (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6">
                <div className="text-center space-y-4 mb-4">
                  <Radio className="w-12 h-12 mx-auto text-green-600" />
                  <div>
                    <div className="font-semibold text-lg text-neutral-900 mb-2">
                      USB Card Reader Mode
                    </div>
                    <div className="text-sm text-neutral-600">
                      {readerStatus || "Ready for card swipe/insert"}
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500 mt-4 p-3 bg-white rounded-lg">
                    💡 Plug your USB card reader into the tablet. Swipe, insert, or tap the card - it will auto-fill the form below.
                  </div>
                </div>
                
                {/* Card form (hidden but active for reader input) */}
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">
                    Card Information (auto-filled by reader)
                  </label>
                  <div
                    ref={cardContainerRef}
                    className="min-h-[180px] rounded-xl border-2 border-green-300 bg-white p-4"
                  />
                  {!cardReady && (
                    <div className="text-center py-6 text-neutral-500 text-sm">
                      Loading payment form... Please swipe/insert card when ready.
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-red-800 text-sm">{error}</div>
                </div>
              )}

              <button
                onClick={handleCardPayment}
                disabled={!cardReady || processing}
                className="w-full rounded-2xl bg-green-600 px-8 py-5 text-white text-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3"
              >
                {processing ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {readerStatus || "Processing Payment..."}
                  </>
                ) : (
                  <>
                    <Radio className="w-6 h-6" />
                    Process Payment
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cash Payment */}
      {paymentMethod === "cash" && (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6">
            <p className="text-base text-green-800 mb-4">
              Record cash payment received from customer.
            </p>
            {error && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}
            <button
              onClick={handleCashPayment}
              disabled={processing}
              className="w-full rounded-2xl bg-green-600 px-8 py-5 text-white text-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3"
            >
              {processing ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Recording Payment...
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6" />
                  Record Cash Payment
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Skip Payment */}
      <div className="pt-4 border-t-2 border-neutral-200">
        <button
          onClick={onSkip}
          disabled={processing}
          className="w-full rounded-xl border-2 border-neutral-300 px-6 py-3 text-neutral-700 text-base font-semibold hover:bg-neutral-50 disabled:opacity-50 transition-all"
        >
          Skip Payment (Process Later)
        </button>
      </div>
    </div>
  );
}
