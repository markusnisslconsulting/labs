import { catalogId, surfaceId, type A2UIMessage, type Component } from "./a2ui";
import type { Strings } from "./strings";
import type { Decision } from "./ticket";
import { resultText } from "./events";
export function components(s: Strings, choose: boolean): Component[] {
  return [
    { id: "root", component: "Card", child: "body" },
    {
      id: "body",
      component: "Column",
      children: ["title", "explanation", "team", "status", "actions"],
    },
    { id: "title", component: "Text", text: s.reviewCard },
    {
      id: "explanation",
      component: "Text",
      text: choose ? s.chooseExplanation : s.explanation,
    },
    choose
      ? {
          id: "team",
          component: "ChoicePicker",
          label: s.teamLabel,
          variant: "mutuallyExclusive",
          options: Object.entries(s.teams).map(([value, label]) => ({
            value,
            label,
          })),
          value: { path: "/draft/team" },
        }
      : { id: "team", component: "Text", text: { path: "/proposedLabel" } },
    { id: "status", component: "Text", text: { path: "/status" } },
    { id: "actions", component: "Row", children: ["save", "discard"] },
    {
      id: "save",
      component: "Button",
      child: "save-label",
      action: {
        event: {
          name: "save_assignment",
          context: {
            ticketId: { path: "/ticketId" },
            teamId: { path: "/draft/team/0" },
          },
        },
      },
    },
    { id: "save-label", component: "Text", text: s.save },
    {
      id: "discard",
      component: "Button",
      child: "discard-label",
      action: { event: { name: "discard_assignment", context: {} } },
    },
    { id: "discard-label", component: "Text", text: s.discard },
  ];
}
export function surfaceMessages(s: Strings, choose: boolean): A2UIMessage[] {
  return [
    { version: "v0.9.1", createSurface: { surfaceId, catalogId } },
    {
      version: "v0.9.1",
      updateComponents: { surfaceId, components: components(s, choose) },
    },
    {
      version: "v0.9.1",
      updateDataModel: {
        surfaceId,
        value: {
          ticketId: "T-104",
          draft: { team: ["billing"] },
          proposedLabel: `${s.proposed}: ${s.teams.billing}`,
          status: s.pending,
        },
      },
    },
  ];
}
export function surfaceResult(s: Strings, decision: Decision): A2UIMessage[] {
  if (decision.kind === "discarded")
    return [{ version: "v0.9.1", deleteSurface: { surfaceId } }];
  return [
    {
      version: "v0.9.1",
      updateDataModel: {
        surfaceId,
        path: "/status",
        value: resultText(s, decision),
      },
    },
    ...(decision.kind === "saved"
      ? [
          {
            version: "v0.9.1" as const,
            updateComponents: {
              surfaceId,
              components: [
                {
                  id: "body",
                  component: "Column" as const,
                  children: ["title", "status"],
                },
              ],
            },
          },
        ]
      : []),
  ];
}
