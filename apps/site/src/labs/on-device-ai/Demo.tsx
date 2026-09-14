import { Button } from "@labs/ui/components/Button";
import { Panel } from "@labs/ui/components/Panel";
import { Stack } from "@labs/ui/components/Stack";
import { TextField } from "@labs/ui/components/TextField";
import { Textarea } from "@labs/ui/components/Textarea";
import { Select } from "@labs/ui/components/Select";
import { Checkbox } from "@labs/ui/components/Checkbox";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStrings } from "./strings";

type Availability =
  "unavailable" | "downloadable" | "downloading" | "available";
type ApiState = Availability | "absent" | "checking" | "failed";
function useAvailability(name: string, check: () => Promise<Availability>) {
  const [state, setState] = useState<ApiState>("checking");
  useEffect(() => {
    let active = true;
    async function probe() {
      setState("checking");
      if (!(name in self)) {
        setState("absent");
        return;
      }
      try {
        const result = await check();
        if (active) setState(result);
      } catch {
        if (active) setState("failed");
      }
    }
    void probe();
    return () => {
      active = false;
    };
  }, [name, check]);
  return state;
}
const usable = (state: ApiState) =>
  ["available", "downloadable", "downloading"].includes(state);
const detectorAvailability = () => LanguageDetector.availability();
const writerAvailability = () => Writer.availability();
const rewriterAvailability = () => Rewriter.availability();
const proofreaderAvailability = () => Proofreader.availability();

/** Each operation owns its progress/error and destroys its instance on every exit. */
function useOperation() {
  const s = useStrings();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const resources = useRef(new Set<{ destroy(): void }>());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const active = resources.current;
    return () => {
      mounted.current = false;
      for (const item of active) item.destroy();
      active.clear();
    };
  }, []);
  const track = <T extends { destroy(): void }>(resource: T): T => {
    if (!mounted.current) {
      resource.destroy();
      throw new Error("Operation ended with the page.");
    }
    resources.current.add(resource);
    return resource;
  };
  const monitor = (target: EventTarget) =>
    target.addEventListener("downloadprogress", (event) => {
      setProgress(Math.round((event as ProgressEvent).loaded * 100));
    });
  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError("");
    setProgress(null);
    try {
      await task();
    } catch (caught) {
      if (mounted.current)
        setError(caught instanceof Error ? caught.message : s.error);
    } finally {
      for (const resource of resources.current) resource.destroy();
      resources.current.clear();
      if (mounted.current) {
        setBusy(false);
        setProgress(null);
      }
    }
  }
  return { busy, progress, error, run, track, monitor };
}
function OperationStatus({
  operation,
}: {
  operation: ReturnType<typeof useOperation>;
}) {
  const s = useStrings();
  return (
    <>
      {operation.progress !== null && (
        <p role="status">{s.progress(operation.progress)}</p>
      )}
      {operation.error && <p role="alert">{operation.error}</p>}
    </>
  );
}
function Result({ label, value }: { label: string; value: string }) {
  return (
    <Panel label={label}>
      <pre className="demo-call" aria-live="polite">
        {value}
      </pre>
    </Panel>
  );
}

export default function OnDeviceDemo() {
  const s = useStrings();
  const [message, setMessage] = useState(s.defaultMessage);
  const [source, setSource] = useState("de");
  const [translation, setTranslation] = useState("");
  const [detected, setDetected] = useState("");
  const pair = useMemo(
    () => ({ sourceLanguage: source, targetLanguage: "en" }),
    [source],
  );
  const checkPair = useCallback(() => Translator.availability(pair), [pair]);
  const translationState = useAvailability("Translator", checkPair);
  const detectionState = useAvailability(
    "LanguageDetector",
    detectorAvailability,
  );
  const translationOp = useOperation();
  const detectionOp = useOperation();

  return (
    <Stack gap="lg">
      <Panel label={s.translation}>
        <Stack gap="md">
          <Textarea
            label={s.message}
            value={message}
            disabled={translationOp.busy || detectionOp.busy}
            onChange={(event) => {
              setMessage(event.target.value);
              setTranslation("");
              setDetected("");
            }}
          />
          <TextField
            label={s.source}
            hint={s.sourceHint}
            value={source}
            disabled={translationOp.busy || detectionOp.busy}
            onChange={(event) => {
              setSource(event.target.value);
              setTranslation("");
            }}
          />
          <p>
            {s.names.translator}: {s.state[translationState]}
          </p>
          <Button
            disabled={
              translationOp.busy ||
              detectionOp.busy ||
              !message.trim() ||
              (source !== "en" && !usable(translationState))
            }
            onClick={() =>
              translationOp.run(async () => {
                setTranslation("");
                if (source === "en") {
                  setTranslation(message);
                  return;
                }
                const translator = translationOp.track(
                  await Translator.create({
                    ...pair,
                    monitor: translationOp.monitor,
                  }),
                );
                setTranslation(await translator.translate(message));
              })
            }
          >
            {translationOp.busy ? s.working : s.translate}
          </Button>
          <OperationStatus operation={translationOp} />
          {translation && (
            <Result label={s.translationResult} value={translation} />
          )}
          {source === "en" && translation && <p>{s.alreadyEnglish}</p>}
          <p className="demo-note">{s.translationCheck}</p>
        </Stack>
      </Panel>
      <Panel label={s.detection}>
        <Stack gap="md">
          <p>{s.detectionIntro}</p>
          <p>
            {s.names.detector}: {s.state[detectionState]}
          </p>
          <Button
            disabled={
              !usable(detectionState) ||
              detectionOp.busy ||
              translationOp.busy ||
              !message.trim()
            }
            onClick={() =>
              detectionOp.run(async () => {
                setDetected("");
                setTranslation("");
                const detector = detectionOp.track(
                  await LanguageDetector.create({
                    monitor: detectionOp.monitor,
                  }),
                );
                const [best] = await detector.detect(message);
                if (!best?.detectedLanguage || best.detectedLanguage === "und")
                  throw new Error(s.undetermined);
                setDetected(s.detected(best.detectedLanguage, best.confidence));
                setSource(best.detectedLanguage);
              })
            }
          >
            {detectionOp.busy ? s.working : s.detect}
          </Button>
          <OperationStatus operation={detectionOp} />
          {detected && <Result label={s.detectionResult} value={detected} />}
        </Stack>
      </Panel>
      <SummaryExample />
      <ExtractionExample />
      <ExtraAvailability />
    </Stack>
  );
}

function SummaryExample() {
  const s = useStrings();
  const [thread, setThread] = useState(s.thread);
  const [type, setType] =
    useState<NonNullable<SummarizerCreateOptions["type"]>>("key-points");
  const [stream, setStream] = useState(false);
  const [result, setResult] = useState("");
  const [quota, setQuota] = useState("");
  const options = useMemo(
    () =>
      ({
        type,
        format: "plain-text",
        length: "short",
        expectedInputLanguages: ["en"],
        outputLanguage: "en",
      }) as const,
    [type],
  );
  const check = useCallback(() => Summarizer.availability(options), [options]);
  const state = useAvailability("Summarizer", check);
  const operation = useOperation();
  return (
    <Panel label={s.summary}>
      <Stack gap="md">
        <Textarea
          label={s.threadLabel}
          value={thread}
          rows={9}
          disabled={operation.busy}
          onChange={(event) => {
            setThread(event.target.value);
            setResult("");
            setQuota("");
          }}
        />
        <Select
          label={s.summaryType}
          value={type}
          options={s.summaryTypes}
          disabled={operation.busy}
          onChange={(event) => {
            setType(event.target.value as typeof type);
            setResult("");
          }}
        />
        <p>{s.summaryOptions}</p>
        <Checkbox
          label={s.stream}
          checked={stream}
          onCheckedChange={setStream}
          disabled={operation.busy}
        />
        <p>
          {s.names.summarizer}: {s.state[state]}
        </p>
        <Button
          disabled={!usable(state) || operation.busy || !thread.trim()}
          onClick={() =>
            operation.run(async () => {
              setResult("");
              setQuota("");
              const summarizer = operation.track(
                await Summarizer.create({
                  ...options,
                  monitor: operation.monitor,
                }),
              );
              const usage = await summarizer.measureInputUsage(thread);
              setQuota(s.quota(usage, summarizer.inputQuota));
              if (usage > summarizer.inputQuota) throw new Error(s.tooLong);
              if (stream) {
                const reader = summarizer
                  .summarizeStreaming(thread)
                  .getReader();
                try {
                  while (true) {
                    const chunk = await reader.read();
                    if (chunk.done) break;
                    setResult((text) => text + chunk.value);
                  }
                } finally {
                  reader.releaseLock();
                }
              } else {
                setResult(await summarizer.summarize(thread));
              }
            })
          }
        >
          {operation.busy ? s.working : s.summarize}
        </Button>
        <OperationStatus operation={operation} />
        {quota && <p>{quota}</p>}
        {result && <Result label={s.summaryResult} value={result} />}
        <p className="demo-note">{s.summaryCheck}</p>
      </Stack>
    </Panel>
  );
}

const promptOptions = {
  expectedInputs: [{ type: "text", languages: ["en"] }],
  expectedOutputs: [{ type: "text", languages: ["en"] }],
} satisfies LanguageModelCreateOptions;
const checkPrompt = () => LanguageModel.availability(promptOptions);
function ExtractionExample() {
  const s = useStrings();
  const [message, setMessage] = useState(s.extractionMessage);
  const [result, setResult] = useState("");
  const state = useAvailability("LanguageModel", checkPrompt);
  const operation = useOperation();
  return (
    <Panel label={s.extraction}>
      <Stack gap="md">
        <Textarea
          label={s.extractionInput}
          value={message}
          disabled={operation.busy}
          onChange={(event) => {
            setMessage(event.target.value);
            setResult("");
          }}
        />
        <p>
          {s.names.prompt}: {s.state[state]}
        </p>
        <Button
          disabled={!usable(state) || operation.busy || !message.trim()}
          onClick={() =>
            operation.run(async () => {
              setResult("");
              const session = operation.track(
                await LanguageModel.create({
                  ...promptOptions,
                  monitor: operation.monitor,
                }),
              );
              const raw = await session.prompt(
                `Extract the order number and describe the issue in English.
Use an empty string for a field that is missing.
Message: ${message}`,
                {
                  responseConstraint: {
                    type: "object",
                    properties: {
                      orderNumber: { type: "string" },
                      issue: { type: "string" },
                    },
                    required: ["orderNumber", "issue"],
                    additionalProperties: false,
                  },
                },
              );
              setResult(JSON.stringify(JSON.parse(raw), null, 2));
            })
          }
        >
          {operation.busy ? s.working : s.extract}
        </Button>
        <OperationStatus operation={operation} />
        {result && <Result label={s.extracted} value={result} />}
        <p className="demo-note">{s.extractionCheck}</p>
      </Stack>
    </Panel>
  );
}
function ExtraAvailability() {
  const s = useStrings();
  const writer = useAvailability("Writer", writerAvailability);
  const rewriter = useAvailability("Rewriter", rewriterAvailability);
  const proofreader = useAvailability("Proofreader", proofreaderAvailability);
  return (
    <details>
      <summary>{s.extra}</summary>
      <p>{s.extraNote}</p>
      <ul>
        <li>
          {s.names.writer}: {s.state[writer]}
        </li>
        <li>
          {s.names.rewriter}: {s.state[rewriter]}
        </li>
        <li>
          {s.names.proofreader}: {s.state[proofreader]}
        </li>
      </ul>
    </details>
  );
}
