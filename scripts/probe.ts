/**
 * Reports which built-in browser AI and tool APIs a stock Chrome
 * profile actually exposes, and what availability() answers for each.
 *
 * Run: pnpm exec tsx scripts/probe.ts
 */
import { chromium } from "@playwright/test";

const NAMES = [
  "LanguageModel",
  "Summarizer",
  "Translator",
  "LanguageDetector",
  "Writer",
  "Rewriter",
  "Proofreader",
];

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
await page.goto("https://example.com");

const result = await page.evaluate(async (names) => {
  const version =
    navigator.userAgentData?.brands?.find((b) => b.brand === "Google Chrome")
      ?.version ?? "unknown";
  const apis: Record<string, string> = {};
  for (const name of names) {
    const ctor = (globalThis as Record<string, unknown>)[name] as {
      availability?: () => Promise<string>;
    };
    if (!ctor) {
      apis[name] = "not present";
      continue;
    }
    try {
      apis[name] =
        typeof ctor.availability === "function"
          ? await ctor.availability()
          : "present, no availability()";
    } catch (error) {
      apis[name] = `error: ${(error as Error).message}`;
    }
  }
  return {
    version,
    apis,
    modelContext: {
      "document.modelContext":
        "modelContext" in document
          ? Object.getOwnPropertyNames(
              Object.getPrototypeOf(document.modelContext),
            )
          : "not present",
      "navigator.modelContext":
        "modelContext" in navigator ? "present" : "not present",
    },
  };
}, NAMES);

console.log(JSON.stringify(result, null, 2));
await browser.close();
