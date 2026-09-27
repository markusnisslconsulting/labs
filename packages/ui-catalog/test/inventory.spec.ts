import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { inventorySchema } from "../src/index";

const catalog = () =>
  inventorySchema.parse(
    JSON.parse(readFileSync("packages/ui/inventory.json", "utf8")),
  );

describe("the inventory contract", () => {
  it("retains override names and defaults from the generated catalog", () => {
    const appShell = catalog().components.find(
      (entry) => entry.component === "AppShell",
    );
    expect(appShell?.slots).toContainEqual({
      token: "--uix-appshell-nav",
      default: "15rem",
    });
  });

  it.each([
    { slots: ["--uix-appshell-nav"] },
    { slots: [{ token: "--uix-appshell-nav" }] },
    { slots: [{ token: "invalid", default: "15rem" }] },
    { props: [{ name: "value", required: true }] },
    { component: "" },
    { useFor: undefined },
  ])("rejects malformed component metadata: %j", (invalid) => {
    const input = catalog();
    expect(() =>
      inventorySchema.parse({
        ...input,
        components: [{ ...input.components[0], ...invalid }],
      }),
    ).toThrow();
  });

  it("rejects duplicate component names", () => {
    const input = catalog();
    expect(() =>
      inventorySchema.parse({
        ...input,
        components: [input.components[0], input.components[0]],
      }),
    ).toThrow(/Duplicate component/);
  });
});
