"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ORDER_STATUS_LABEL } from "@/lib/orderStatus";

interface SearchResult {
  id: string;
  type: "order" | "customer" | "invoice" | "product";
  title: string;
  subtitle: string;
  description: string;
  status?: string;
  amount?: number;
  url: string;
  createdAt: string | null;
}

interface SearchData {
  orders: SearchResult[];
  customers: SearchResult[];
  invoices: SearchResult[];
  products: SearchResult[];
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [query]);

  async function performSearch() {
    if (query.length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/staff/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data);
      setSelectedIndex(0);
    } catch (e: any) {
      console.error("Search error:", e);
      setResults({ orders: [], customers: [], invoices: [], products: [] });
    } finally {
      setLoading(false);
    }
  }

  const allResults: SearchResult[] = results
    ? [...results.orders, ...results.customers, ...results.invoices, ...results.products]
    : [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && allResults[selectedIndex]) {
      e.preventDefault();
      router.push(allResults[selectedIndex].url);
    } else if (e.key === "Escape") {
      router.back();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "order":
        return "📋";
      case "customer":
        return "👤";
      case "invoice":
        return "💳";
      case "product":
        return "🖼️";
      default:
        return "🔍";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "order":
        return "Order";
      case "customer":
        return "Customer";
      case "invoice":
        return "Invoice";
      default:
        return "";
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Global Search</h1>
        <p className="text-sm text-neutral-600">
          Search across orders, customers, and invoices
        </p>
      </div>

      <div className="relative mb-6">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search orders, customers, invoices..."
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
            Searching...
          </div>
        )}
      </div>

      {query.length < 2 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">
          <p className="text-lg mb-2">Start typing to search</p>
          <p className="text-sm">Search by order number, customer name, email, phone, or invoice number</p>
        </div>
      )}

      {query.length >= 2 && !loading && results && (
        <div className="space-y-6">
          {allResults.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">
              <p className="text-lg mb-2">No results found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            <>
              {results.orders.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                    Orders ({results.orders.length})
                  </h2>
                  <div className="space-y-2">
                    {results.orders.map((result, idx) => {
                      const globalIdx = idx;
                      return (
                        <Link
                          key={result.id}
                          href={result.url}
                          className={`block rounded-xl border p-4 transition-colors ${
                            selectedIndex === globalIdx
                              ? "border-blue-500 bg-blue-50"
                              : "border-neutral-200 bg-white hover:bg-neutral-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{getTypeIcon(result.type)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-neutral-900">
                                  {result.title}
                                </span>
                                {result.status && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                                    {ORDER_STATUS_LABEL[result.status as keyof typeof ORDER_STATUS_LABEL] || result.status}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-neutral-600 mb-1">
                                {result.subtitle}
                              </div>
                              {result.description && (
                                <div className="text-xs text-neutral-500">
                                  {result.description}
                                </div>
                              )}
                              {result.amount && (
                                <div className="text-sm font-medium text-neutral-900 mt-1">
                                  ${(result.amount / 100).toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {results.customers.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                    Customers ({results.customers.length})
                  </h2>
                  <div className="space-y-2">
                    {results.customers.map((result, idx) => {
                      const globalIdx = results.orders.length + idx;
                      return (
                        <Link
                          key={result.id}
                          href={result.url}
                          className={`block rounded-xl border p-4 transition-colors ${
                            selectedIndex === globalIdx
                              ? "border-blue-500 bg-blue-50"
                              : "border-neutral-200 bg-white hover:bg-neutral-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{getTypeIcon(result.type)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-neutral-900 mb-1">
                                {result.title}
                              </div>
                              {result.subtitle && (
                                <div className="text-sm text-neutral-600">
                                  {result.subtitle}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {results.invoices.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                    Invoices ({results.invoices.length})
                  </h2>
                  <div className="space-y-2">
                    {results.invoices.map((result, idx) => {
                      const globalIdx = results.orders.length + results.customers.length + idx;
                      return (
                        <Link
                          key={result.id}
                          href={result.url}
                          className={`block rounded-xl border p-4 transition-colors ${
                            selectedIndex === globalIdx
                              ? "border-blue-500 bg-blue-50"
                              : "border-neutral-200 bg-white hover:bg-neutral-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{getTypeIcon(result.type)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-neutral-900">
                                  {result.title}
                                </span>
                                {result.status && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                                    {result.status}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-neutral-600 mb-1">
                                {result.subtitle}
                              </div>
                              {result.description && (
                                <div className="text-xs text-neutral-500 mb-1">
                                  {result.description}
                                </div>
                              )}
                              {result.amount && (
                                <div className="text-sm font-medium text-neutral-900">
                                  Total: ${(result.amount / 100).toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {results.products && results.products.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                    Products ({results.products.length})
                  </h2>
                  <div className="space-y-2">
                    {results.products.map((result, idx) => {
                      const globalIdx = results.orders.length + results.customers.length + results.invoices.length + idx;
                      return (
                        <Link
                          key={result.id}
                          href={result.url}
                          className={`block rounded-xl border p-4 transition-colors ${
                            selectedIndex === globalIdx
                              ? "border-blue-500 bg-blue-50"
                              : "border-neutral-200 bg-white hover:bg-neutral-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{getTypeIcon(result.type)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-neutral-900">
                                  {result.title}
                                </span>
                                {result.status && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    result.status === "published"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-neutral-100 text-neutral-600"
                                  }`}>
                                    {result.status}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-neutral-600 mb-1">
                                {result.subtitle}
                              </div>
                              {result.description && (
                                <div className="text-xs text-neutral-500 mb-1">
                                  {result.description}
                                </div>
                              )}
                              {result.amount && (
                                <div className="text-sm font-medium text-neutral-900">
                                  ${(result.amount / 100).toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
