import { createContext, useContext } from "react";
const english = {
  title: "Work with a support message on this device",
  intro:
    "Try the four examples in article order. Each operation checks its own API and configuration. A click may start Chrome's model preparation; the text is processed on this device.",
  translation: "1. Translate a German message",
  message: "Message to translate",
  defaultMessage: "Der Kunde Meier fragt, wo Bestellung 4711 bleibt.",
  source: "Source language tag",
  sourceHint:
    "Start with de for German. Detection below can update this field; the target is English (en).",
  translate: "Translate to English",
  translationResult: "English translation",
  translationCheck:
    "Compare the meaning with ‘Customer Meier asks where order 4711 is.’ Check that the order number survives. The translation may use different wording.",
  detection: "2. Detect the message's language",
  detectionIntro:
    "This uses the message above. Detect its language, then click Translate to English to translate from that language. The two clicks keep model preparation tied to a fresh user action.",
  detect: "Detect language",
  detectionResult: "Detected language",
  detected: (language: string, confidence: number) =>
    `${language} · confidence ${confidence.toFixed(3)}`,
  undetermined:
    "Could not identify the language. Enter a source language tag above.",
  alreadyEnglish:
    "The source is English; the original text is shown without calling Translator.",
  summary: "3. Summarize a conversation",
  threadLabel: "Conversation to summarize",
  thread: [
    "Customer (Mon): Order 4711 arrived damaged, the box was crushed and the lamp inside is broken. I need a replacement before Friday.",
    "Support (Mon): We are sorry about that. Could you send a photo of the damage? A replacement usually ships within two days.",
    "Customer (Tue): Photo attached. Please confirm the replacement arrives before Friday, it is a gift.",
    "Support (Tue): Replacement approved and shipped with express delivery, tracking 88231. The damaged lamp does not need to be returned.",
  ].join("\n"),
  summaryType: "Summary type",
  summaryTypes: [
    { value: "key-points", label: "Key points" },
    { value: "headline", label: "Headline" },
    { value: "tldr", label: "Brief overview" },
    { value: "teaser", label: "Teaser" },
  ],
  summaryOptions: "Short length, plain text, English input and output.",
  stream: "Stream the result as it arrives",
  summarize: "Summarize conversation",
  summaryResult: "Summary",
  summaryCheck:
    "For the sample conversation, check that the lamp is broken, a replacement has shipped, and no return is required. Friday arrival was requested but never confirmed.",
  quota: (used: number, limit: number) =>
    `Input usage: ${used} of ${limit} model input units.`,
  tooLong:
    "This conversation is too long for one call. Shorten it or select fewer messages.",
  extraction: "4. Extract an order number with Prompt",
  extractionInput: "English message to extract from",
  extractionMessage: "Customer Meier asks where order 4711 is.",
  extract: "Extract order number and issue",
  extracted: "Structured result",
  extractionCheck:
    "Check orderNumber against the message. Remove the order number and try again: the instructions ask for an empty string when a field is missing. A valid JSON shape does not check the facts for you.",
  extra: "Check the other three APIs",
  extraNote:
    "These checks report browser availability. Writer, Rewriter, and Proofreader are experimental; this lab has no writing exercises for them.",
  names: {
    translator: "Translator",
    detector: "LanguageDetector",
    summarizer: "Summarizer",
    prompt: "LanguageModel",
    writer: "Writer",
    rewriter: "Rewriter",
    proofreader: "Proofreader",
  },
  state: {
    checking: "Checking availability…",
    absent: "API not exposed by this browser",
    unavailable: "Unavailable for this configuration",
    downloadable: "Can prepare the model; a download may be needed",
    downloading: "Model preparation is in progress",
    available: "Model available",
    failed: "Availability check failed; reload to retry",
  },
  working: "Working…",
  progress: (percent: number) => `Preparing model: ${percent}%`,
  error:
    "The browser rejected the call without a reason. Reload to retry; chrome://on-device-internals shows Chrome's model state.",
  unsupported:
    "This operation is unavailable. Use a supporting desktop Chrome configuration and check the requirements in the article.",
};
export const OnDeviceLabStrings = createContext(english);
export const useStrings = () => useContext(OnDeviceLabStrings);
