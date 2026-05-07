import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, "../public/promo/worldcup-instagram.html");
const outPath = path.resolve(__dirname, "../public/promo/worldcup-instagram.jpg");

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1080 });
await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" });
await page.screenshot({ path: outPath, type: "jpeg", quality: 95 });
await browser.close();
console.log("Saved:", outPath);
