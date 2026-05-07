import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const limiter = rateLimit({ limit: 10, windowSeconds: 600 }); // 10 per 10 min

/**
 * POST /api/public/customer-photo
 * Public endpoint for uploading a photo of customer artwork from the iPad kiosk camera.
 * Returns the public URL of the uploaded image.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = limiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Please wait a few minutes." },
      { status: 429 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP" },
        { status: 400 },
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Max 10MB." },
        { status: 400 },
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeName = `customer-photos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const blob = await put(safeName, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[Customer photo upload error]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
