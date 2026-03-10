const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

function hashPassword(pw, secret) {
  return crypto.createHash("sha256").update(pw + secret).digest("hex");
}

async function main() {
  const name = process.env.USER_NAME || "";
  const email = (process.env.USER_EMAIL || "").toLowerCase();
  const password = process.env.USER_PASSWORD || "";
  const role = process.env.USER_ROLE || "staff"; // "admin" or "staff"
  const secret = process.env.AUTH_SECRET || "";

  if (!name || !email || !password || password.length < 6 || !secret) {
    throw new Error("Set USER_NAME, USER_EMAIL, USER_PASSWORD (>=6 chars), AUTH_SECRET. Optionally set USER_ROLE (admin or staff, default: staff)");
  }

  if (role !== "admin" && role !== "staff") {
    throw new Error("USER_ROLE must be 'admin' or 'staff'");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("User already exists:", email);
    return;
  }

  await prisma.user.create({
    data: {
      name,
      email,
      role,
      passwordHash: hashPassword(password, secret),
      locationId: role === "admin" ? null : undefined, // Staff users need location, but we'll let them set it via UI
    },
  });

  console.log(`Created ${role} user:`, email);
  console.log("Note: If this is a staff user, assign them to a location via the Users page in the staff area.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
