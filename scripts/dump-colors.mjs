import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(
  "http://127.0.0.1:4489/iframe.html?id=foundations-tokens--semantic-tokens-story&viewMode=story",
  { waitUntil: "load" },
);
await page.waitForTimeout(800);
const bad = await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll(
    "#root span, #root code, #root p, #root button",
  )) {
    const cs = getComputedStyle(el);
    if (cs.color === "rgb(124, 136, 156)") {
      out.push({
        tag: el.tagName,
        cls: el.className?.toString().slice(0, 40),
        text: el.textContent?.slice(0, 40),
      });
    }
  }
  return out.slice(0, 6);
});
console.log("BAD:", JSON.stringify(bad, null, 1));
await browser.close();
