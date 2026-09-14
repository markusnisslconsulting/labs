import { z } from "zod";
export const catalogId = "https://labs.markusnissl.com/catalogs/ticket-ui.json";
export const surfaceId = "ticket-assignment";
const binding = z.strictObject({
  path: z
    .string()
    .regex(
      /^(?![\s\S]*\/(?:__proto__|constructor|prototype)(?:\/|$))\/(?:[^~]|~[01])*$/,
    ),
});
const text = z.union([z.string(), binding]);
const contextValue = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  binding,
]);
export const componentSchema = z.discriminatedUnion("component", [
  z.strictObject({
    id: z.string(),
    component: z.literal("Card"),
    child: z.string(),
  }),
  z.strictObject({
    id: z.string(),
    component: z.literal("Column"),
    children: z.array(z.string()),
  }),
  z.strictObject({
    id: z.string(),
    component: z.literal("Row"),
    children: z.array(z.string()),
  }),
  z.strictObject({ id: z.string(), component: z.literal("Text"), text }),
  z.strictObject({
    id: z.string(),
    component: z.literal("Button"),
    child: z.string(),
    action: z.strictObject({
      event: z.strictObject({
        name: z.string(),
        context: z.record(z.string(), contextValue),
      }),
    }),
  }),
  z.strictObject({
    id: z.string(),
    component: z.literal("ChoicePicker"),
    label: text,
    variant: z.literal("mutuallyExclusive"),
    options: z.array(z.strictObject({ label: text, value: z.string() })).min(1),
    value: binding,
  }),
]);
export type Component = z.infer<typeof componentSchema>;
export const messageSchema = z.union([
  z.strictObject({
    version: z.literal("v0.9.1"),
    createSurface: z.strictObject({
      surfaceId: z.string(),
      catalogId: z.string(),
    }),
  }),
  z.strictObject({
    version: z.literal("v0.9.1"),
    updateComponents: z.strictObject({
      surfaceId: z.string(),
      components: z.array(componentSchema).min(1),
    }),
  }),
  z.strictObject({
    version: z.literal("v0.9.1"),
    updateDataModel: z.strictObject({
      surfaceId: z.string(),
      path: z.string().optional(),
      value: z.unknown().optional(),
    }),
  }),
  z.strictObject({
    version: z.literal("v0.9.1"),
    deleteSurface: z.strictObject({ surfaceId: z.string() }),
  }),
]);
export type A2UIMessage = z.infer<typeof messageSchema>;
export type Surface = {
  surfaceId: string;
  components: Record<string, Component>;
  data: Record<string, unknown>;
};
export type A2UIAction = {
  version: "v0.9.1";
  action: {
    name: string;
    surfaceId: string;
    sourceComponentId: string;
    timestamp: string;
    context: Record<string, unknown>;
  };
};
function segments(path: string) {
  if (path === "/" || path === "") return [];
  if (!path.startsWith("/") || /~(?![01])/u.test(path))
    throw Error("INVALID_PATH");
  const parts = path
    .slice(1)
    .split("/")
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"));
  if (
    parts.some((part) =>
      ["__proto__", "constructor", "prototype"].includes(part),
    )
  )
    throw Error("UNSUPPORTED_PATH");
  return parts;
}
export function readPath(data: unknown, path: string): unknown {
  let value = data;
  for (const key of segments(path)) {
    if (!value || typeof value !== "object" || !Object.hasOwn(value, key))
      return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}
export function writePath(
  data: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const parts = segments(path);
  if (!parts.length) {
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw Error("OBJECT_ROOT_REQUIRED");
    return structuredClone(value) as Record<string, unknown>;
  }
  const next = structuredClone(data);
  let target = next;
  for (const key of parts.slice(0, -1)) {
    const child = target[key];
    if (child === undefined) target[key] = {};
    else if (!child || typeof child !== "object" || Array.isArray(child))
      throw Error("UNSUPPORTED_PATH");
    target = target[key] as Record<string, unknown>;
  }
  const key = parts.at(-1)!;
  if (value === undefined) delete target[key];
  else target[key] = structuredClone(value);
  return next;
}
export function resolve(
  value: unknown,
  data: Record<string, unknown>,
): unknown {
  return binding.safeParse(value).success
    ? readPath(data, (value as { path: string }).path)
    : value;
}
function children(component: Component): string[] {
  if ("children" in component) return component.children;
  if ("child" in component) return [component.child];
  return [];
}
function checkCycles(components: Record<string, Component>) {
  const visited = new Set<string>();
  function visit(id: string, active: Set<string>) {
    if (active.has(id)) throw Error("CYCLIC_COMPONENTS");
    if (visited.has(id) || !Object.hasOwn(components, id)) return;
    const next = new Set(active).add(id);
    children(components[id]!).forEach((child) => visit(child, next));
    visited.add(id);
  }
  Object.keys(components).forEach((id) => visit(id, new Set()));
}
export function receiveA2UI(
  surface: Surface | null,
  input: unknown,
): Surface | null {
  const message = messageSchema.parse(input);
  if ("createSurface" in message) {
    if (surface || message.createSurface.catalogId !== catalogId)
      throw Error("UNSUPPORTED_SURFACE");
    return {
      surfaceId: message.createSurface.surfaceId,
      components: {},
      data: {},
    };
  }
  const update =
    "updateComponents" in message
      ? message.updateComponents
      : "updateDataModel" in message
        ? message.updateDataModel
        : message.deleteSurface;
  if (!surface || surface.surfaceId !== update.surfaceId)
    throw Error("UNKNOWN_SURFACE");
  if ("deleteSurface" in message) return null;
  if ("updateDataModel" in message)
    return {
      ...surface,
      data: writePath(
        surface.data,
        message.updateDataModel.path ?? "/",
        message.updateDataModel.value,
      ),
    };
  const components = { ...surface.components };
  for (const component of message.updateComponents.components) {
    if (["__proto__", "constructor", "prototype"].includes(component.id))
      throw Error("UNSUPPORTED_ID");
    components[component.id] = component;
  }
  checkCycles(components);
  return { ...surface, components };
}
export function actionFrom(
  surface: Surface,
  componentId: string,
  timestamp = new Date().toISOString(),
): A2UIAction {
  const component = surface.components[componentId];
  if (!component || component.component !== "Button")
    throw Error("BUTTON_REQUIRED");
  const { name, context } = component.action.event;
  return {
    version: "v0.9.1",
    action: {
      name,
      surfaceId: surface.surfaceId,
      sourceComponentId: componentId,
      timestamp,
      context: Object.fromEntries(
        Object.entries(context).map(([key, value]) => [
          key,
          resolve(value, surface.data),
        ]),
      ),
    },
  };
}
