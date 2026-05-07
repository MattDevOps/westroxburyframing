"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Phone, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

// Dynamically import TwilioComplianceEmbed with SSR disabled since it uses browser-only APIs
const TwilioComplianceEmbed = dynamic(
  () => import("@twilio/twilio-compliance-embed").then((mod) => mod.TwilioComplianceEmbed),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    ),
  }
);

export default function TwilioSettingsPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [useCaseCategories, setUseCaseCategories] = useState<string[]>([]);
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState("");
  const [businessRegistrationAuthority, setBusinessRegistrationAuthority] = useState("EIN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inquiryData, setInquiryData] = useState<{
    inquiry_id: string;
    inquiry_session_token: string;
  } | null>(null);
  const [embedReady, setEmbedReady] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Load current Twilio phone number from environment or allow manual entry
  useEffect(() => {
    // You can pre-fill with TWILIO_PHONE_NUMBER if available
    const twilioNumber = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || "";
    if (twilioNumber) {
      setPhoneNumber(twilioNumber);
    }
  }, []);

  // Default use case categories for informational messages
  const defaultUseCaseCategories = ["ACCOUNT_NOTIFICATIONS", "DELIVERY_NOTIFICATIONS"];

  useEffect(() => {
    if (useCaseCategories.length === 0) {
      setUseCaseCategories(defaultUseCaseCategories);
    }
  }, []);

  async function handleInitialize() {
    setError(null);
    setLoading(true);
    setInquiryData(null);
    setEmbedReady(false);
    setInquirySubmitted(false);

    try {
      const response = await fetch("/staff/api/twilio/toll-free/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tollfreePhoneNumber: phoneNumber.trim(),
          notificationEmail: notificationEmail.trim(),
          useCaseCategories: useCaseCategories.length > 0 ? useCaseCategories : defaultUseCaseCategories,
          businessRegistrationNumber: businessRegistrationNumber.trim() || undefined,
          businessRegistrationAuthority: businessRegistrationAuthority || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize verification");
      }

      setInquiryData({
        inquiry_id: data.inquiry_id,
        inquiry_session_token: data.inquiry_session_token,
      });
    } catch (e: any) {
      setError(e.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function checkVerificationStatus() {
    if (!phoneNumber.trim()) return;

    setCheckingStatus(true);
    setError(null);

    try {
      const response = await fetch(
        `/staff/api/twilio/toll-free/status?phoneNumber=${encodeURIComponent(phoneNumber.trim())}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check status");
      }

      setVerificationStatus(data.status || "not_found");
    } catch (e: any) {
      setError(e.message || "Failed to check status");
    } finally {
      setCheckingStatus(false);
    }
  }

  const handleInquirySubmitted = () => {
    setInquirySubmitted(true);
    // Optionally check status after submission
    setTimeout(() => {
      checkVerificationStatus();
    }, 2000);
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-neutral-100 text-neutral-600">
          Not verified
        </span>
      );
    }

    const statusMap: Record<string, { color: string; label: string }> = {
      approved: { color: "bg-emerald-100 text-emerald-700", label: "Approved" },
      pending: { color: "bg-yellow-100 text-yellow-700", label: "Pending" },
      rejected: { color: "bg-red-100 text-red-700", label: "Rejected" },
      in_progress: { color: "bg-blue-100 text-blue-700", label: "In Progress" },
    };

    const statusInfo = statusMap[status.toLowerCase()] || {
      color: "bg-neutral-100 text-neutral-600",
      label: status,
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Twilio Toll-Free Verification</h1>
        <p className="text-sm text-neutral-600">
          Verify your toll-free phone number with Twilio to ensure compliance with messaging regulations.
          This is required for sending SMS messages from toll-free numbers.
        </p>
      </div>

      {/* Status Check Section */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Verification Status</h2>
          <button
            onClick={checkVerificationStatus}
            disabled={checkingStatus || !phoneNumber.trim()}
            className="text-sm px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkingStatus ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking...
              </span>
            ) : (
              "Check Status"
            )}
          </button>
        </div>
        {verificationStatus !== null && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">Status:</span>
            {getStatusBadge(verificationStatus)}
          </div>
        )}
      </div>

      {/* Initialize Form */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">Start Verification</h2>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {inquirySubmitted && (
          <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">
              Verification submitted successfully! Check your email for updates on the verification status.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Toll-Free Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+18555551234"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              required
            />
            <p className="mt-1 text-xs text-neutral-500">
              Enter in E.164 format (e.g., +18555551234)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Notification Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="notifications@example.com"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              required
            />
            <p className="mt-1 text-xs text-neutral-500">
              Email address to receive verification status updates
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Use Case Categories
          </label>
          <div className="space-y-2">
            {[
              { value: "ACCOUNT_NOTIFICATIONS", label: "Account Notifications" },
              { value: "DELIVERY_NOTIFICATIONS", label: "Delivery Notifications" },
              { value: "CUSTOMER_CARE", label: "Customer Care" },
              { value: "TWO_FACTOR_AUTHENTICATION", label: "Two-Factor Authentication" },
              { value: "MARKETING", label: "Marketing" },
            ].map((category) => (
              <label key={category.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useCaseCategories.includes(category.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setUseCaseCategories([...useCaseCategories, category.value]);
                    } else {
                      setUseCaseCategories(useCaseCategories.filter((c) => c !== category.value));
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm text-neutral-700">{category.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Business Registration Number (Optional)
            </label>
            <input
              type="text"
              value={businessRegistrationNumber}
              onChange={(e) => setBusinessRegistrationNumber(e.target.value)}
              placeholder="12-3456789"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-neutral-500">
              EIN for US businesses (9 digits, optionally formatted with hyphen)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Business Registration Authority
            </label>
            <select
              value={businessRegistrationAuthority}
              onChange={(e) => setBusinessRegistrationAuthority(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="EIN">EIN (US)</option>
              <option value="DUNS">DUNS</option>
              <option value="ABN">ABN (Australia)</option>
              <option value="CNPJ">CNPJ (Brazil)</option>
              <option value="CVR">CVR (Denmark)</option>
              <option value="GSTIN">GSTIN (India)</option>
              <option value="HMRC">HMRC (UK)</option>
              <option value="IEC">IEC (India)</option>
              <option value="PAN">PAN (India)</option>
              <option value="RFC">RFC (Mexico)</option>
              <option value="SSN">SSN (US)</option>
              <option value="VAT">VAT (EU)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleInitialize}
          disabled={loading || !phoneNumber.trim() || !notificationEmail.trim()}
          className="w-full md:w-auto px-6 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Initializing...
            </span>
          ) : (
            "Start Verification"
          )}
        </button>
      </div>

      {/* Compliance Embed */}
      {inquiryData && (
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Verification Form</h2>
          <div className="min-h-[600px]">
            {!embedReady && (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
              </div>
            )}
            <TwilioComplianceEmbed
              inquiryId={inquiryData.inquiry_id}
              inquirySessionToken={inquiryData.inquiry_session_token}
              onReady={() => {
                setEmbedReady(true);
              }}
              onInquirySubmitted={handleInquirySubmitted}
              onComplete={() => {
                console.log("Verification completed");
              }}
              onCancel={() => {
                setError("Verification was cancelled");
              }}
              onError={() => {
                setError("An error occurred in the verification form");
              }}
            />
          </div>
        </div>
      )}

      {/* Documentation Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Need help?</strong> See the{" "}
          <a
            href="https://www.twilio.com/docs/messaging/compliance/toll-free/compliance-embeddable-onboarding"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-700"
          >
            Twilio Compliance Embeddable Onboarding Guide
          </a>
          {" "}for more information.
        </p>
      </div>
    </div>
  );
}
