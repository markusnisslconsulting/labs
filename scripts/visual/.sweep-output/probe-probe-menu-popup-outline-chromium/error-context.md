# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: probe/probe.spec.ts >> menu popup outline
- Location: scripts/visual/probe/probe.spec.ts:2:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4532/iframe.html?id=components-menu--open&viewMode=story
Call log:
  - navigating to "http://127.0.0.1:4532/iframe.html?id=components-menu--open&viewMode=story", waiting until "load"

```

# Test source

```ts
  1  | import { test } from "@playwright/test";
  2  | test("menu popup outline", async ({ page }) => {
> 3  |   await page.goto("http://127.0.0.1:4532/iframe.html?id=components-menu--open&viewMode=story");
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4532/iframe.html?id=components-menu--open&viewMode=story
  4  |   await page.waitForTimeout(600);
  5  |   const info = await page.evaluate(() => {
  6  |     const el = document.querySelector(".uix-menu") as HTMLElement | null;
  7  |     if (!el) return "no popup";
  8  |     const cs = getComputedStyle(el);
  9  |     return {
  10 |       tabindex: el.getAttribute("tabindex"),
  11 |       isFocused: document.activeElement === el,
  12 |       activeEl: document.activeElement?.className ?? String(document.activeElement?.tagName),
  13 |       outline: cs.outline, outlineColor: cs.outlineColor, outlineWidth: cs.outlineWidth,
  14 |       border: cs.border, borderColor: cs.borderColor,
  15 |       matchesFocusVisible: el.matches(":focus-visible"),
  16 |     };
  17 |   });
  18 |   console.log(JSON.stringify(info, null, 2));
  19 | });
  20 | 
```