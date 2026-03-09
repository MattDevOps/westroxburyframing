"use client";

import { use } from "react";
import { redirect } from "next/navigation";

export default function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  redirect(`/staff/orders/${id}`);
}
