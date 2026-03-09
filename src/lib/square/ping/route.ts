import { NextResponse } from "next/server";
import { squareFetch } from "@/lib/square/client";

export async function GET() {
  const me = await squareFetch("/v2/locations");
  return NextResponse.json(me);
}
