"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface GiftCertificate {
  id: string;
  certificateNumber: string;
  redemptionCode: string | null;
  amount: number;
  balance: number;
  issuedAt: string;
  expiresAt: string | null;
  redeemedAt: string | null;
  notes: string | null;
  source: string | null;
  purchasedByName: string | null;
  purchasedByEmail: string | null;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientMessage: string | null;
  deliverAt: string | null;
  deliveredAt: string | null;
  squarePaymentId: string | null;
  issuedToCustomer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  } | null;
  issuedBy: { name: string } | null;
  redeemedOnOrder: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    createdAt: string;
  } | null;
}

export default function GiftCertificateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [certificate, setCertificate] = useState<GiftCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [overrideEmail, setOverrideEmail] = useState("");

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      loadCertificate(p.id);
    });
  }, [params]);

  async function loadCertificate(certId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/staff/api/gift-certificates/${certId}`);
      if (!res.ok) throw new Error("Failed to load certificate");
      const data = await res.json();
      setCertificate(data.certificate);
    } catch (e: any) {
      console.error("Error loading certificate:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!id) return;
    setResending(true);
    setResendMessage(null);
    setResendError(null);
    try {
      const res = await fetch(`/staff/api/gift-certificates/${id}/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrideEmail ? { to: overrideEmail } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        setResendError(data.error || "Failed to send");
      } else {
        setResendMessage(`Sent to ${data.sentTo}`);
        await loadCertificate(id);
      }
    } catch (e: any) {
      setResendError(e?.message || "Failed to send");
    } finally {
      setResending(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-10 text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="p-6">
        <div className="text-center py-10 text-red-500">Certificate not found</div>
      </div>
    );
  }

  const isActive =
    !certificate.redeemedAt &&
    (!certificate.expiresAt || new Date(certificate.expiresAt) > new Date());
  const isExpired =
    certificate.expiresAt &&
    new Date(certificate.expiresAt) < new Date() &&
    !certificate.redeemedAt;
  const isRedeemed = !!certificate.redeemedAt;
  const isOnline = certificate.source === "online";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            Gift Certificate {certificate.certificateNumber}
          </h1>
          <p className="text-sm text-neutral-600">
            Issued {new Date(certificate.issuedAt).toLocaleDateString()}
            {certificate.issuedBy ? ` by ${certificate.issuedBy.name}` : isOnline ? " online" : ""}
          </p>
        </div>
        <Link
          href="/staff/gift-certificates"
          className="rounded-xl border border-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-50"
        >
          ← Back to List
        </Link>
      </div>

      {/* Status Card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-neutral-500 mb-1">Original Amount</div>
            <div className="text-2xl font-bold">${(certificate.amount / 100).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-500 mb-1">Remaining Balance</div>
            <div className="text-2xl font-bold text-green-600">
              ${(certificate.balance / 100).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-sm text-neutral-500 mb-1">Status</div>
            <div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isActive
                    ? "bg-green-100 text-green-700"
                    : isRedeemed
                    ? "bg-blue-100 text-blue-700"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {isActive ? "Active" : isRedeemed ? "Redeemed" : "Expired"}
              </span>
              {isOnline && (
                <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  Online Purchase
                </span>
              )}
            </div>
          </div>
        </div>
        {certificate.redemptionCode && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <div className="text-sm text-neutral-500 mb-1">Redemption Code</div>
            <code className="text-lg font-mono font-semibold bg-neutral-50 border border-neutral-200 rounded px-3 py-1">
              {certificate.redemptionCode}
            </code>
          </div>
        )}
      </div>

      {/* Online Purchase Info */}
      {isOnline && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Online Purchase Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-500">Purchased by</div>
              <div className="font-medium">{certificate.purchasedByName}</div>
              {certificate.purchasedByEmail && (
                <a
                  href={`mailto:${certificate.purchasedByEmail}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {certificate.purchasedByEmail}
                </a>
              )}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-500">Recipient</div>
              <div className="font-medium">{certificate.recipientName}</div>
              {certificate.recipientEmail && (
                <a
                  href={`mailto:${certificate.recipientEmail}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {certificate.recipientEmail}
                </a>
              )}
            </div>
          </div>

          {certificate.recipientMessage && (
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Message</div>
              <p className="text-sm text-neutral-800 italic whitespace-pre-wrap">
                &ldquo;{certificate.recipientMessage}&rdquo;
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-amber-200">
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-500">Delivery</div>
              {certificate.deliveredAt ? (
                <div className="text-sm text-green-700">
                  Delivered {new Date(certificate.deliveredAt).toLocaleString()}
                </div>
              ) : certificate.deliverAt ? (
                <div className="text-sm text-amber-700">
                  Scheduled for {new Date(certificate.deliverAt).toLocaleDateString()}
                </div>
              ) : (
                <div className="text-sm text-red-700">Not yet sent</div>
              )}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-500">Square Payment</div>
              {certificate.squarePaymentId ? (
                <code className="text-xs">{certificate.squarePaymentId}</code>
              ) : (
                <div className="text-sm text-neutral-500">—</div>
              )}
            </div>
          </div>

          {/* Resend */}
          {!isRedeemed && (
            <div className="pt-3 border-t border-amber-200">
              <div className="flex flex-col md:flex-row md:items-end gap-3">
                <div className="flex-1">
                  <label className="text-xs uppercase tracking-wide text-neutral-500">
                    Resend to (leave blank to use recipient email)
                  </label>
                  <input
                    type="email"
                    value={overrideEmail}
                    onChange={(e) => setOverrideEmail(e.target.value)}
                    placeholder={certificate.recipientEmail || ""}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="rounded-md bg-black px-4 py-2 text-white text-sm hover:bg-neutral-800 disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend Email"}
                </button>
              </div>
              {resendMessage && (
                <p className="text-sm text-green-700 mt-2">{resendMessage}</p>
              )}
              {resendError && <p className="text-sm text-red-700 mt-2">{resendError}</p>}
            </div>
          )}
        </div>
      )}

      {/* Customer Info */}
      {certificate.issuedToCustomer && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Customer</h2>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-neutral-500">Name:</span>{" "}
              <Link
                href={`/staff/customers/${certificate.issuedToCustomer.id}`}
                className="text-blue-600 hover:underline font-medium"
              >
                {certificate.issuedToCustomer.firstName} {certificate.issuedToCustomer.lastName}
              </Link>
            </div>
            {certificate.issuedToCustomer.email && (
              <div>
                <span className="text-sm text-neutral-500">Email:</span>{" "}
                {certificate.issuedToCustomer.email}
              </div>
            )}
            {certificate.issuedToCustomer.phone && (
              <div>
                <span className="text-sm text-neutral-500">Phone:</span>{" "}
                {certificate.issuedToCustomer.phone}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Redemption Info */}
      {certificate.redeemedOnOrder && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Redemption</h2>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-neutral-500">Redeemed on:</span>{" "}
              <Link
                href={`/staff/orders/${certificate.redeemedOnOrder.id}`}
                className="text-blue-600 hover:underline font-medium"
              >
                Order #{certificate.redeemedOnOrder.orderNumber}
              </Link>
            </div>
            {certificate.redeemedAt && (
              <div>
                <span className="text-sm text-neutral-500">Date:</span>{" "}
                {new Date(certificate.redeemedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expiration */}
      {certificate.expiresAt && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold mb-2">Expiration</h2>
          <div className="text-sm text-neutral-600">
            {new Date(certificate.expiresAt).toLocaleDateString()}
            {isExpired && <span className="ml-2 text-red-600">(Expired)</span>}
          </div>
        </div>
      )}

      {/* Notes */}
      {certificate.notes && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold mb-2">Notes</h2>
          <p className="text-sm text-neutral-600 whitespace-pre-wrap">{certificate.notes}</p>
        </div>
      )}
    </div>
  );
}
