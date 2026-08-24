import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage();
page.on("console", (msg) =>
  console.log("CONSOLE:", msg.type(), msg.text().slice(0, 120)),
);
page.on("pageerror", (err) =>
  console.log("PAGEERROR:", String(err).slice(0, 200)),
);

await page.goto(
  "http://127.0.0.1:4471/iframe.html?id=components-tooltip--open-state&viewMode=story",
  { waitUntil: "load" },
);
await page.waitForTimeout(1200);

const info = await page.evaluate(() => ({
  hasContent: document.body.innerHTML.includes("draft rows only"),
  popupCount: document.querySelectorAll(".uix-tooltip-content").length,
  triggerDescribedby:
    document
      .querySelector("[aria-describedby]")
      ?.getAttribute("aria-describedby") ?? null,
  bodyTail: document.body.innerHTML.slice(-400),
}));
console.log(JSON.stringify(info, null, 2));
await browser.close();
