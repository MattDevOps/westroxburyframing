import { squareFetch } from "./client";

export async function findCustomerByEmail(email: string): Promise<string | null> {
  if (!email || !email.trim()) {
    return null;
  }
  
  try {
    const resp = await squareFetch<{
      customers?: Array<{ id: string; email_address?: string }>;
    }>("/v2/customers/search", {
      method: "POST",
      body: JSON.stringify({
        query: { 
          filter: { 
            email_address: { exact: email.trim() } 
          } 
        },
        limit: 1,
      }),
    });
    const id = resp.customers?.[0]?.id;
    return id || null;
  } catch (err: any) {
    // If search fails, customer doesn't exist
    return null;
  }
}

export async function upsertCustomer(args: {
  email: string;
  givenName?: string;
  familyName?: string;
}): Promise<string> {
  if (!args.email || !args.email.trim()) {
    throw new Error("Email is required to create a Square customer");
  }

  const existing = await findCustomerByEmail(args.email);
  if (existing) return existing;

  const customerData: any = {
    email_address: args.email.trim(),
  };
  
  if (args.givenName) customerData.given_name = args.givenName;
  if (args.familyName) customerData.family_name = args.familyName;

  const created = await squareFetch<{ customer: { id: string } }>("/v2/customers", {
    method: "POST",
    body: JSON.stringify({
      given_name: args.givenName || "",
      family_name: args.familyName || "",
      email_address: args.email.trim(),
    }),
  });
  return created.customer.id;
}
