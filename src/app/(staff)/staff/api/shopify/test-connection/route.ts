import { NextResponse } from "next/server";
import { testShopifyConnection } from "@/lib/shopify";

export async function GET() {
  try {
    const result = await testShopifyConnection();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to test connection" },
      { status: 500 }
    );
  }
}
