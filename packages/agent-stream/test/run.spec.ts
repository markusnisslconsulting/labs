import { describe, expect, it, vi } from "vitest";
import {
  createScriptedRun,
  type AgentEvent,
  type Scheduler,
} from "../src/index";

/** A scheduler with no clock: tests pull due callbacks by hand. */
function manualScheduler(): Scheduler & { tick(): number } {
  let now = 0;
  const queue: Array<{ at: number; fn: () => void }> = [];
  return {
    set(fn, delayMs) {
      queue.push({ at: now + delayMs, fn });
      return queue.length;
    },
    clear(handle) {
      const index = Number(handle) - 1;
      if (index >= 0 && index < queue.length) queue[index]!.fn = () => {};
    },
    tick() {
      const due = queue.filter((item) => item.at <= now + 10_000);
      for (const item of due) item.fn();
      now += 10_000;
      return due.length;
    },
  };
}

describe("createScriptedRun", () => {
  it("emits the proposal phase in order and ends on the state delta", () => {
    const scheduler = manualScheduler();
    const events: AgentEvent[] = [];
    const run = createScriptedRun({
      fromUnits: 800,
      toUnits: 1240,
      callbacks: { onEvent: (event) => events.push(event) },
      scheduler,
    });

    run.start();
    scheduler.tick();

    expect(events.map((event) => event.type)).toEqual([
      "run-started",
      "text-message",
      "tool-call-started",
      "state-delta",
    ]);
    const delta = events.at(-1)!;
    expect(delta).toEqual({
      type: "state-delta",
      proposedUnits: 1240,
    });
  });

  it("never finishes the run itself; finishing belongs to the person", () => {
    const scheduler = manualScheduler();
    const events: AgentEvent[] = [];
    createScriptedRun({
      fromUnits: 800,
      toUnits: 1240,
      callbacks: { onEvent: (event) => events.push(event) },
      scheduler,
    }).start();

    scheduler.tick();
    scheduler.tick();
    scheduler.tick();

    expect(events.some((event) => event.type === "run-finished")).toBe(false);
  });

  it("cancel stops pending events", () => {
    const scheduler = manualScheduler();
    const onEvent = vi.fn();
    const run = createScriptedRun({
      fromUnits: 800,
      toUnits: 1240,
      callbacks: { onEvent },
      scheduler,
    });

    run.start();
    run.cancel();
    scheduler.tick();

    expect(onEvent).not.toHaveBeenCalled();
  });
});
