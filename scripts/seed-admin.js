const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

function hashPassword(pw, secret) {
  return crypto.createHash("sha256").update(pw + secret).digest("hex");
}

async function main() {
  const email = (process.env.STAFF_SEED_ADMIN_EMAIL || "").toLowerCase();
  const password = process.env.STAFF_SEED_ADMIN_PASSWORD || "";
  const secret = process.env.AUTH_SECRET || "";

  if (!email || !password || password.length < 8 || !secret) {
    throw new Error("Set STAFF_SEED_ADMIN_EMAIL, STAFF_SEED_ADMIN_PASSWORD (>=8 chars), AUTH_SECRET");
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
      passwordHash: hashPassword(password, secret),
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
