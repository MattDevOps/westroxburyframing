/**
 * Shopify Admin API Client
 * 
 * This module provides functions to import orders, products, and customers from Shopify.
 * Uses Shopify Admin API with access token authentication.
 * 
 * Documentation: https://shopify.dev/docs/api/admin-rest
 */

import { env } from "./env";

interface ShopifyConfig {
  shopDomain: string;
  accessToken: string;
  apiVersion?: string;
}

interface ShopifyOrder {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  currency: string;
  customer: {
    id: number;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
  line_items: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
    sku: string | null;
    variant_id: number | null;
    product_id: number | null;
  }>;
  shipping_address: {
    address1: string | null;
    address2: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
    country: string | null;
  } | null;
  billing_address: {
    address1: string | null;
    address2: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
    country: string | null;
  } | null;
}

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string | null;
  vendor: string | null;
  product_type: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    sku: string | null;
    barcode: string | null;
    inventory_quantity: number;
    weight: number | null;
    weight_unit: string | null;
  }>;
  images: Array<{
    id: number;
    src: string;
    alt: string | null;
  }>;
}

interface ShopifyCustomer {
  id: number;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  accepts_marketing: boolean;
  addresses: Array<{
    address1: string | null;
    address2: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
    country: string | null;
    phone: string | null;
  }>;
}

interface ShopifyResponse<T> {
  orders?: T[];
  products?: T[];
  customers?: T[];
}

/**
 * Get Shopify API base URL
 */
function getShopifyBaseUrl(shopDomain: string, apiVersion: string): string {
  const domain = shopDomain.replace(/^https?:\/\//, "").replace(/\.myshopify\.com.*$/, "");
  return `https://${domain}.myshopify.com/admin/api/${apiVersion}`;
}

/**
 * Make authenticated request to Shopify Admin API
 */
async function shopifyFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { SHOPIFY_SHOP_DOMAIN, SHOPIFY_ACCESS_TOKEN, SHOPIFY_API_VERSION } = env;

  if (!SHOPIFY_SHOP_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error("Shopify credentials not configured. Set SHOPIFY_SHOP_DOMAIN and SHOPIFY_ACCESS_TOKEN.");
  }

  const baseUrl = getShopifyBaseUrl(SHOPIFY_SHOP_DOMAIN, SHOPIFY_API_VERSION);
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Fetch all pages of results (Shopify paginates with link headers)
 */
async function shopifyFetchAll<T>(
  path: string,
  limit: number = 250
): Promise<T[]> {
  const allResults: T[] = [];
  let url = `${path}${path.includes("?") ? "&" : "?"}limit=${limit}`;
  let hasNext = true;

  while (hasNext) {
    const response = await shopifyFetch<{ [key: string]: T[] }>(url);
    
    // Shopify returns data in different keys depending on endpoint
    const dataKey = Object.keys(response).find(key => Array.isArray(response[key]));
    if (!dataKey) break;
    
    const items = response[dataKey] as T[];
    allResults.push(...items);

    // Check for next page (would need to parse Link header in real implementation)
    // For now, we'll use a simpler approach: if we got less than limit, we're done
    hasNext = items.length === limit;
    
    if (hasNext && items.length > 0) {
      // Get the last item's ID for cursor-based pagination
      const lastId = (items[items.length - 1] as any).id;
      url = `${path}${path.includes("?") ? "&" : "?"}limit=${limit}&since_id=${lastId}`;
    } else {
      hasNext = false;
    }
  }

  return allResults;
}

/**
 * Import orders from Shopify
 */
export async function importShopifyOrders(
  sinceId?: number,
  limit: number = 250
): Promise<ShopifyOrder[]> {
  let path = "/orders.json?status=any";
  if (sinceId) {
    path += `&since_id=${sinceId}`;
  }
  path += `&limit=${limit}`;

  const response = await shopifyFetch<{ orders: ShopifyOrder[] }>(path);
  return response.orders || [];
}

/**
 * Import products from Shopify
 */
export async function importShopifyProducts(
  sinceId?: number,
  limit: number = 250
): Promise<ShopifyProduct[]> {
  let path = "/products.json";
  if (sinceId) {
    path += `?since_id=${sinceId}`;
  } else {
    path += "?";
  }
  path += `${sinceId ? "&" : ""}limit=${limit}`;

  const response = await shopifyFetch<{ products: ShopifyProduct[] }>(path);
  return response.products || [];
}

/**
 * Import customers from Shopify
 */
export async function importShopifyCustomers(
  sinceId?: number,
  limit: number = 250
): Promise<ShopifyCustomer[]> {
  let path = "/customers.json";
  if (sinceId) {
    path += `?since_id=${sinceId}`;
  } else {
    path += "?";
  }
  path += `${sinceId ? "&" : ""}limit=${limit}`;

  const response = await shopifyFetch<{ customers: ShopifyCustomer[] }>(path);
  return response.customers || [];
}

/**
 * Test Shopify connection
 */
export async function testShopifyConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await shopifyFetch<{ shop: { name: string; domain: string } }>("/shop.json");
    return {
      success: true,
      message: `Connected to ${response.shop?.name || "Shopify store"}`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to connect to Shopify",
    };
  }
}
