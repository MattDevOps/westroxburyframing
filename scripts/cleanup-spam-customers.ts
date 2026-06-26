/**
 * One-off cleanup for the bot wave that created fake Customer records via the
 * public order/quote/kiosk endpoints (gibberish names like "IqvZvYrtmZtkFTel").
 *
 * Uses the SAME detector that now guards those endpoints (src/lib/spam.ts), so
 * what gets deleted here is exactly what would be blocked going forward.
 *
 *   Dry run (default, deletes nothing):  npx tsx -r dotenv/config scripts/cleanup-spam-customers.ts
 *   Actually delete:                     npx tsx -r dotenv/config scripts/cleanup-spam-customers.ts --delete
 *
 * Per spam customer we remove, in a transaction: their CustomerMessages and
 * ActivityLogs (linked by orderId, no DB cascade), their Orders (cascades order
 * children), then the Customer itself (cascades tags + recall sends).
 */
import { PrismaClient } from "@prisma/client";
import { detectSpamName } from "../src/lib/spam";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--delete");

async function main() {
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      passwordHash: true,
      createdAt: true,
      _count: { select: { orders: true, invoices: true, appointments: true, giftCertificates: true } },
    },
  });

  const spam = customers.filter((c) => detectSpamName(c.firstName, c.lastName).spam);

  console.log(`Scanned ${customers.length} customers; ${spam.length} match the spam-name heuristic.\n`);
  for (const c of spam) {
    const reason = detectSpamName(c.firstName, c.lastName).reason;
    console.log(
      `  ${c.createdAt.toISOString().slice(0, 10)}  "${c.firstName} ${c.lastName}"  <${c.email ?? "no-email"}>  ` +
        `orders=${c._count.orders} invoices=${c._count.invoices} appts=${c._count.appointments} ` +
        `gift=${c._count.giftCertificates}${c.passwordHash ? " [has-login]" : ""}  (${reason})`,
    );
  }

  if (spam.length === 0) {
    console.log("\nNothing to do.");
    return;
  }

  if (!APPLY) {
    console.log(`\nDRY RUN — nothing deleted. Re-run with --delete to remove these ${spam.length} records.`);
    return;
  }

  console.log(`\nDeleting ${spam.length} spam customers...`);
  let deleted = 0;
  const failures: { name: string; error: string }[] = [];

  for (const c of spam) {
    try {
      const orders = await prisma.order.findMany({ where: { customerId: c.id }, select: { id: true } });
      const orderIds = orders.map((o) => o.id);

      await prisma.$transaction(async (tx) => {
        if (orderIds.length > 0) {
          await tx.customerMessage.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.activityLog.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.order.deleteMany({ where: { id: { in: orderIds } } });
        }
        await tx.customer.delete({ where: { id: c.id } });
      });
      deleted++;
    } catch (e) {
      failures.push({ name: `${c.firstName} ${c.lastName}`, error: e instanceof Error ? e.message : String(e) });
    }
  }

  console.log(`\nDeleted ${deleted}/${spam.length}.`);
  if (failures.length > 0) {
    console.log(`${failures.length} could not be deleted (likely real records with other relations):`);
    for (const f of failures) console.log(`  "${f.name}": ${f.error.split("\n")[0]}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
