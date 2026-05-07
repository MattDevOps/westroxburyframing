"use client";

import { useState } from "react";
import Link from "next/link";

type ImportType = "orders" | "products" | "customers";

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export default function ShopifyPage() {
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [testing, setTesting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importType, setImportType] = useState<ImportType | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus(null);
    try {
      const res = await fetch("/staff/api/shopify/test-connection");
      const data = await res.json();
      setConnectionStatus(data);
    } catch (error: any) {
      setConnectionStatus({
        success: false,
        message: error.message || "Failed to test connection",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleImport = async (type: ImportType) => {
    setImporting(true);
    setImportType(type);
    setImportResult(null);
    try {
      const res = await fetch("/staff/api/shopify/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.error) {
        setImportResult({
          success: false,
          imported: 0,
          skipped: 0,
          errors: [data.error],
        });
      } else {
        setImportResult(data);
      }
    } catch (error: any) {
      setImportResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: [error.message || "Failed to import"],
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Shopify Integration</h1>
        <p className="text-neutral-600 text-sm mt-1">
          Import orders, products, and customers from your Shopify store
        </p>
      </div>

      {/* Connection Test */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Connection Status</h2>
            <p className="text-sm text-neutral-600 mt-1">
              Test your Shopify API connection
            </p>
          </div>
          <button
            onClick={testConnection}
            disabled={testing}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {testing ? "Testing..." : "Test Connection"}
          </button>
        </div>

        {connectionStatus && (
          <div
            className={`rounded-lg p-4 ${
              connectionStatus.success
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <div className="font-medium">
              {connectionStatus.success ? "✓ Connected" : "✗ Connection Failed"}
            </div>
            <div className="text-sm mt-1">{connectionStatus.message}</div>
          </div>
        )}

        {!connectionStatus && (
          <div className="rounded-lg p-4 bg-neutral-50 border border-neutral-200 text-neutral-600 text-sm">
            Configure your Shopify credentials in environment variables:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><code className="bg-neutral-200 px-1 rounded">SHOPIFY_SHOP_DOMAIN</code> - Your shop domain (e.g., "mystore" or "mystore.myshopify.com")</li>
              <li><code className="bg-neutral-200 px-1 rounded">SHOPIFY_ACCESS_TOKEN</code> - Admin API access token</li>
              <li><code className="bg-neutral-200 px-1 rounded">SHOPIFY_API_VERSION</code> - API version (default: "2024-01")</li>
            </ul>
          </div>
        )}
      </div>

      {/* Import Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Import Orders */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Import Orders</h3>
            <p className="text-sm text-neutral-600 mt-1">
              Import Shopify orders as new orders in the system. Customers will be created or matched by email.
            </p>
          </div>
          <button
            onClick={() => handleImport("orders")}
            disabled={importing}
            className="w-full px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {importing && importType === "orders" ? "Importing..." : "Import Orders"}
          </button>
          {importResult && importType === "orders" && (
            <div className="rounded-lg p-3 bg-neutral-50 border border-neutral-200 text-sm">
              <div className="font-medium text-neutral-900">
                {importResult.success ? "Import Complete" : "Import Failed"}
              </div>
              <div className="mt-2 space-y-1 text-neutral-600">
                <div>Imported: {importResult.imported}</div>
                <div>Skipped: {importResult.skipped}</div>
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <div className="font-medium text-red-600">Errors:</div>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      {importResult.errors.slice(0, 5).map((error, i) => (
                        <li key={i} className="text-xs">{error}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li className="text-xs">... and {importResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Import Products */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Import Products</h3>
            <p className="text-sm text-neutral-600 mt-1">
              Import Shopify products into your product catalog. Products are matched by SKU.
            </p>
          </div>
          <button
            onClick={() => handleImport("products")}
            disabled={importing}
            className="w-full px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {importing && importType === "products" ? "Importing..." : "Import Products"}
          </button>
          {importResult && importType === "products" && (
            <div className="rounded-lg p-3 bg-neutral-50 border border-neutral-200 text-sm">
              <div className="font-medium text-neutral-900">
                {importResult.success ? "Import Complete" : "Import Failed"}
              </div>
              <div className="mt-2 space-y-1 text-neutral-600">
                <div>Imported: {importResult.imported}</div>
                <div>Skipped: {importResult.skipped}</div>
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <div className="font-medium text-red-600">Errors:</div>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      {importResult.errors.slice(0, 5).map((error, i) => (
                        <li key={i} className="text-xs">{error}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li className="text-xs">... and {importResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Import Customers */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Import Customers</h3>
            <p className="text-sm text-neutral-600 mt-1">
              Import Shopify customers. Existing customers are updated with Shopify data.
            </p>
          </div>
          <button
            onClick={() => handleImport("customers")}
            disabled={importing}
            className="w-full px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {importing && importType === "customers" ? "Importing..." : "Import Customers"}
          </button>
          {importResult && importType === "customers" && (
            <div className="rounded-lg p-3 bg-neutral-50 border border-neutral-200 text-sm">
              <div className="font-medium text-neutral-900">
                {importResult.success ? "Import Complete" : "Import Failed"}
              </div>
              <div className="mt-2 space-y-1 text-neutral-600">
                <div>Imported: {importResult.imported}</div>
                <div>Skipped: {importResult.skipped}</div>
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <div className="font-medium text-red-600">Errors:</div>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      {importResult.errors.slice(0, 5).map((error, i) => (
                        <li key={i} className="text-xs">{error}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li className="text-xs">... and {importResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">How It Works</h3>
        <ul className="space-y-2 text-sm text-neutral-600">
          <li>
            <strong className="text-neutral-900">Orders:</strong> Shopify orders are imported as new orders with status "new_design". 
            Customer information is extracted and matched or created. Order details are stored in the order notes.
          </li>
          <li>
            <strong className="text-neutral-900">Products:</strong> Products are imported into your product catalog. 
            Products with the same SKU are skipped to avoid duplicates. Product images, prices, and inventory are synced.
          </li>
          <li>
            <strong className="text-neutral-900">Customers:</strong> Customers are matched by email address. 
            If a customer already exists, their information is updated with Shopify data. New customers are created.
          </li>
        </ul>
      </div>
    </div>
  );
}
