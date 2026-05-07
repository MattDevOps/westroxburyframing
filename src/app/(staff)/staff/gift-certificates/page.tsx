"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  } | null;
  issuedBy: {
    name: string;
  };
  redeemedOnOrder: {
    id: string;
    orderNumber: string;
  } | null;
}

export default function GiftCertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<GiftCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "redeemed" | "expired">("all");

  useEffect(() => {
    loadCertificates();
  }, [searchQuery, statusFilter]);

  async function loadCertificates() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/staff/api/gift-certificates?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load certificates");
      const data = await res.json();
      setCertificates(data.certificates || []);
    } catch (e: any) {
      console.error("Error loading certificates:", e);
    } finally {
      setLoading(false);
    }
  }

  const getStatus = (cert: GiftCertificate) => {
    if (cert.redeemedAt) return "redeemed";
    if (cert.expiresAt && new Date(cert.expiresAt) < new Date()) return "expired";
    return "active";
  };

  const activeCount = certificates.filter((c) => getStatus(c) === "active").length;
  const redeemedCount = certificates.filter((c) => getStatus(c) === "redeemed").length;
  const expiredCount = certificates.filter((c) => getStatus(c) === "expired").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gift Certificates</h1>
        <Link
          href="/staff/gift-certificates/new"
          className="rounded-xl bg-black px-4 py-2 text-white hover:bg-neutral-800"
        >
          + Issue Certificate
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-500 mb-1">Active</div>
          <div className="text-2xl font-bold text-green-600">{activeCount}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-500 mb-1">Redeemed</div>
          <div className="text-2xl font-bold text-blue-600">{redeemedCount}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-500 mb-1">Expired</div>
          <div className="text-2xl font-bold text-neutral-400">{expiredCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by certificate number or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="redeemed">Redeemed</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-10 text-neutral-500">Loading...</div>
      ) : certificates.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">
          <p className="text-lg mb-2">No gift certificates found</p>
          <p className="text-sm">Issue your first gift certificate to get started</p>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-neutral-700">Certificate #</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-neutral-700">Customer</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-neutral-700">Amount</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-neutral-700">Balance</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-neutral-700">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-neutral-700">Issued</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-neutral-700">Expires</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-neutral-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {certificates.map((cert) => {
                const status = getStatus(cert);
                return (
                  <tr key={cert.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/staff/gift-certificates/${cert.id}`}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {cert.certificateNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {cert.issuedToCustomer ? (
                        <Link
                          href={`/staff/customers/${cert.issuedToCustomer.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {cert.issuedToCustomer.firstName} {cert.issuedToCustomer.lastName}
                        </Link>
                      ) : (
                        <span className="text-neutral-400">No customer</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ${(cert.amount / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ${(cert.balance / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          status === "active"
                            ? "bg-green-100 text-green-700"
                            : status === "redeemed"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {new Date(cert.issuedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {cert.expiresAt ? new Date(cert.expiresAt).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/staff/gift-certificates/${cert.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
