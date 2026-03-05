import { NextResponse } from "next/server";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/twilio/toll-free/status?phoneNumber=+18555551234
 * Get the verification status of a toll-free number
 * 
 * This endpoint calls Twilio's Trust Hub API to get the status of a toll-free verification.
 */
export async function GET(req: Request) {
  try {
    const userId = getStaffUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get("phoneNumber");

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return NextResponse.json(
        { error: "Twilio credentials not configured" },
        { status: 500 }
      );
    }

    // Call Twilio Trust Hub API to get verification status
    // Note: This uses the Toll-Free Verifications API endpoint
    const response = await fetch(
      `https://trusthub.twilio.com/v1/Tollfree/Verifications?TollfreePhoneNumber=${encodeURIComponent(phoneNumber)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // If no verification found, return null status
      if (response.status === 404) {
        return NextResponse.json({
          phoneNumber,
          status: null,
          message: "No verification found for this number",
        });
      }
      
      console.error("Twilio API error:", data);
      return NextResponse.json(
        { 
          error: data.message || "Failed to get verification status",
          code: data.code,
        },
        { status: response.status }
      );
    }

    // Return the first verification if multiple exist
    const verification = Array.isArray(data.verifications) && data.verifications.length > 0
      ? data.verifications[0]
      : null;

    return NextResponse.json({
      phoneNumber,
      status: verification?.status || null,
      verification: verification || null,
    });
  } catch (error: any) {
    console.error("Error getting verification status:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
