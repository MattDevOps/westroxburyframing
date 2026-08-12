/**
 * "Bill To" resolution for invoices.
 *
 * When there's a company, the company is the party being billed and the person
 * becomes the attention line — we're billing Boston Police Dept, not Marc:
 *
 *   Boston Police Dept
 *   ATTN: Marc Vallencourt
 *   <address / email / phone, as usual>
 *
 * With no company it falls back to just the person's name, which is how every
 * invoice rendered before this existed.
 *
 * The address follows the same rule: a company invoice uses the company's
 * billing address when one is on file, so a work invoice doesn't print
 * somebody's home address. It falls back to the personal address otherwise.
 */

export type BillToCustomer = {
  firstName?: string | null;
  lastName?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  orgAddressLine1?: string | null;
  orgAddressLine2?: string | null;
  orgCity?: string | null;
  orgState?: string | null;
  orgZip?: string | null;
};

export type BillToAddress = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
};

export type BillTo = {
  /** Headline name on the invoice — the company when there is one. */
  name: string;
  /** "Marc Vallencourt" when billing a company, otherwise null. */
  attn: string | null;
  /** True when a company is being billed rather than the person. */
  isCompany: boolean;
  address: BillToAddress;
  /** Single-line form, e.g. "1 Schroeder Plaza, Boston, MA 02120". */
  addressText: string;
};

const emptyAddress: BillToAddress = {
  line1: null,
  line2: null,
  city: null,
  state: null,
  zip: null,
};

function personalAddress(c: BillToCustomer | null | undefined): BillToAddress {
  if (!c) return emptyAddress;
  return {
    line1: c.addressLine1 || null,
    line2: c.addressLine2 || null,
    city: c.city || null,
    state: c.state || null,
    zip: c.zip || null,
  };
}

function companyAddress(c: BillToCustomer | null | undefined): BillToAddress {
  if (!c) return emptyAddress;
  return {
    line1: c.orgAddressLine1 || null,
    line2: c.orgAddressLine2 || null,
    city: c.orgCity || null,
    state: c.orgState || null,
    zip: c.orgZip || null,
  };
}

function hasAny(a: BillToAddress) {
  return Boolean(a.line1 || a.line2 || a.city || a.state || a.zip);
}

/** Single-line address: "1 Schroeder Plaza, Boston, MA 02120". */
export function formatAddress(a: BillToAddress) {
  // State and ZIP belong together — a comma between them reads as a typo.
  const cityStateZip = [a.city, [a.state, a.zip].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return [a.line1, a.line2, cityStateZip].filter(Boolean).join(", ");
}

export function resolveBillTo(
  company: string | null | undefined,
  customer: BillToCustomer | null | undefined
): BillTo {
  const personName = `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim();
  const org = (company || "").trim();
  const isCompany = Boolean(org);

  // A company invoice prefers the company's own address, but an empty company
  // address shouldn't blank out the invoice — fall back to the personal one.
  const orgAddr = companyAddress(customer);
  const address = isCompany && hasAny(orgAddr) ? orgAddr : personalAddress(customer);

  return {
    name: isCompany ? org : personName,
    attn: isCompany ? personName || null : null,
    isCompany,
    address,
    addressText: formatAddress(address),
  };
}
