const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.STAFF_SEED_ADMIN_EMAIL || "").toLowerCase();
  const password = process.env.STAFF_SEED_ADMIN_PASSWORD || "";

  if (!email || !password || password.length < 8) {
    throw new Error("Set STAFF_SEED_ADMIN_EMAIL, STAFF_SEED_ADMIN_PASSWORD (>=8 chars)");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin already exists:", email);
    return;
  }

  await prisma.user.create({
    data: {
      name: "Admin",
      email,
      role: "admin",
      passwordHash: await bcrypt.hash(password, 12),
    },
  });

  console.log("Seeded admin:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
