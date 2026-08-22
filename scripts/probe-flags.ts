/**
 * Same probe as probe.ts, but with Chrome's AI and WebMCP feature
 * flags enabled at launch. The delta between the two runs is the
 * gated-versus-absent distinction the WebMCP article is built on.
 *
 * Run: pnpm exec tsx scripts/probe-flags.ts
 */
import { chromium } from "@playwright/test";

const args = [
  "--enable-features=AIPromptAPI,AISummarizationAPI,AITranslationAPI," +
    "AILanguageDetectionAPI,AIWriterAPI,AIRewriterAPI,AIProofreaderAPI," +
    "WebMachineLearningModelContext,WebMCP",
  "--optimization-guide-on-device-model=enabled-bypass-perf-requirement",
];

const browser = await chromium.launch({ channel: "chrome", args });
const page = await browser.newPage();
await page.goto("https://example.com");

const result = await page.evaluate(async () => {
  const apis: Record<string, string> = {};
  const names = [
    "LanguageModel",
    "Summarizer",
    "Translator",
    "LanguageDetector",
    "Writer",
    "Rewriter",
    "Proofreader",
  ];
  for (const name of names) {
    const ctor = (globalThis as Record<string, unknown>)[name] as {
      availability?: (options?: unknown) => Promise<string>;
    };
    if (!ctor) {
      apis[name] = "not present";
      continue;
    }
    try {
      apis[name] =
        name === "Translator"
          ? await ctor.availability({
              sourceLanguage: "de",
              targetLanguage: "en",
            })
          : await ctor.availability();
    } catch (error) {
      apis[name] = `error: ${(error as Error).message}`;
    }
  }
  return {
    ...apis,
    "document.modelContext":
      "modelContext" in document ? "present" : "not present",
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
