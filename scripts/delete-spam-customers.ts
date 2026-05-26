import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGETS = [
  { firstName: "VxxsieGgNwFqieQQwlfqBM", lastName: "TSrVxGjNHdBpBYFqRZYinC" },
  { firstName: "jaRKUwjNDhjeSYdNFyUpsEUd", lastName: "NDNDrNrSrhtLpytDaIgbBP" },
  { firstName: "NuQFCkqqLpeNBGdfHIFHJbRm", lastName: "oVrrRPOMnaJnMLabcGN" },
  { firstName: "cICzThHTrlktAmnPHUyfpIU", lastName: "jeNwUkNKQINrRtvSWHAj" },
  { firstName: "VXBWKIBaRPdOHHzhjnkfmxiu", lastName: "lIYnZDWetradtZyJFCmqmS" },
];
const EMAIL_TARGETS = [
  "ufarigo.d.ud.u.62@gmail.com",
  "ef.ob.e.gol.03.7@gmail.com",
  "ag.esuh.a.ne.v.i0.71@gmail.com",
  "ze.ji.fim.o8.9.9@gmail.com",
];

async function main() {
  const apply = process.argv.includes("--apply");

  const matches = await prisma.customer.findMany({
    where: {
      OR: [
        ...TARGETS.map((t) => ({ firstName: t.firstName, lastName: t.lastName })),
        { email: { in: EMAIL_TARGETS } },
      ],
    },
    include: {
      _count: {
        select: {
          orders: true,
          invoices: true,
          appointments: true,
          tagAssignments: true,
          giftCertificates: true,
          recallSends: true,
        },
      },
    },
  });

  console.log(`Matched ${matches.length} customer(s):`);
  for (const c of matches) {
    console.log(`  - ${c.firstName} ${c.lastName} | ${c.email || "no email"} | ${c.phone || "no phone"} | created ${c.createdAt.toISOString()}`);
    console.log(`    relations:`, c._count);
  }

  if (matches.length === 0) {
    console.log("No matches. Nothing to delete.");
    return;
  }

  const withRelations = matches.filter((c) => {
    const r = c._count;
    return r.orders > 0 || r.invoices > 0 || r.appointments > 0 || r.tagAssignments > 0 || r.giftCertificates > 0 || r.recallSends > 0;
  });
  if (withRelations.length > 0) {
    console.log(`\nWARNING: ${withRelations.length} match(es) have related rows. Aborting to avoid silent cascade. Resolve manually.`);
    return;
  }

  if (!apply) {
    console.log("\n[DRY RUN] Pass --apply to delete.");
    return;
  }

  const ids = matches.map((c) => c.id);
  const result = await prisma.customer.deleteMany({ where: { id: { in: ids } } });
  console.log(`\nDeleted ${result.count} customer(s).`);
  const remaining = await prisma.customer.count();
  console.log(`Customer table now has ${remaining} rows.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
