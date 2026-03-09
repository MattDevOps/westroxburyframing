export type SquareEnv = "sandbox" | "production";

export type SquareMoney = {
  amount: number; // cents
  currency: "USD";
};

export type SquareInvoiceLine = {
  name: string;
  quantity?: string; // Square wants string quantities like "1" or "2.5"
  basePriceMoney: SquareMoney;
};

export type CreateInvoiceInput = {
  customerId?: string;
  customerEmail?: string;
  customerGivenName?: string;
  customerFamilyName?: string;

  locationId: string;
  orderId: string; // your internal order id (used in reference/notes)
  title?: string;
  message?: string;
  lines: SquareInvoiceLine[];

  kind: "full" | "deposit";
  depositPercent?: number; // default 50 for deposit
  dueDays?: number; // default 7
};
