export {};

type BuiltinAiAvailability =
  "unavailable" | "downloadable" | "downloading" | "available";

declare global {
  class LanguageDetector {
    static availability(): Promise<BuiltinAiAvailability>;
    static create(options?: {
      monitor?(monitor: EventTarget): void;
    }): Promise<LanguageDetector>;
    detect(
      text: string,
    ): Promise<Array<{ detectedLanguage: string; confidence: number }>>;
  }

  class Translator {
    static availability(options: {
      sourceLanguage: string;
      targetLanguage: string;
    }): Promise<BuiltinAiAvailability>;
    static create(options: {
      sourceLanguage: string;
      targetLanguage: string;
      monitor?(monitor: EventTarget): void;
    }): Promise<Translator>;
    translate(text: string): Promise<string>;
  }

  interface SummarizerCreateOptions {
    type?: "key-points" | "tldr" | "teaser" | "headline";
    format?: "markdown" | "plain-text";
    length?: "short" | "medium" | "long";
    monitor?(monitor: EventTarget): void;
  }

  class Summarizer {
    static availability(): Promise<BuiltinAiAvailability>;
    static create(options?: SummarizerCreateOptions): Promise<Summarizer>;
    summarize(input: string): Promise<string>;
    measureInputUsage(input: string): Promise<number>;
    readonly inputQuota: number;
    destroy(): void;
  }

  interface LanguageModelCreateOptions {
    monitor?(monitor: EventTarget): void;
    expectedInputs?: { type: "text" | "image" | "audio" }[];
  }

  class LanguageModel {
    static availability(): Promise<BuiltinAiAvailability>;
    static create(options?: LanguageModelCreateOptions): Promise<LanguageModel>;
    prompt(
      input: string,
      options?: { responseConstraint?: Record<string, unknown> },
    ): Promise<string>;
    destroy(): void;
  }

  class Writer {
    static availability(): Promise<BuiltinAiAvailability>;
  }

  class Rewriter {
    static availability(): Promise<BuiltinAiAvailability>;
  }

  class Proofreader {
    static availability(): Promise<BuiltinAiAvailability>;
  }

  interface ModelContextTool {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    execute(input: Record<string, unknown>): Promise<unknown> | unknown;
  }

  interface ModelContext {
    registerTool(
      tool: ModelContextTool,
      options?: { signal?: AbortSignal },
    ): Promise<void> | void;
  }

  interface Document {
    modelContext?: ModelContext;
  }
}
