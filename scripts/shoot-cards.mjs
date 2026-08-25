import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("https://labs.markusnissl.com/", { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.screenshot({ path: "/tmp/cards-fixed.png", fullPage: false });
await browser.close();
console.log("done");
