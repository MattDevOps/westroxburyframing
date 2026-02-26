import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

const POSTMARK_API = "https://api.postmarkapp.com/email";

async function sendViaPostmark(params: {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey =
    process.env.EMAIL_PROVIDER_API_KEY || process.env.POSTMARK_SERVER_API_TOKEN;
  if (!apiKey) {
    console.warn("EMAIL: No API key configured. Set EMAIL_PROVIDER_API_KEY or POSTMARK_SERVER_API_TOKEN.");
    return { ok: false, error: "Email not configured" };
  }

  const body: Record<string, string | undefined> = {
    From: params.from,
    To: params.to,
    Subject: params.subject,
    TextBody: params.text,
  };
  if (params.html) body.HtmlBody = params.html;

  const res = await fetch(POSTMARK_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": apiKey,
    },
    body: JSON.stringify(body),
  });

    if (!res.ok) {
      const errText = await res.text();
      let errorMessage = errText || `HTTP ${res.status}`;
      
      try {
        const errJson = JSON.parse(errText);
        if (errJson.ErrorCode === 412) {
          errorMessage = "⚠️ Postmark Account Pending Approval: Your Postmark account is in pending approval status and can only send emails to addresses on the same domain (westroxburyframing.com). To send to external addresses, you need to:\n\n1. Log into your Postmark account at https://account.postmarkapp.com\n2. Complete account verification (verify your domain, add billing info if required)\n3. Wait for Postmark to approve your account (usually 24-48 hours)\n\nUntil approved, you can only send to @westroxburyframing.com addresses.";
        } else if (errJson.Message) {
          errorMessage = errJson.Message;
        }
      } catch {
        // Not JSON, use raw text
      }
      
      console.error("Postmark send failed:", res.status, errorMessage);
      return { ok: false, error: errorMessage };
    }
  return { ok: true };
}

function getFrom(): string {
  return process.env.EMAIL_FROM || "West Roxbury Framing <jake@westroxburyframing.com>";
}

function emailLayout(opts: {
  heading: string;
  body: string;
  cta?: { label: string; url: string };
}): string {
  const baseUrl = process.env.PUBLIC_BASE_URL || "https://westroxburyframing.com";
  const ctaHtml = opts.cta
    ? `<tr><td style="padding:24px 0 0">
        <a href="${opts.cta.url}" style="display:inline-block;background:#b8860b;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:6px">${opts.cta.label}</a>
       </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${opts.heading}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">

  <!-- Header -->
  <tr><td style="background:#1a1a1a;padding:24px 32px;text-align:center">
    <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.5px">
      West Roxbury <span style="color:#b8860b">Framing</span>
    </h1>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td>
        <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a1a">${opts.heading}</h2>
      </td></tr>
      <tr><td style="font-size:15px;line-height:1.6;color:#404040">
        ${opts.body}
      </td></tr>
      ${ctaHtml}
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#fafaf9;padding:24px 32px;border-top:1px solid #e5e5e5">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="font-size:12px;color:#a3a3a3;line-height:1.5">
        <strong style="color:#737373">West Roxbury Framing</strong><br>
        1741 Centre Street, West Roxbury, MA 02132<br>
        (617) 327-3890 &bull; <a href="${baseUrl}" style="color:#b8860b;text-decoration:none">westroxburyframing.com</a>
      </td></tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }
  const { subject, message, tagId, customerIds, includeUnsubscribed, discountPercent } = body;

  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  // Build customer query
  const where: any = {};
  
  if (tagId && tagId.trim() !== "") {
    // Filter by specific tag
    where.tagAssignments = {
      some: {
        tagId: tagId,
      },
    };
  } else if (customerIds && Array.isArray(customerIds) && customerIds.length > 0) {
    // Filter by specific customer IDs
    where.id = { in: customerIds };
  }
  // If neither tagId nor customerIds specified, send to all customers (no additional filter)

  // Filter by email and opt-in status
  where.email = { not: null };
  if (!includeUnsubscribed) {
    where.marketingOptIn = true;
  }

  let customers;
  try {
    customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });
  } catch (error: any) {
    console.error("Error fetching customers for email blast:", error);
    
    // Fallback if Prisma client doesn't recognize tagAssignments
    if (error.message && error.message.includes('tagAssignments')) {
      try {
        // Fetch customers with tag separately
        if (tagId && tagId.trim() !== "") {
          const assignments = await (prisma as any).customerTagAssignment?.findMany({
            where: { tagId },
            select: { customerId: true },
          }).catch(() => []);
          
          const customerIdsWithTag = assignments.map((a: any) => a.customerId);
          if (customerIdsWithTag.length === 0) {
            return NextResponse.json({ 
              error: "No customers found with the selected tag. Make sure customers have the tag assigned and have opted in for marketing emails." 
            }, { status: 400 });
          }
          
          const fallbackWhere: any = {
            id: { in: customerIdsWithTag },
            email: { not: null },
          };
          if (!includeUnsubscribed) {
            fallbackWhere.marketingOptIn = true;
          }
          
          customers = await prisma.customer.findMany({
            where: fallbackWhere,
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          });
        } else {
          // No tag filter, just use basic where
          const fallbackWhere: any = {
            email: { not: null },
          };
          if (!includeUnsubscribed) {
            fallbackWhere.marketingOptIn = true;
          }
          
          customers = await prisma.customer.findMany({
            where: fallbackWhere,
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          });
        }
      } catch (fallbackError: any) {
        console.error("Fallback query also failed:", fallbackError);
        return NextResponse.json(
          { error: fallbackError.message || "Failed to fetch customers" },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: error.message || "Failed to fetch customers" },
        { status: 500 }
      );
    }
  }

  if (customers.length === 0) {
    // Provide more helpful error message
    let errorMsg = "No customers found matching criteria.";
    if (!includeUnsubscribed) {
      errorMsg += " Make sure customers have opted in for marketing emails (marketingOptIn = true)";
    }
    if (tagId) {
      errorMsg += ` and have the selected tag assigned.`;
    } else if (customerIds && customerIds.length > 0) {
      errorMsg += ` Check that the selected customers have email addresses.`;
    } else {
      errorMsg += " Check that customers have email addresses and have opted in for marketing.";
    }
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }

  const baseUrl = process.env.PUBLIC_BASE_URL || "https://westroxburyframing.com";
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Send emails
  for (const customer of customers) {
    if (!customer.email) continue;

    const customerName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Customer";
    let personalizedMessage = message.replace(/\{\{name\}\}/g, customerName);
    
    // Replace {{discount}} placeholder if present (for templates)
    const discount = discountPercent ? discountPercent.toString() : "20";
    personalizedMessage = personalizedMessage.replace(/\{\{discount\}\}/g, discount);

    const html = emailLayout({
      heading: subject,
      body: `<p>${personalizedMessage.replace(/\n/g, "</p><p>")}</p>`,
      cta: { label: "Visit Our Website", url: baseUrl },
    });

    const text = personalizedMessage;

    const result = await sendViaPostmark({
      to: customer.email,
      from: getFrom(),
      subject,
      text,
      html,
    });

    if (result.ok) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push(`${customer.email}: ${result.error || "Failed"}`);
    }
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      entityType: "system",
      action: "email_blast_sent",
      entityId: "email_blast", // System-level action, use a placeholder ID
      actorUserId: userId,
      metadata: {
        subject,
        totalRecipients: customers.length,
        sent: results.sent,
        failed: results.failed,
        tagId: tagId || null,
        customerIds: customerIds || null,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    total: customers.length,
    sent: results.sent,
    failed: results.failed,
    errors: results.errors.slice(0, 10), // Limit errors returned
  });
}
