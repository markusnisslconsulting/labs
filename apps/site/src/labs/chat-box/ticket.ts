/** A local service simulation: synchronous writes, no authentication or persistence. */
export type Team = "general-support" | "billing" | "technical-support";
export type Ticket = { ticketId: "T-104"; teamId: Team; version: number };
export type Proposal = {
  proposalId: string;
  ticketId: "T-104";
  currentTeamId: Team;
  proposedTeamId: Team;
  expectedVersion: number;
  status: "awaiting_review";
};
export type Receipt = {
  proposalId: string;
  before: Ticket;
  after: Ticket;
  actor: "user" | "colleague";
};
export type SaveResult =
  | { kind: "saved"; receipt: Receipt }
  | { kind: "conflict"; current: Ticket }
  | { kind: "refused" };

export function createTicketService() {
  let current: Ticket = {
    ticketId: "T-104",
    teamId: "general-support",
    version: 1,
  };
  let nextId = 17;
  let refuseNext = false;
  const proposals = new Map<string, Proposal>();
  const receipts: Receipt[] = [];
  const read = () => ({ ...current });
  function proposal(proposedTeamId: Team, base = current): Proposal {
    const value: Proposal = {
      proposalId: `proposal-${nextId++}`,
      ticketId: "T-104",
      currentTeamId: base.teamId,
      proposedTeamId,
      expectedVersion: base.version,
      status: "awaiting_review",
    };
    proposals.set(value.proposalId, value);
    return { ...value };
  }
  return {
    read,
    history: () => structuredClone(receipts),
    propose(input: { ticketId: string; teamId: string }) {
      if (input.ticketId !== "T-104") throw new Error("Unknown ticket.");
      if (
        !["general-support", "billing", "technical-support"].includes(
          input.teamId,
        )
      )
        throw new Error("Unknown team.");
      return proposal(input.teamId as Team);
    },
    restore: (receipt: Receipt) =>
      proposal(receipt.before.teamId, receipt.after),
    discard(id: string) {
      proposals.delete(id);
    },
    refuseNext(value: boolean) {
      refuseNext = value;
    },
    save(id: string): SaveResult {
      const candidate = proposals.get(id);
      if (!candidate) return { kind: "refused" };
      if (refuseNext) {
        refuseNext = false;
        return { kind: "refused" };
      }
      if (candidate.expectedVersion !== current.version)
        return { kind: "conflict", current: read() };
      const receipt: Receipt = {
        proposalId: id,
        before: read(),
        after: {
          ...current,
          teamId: candidate.proposedTeamId,
          version: current.version + 1,
        },
        actor: "user",
      };
      current = { ...receipt.after };
      proposals.delete(id);
      receipts.push(receipt);
      return { kind: "saved", receipt: structuredClone(receipt) };
    },
    colleague() {
      const before = read();
      current = {
        ...current,
        teamId: "technical-support",
        version: current.version + 1,
      };
      receipts.push({
        proposalId: "",
        before,
        after: read(),
        actor: "colleague",
      });
      return read();
    },
  };
}
