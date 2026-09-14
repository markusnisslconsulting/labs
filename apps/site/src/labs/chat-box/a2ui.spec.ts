/// <reference types="node" />
import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import {
  actionFrom,
  catalogId,
  readPath,
  receiveA2UI,
  surfaceId,
  writePath,
  type Surface,
} from "./a2ui";
import { components, surfaceMessages, surfaceResult } from "./surfaces";
import { english } from "./strings";
import { createTicketService } from "./ticket";
const json = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const common = json("./spec/common_types.json");
const officialServer = json("./spec/server_to_client.json");
const officialClient = json("./spec/client_to_server.json");
const catalog = json("../../../public/catalogs/ticket-ui.json");
function validators(selectedCatalog: object) {
  const ajv = new Ajv2020({ strict: false, validateFormats: false });
  ajv.addSchema({
    ...selectedCatalog,
    $id: "https://a2ui.org/specification/v0_9/catalog.json",
  });
  ajv.addSchema(common);
  return {
    server: ajv.compile(officialServer),
    client: ajv.compile(officialClient),
  };
}
function fresh(choose = true): Surface {
  return surfaceMessages(english, choose).reduce<Surface | null>(
    receiveA2UI,
    null,
  )!;
}
describe("A2UI surfaces using the published ticket catalog", () => {
  it("matches upstream v0.9.1 envelopes and Basic component shapes, as well as our smaller catalog", () => {
    for (const selected of [catalog, json("./spec/basic-catalog.json")]) {
      const validate = validators(selected);
      for (const choose of [false, true]) {
        const messages = [
          ...surfaceMessages(english, choose),
          ...surfaceResult(english, {
            kind: "saved",
            ticket: { ticketId: "T-104", teamId: "billing" },
          }),
          ...surfaceResult(english, { kind: "discarded" }),
        ];
        messages.forEach((message) =>
          expect(
            validate.server(message),
            JSON.stringify(validate.server.errors),
          ).toBe(true),
        );
        expect(
          validate.client(actionFrom(fresh(choose), "save")),
          JSON.stringify(validate.client.errors),
        ).toBe(true);
      }
      expect(
        validate.server({
          updateComponents: {
            surfaceId,
            components: components(english, true),
          },
        }),
      ).toBe(false);
    }
  });
  it("resolves the selected team at click time and updates the existing surface after saving", () => {
    const service = createTicketService();
    const before = fresh();
    const surface = {
      ...before,
      data: writePath(before.data, "/draft/team", ["technical-support"]),
    };
    expect(service.read().teamId).toBe("general-support");
    const request = actionFrom(surface, "save", "2026-09-14T12:00:00Z");
    expect(request.action.context).toEqual({
      ticketId: "T-104",
      teamId: "technical-support",
    });
    const decision = service.save(
      request.action.context.ticketId,
      request.action.context.teamId,
    );
    const after = surfaceResult(english, decision).reduce<Surface | null>(
      receiveA2UI,
      surface,
    )!;
    expect(after.surfaceId).toBe(before.surfaceId);
    expect(readPath(after.data, "/status")).toBe(
      english.saved("Technical Support"),
    );
    expect(after.components["body"]).toMatchObject({
      children: ["title", "status"],
    });
    expect(service.read().teamId).toBe("technical-support");
  });
  it("changes components by message, retains unrelated nodes and supports data replacement and deletion", () => {
    const before = fresh();
    const updated = receiveA2UI(before, {
      version: "v0.9.1",
      updateComponents: {
        surfaceId,
        components: [
          { id: "title", component: "Text", text: "Choose the next team" },
        ],
      },
    })!;
    expect(updated.components["title"]).toMatchObject({
      text: "Choose the next team",
    });
    expect(updated.components["save"]).toEqual(before.components["save"]);
    expect(
      receiveA2UI(updated, {
        version: "v0.9.1",
        updateDataModel: { surfaceId, path: "/status" },
      })!.data,
    ).not.toHaveProperty("status");
    expect(
      receiveA2UI(updated, { version: "v0.9.1", deleteSurface: { surfaceId } }),
    ).toBeNull();
  });
  it("rejects unsupported catalogs, components, cycles and unsafe paths without changing existing state", () => {
    const before = fresh();
    const saved = structuredClone(before);
    expect(() =>
      receiveA2UI(null, {
        version: "v0.9.1",
        createSurface: { surfaceId, catalogId: "other" },
      }),
    ).toThrow();
    expect(() =>
      receiveA2UI(before, {
        version: "v0.9.1",
        createSurface: { surfaceId, catalogId },
      }),
    ).toThrow();
    for (const component of [
      { id: "root", component: "Image", url: "x" },
      { id: "root", component: "Column", children: ["root"] },
    ]) {
      expect(() =>
        receiveA2UI(before, {
          version: "v0.9.1",
          updateComponents: { surfaceId, components: [component] },
        }),
      ).toThrow();
    }
    for (const path of [
      "/bad~",
      "/__proto__/polluted",
      "/normal\n/__proto__/polluted",
      "/normal\u2028/constructor/value",
    ]) {
      expect(() =>
        receiveA2UI(before, {
          version: "v0.9.1",
          updateComponents: {
            surfaceId,
            components: [{ id: "title", component: "Text", text: { path } }],
          },
        }),
      ).toThrow();
    }
    expect(() => writePath(before.data, "/__proto__/polluted", true)).toThrow();
    expect(before).toEqual(saved);
  });
});
