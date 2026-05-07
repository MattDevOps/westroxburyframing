"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface GiftCertificate {
  id: string;
  certificateNumber: string;
  amount: number;
  balance: number;
  issuedAt: string;
  expiresAt: string | null;
  redeemedAt: string | null;
  notes: string | null;
  issuedToCustomer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  } | null;
  issuedBy: {
    name: string;
  };
  redeemedOnOrder: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    createdAt: string;
  } | null;
}

export default function GiftCertificateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [certificate, setCertificate] = useState<GiftCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string | null>(null);

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

  const isActive = !certificate.redeemedAt && (!certificate.expiresAt || new Date(certificate.expiresAt) > new Date());
  const isExpired = certificate.expiresAt && new Date(certificate.expiresAt) < new Date() && !certificate.redeemedAt;
  const isRedeemed = !!certificate.redeemedAt;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Gift Certificate {certificate.certificateNumber}</h1>
          <p className="text-sm text-neutral-600">
            Issued {new Date(certificate.issuedAt).toLocaleDateString()} by {certificate.issuedBy.name}
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
            </div>
          </div>
        </div>
      </div>

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
