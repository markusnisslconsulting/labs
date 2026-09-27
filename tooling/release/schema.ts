import { z } from "zod";
export const routeSchema = z
  .object({
    routes: z
      .array(z.string().regex(/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/))
      .min(1),
  })
  .superRefine(({ routes }, ctx) => {
    if (!routes.includes("/") || new Set(routes).size !== routes.length)
      ctx.addIssue({
        code: "custom",
        message: "Routes must include / and be unique",
      });
  });
export const manifestSchema = routeSchema.safeExtend({
  version: z.literal(2),
  releaseId: z.string().regex(/^[a-f0-9]{40}-[a-f0-9]{16}$/),
  sourceSha: z.string().regex(/^[a-f0-9]{40}$/),
  dirty: z.boolean(),
  files: z.record(
    z.string(),
    z.object({
      bytes: z.number().int().nonnegative(),
      sha256: z.string().regex(/^[a-f0-9]{64}$/),
    }),
  ),
});

/** Public URLs select their own static document within the retained release. */
export function routeDocuments(routes: string[], releaseId: string) {
  return Object.fromEntries(
    routes.map((route) => [
      route,
      route === "/"
        ? "index.html"
        : `releases/${releaseId}/pages/${route.slice(1)}.html`,
    ]),
  );
}
