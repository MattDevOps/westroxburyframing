"use client";

import { useState, useEffect, useRef } from "react";
import type { IntakeData } from "./page";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
}

interface Step1Props {
  data: IntakeData;
  updateData: (updates: Partial<IntakeData>) => void;
  onNext: () => void;
}

const ARTWORK_TYPES = [
  { value: "print", label: "Print / Poster" },
  { value: "photo", label: "Photo" },
  { value: "diploma", label: "Diploma / Certificate" },
  { value: "artwork", label: "Original Artwork" },
  { value: "object", label: "3D Object / Shadowbox" },
  { value: "custom", label: "Custom" },
];

export default function Step1CustomerArtwork({ data, updateData, onNext }: Step1Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // New customer form
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Search customers
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/staff/api/customers?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.customers || []);
        }
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const selectCustomer = (customer: Customer) => {
    updateData({
      customerId: customer.id,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        email: customer.email,
      },
    });
    setSearchQuery(`${customer.firstName} ${customer.lastName}`);
    setSearchResults([]);
  };

  const handleCreateCustomer = async () => {
    if (!newFirstName.trim() || !newLastName.trim()) {
      alert("First and last name are required");
      return;
    }

    if (!newPhone.trim() && !newEmail.trim()) {
      alert("Phone or email is required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/staff/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: newFirstName.trim(),
          last_name: newLastName.trim(),
          phone: newPhone.trim() || null,
          email: newEmail.trim() || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create customer");
      }

      const result = await res.json();
      const customer = result.customer;

      updateData({
        customerId: customer.id,
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          email: customer.email,
        },
      });

      setShowCreateForm(false);
      setNewFirstName("");
      setNewLastName("");
      setNewPhone("");
      setNewEmail("");
    } catch (e: any) {
      alert(e.message || "Failed to create customer");
    } finally {
      setCreating(false);
    }
  };

  const canProceed = !!(
    data.customerId &&
    data.artworkType &&
    data.width > 0 &&
    data.height > 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Step 1: Customer & Artwork</h2>
        <p className="text-sm text-neutral-600">
          Find or create a customer, then enter the artwork details
        </p>
      </div>

      {/* Customer Search */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700">
          Customer <span className="text-red-500">*</span>
        </label>
        
        {!data.customerId ? (
          <>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, phone, or email..."
                className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  Searching...
                </div>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="border border-neutral-200 rounded-xl bg-white shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => selectCustomer(customer)}
                    className="w-full text-left px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-b-0"
                  >
                    <div className="font-medium text-neutral-900">
                      {customer.firstName} {customer.lastName}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {customer.phone && `📞 ${customer.phone}`}
                      {customer.phone && customer.email && " • "}
                      {customer.email && `✉️ ${customer.email}`}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Create New Customer
              </button>
            )}

            {showCreateForm && (
              <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateCustomer}
                    disabled={creating}
                    className="flex-1 rounded-lg bg-black px-4 py-2 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create Customer"}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 rounded-lg border border-neutral-300 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-neutral-900">
                  {data.customer?.firstName} {data.customer?.lastName}
                </div>
                <div className="text-sm text-neutral-600">
                  {data.customer?.phone && `📞 ${data.customer.phone}`}
                  {data.customer?.phone && data.customer?.email && " • "}
                  {data.customer?.email && `✉️ ${data.customer.email}`}
                </div>
              </div>
              <button
                onClick={() => {
                  updateData({ customerId: null, customer: null });
                  setSearchQuery("");
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Change
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Artwork Type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700">
          Artwork Type <span className="text-red-500">*</span>
        </label>
        <select
          value={data.artworkType}
          onChange={(e) => updateData({ artworkType: e.target.value })}
          className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select artwork type...</option>
          {ARTWORK_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Size */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">
            Width <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={data.width || ""}
            onChange={(e) => updateData({ width: parseFloat(e.target.value) || 0 })}
            min="0"
            step="0.125"
            className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">
            Height <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={data.height || ""}
            onChange={(e) => updateData({ height: parseFloat(e.target.value) || 0 })}
            min="0"
            step="0.125"
            className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">
            Units
          </label>
          <select
            value={data.units}
            onChange={(e) => updateData({ units: e.target.value as "in" | "cm" })}
            className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="in">Inches</option>
            <option value="cm">Centimeters</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700">
          Description (Optional)
        </label>
        <textarea
          value={data.itemDescription || ""}
          onChange={(e) => updateData({ itemDescription: e.target.value || null })}
          rows={2}
          className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Additional details about the artwork..."
        />
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-4 border-t border-neutral-200">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="rounded-xl bg-black px-6 py-3 text-white font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Frame Selection →
        </button>
      </div>
    </div>
  );
}
