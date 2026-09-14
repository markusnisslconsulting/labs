import { describe, expect, it } from "vitest";
import { EventSchemas } from "@ag-ui/core";
import { createTicketService } from "./ticket";
import { proposalEvents, receiveEvent } from "./events";
const request = { ticketId: "T-104", teamId: "billing" };
describe("assignment proposals and service writes", () => {
  it("preparing or discarding a proposal leaves the record untouched", () => {
    const service = createTicketService();
    const candidate = service.propose(request);
    expect(service.read().teamId).toBe("general-support");
    service.discard(candidate.proposalId);
    expect(service.save(candidate.proposalId).kind).toBe("refused");
    expect(service.read()).toMatchObject({
      teamId: "general-support",
      version: 1,
    });
  });
  it("uses the service's proposal and records a single successful write", () => {
    const service = createTicketService();
    const candidate = service.propose(request);
    candidate.proposedTeamId = "technical-support";
    expect(service.save(candidate.proposalId)).toMatchObject({
      kind: "saved",
      receipt: {
        before: { teamId: "general-support", version: 1 },
        after: { teamId: "billing", version: 2 },
      },
    });
    expect(service.save(candidate.proposalId).kind).toBe("refused");
    expect(service.history()).toHaveLength(1);
  });
  it("rejects unknown records and teams", () => {
    const service = createTicketService();
    expect(() => service.propose({ ...request, ticketId: "T-999" })).toThrow();
    expect(() => service.propose({ ...request, teamId: "unknown" })).toThrow();
    expect(service.read().version).toBe(1);
  });
  it("a refused save does not write and can be retried", () => {
    const service = createTicketService();
    const candidate = service.propose(request);
    service.refuseNext(true);
    expect(service.save(candidate.proposalId).kind).toBe("refused");
    expect(service.read().version).toBe(1);
    expect(service.save(candidate.proposalId).kind).toBe("saved");
  });
  it("a colleague's edit survives a stale save until a replacement is reviewed", () => {
    const service = createTicketService();
    const candidate = service.propose(request);
    service.colleague();
    expect(service.save(candidate.proposalId)).toMatchObject({
      kind: "conflict",
      current: { teamId: "technical-support", version: 2 },
    });
    expect(service.read().teamId).toBe("technical-support");
    const replacement = service.propose(request);
    expect(replacement.proposalId).not.toBe(candidate.proposalId);
    expect(replacement).toMatchObject({
      currentTeamId: "technical-support",
      expectedVersion: 2,
    });
    expect(service.save(replacement.proposalId).kind).toBe("saved");
  });
  it("restoration creates a second write and cannot overwrite a later edit", () => {
    const service = createTicketService();
    const saved = service.save(service.propose(request).proposalId);
    if (saved.kind !== "saved") throw new Error("Expected saved");
    const restoration = service.restore(saved.receipt);
    expect(service.save(restoration.proposalId).kind).toBe("saved");
    expect(service.history()).toHaveLength(2);
    expect(service.read()).toMatchObject({
      teamId: "general-support",
      version: 3,
    });
    service.colleague();
    expect(service.save(service.restore(saved.receipt).proposalId).kind).toBe(
      "conflict",
    );
    expect(service.read().teamId).toBe("technical-support");
  });
});

describe("agent events feeding the review surface", () => {
  it("uses valid AG-UI events and displays their proposal without changing the record", () => {
    const service = createTicketService();
    const candidate = service.propose(request);
    const events = proposalEvents(
      candidate,
      "Billing can review this duplicate charge.",
    );
    events.forEach((event) =>
      expect(EventSchemas.safeParse(event).success).toBe(true),
    );
    const view = events.reduce(receiveEvent, {
      explanation: "",
      proposal: null,
    });
    expect(view).toEqual({
      explanation: "Billing can review this duplicate charge.",
      proposal: candidate,
    });
    expect(service.read().teamId).toBe("general-support");
  });
});
