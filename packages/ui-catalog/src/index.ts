import { z } from "zod";

const text = z.string().min(1);
export const inventoryComponentSchema = z.strictObject({
  component: text,
  props: z.array(
    z.strictObject({
      name: text,
      type: text,
      required: z.boolean(),
      doc: text.optional(),
    }),
  ),
  parts: z.array(text),
  slots: z.array(
    z.strictObject({
      token: z.string().regex(/^--uix-[a-z0-9-]+$/),
      default: text,
    }),
  ),
  status: z.enum(["stable", "beta", "experimental", "deprecated"]),
  useFor: text,
  insteadWhen: text,
  accessibility: text,
  passthrough: z.literal(true).optional(),
});

export const inventorySchema = z
  .strictObject({
    note: text,
    components: z.array(inventoryComponentSchema).min(1),
  })
  .superRefine(({ components }, context) => {
    const names = new Set<string>();
    components.forEach((entry, index) => {
      if (names.has(entry.component)) {
        context.addIssue({
          code: "custom",
          message: "Duplicate component",
          path: ["components", index, "component"],
        });
      }
      names.add(entry.component);
    });
  });

export type Inventory = z.infer<typeof inventorySchema>;
export type InventoryComponent = z.infer<typeof inventoryComponentSchema>;
export type InventoryProp = InventoryComponent["props"][number];
