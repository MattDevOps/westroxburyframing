"use client";

import { useState, useEffect, useRef } from "react";
import { User, Search, Plus, Image, Ruler, FileText } from "lucide-react";
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
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 mb-4">
          <User className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">Step 1: Customer & Artwork</h2>
        <p className="text-base text-neutral-600">
          Find or create a customer, then enter the artwork details
        </p>
      </div>

      {/* Customer Search */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-base md:text-lg font-semibold text-neutral-900">
          <User className="w-5 h-5 text-blue-600" />
          Customer <span className="text-red-500">*</span>
        </label>
        
        {!data.customerId ? (
          <>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, phone, or email..."
                className="w-full rounded-2xl border-2 border-neutral-300 px-12 py-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                autoFocus
              />
              {searching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                  Searching...
                </div>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="border-2 border-neutral-200 rounded-2xl bg-white shadow-xl max-h-64 overflow-y-auto">
                {searchResults.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => selectCustomer(customer)}
                    className="w-full text-left px-5 py-4 hover:bg-blue-50 border-b border-neutral-100 last:border-b-0 transition-colors"
                  >
                    <div className="font-semibold text-base text-neutral-900">
                      {customer.firstName} {customer.lastName}
                    </div>
                    <div className="text-sm text-neutral-600 mt-1">
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
                className="flex items-center gap-2 text-base text-blue-600 hover:text-blue-700 font-semibold py-2"
              >
                <Plus className="w-5 h-5" />
                Create New Customer
              </button>
            )}

            {showCreateForm && (
              <div className="border-2 border-blue-200 rounded-2xl p-5 md:p-6 bg-blue-50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      className="w-full rounded-xl border-2 border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      className="w-full rounded-xl border-2 border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full rounded-xl border-2 border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full rounded-xl border-2 border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCreateCustomer}
                    disabled={creating}
                    className="flex-1 rounded-xl bg-black px-6 py-4 text-white text-base font-semibold hover:bg-neutral-800 disabled:opacity-50 transition-all shadow-lg"
                  >
                    {creating ? "Creating..." : "Create Customer"}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-4 rounded-xl border-2 border-neutral-300 text-base text-neutral-700 font-medium hover:bg-neutral-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-lg text-neutral-900">
                    {data.customer?.firstName} {data.customer?.lastName}
                  </div>
                  <div className="text-sm text-neutral-600">
                    {data.customer?.phone && `📞 ${data.customer.phone}`}
                    {data.customer?.phone && data.customer?.email && " • "}
                    {data.customer?.email && `✉️ ${data.customer.email}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  updateData({ customerId: null, customer: null });
                  setSearchQuery("");
                }}
                className="text-base text-blue-600 hover:text-blue-700 font-semibold px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors"
              >
                Change
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Artwork Type */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-base md:text-lg font-semibold text-neutral-900">
          <Image className="w-5 h-5 text-blue-600" />
          Artwork Type <span className="text-red-500">*</span>
        </label>
        <select
          value={data.artworkType}
          onChange={(e) => updateData({ artworkType: e.target.value })}
          className="w-full rounded-2xl border-2 border-neutral-300 px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-base md:text-lg font-semibold text-neutral-900">
          <Ruler className="w-5 h-5 text-blue-600" />
          Dimensions <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Width
            </label>
            <input
              type="number"
              value={data.width || ""}
              onChange={(e) => updateData({ width: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.125"
              className="w-full rounded-xl border-2 border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Height
            </label>
            <input
              type="number"
              value={data.height || ""}
              onChange={(e) => updateData({ height: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.125"
              className="w-full rounded-xl border-2 border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Units
            </label>
            <select
              value={data.units}
              onChange={(e) => updateData({ units: e.target.value as "in" | "cm" })}
              className="w-full rounded-xl border-2 border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="in">Inches</option>
              <option value="cm">Centimeters</option>
            </select>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-base md:text-lg font-semibold text-neutral-900">
          <FileText className="w-5 h-5 text-blue-600" />
          Description (Optional)
        </label>
        <textarea
          value={data.itemDescription || ""}
          onChange={(e) => updateData({ itemDescription: e.target.value || null })}
          rows={3}
          className="w-full rounded-2xl border-2 border-neutral-300 px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          placeholder="Additional details about the artwork..."
        />
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-6 border-t-2 border-neutral-200">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="rounded-2xl bg-black px-8 py-4 text-white text-base font-bold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl min-w-[200px]"
        >
          Next: Frame Selection →
        </button>
      </div>
    </div>
  );
}
