import { Button } from "@labs/ui/components/Button";
import { Panel } from "@labs/ui/components/Panel";
import { Stack } from "@labs/ui/components/Stack";
import { StatusPill } from "@labs/ui/components/StatusPill";
import { useEffect, useState } from "react";

type Availability =
  "unavailable" | "downloadable" | "downloading" | "available";
type ApiState = Availability | "absent" | "checking";
type Phase = "idle" | "working" | "needs-download" | "done" | "failed";

const DEFAULT_TEXT = "Der Kunde Meier fragt, wo Bestellung 4711 bleibt.";

const SAMPLE_THREAD = [
  "Customer (Mon): Order 4711 arrived damaged, the box was crushed and the lamp inside is broken. I need a replacement before Friday.",
  "Support (Mon): We are sorry about that. Could you send a photo of the damage? A replacement usually ships within two days.",
  "Customer (Tue): Photo attached. Please confirm the replacement arrives before Friday, it is a gift.",
  "Support (Tue): Replacement approved and shipped with express delivery, tracking 88231. The damaged lamp does not need to be returned.",
].join("\n");

const stateLabel: Record<ApiState, string> = {
  checking: "checking…",
  absent: "not exposed by this browser",
  unavailable: "unavailable on this machine",
  downloadable: "needs a download",
  downloading: "downloading",
  available: "ready on this machine",
};

function toneOf(state: ApiState): "ok" | "warn" | "off" {
  if (state === "available") return "ok";
  if (state === "downloadable" || state === "downloading") return "warn";
  return "off";
}

function hasApi(name: string): boolean {
  return typeof self !== "undefined" && name in self;
}

function errorText(caught: unknown): string {
  if (caught instanceof Error && caught.message) return caught.message;
  if (typeof caught === "string" && caught) return caught;
  return "The browser rejected the call without giving a reason. In our tests this happens when the on-device service is briefly stuck: reload the page and try again, and if it persists, chrome://on-device-internals shows the model's state.";
}

const OnDeviceDemo = () => {
  const [detector, setDetector] = useState<ApiState>("checking");
  const [translator, setTranslator] = useState<ApiState>("checking");
  const [summarizer, setSummarizer] = useState<ApiState>("checking");
  const [prompt, setPrompt] = useState<ApiState>("checking");
  const [writer, setWriter] = useState<ApiState>("checking");
  const [rewriter, setRewriter] = useState<ApiState>("checking");
  const [proofreader, setProofreader] = useState<ApiState>("checking");
  const [text, setText] = useState(DEFAULT_TEXT);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<{
    lang: string;
    english: string;
  } | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarising, setSummarising] = useState(false);
  const [extracted, setExtracted] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    function probe(
      name: string,
      check: () => Promise<Availability>,
      set: (state: ApiState) => void,
    ) {
      if (!hasApi(name)) {
        set("absent");
        return;
      }
      check()
        .then((state) => {
          if (!cancelled) set(state);
        })
        .catch(() => {
          if (!cancelled) set("unavailable");
        });
    }

    probe(
      "LanguageDetector",
      () => LanguageDetector.availability(),
      setDetector,
    );
    probe(
      "Translator",
      () =>
        Translator.availability({ sourceLanguage: "de", targetLanguage: "en" }),
      setTranslator,
    );
    probe("Summarizer", () => Summarizer.availability(), setSummarizer);
    probe("LanguageModel", () => LanguageModel.availability(), setPrompt);
    probe("Writer", () => Writer.availability(), setWriter);
    probe("Rewriter", () => Rewriter.availability(), setRewriter);
    probe("Proofreader", () => Proofreader.availability(), setProofreader);

    return () => {
      cancelled = true;
    };
  }, []);

  const supported = detector !== "absent" && translator !== "absent";
  const modelPresent = summarizer === "available" || prompt === "available";

  const run = async (allowDownload: boolean) => {
    setError(null);
    setResult(null);
    setProgress(null);
    setPhase("working");
    try {
      const languageDetector = await LanguageDetector.create();
      const [top] = await languageDetector.detect(text);
      const source = top?.detectedLanguage ?? "de";

      if (source === "en") {
        setResult({ lang: "en", english: text });
        setPhase("done");
        return;
      }

      const pair = await Translator.availability({
        sourceLanguage: source,
        targetLanguage: "en",
      });
      if (pair === "unavailable") {
        setError(`This machine has no on-device pair for ${source} → en.`);
        setPhase("failed");
        return;
      }
      if (pair !== "available" && !allowDownload) {
        setResult({ lang: source, english: "" });
        setPhase("needs-download");
        return;
      }

      const activeTranslator = await Translator.create({
        sourceLanguage: source,
        targetLanguage: "en",
        monitor(monitor) {
          monitor.addEventListener("downloadprogress", (event) => {
            setProgress((event as ProgressEvent).loaded);
          });
        },
      });
      setProgress(null);
      const english = await activeTranslator.translate(text);
      setResult({ lang: source, english });
      setPhase("done");
    } catch (caught) {
      setError(errorText(caught));
      setPhase("failed");
    }
  };

  const runSummary = async () => {
    setError(null);
    setSummary(null);
    setSummarising(true);
    try {
      const activeSummarizer = await Summarizer.create({
        type: "key-points",
        format: "plain-text",
        length: "short",
        monitor(monitor) {
          monitor.addEventListener("downloadprogress", (event) => {
            setProgress((event as ProgressEvent).loaded);
          });
        },
      });
      setProgress(null);
      const keyPoints = await activeSummarizer.summarize(SAMPLE_THREAD);
      setSummary(keyPoints);
      setSummarizer("available");
      activeSummarizer.destroy();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setProgress(null);
      setSummarising(false);
    }
  };

  const runAsk = async () => {
    setError(null);
    setExtracted(null);
    setAsking(true);
    try {
      const session = await LanguageModel.create({
        monitor(monitor) {
          monitor.addEventListener("downloadprogress", (event) => {
            setProgress((event as ProgressEvent).loaded);
          });
        },
      });
      setProgress(null);
      const raw = await session.prompt(
        `Extract the order number and the issue from this support message: "${text}"`,
        {
          responseConstraint: {
            type: "object",
            properties: {
              orderNumber: { type: "string" },
              issue: { type: "string" },
            },
            required: ["orderNumber", "issue"],
          },
        },
      );
      setExtracted(raw);
      setPrompt("available");
      session.destroy();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setProgress(null);
      setAsking(false);
    }
  };

  return (
    <Panel label="Live · the seven built-in APIs, checked on this machine">
      {/* The space between these used to come from each Panel's own bottom
          margin, which is gone. Several of them are conditional, and a
          margin on a conditional sibling is the case that breaks first. */}
      <Stack gap="lg">
        <ul className="demo-status">
          <li>
            Language Detector ·{" "}
            <StatusPill tone={toneOf(detector)}>
              {stateLabel[detector]}
            </StatusPill>
          </li>
          <li>
            Translator (de → en) ·{" "}
            <StatusPill tone={toneOf(translator)}>
              {stateLabel[translator]}
            </StatusPill>
          </li>
          <li>
            Summarizer ·{" "}
            <StatusPill tone={toneOf(summarizer)}>
              {stateLabel[summarizer]}
            </StatusPill>
          </li>
          <li>
            Prompt ·{" "}
            <StatusPill tone={toneOf(prompt)}>{stateLabel[prompt]}</StatusPill>
          </li>
          <li>
            Writer ·{" "}
            <StatusPill tone={toneOf(writer)}>{stateLabel[writer]}</StatusPill>
          </li>
          <li>
            Rewriter ·{" "}
            <StatusPill tone={toneOf(rewriter)}>
              {stateLabel[rewriter]}
            </StatusPill>
          </li>
          <li>
            Proofreader ·{" "}
            <StatusPill tone={toneOf(proofreader)}>
              {stateLabel[proofreader]}
            </StatusPill>
          </li>
        </ul>

        <textarea
          className="demo-textarea"
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-label="Text to translate on this machine"
        />
        <div className="demo-actions">
          <button
            type="button"
            className="demo-button"
            disabled={!supported || phase === "working"}
            onClick={() => run(false)}
          >
            {phase === "working"
              ? "Working…"
              : "Detect and translate on this machine"}
          </button>
          {phase === "needs-download" ? (
            <button
              type="button"
              className="demo-button ghost"
              onClick={() => run(true)}
            >
              Download the language pack (small) and translate
            </button>
          ) : null}
          {summarizer === "available" || summarizer === "downloadable" ? (
            <Button
              variant="outline"
              disabled={summarising}
              onClick={runSummary}
            >
              {summarising
                ? "Summarising…"
                : summarizer === "available"
                  ? "Summarise a sample ticket thread (three bullets)"
                  : "Download the shared model (several GB) and summarise"}
            </Button>
          ) : null}
          {prompt === "available" || prompt === "downloadable" ? (
            <Button variant="outline" disabled={asking} onClick={runAsk}>
              {asking
                ? "Asking…"
                : prompt === "available"
                  ? "Ask: extract order number and issue (JSON)"
                  : "Download the shared model (several GB) and ask"}
            </Button>
          ) : null}
        </div>

        {progress !== null ? (
          <div
            className="demo-progress"
            role="progressbar"
            aria-label="Model download"
          >
            <span style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        ) : null}

        {phase === "needs-download" && result ? (
          <p className="demo-note">
            Detected {result.lang}. The {result.lang} → en pack is not on this
            machine yet. Downloading it is your call, which is exactly how{" "}
            <code>create()</code> should be treated in a product.
          </p>
        ) : null}

        {phase === "done" && result ? (
          <Panel>
            Detected <strong>{result.lang}</strong> → &ldquo;{result.english}
            &rdquo;
            <p className="demo-note">
              That sentence was translated on your machine. Nothing was sent to
              a server; the network tab can confirm it.
            </p>
          </Panel>
        ) : null}

        {summary ? (
          <Panel>
            <strong>Key points</strong>
            <p style={{ whiteSpace: "pre-line", margin: "0.5rem 0 0" }}>
              {summary}
            </p>
            <p className="demo-note">
              Short key points, plain text: the documented shape from the budget
              section, produced on your machine from a four-message sample
              thread.
            </p>
          </Panel>
        ) : null}

        {extracted ? (
          <Panel>
            <strong>Extracted</strong>
            <p style={{ whiteSpace: "pre-line", margin: "0.5rem 0 0" }}>
              <code>{extracted}</code>
            </p>
            <p className="demo-note">
              The escape hatch with a schema: the Prompt API had to answer in
              the declared JSON shape, on your machine.
            </p>
          </Panel>
        ) : null}

        {error ? <p className="demo-note">{error}</p> : null}

        {!supported && detector !== "checking" ? (
          <p className="demo-note">
            Your browser does not expose these APIs. You are looking at the{" "}
            <code>unavailable</code> state the article says to design for. In a
            current desktop Chrome, the buttons above run entirely on the local
            machine.
          </p>
        ) : (
          <p className="demo-note">
            The chips are live <code>availability()</code> answers from your
            browser, for this origin, on this machine, for everything Chrome
            offers today. Nothing downloads without your click, and every
            download button says what it fetches: the language pack is small,
            the shared model behind Summarise and Ask is a multi-gigabyte
            download. Write, rewrite and proofread are in trials; they appear as
            states here until their API shape settles.
            {modelPresent
              ? " The shared model is on this machine, so Summarise and Ask run immediately."
              : ""}
          </p>
        )}
      </Stack>
    </Panel>
  );
};

export default OnDeviceDemo;
