import { NextResponse } from "next/server";
import { squareFetch } from "@/lib/square/client";

export async function GET() {
  try {
    const data = await squareFetch("/v2/locations");
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Square ping failed" },
      { status: 500 }
    );
  }
}
