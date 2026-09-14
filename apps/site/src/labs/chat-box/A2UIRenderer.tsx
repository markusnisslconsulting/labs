import { Button } from "@labs/ui/components/Button";
import { Panel } from "@labs/ui/components/Panel";
import { Select } from "@labs/ui/components/Select";
import { Stack } from "@labs/ui/components/Stack";
import type { ReactNode } from "react";
import { resolve, type Surface } from "./a2ui";
import { useStrings } from "./strings";
/** The catalog maps to existing design-system components, including their keyboard behavior. */
export function A2UIRenderer({
  surface,
  busy,
  onAction,
  onEdit,
}: {
  surface: Surface;
  busy: boolean;
  onAction: (componentId: string) => void;
  onEdit: (path: string, value: string[]) => void;
}) {
  const s = useStrings();
  const string = (value: unknown) => {
    const resolved = resolve(value, surface.data);
    return typeof resolved === "string" ? resolved : "";
  };
  function render(id: string): ReactNode {
    const component = surface.components[id];
    if (!component) return null;
    switch (component.component) {
      case "Card":
        return <Panel key={id}>{render(component.child)}</Panel>;
      case "Column":
        return (
          <Stack key={id} gap="md">
            {component.children.map(render)}
          </Stack>
        );
      case "Row":
        return (
          <Stack key={id} direction="inline" gap="sm" wrap>
            {component.children.map(render)}
          </Stack>
        );
      case "Text":
        return <span key={id}>{string(component.text)}</span>;
      case "Button":
        return (
          <Button key={id} disabled={busy} onClick={() => onAction(id)}>
            {render(component.child)}
          </Button>
        );
      case "ChoicePicker": {
        const values = resolve(component.value, surface.data);
        const selected =
          Array.isArray(values) &&
          values.length === 1 &&
          component.options.some((option) => option.value === values[0])
            ? values[0]
            : "";
        return (
          <Select
            key={id}
            label={string(component.label)}
            value={selected}
            options={[
              { value: "", label: s.chooseTeam },
              ...component.options.map((option) => ({
                value: option.value,
                label: string(option.label),
              })),
            ]}
            disabled={busy}
            onChange={(event) => {
              const value = event.currentTarget.value;
              onEdit(component.value.path, value ? [value] : []);
            }}
          />
        );
      }
    }
  }
  return render("root");
}
