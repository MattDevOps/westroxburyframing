import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { handleApiError, AppError } from "@/lib/apiErrorHandler";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /staff/api/vendors/[id]/import-prices
 * Import vendor prices from CSV
 * 
 * Body: {
 *   csv: string (CSV content)
 *   format: "itemNumber,costPerUnit,retailPerUnit" | "itemNumber,description,costPerUnit,retailPerUnit"
 *   updateExisting: boolean (default: true)
 * }
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const vendor = await prisma.vendor.findUnique({
      where: { id },
    });

    if (!vendor) {
      throw new AppError("Vendor not found", 404, "NOT_FOUND");
    }

    const { csv, format = "itemNumber,costPerUnit,retailPerUnit", updateExisting = true } = body;

    if (!csv || typeof csv !== "string") {
      throw new AppError("CSV content is required", 400, "VALIDATION_ERROR");
    }

    // Parse CSV
    const lines = csv.trim().split("\n").filter((line: string) => line.trim());
    if (lines.length < 2) {
      throw new AppError("CSV must have at least a header row and one data row", 400, "VALIDATION_ERROR");
    }

    const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase());
    const itemNumberIndex = headers.indexOf("itemnumber");
    const costIndex = headers.indexOf("costperunit") !== -1 ? headers.indexOf("costperunit") : headers.indexOf("cost");
    const retailIndex = headers.indexOf("retailperunit") !== -1 ? headers.indexOf("retailperunit") : headers.indexOf("retail");
    const descriptionIndex = headers.indexOf("description");

    if (itemNumberIndex === -1 || costIndex === -1) {
      throw new AppError("CSV must include 'itemNumber' and 'costPerUnit' columns", 400, "VALIDATION_ERROR");
    }

    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v: string) => v.trim());
      const itemNumber = values[itemNumberIndex];
      const costPerUnit = parseFloat(values[costIndex]);
      const retailPerUnit = retailIndex !== -1 ? parseFloat(values[retailIndex]) : null;
      const description = descriptionIndex !== -1 ? values[descriptionIndex] : null;

      if (!itemNumber || isNaN(costPerUnit) || costPerUnit < 0) {
        results.errors.push(`Row ${i + 1}: Invalid item number or cost`);
        results.skipped++;
        continue;
      }

      try {
        // Find existing catalog item
        const existing = await prisma.vendorCatalogItem.findFirst({
          where: {
            vendorId: id,
            itemNumber,
          },
        });

        if (existing) {
          if (updateExisting) {
            await prisma.vendorCatalogItem.update({
              where: { id: existing.id },
              data: {
                costPerUnit,
                retailPerUnit: retailPerUnit !== null ? retailPerUnit : existing.retailPerUnit,
                description: description || existing.description,
              },
            });
            results.updated++;
          } else {
            results.skipped++;
          }
        } else {
          // Create new item
          await prisma.vendorCatalogItem.create({
            data: {
              vendorId: id,
              itemNumber,
              description: description || null,
              category: "frame", // Default, can be updated later
              unitType: "foot", // Default, can be updated later
              costPerUnit,
              retailPerUnit,
            },
          });
          results.imported++;
        }
      } catch (error: any) {
        results.errors.push(`Row ${i + 1}: ${error.message || "Failed to process"}`);
        results.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Imported ${results.imported} new items, updated ${results.updated} existing items`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
