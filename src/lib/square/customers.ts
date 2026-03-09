import { squareFetch } from "./client";

export async function findCustomerByEmail(email: string): Promise<{ id: string; email_address?: string } | null> {
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
    const customer = resp.customers?.[0];
    return customer || null;
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
  if (existing) {
    // Update customer to ensure email and name are current
    try {
      const updated = await squareFetch<{ customer: { id: string; email_address?: string } }>(`/v2/customers/${existing.id}`, {
        method: "PUT",
        body: JSON.stringify({
          given_name: args.givenName || "",
          family_name: args.familyName || "",
          email_address: args.email.trim(),
        }),
      });
      
      // Verify email was set
      if (!updated.customer?.email_address) {
        console.warn("Square customer update may not have set email:", existing.id);
      }
    } catch (err) {
      // If update fails, customer still exists, so continue
      console.warn("Failed to update Square customer:", err);
    }
    return existing.id;
  }

  const created = await squareFetch<{ customer: { id: string; email_address?: string } }>("/v2/customers", {
    method: "POST",
    body: JSON.stringify({
      given_name: args.givenName || "",
      family_name: args.familyName || "",
      email_address: args.email.trim(),
    }),
  });
  
  // Verify email was set
  if (!created.customer?.email_address) {
    console.warn("Square customer creation may not have set email:", created.customer.id);
  }
  
  return created.customer.id;
}
