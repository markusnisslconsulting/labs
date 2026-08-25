import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(
  "http://127.0.0.1:4483/iframe.html?id=components-menu--row-actions&viewMode=story",
  { waitUntil: "load" },
);
await page.waitForTimeout(400);
await page.getByRole("button", { name: /Row actions/ }).click();
await page.waitForTimeout(500);
const menuInfo = await page.evaluate(() => ({
  menu:
    document.querySelector("[role='menu']")?.textContent?.slice(0, 60) ?? null,
  items: document.querySelectorAll("[role='menuitem']").length,
}));
console.log("MENU:", JSON.stringify(menuInfo));

await page.goto(
  "http://127.0.0.1:4483/iframe.html?id=components-slider--reorder-buffer&viewMode=story",
  { waitUntil: "load" },
);
await page.waitForTimeout(400);
const sliderInfo = await page.evaluate(() => {
  const sliders = [...document.querySelectorAll("[role='slider']")];
  return sliders.map((s) => ({
    valuenow: s.getAttribute("aria-valuenow"),
    label: s.getAttribute("aria-label"),
    inTrack: !!s.closest(".uix-slider-track"),
  }));
});
console.log("SLIDER:", JSON.stringify(sliderInfo));

await browser.close();
