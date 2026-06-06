const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Accept from CLI args (node reset-password.js email newPassword) or env vars.
  const email = (process.argv[2] || process.env.RESET_EMAIL || "").toLowerCase();
  const password = process.argv[3] || process.env.RESET_PASSWORD || "";

  if (!email || !password || password.length < 8) {
    throw new Error(
      "Usage: node -r dotenv/config scripts/reset-password.js <email> <newPassword>\n" +
        "  (password must be >=8 chars)",
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(`No staff user found with email: ${email}`);
  }

  await prisma.user.update({
    where: { email },
    data: { passwordHash: await bcrypt.hash(password, 12) },
  });

  console.log("Password reset for:", email);
}

main()
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
