import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { env } from "@/lib/env";
import { normalizeEmail, normalizePhone } from "@/lib/ids";

function getMailchimpBase(): string | null {
  if (!env.MAILCHIMP_API_KEY || !env.MAILCHIMP_AUDIENCE_ID || !env.MAILCHIMP_SERVER_PREFIX) {
    return null;
  }
  return `https://${env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0`;
}

function getAuthHeader(): string {
  return `Basic ${Buffer.from(`anystring:${env.MAILCHIMP_API_KEY}`).toString("base64")}`;
}

/**
 * POST /staff/api/mailchimp/import
 * Import customers from Mailchimp audience
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const base = getMailchimpBase();
  if (!base) {
    return NextResponse.json({ error: "Mailchimp not configured" }, { status: 400 });
  }

  try {
    // Fetch all members from Mailchimp
    let allMembers: any[] = [];
    let offset = 0;
    const count = 1000; // Mailchimp max per page

    while (true) {
      const res = await fetch(
        `${base}/lists/${env.MAILCHIMP_AUDIENCE_ID}/members?count=${count}&offset=${offset}&status=subscribed`,
        {
          method: "GET",
          headers: {
            "Authorization": getAuthHeader(),
          },
        }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to fetch Mailchimp members: ${err}`);
      }

      const data = await res.json();
      allMembers = allMembers.concat(data.members || []);

      if (data.members.length < count) {
        break; // Last page
      }

      offset += count;
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const member of allMembers) {
      if (!member.email_address) {
        skipped++;
        continue;
      }

      const email = normalizeEmail(member.email_address);
      const firstName = member.merge_fields?.FNAME || "";
      const lastName = member.merge_fields?.LNAME || "";
      const phone = member.merge_fields?.PHONE ? normalizePhone(member.merge_fields.PHONE) : null;

      if (!firstName && !lastName) {
        skipped++;
        continue;
      }

      try {
        // Check if customer exists by email
        const existing = await prisma.customer.findFirst({
          where: { email },
        });

        if (existing) {
          // Update existing customer
          await prisma.customer.update({
            where: { id: existing.id },
            data: {
              firstName: firstName || existing.firstName,
              lastName: lastName || existing.lastName,
              phone: phone || existing.phone,
              email: email || existing.email,
              marketingOptIn: true,
              marketingOptInAt: existing.marketingOptInAt || new Date(),
            },
          });
          updated++;

          // Sync tags from Mailchimp
          if (member.tags && Array.isArray(member.tags) && member.tags.length > 0) {
            for (const tag of member.tags) {
              if (tag.name === "Customer") continue; // Skip default tag

              try {
                // Find or create tag
                let customerTag = await (prisma as any).customerTag.findUnique({
                  where: { name: tag.name },
                });

                if (!customerTag) {
                  customerTag = await (prisma as any).customerTag.create({
                    data: { name: tag.name },
                  });
                }

                // Assign tag to customer if not already assigned
                await (prisma as any).customerTagAssignment.upsert({
                  where: {
                    customerId_tagId: {
                      customerId: existing.id,
                      tagId: customerTag.id,
                    },
                  },
                  create: {
                    customerId: existing.id,
                    tagId: customerTag.id,
                  },
                  update: {},
                }).catch(() => {
                  // Ignore if already exists
                });
              } catch (tagError) {
                // Skip tag sync errors
                console.error("Error syncing tag:", tagError);
              }
            }
          }
        } else {
          // Create new customer
          await prisma.customer.create({
            data: {
              firstName,
              lastName,
              email,
              phone,
              preferredContact: "email",
              marketingOptIn: true,
              marketingOptInAt: new Date(),
            },
          });
          imported++;
        }
      } catch (error: any) {
        errors.push(`${member.email_address}: ${error.message || "Failed"}`);
      }
    }

    return NextResponse.json({
      ok: true,
      imported,
      updated,
      skipped,
      total: allMembers.length,
      errors: errors.slice(0, 10), // Limit errors returned
    });
  } catch (error: any) {
    console.error("Error importing from Mailchimp:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import from Mailchimp" },
      { status: 500 }
    );
  }
}
