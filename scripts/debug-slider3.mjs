import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage();
page.on("console", (m) => console.log("CONSOLE:", m.text().slice(0, 160)));
page.on("pageerror", (e) => console.log("PAGEERROR:", String(e).slice(0, 300)));
await page.goto(
  "http://127.0.0.1:4486/iframe.html?id=components-slider--reorder-buffer&viewMode=story",
  { waitUntil: "load" },
);
await page.waitForTimeout(600);
const html = await page.evaluate(
  () =>
    document.querySelector(".uix-slider")?.outerHTML?.slice(0, 300) ??
    "NOT FOUND",
);
console.log("HTML:", html);
await browser.close();
