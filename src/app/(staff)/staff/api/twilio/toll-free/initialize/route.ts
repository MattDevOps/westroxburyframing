import { NextResponse } from "next/server";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * POST /staff/api/twilio/toll-free/initialize
 * Initialize a ComplianceInquiry for Toll-Free Verification
 * 
 * This endpoint calls Twilio's Trust Hub API to initialize a compliance inquiry
 * and returns the inquiry_id and inquiry_session_token needed for the embeddable.
 */
export async function POST(req: Request) {
  try {
    const userId = getStaffUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tollfreePhoneNumber, notificationEmail, useCaseCategories, businessRegistrationNumber, businessRegistrationAuthority, themeSetId } = body;

    if (!tollfreePhoneNumber) {
      return NextResponse.json(
        { error: "Toll-free phone number is required" },
        { status: 400 }
      );
    }

    if (!notificationEmail) {
      return NextResponse.json(
        { error: "Notification email is required" },
        { status: 400 }
      );
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return NextResponse.json(
        { error: "Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables." },
        { status: 500 }
      );
    }

    // Build request body for Twilio API
    const formData = new URLSearchParams();
    formData.append("TollfreePhoneNumber", tollfreePhoneNumber);
    formData.append("NotificationEmail", notificationEmail);
    
    if (useCaseCategories && Array.isArray(useCaseCategories) && useCaseCategories.length > 0) {
      useCaseCategories.forEach((category: string) => {
        formData.append("UseCaseCategories", category);
      });
    }
    
    if (businessRegistrationNumber) {
      formData.append("BusinessRegistrationNumber", businessRegistrationNumber);
    }
    
    if (businessRegistrationAuthority) {
      formData.append("BusinessRegistrationAuthority", businessRegistrationAuthority);
    }
    
    if (themeSetId) {
      formData.append("ThemeSetId", themeSetId);
    }

    // Call Twilio Trust Hub API
    const response = await fetch(
      "https://trusthub.twilio.com/v1/ComplianceInquiries/Tollfree/Initialize",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
        body: formData.toString(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Twilio API error:", data);
      return NextResponse.json(
        { 
          error: data.message || "Failed to initialize compliance inquiry",
          code: data.code,
          details: data
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      inquiry_id: data.inquiry_id,
      inquiry_session_token: data.inquiry_session_token,
    });
  } catch (error: any) {
    console.error("Error initializing compliance inquiry:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
