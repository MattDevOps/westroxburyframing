/**
 * QuickBooks Online API Client
 * 
 * This module provides functions to sync invoices and customers to QuickBooks Online.
 * Requires OAuth 2.0 authentication via Intuit's OAuth flow.
 */

interface QBOConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  realmId?: string; // Company ID
  environment?: "sandbox" | "production";
}

interface QBOInvoice {
  Line: Array<{
    Amount: number;
    DetailType: string;
    SalesItemLineDetail?: {
      ItemRef?: { value: string; name: string };
      Qty: number;
      UnitPrice: number;
    };
    TaxLineDetail?: {};
    Description?: string;
  }>;
  CustomerRef: { value: string; name: string };
  TxnDate: string; // YYYY-MM-DD
  DueDate?: string;
  TotalAmt: number;
  DocNumber?: string;
  PrivateNote?: string;
}

interface QBOCustomer {
  DisplayName: string;
  GivenName?: string;
  FamilyName?: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  BillAddr?: {
    Line1?: string;
    Line2?: string;
    City?: string;
    CountrySubDivisionCode?: string; // State
    PostalCode?: string;
  };
}

/**
 * Get OAuth authorization URL for QuickBooks Online
 */
export function getQBOAuthUrl(redirectUri: string, state?: string): string {
  const { QBO_CLIENT_ID } = require("./env").env;
  if (!QBO_CLIENT_ID) {
    throw new Error("QBO_CLIENT_ID environment variable is not set");
  }

  const { QBO_ENVIRONMENT } = require("./env").env;
  const scope = "com.intuit.quickbooks.accounting";
  const responseType = "code";
  const baseUrl = "https://appcenter.intuit.com/connect/oauth2";

  const params = new URLSearchParams({
    client_id: QBO_CLIENT_ID,
    scope,
    redirect_uri: redirectUri,
    response_type: responseType,
    access_type: "offline", // Request refresh token
    ...(state && { state }),
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeQBOCode(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string; realmId: string }> {
  const { QBO_CLIENT_ID, QBO_CLIENT_SECRET } = require("./env").env;

  if (!QBO_CLIENT_ID || !QBO_CLIENT_SECRET) {
    throw new Error("QBO_CLIENT_ID and QBO_CLIENT_SECRET must be set");
  }

  const tokenUrl = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${QBO_CLIENT_ID}:${QBO_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    realmId: data.realmId,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshQBOToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const { QBO_CLIENT_ID, QBO_CLIENT_SECRET } = require("./env").env;

  if (!QBO_CLIENT_ID || !QBO_CLIENT_SECRET) {
    throw new Error("QBO_CLIENT_ID and QBO_CLIENT_SECRET must be set");
  }

  const tokenUrl = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${QBO_CLIENT_ID}:${QBO_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken, // Use new refresh token if provided
  };
}

/**
 * Make authenticated API request to QuickBooks Online
 */
async function qboRequest(
  accessToken: string,
  realmId: string,
  method: string,
  endpoint: string,
  body?: any
): Promise<any> {
  const { QBO_ENVIRONMENT } = require("./env").env;
  const baseUrl =
    QBO_ENVIRONMENT === "production"
      ? "https://quickbooks.api.intuit.com"
      : "https://sandbox-quickbooks.api.intuit.com";

  const url = `${baseUrl}/v3/company/${realmId}/${endpoint}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QBO API error: ${error}`);
  }

  return response.json();
}

/**
 * Create or update customer in QuickBooks Online
 */
export async function syncCustomerToQBO(
  accessToken: string,
  realmId: string,
  customer: {
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  }
): Promise<{ id: string; syncToken: string }> {
  const qboCustomer: QBOCustomer = {
    DisplayName: `${customer.firstName} ${customer.lastName}`,
    GivenName: customer.firstName,
    FamilyName: customer.lastName,
    ...(customer.email && { PrimaryEmailAddr: { Address: customer.email } }),
    ...(customer.phone && { PrimaryPhone: { FreeFormNumber: customer.phone } }),
    ...((customer.addressLine1 ||
      customer.city ||
      customer.state ||
      customer.zip) && {
      BillAddr: {
        ...(customer.addressLine1 && { Line1: customer.addressLine1 }),
        ...(customer.addressLine2 && { Line2: customer.addressLine2 }),
        ...(customer.city && { City: customer.city }),
        ...(customer.state && { CountrySubDivisionCode: customer.state }),
        ...(customer.zip && { PostalCode: customer.zip }),
      },
    }),
  };

  const response = await qboRequest(accessToken, realmId, "POST", "customer", qboCustomer);
  const createdCustomer = response.QueryResponse?.Customer?.[0] || response.Customer;

  return {
    id: createdCustomer.Id,
    syncToken: createdCustomer.SyncToken,
  };
}

/**
 * Create invoice in QuickBooks Online
 */
export async function syncInvoiceToQBO(
  accessToken: string,
  realmId: string,
  invoice: {
    invoiceNumber: string;
    customerId: string; // QBO customer ID
    customerName: string;
    lineItems: Array<{
      description: string;
      amount: number; // in cents
      quantity?: number;
    }>;
    totalAmount: number; // in cents
    taxAmount: number; // in cents
    invoiceDate: Date;
    dueDate?: Date;
    notes?: string;
  }
): Promise<{ id: string; syncToken: string; docNumber: string }> {
  const qboInvoice: QBOInvoice = {
    CustomerRef: {
      value: invoice.customerId,
      name: invoice.customerName,
    },
    TxnDate: invoice.invoiceDate.toISOString().split("T")[0],
    ...(invoice.dueDate && {
      DueDate: invoice.dueDate.toISOString().split("T")[0],
    }),
    DocNumber: invoice.invoiceNumber,
    TotalAmt: invoice.totalAmount / 100, // Convert cents to dollars
    ...(invoice.notes && { PrivateNote: invoice.notes }),
    Line: [
      // Line items
      ...invoice.lineItems.map((item) => ({
        Amount: item.amount / 100,
        DetailType: "SalesItemLineDetail",
        SalesItemLineDetail: {
          Qty: item.quantity || 1,
          UnitPrice: item.amount / 100 / (item.quantity || 1),
        },
        Description: item.description,
      })),
      // Tax line (if applicable)
      ...(invoice.taxAmount > 0
        ? [
            {
              Amount: invoice.taxAmount / 100,
              DetailType: "TaxLineDetail",
              TaxLineDetail: {},
            },
          ]
        : []),
    ],
  };

  const response = await qboRequest(accessToken, realmId, "POST", "invoice", qboInvoice);
  const createdInvoice = response.QueryResponse?.Invoice?.[0] || response.Invoice;

  return {
    id: createdInvoice.Id,
    syncToken: createdInvoice.SyncToken,
    docNumber: createdInvoice.DocNumber || invoice.invoiceNumber,
  };
}

/**
 * Check if QuickBooks Online is configured
 */
export function isQBOConfigured(): boolean {
  const { QBO_CLIENT_ID, QBO_CLIENT_SECRET, QBO_ACCESS_TOKEN, QBO_REALM_ID } = require("./env").env;
  return !!(QBO_CLIENT_ID && QBO_CLIENT_SECRET && QBO_ACCESS_TOKEN && QBO_REALM_ID);
}
