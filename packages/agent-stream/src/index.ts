/**
 * The event vocabulary and scripted run behind "The Chat Box Is a
 * Log". The article's demo shows a run twice: as a transcript and as
 * typed events landing on the product row. The event names mirror the
 * AG-UI families the article walks through.
 *
 * The run is pure scheduling. It emits events; what a screen does
 * with them is somebody else's decision.
 */
export type AgentEvent =
  | { type: "run-started" }
  | { type: "text-message"; text: string }
  | { type: "tool-call-started" }
  | { type: "state-delta"; proposedUnits: number }
  | { type: "run-finished" };

export interface RunCallbacks {
  onEvent(event: AgentEvent): void;
}

/** Injected time. The default wraps setTimeout; tests pass a queue. */
export interface Scheduler {
  set(fn: () => void, delayMs: number): unknown;
  clear(handle: unknown): void;
}

export function timeoutScheduler(): Scheduler {
  return {
    set: (fn, delayMs) => setTimeout(fn, delayMs),
    clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  };
}

export interface ScriptedRunConfig {
  fromUnits: number;
  toUnits: number;
  callbacks: RunCallbacks;
  scheduler?: Scheduler;
}

export interface ScriptedRun {
  start(): void;
  cancel(): void;
}

/**
 * A proposal phase for one SKU: start, narrate, call the tool, paint
 * the state delta. The run ends there on purpose; finishing it is the
 * person's decision, not the script's.
 */
export function createScriptedRun(config: ScriptedRunConfig): ScriptedRun {
  const scheduler = config.scheduler ?? timeoutScheduler();
  const handles: unknown[] = [];
  const at = (delayMs: number, event: AgentEvent) => {
    handles.push(scheduler.set(() => config.callbacks.onEvent(event), delayMs));
  };

  return {
    start() {
      at(200, { type: "run-started" });
      at(700, {
        type: "text-message",
        text: "Preparing the promotion week. SKU 4711 needs a higher reorder point.",
      });
      at(1400, { type: "tool-call-started" });
      at(2100, { type: "state-delta", proposedUnits: config.toUnits });
    },
    cancel() {
      handles.forEach((handle) => scheduler.clear(handle));
      handles.length = 0;
    },
  };
}
