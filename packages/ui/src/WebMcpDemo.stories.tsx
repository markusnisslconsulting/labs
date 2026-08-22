import type { Meta, StoryObj } from "@storybook/react-vite";
import WebMcpDemo from "./WebMcpDemo";

const meta = {
  title: "Demos/Ordering desk",
  component: WebMcpDemo,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Thin view over `@labs/reorder-desk`: the desk owns rows, the descriptor declares `set_reorder_point`, `execute()` routes into `desk.propose()`. The Save button and an agent call the same function. Source: [WebMcpDemo.tsx](https://github.com/markusnisslconsulting/labs/tree/main/packages/ui/src/WebMcpDemo.tsx).",
      },
      source: {
        code: `const desk = useRef(createDesk(START_ROWS));
registerTool(reorderPointToolDescriptor(desk.current), { signal });`,
      },
    },
  },
} satisfies Meta<typeof WebMcpDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A page that registers set_reorder_point as a callable tool. */
export const Default: Story = {};
