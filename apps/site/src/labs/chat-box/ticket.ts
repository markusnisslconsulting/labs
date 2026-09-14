/** A small in-memory service. A deployed service also needs authentication and storage. */
export const teamIds = [
  "general-support",
  "billing",
  "technical-support",
] as const;
export type Team = (typeof teamIds)[number];
export type Ticket = { ticketId: "T-104"; teamId: Team };
export type Decision =
  | { kind: "saved"; ticket: Ticket }
  | { kind: "discarded" }
  | { kind: "refused" };
export function createTicketService() {
  let ticket: Ticket = { ticketId: "T-104", teamId: "general-support" };
  return {
    read: () => ({ ...ticket }),
    save(ticketId: unknown, teamId: unknown, refuse = false): Decision {
      if (
        ticketId !== ticket.ticketId ||
        !teamIds.includes(teamId as Team) ||
        refuse
      )
        return { kind: "refused" };
      ticket = { ...ticket, teamId: teamId as Team };
      return { kind: "saved", ticket: { ...ticket } };
    },
  };
}
