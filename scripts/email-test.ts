import "dotenv/config";
import { sendPickupReadyCustomerEmail } from "../src/lib/email";

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error("usage: email-test.ts <email>");
    process.exit(1);
  }
  console.log("EMAIL_PROVIDER_API_KEY set:", !!process.env.EMAIL_PROVIDER_API_KEY);
  console.log("POSTMARK_SERVER_API_TOKEN set:", !!process.env.POSTMARK_SERVER_API_TOKEN);
  console.log("EMAIL_FROM:", process.env.EMAIL_FROM || "(default)");
  console.log("Sending to:", to);
  const r = await sendPickupReadyCustomerEmail({ to, customerName: "Test" });
  console.log("Result:", r);
}
main().catch(e => { console.error("CRASH:", e); process.exit(1); });
