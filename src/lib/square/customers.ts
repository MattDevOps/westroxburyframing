import { squareFetch } from "./client";

export async function findCustomerByEmail(email: string): Promise<string | null> {
  const resp = await squareFetch<{
    customers?: Array<{ id: string; email_address?: string }>;
  }>("/v2/customers/search", {
    method: "POST",
    body: JSON.stringify({
      query: { filter: { email_address: { exact: email } } },
      limit: 1,
    }),
  });
  const id = resp.customers?.[0]?.id;
  return id || null;
}

export async function upsertCustomer(args: {
  email: string;
  givenName?: string;
  familyName?: string;
}): Promise<string> {
  const existing = await findCustomerByEmail(args.email);
  if (existing) return existing;

  const created = await squareFetch<{ customer: { id: string } }>("/v2/customers", {
    method: "POST",
    body: JSON.stringify({
      email_address: args.email,
      given_name: args.givenName,
      family_name: args.familyName,
    }),
  });
  return created.customer.id;
}
