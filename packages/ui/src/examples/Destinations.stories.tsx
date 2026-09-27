import type { Meta, StoryObj } from "@storybook/react-vite";
import { examplePages, type ExamplePage } from "../../.storybook/examplePages";
import { Panel } from "../components/Panel";
import { Stack } from "../components/Stack";

function Destination({
  page,
  returnTo,
}: {
  page: ExamplePage;
  returnTo: string;
}) {
  const content = examplePages[page] ?? examplePages.labs;
  const origin = /^[a-z0-9-]+--[a-z0-9-]+$/.test(returnTo)
    ? returnTo
    : "components-breadcrumb--trail";
  return (
    <Stack gap="lg">
      <h1>{content.title}</h1>
      <Panel label="Example destination">
        <p>{content.text}</p>
      </Panel>
      <a href={`./iframe.html?id=${origin}&viewMode=story`}>
        Back to the component example
      </a>
    </Stack>
  );
}

const meta = {
  title: "Examples/Destinations",
  component: Destination,
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
} satisfies Meta<typeof Destination>;
export default meta;

/** A real destination for fixture links; hidden from the component catalog. */
export const Preview: StoryObj<typeof meta> = {
  args: { page: "labs", returnTo: "components-breadcrumb--trail" },
};
