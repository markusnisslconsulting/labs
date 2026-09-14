import { mkdirSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { catalogId, componentSchema } from "../src/labs/chat-box/a2ui";
const schema = z.toJSONSchema(componentSchema);
const variants = schema.oneOf ?? schema.anyOf ?? [];
const common = "https://a2ui.org/specification/v0_9/common_types.json#/$defs/";
const components = Object.fromEntries(
  variants.map((definition) => {
    const properties = definition.properties!;
    if (properties["child"])
      properties["child"] = { $ref: common + "ComponentId" };
    if (properties["children"])
      properties["children"] = {
        allOf: [{ $ref: common + "ChildList" }, { type: "array" }],
      };
    return [properties["component"]!.const, definition];
  }),
);
const catalog = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: catalogId,
  catalogId,
  title: "Ticket UI catalog",
  description:
    "Six components for the AG-UI and A2UI lab. Plain text, absolute object paths, fixed child lists, and a single-choice picker. No function calls or child templates.",
  components,
  functions: {},
  $defs: {
    anyComponent: {
      oneOf: Object.keys(components).map((name) => ({
        $ref: "#/components/" + name,
      })),
    },
    anyFunction: false,
    theme: { type: "object", additionalProperties: false },
  },
};
mkdirSync("apps/site/public/catalogs", { recursive: true });
writeFileSync(
  "apps/site/public/catalogs/ticket-ui.json",
  JSON.stringify(catalog, null, 2) + "\n",
);
