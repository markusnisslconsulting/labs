import { describe, expect, it } from "vitest";
import { EventSchemas, RunAgentInputSchema } from "@ag-ui/core";
import { createTicketService } from "./ticket";
import {
  initialAgentView,
  proposalEvents,
  receiveEvent,
  responseEvents,
  runInput,
} from "./events";
import { english } from "./strings";
describe("AG-UI request, frontend tool and continuation", () => {
  it("carries context and state into a review, then returns the call-linked service outcome", () => {
    const service = createTicketService();
    expect(RunAgentInputSchema.safeParse(runInput(english)).success).toBe(true);
    const events = proposalEvents(english);
    events.forEach((event) =>
      expect(EventSchemas.safeParse(event).success).toBe(true),
    );
    const view = events.reduce(receiveEvent, initialAgentView());
    expect(view.reply).toBe(english.explanation);
    expect(view.state.proposedTeamId).toBe("billing");
    expect(service.read().teamId).toBe("general-support");
    expect(view.call?.complete).toBe(true);
    const args = JSON.parse(view.call!.args);
    const decision = service.save(args.ticketId, view.state.proposedTeamId);
    const next = runInput(english, view.state, decision);
    expect(RunAgentInputSchema.safeParse(next).success).toBe(true);
    expect(next.messages.at(-1)).toMatchObject({
      role: "tool",
      toolCallId: view.call!.id,
      content: JSON.stringify(decision),
    });
    const reply = responseEvents(english, decision, view.state);
    reply.forEach((event) =>
      expect(EventSchemas.safeParse(event).success).toBe(true),
    );
    const final = reply.reduce(receiveEvent, view);
    expect(final.state).toMatchObject({
      currentTeamId: "billing",
      proposedTeamId: null,
    });
    expect(final.reply).toBe(english.saved("Billing"));
  });
  it("reports a refusal without changing the stored ticket", () => {
    const service = createTicketService();
    for (const [id, team, refuse] of [
      ["T-999", "billing", false],
      ["T-104", "unknown", false],
      ["T-104", "billing", true],
    ] as const) {
      expect(service.save(id, team, refuse)).toEqual({ kind: "refused" });
      expect(service.read().teamId).toBe("general-support");
    }
    const view = proposalEvents(english).reduce(
      receiveEvent,
      initialAgentView(),
    );
    const final = responseEvents(
      english,
      { kind: "refused" },
      view.state,
    ).reduce(receiveEvent, view);
    expect(final.reply).toBe(english.refused);
    expect(final.state.currentTeamId).toBe("general-support");
  });
  it("discarding returns a decision without requesting a write", () => {
    const view = proposalEvents(english).reduce(
      receiveEvent,
      initialAgentView(),
    );
    const result = responseEvents(
      english,
      { kind: "discarded" },
      view.state,
    ).reduce(receiveEvent, view);
    expect(result.state).toMatchObject({
      currentTeamId: "general-support",
      proposedTeamId: null,
    });
    expect(result.reply).toBe(english.discarded);
  });
});
