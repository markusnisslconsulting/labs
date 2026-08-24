import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage();

await page
  .goto(
    "http://127.0.0.1:4440/iframe.html?id=components-tabs--three-panels&viewMode=story",
    { waitUntil: "load" },
  )
  .catch(async () => {
    // lokaler Server fehlt — später via CI prüfen
  });

const server = "http://127.0.0.1:4468";
if (server) {
  await page.goto(
    `${server}/iframe.html?id=components-tabs--three-panels&viewMode=story`,
    { waitUntil: "load" },
  );
  await page.keyboard.press("Tab");
  const before = await page.evaluate(() => {
    const tabs = [...document.querySelectorAll("[role='tab']")];
    return tabs.map((t) => ({
      id: t.id,
      selected: t.getAttribute("aria-selected"),
      focused: document.activeElement === t,
    }));
  });
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  const after = await page.evaluate(() => {
    const tabs = [...document.querySelectorAll("[role='tab']")];
    return tabs.map((t) => ({
      id: t.id,
      selected: t.getAttribute("aria-selected"),
      focused: document.activeElement === t,
    }));
  });
  console.log("TABS before:", JSON.stringify(before));
  console.log("TABS after :", JSON.stringify(after));

  await page.goto(
    `${server}/iframe.html?id=components-tooltip--on-button&viewMode=story`,
    { waitUntil: "load" },
  );
  await page.waitForTimeout(300);
  await page.hover("button");
  await page.waitForTimeout(1200);
  const tip = await page.evaluate(() => {
    const el = document.querySelector("[role='tooltip']");
    const trigger = document.querySelector("[aria-describedby]");
    return {
      tooltip: el?.textContent ?? null,
      describedby: trigger?.getAttribute("aria-describedby") ?? null,
      bodyHasPopup: document.body.innerHTML.includes("draft rows"),
    };
  });
  console.log("TOOLTIP:", JSON.stringify(tip));
}
await browser.close();
