import { DirectionProvider } from "@base-ui-components/react/direction-provider";
import { useState } from "react";
import { Badge } from "../../src/components/Badge";
import { Button } from "../../src/components/Button";
import { Checkbox } from "../../src/components/Checkbox";
import { Menu } from "../../src/components/Menu";
import { Panel } from "../../src/components/Panel";
import { RadioGroup } from "../../src/components/RadioGroup";
import { Slider } from "../../src/components/Slider";
import { Stack } from "../../src/components/Stack";
import { Switch } from "../../src/components/Switch";
import { Tabs } from "../../src/components/Tabs";
import { TextField } from "../../src/components/TextField";
import { Pagination } from "../../src/components/Pagination";
import { Dialog, AlertDialog } from "../../src/components/Dialog";
import { Drawer } from "../../src/components/Drawer";
import { CommandPalette } from "../../src/components/CommandPalette";
import { Popover } from "../../src/components/Popover";
import { Tooltip } from "../../src/components/Tooltip";

export function PortalScopes() {
  const [open, setOpen] = useState<string>();
  const close = (next: boolean) => {
    if (!next) setOpen(undefined);
  };
  return (
    <DirectionProvider direction="rtl">
      <Panel
        dir="rtl"
        data-brand="coaching"
        data-density="compact"
        aria-label="Overlay scope"
      >
        <Stack>
          <Menu label="Scoped menu" items={[{ id: "save", label: "Save" }]} />
          <Popover trigger="Scoped popover" title="Details">
            Additional information
          </Popover>
          <Tooltip content="Scoped hint">
            <Button>Scoped tooltip</Button>
          </Tooltip>
          {["dialog", "alert", "drawer", "palette"].map((kind) => (
            <Button key={kind} onClick={() => setOpen(kind)}>
              Open {kind}
            </Button>
          ))}
          <Dialog
            title="Scoped dialog"
            open={open === "dialog"}
            onOpenChange={close}
          >
            Dialog content
          </Dialog>
          <AlertDialog
            title="Scoped alert"
            open={open === "alert"}
            onOpenChange={close}
          >
            Confirm the change
          </AlertDialog>
          <Drawer
            title="Scoped drawer"
            open={open === "drawer"}
            onOpenChange={close}
          >
            Drawer content
          </Drawer>
          <CommandPalette
            label="Scoped palette"
            open={open === "palette"}
            onOpenChange={close}
            commands={[{ id: "save", label: "Save" }]}
          />
        </Stack>
      </Panel>
    </DirectionProvider>
  );
}

function Controls({ name }: { name: string }) {
  return (
    <Stack gap="md">
      <Button>Save example</Button>
      <TextField label={`${name} title`} defaultValue="Example" />
      <Checkbox label="Email updates" defaultChecked={false} />
      <Switch label="Reminders" defaultChecked />
      <RadioGroup
        name={name}
        legend="Delivery"
        options={[
          { value: "standard", label: "Standard" },
          { value: "express", label: "Express" },
        ]}
      />
      <Slider label="Volume" defaultValue={40} />
      <Badge>Draft</Badge>
    </Stack>
  );
}

export function DensityScopes() {
  return (
    <Stack gap="lg">
      <Panel aria-label="Inherited density">
        <Controls name="Inherited" />
      </Panel>
      <Panel data-brand="coaching" aria-label="Coaching density">
        <Controls name="Coaching" />
      </Panel>
      <Panel data-brand="consulting" aria-label="Consulting density">
        <Controls name="Consulting" />
      </Panel>
      <Panel
        data-brand="coaching"
        data-density="comfortable"
        aria-label="Local comfortable density"
      >
        <Controls name="Local" />
      </Panel>
      <Panel
        data-brand="coaching"
        data-density="default"
        aria-label="Local default density"
      >
        <Controls name="Default" />
      </Panel>
    </Stack>
  );
}

export function NestedDirection({ direction }: { direction: "ltr" | "rtl" }) {
  return (
    <div dir={direction}>
      <DirectionProvider direction={direction}>
        <Stack gap="lg">
          <Tabs
            label="Local views"
            tabs={[
              { id: "one", label: "First", content: "First view" },
              { id: "two", label: "Second", content: "Second view" },
              { id: "three", label: "Third", content: "Third view" },
            ]}
          />
          <Switch label="Local reminders" defaultChecked />
          <Pagination defaultPage={2} pageCount={3} />
          <Menu label="Local actions" items={[{ id: "save", label: "Save" }]} />
        </Stack>
      </DirectionProvider>
    </div>
  );
}
