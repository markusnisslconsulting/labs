import type { Meta, StoryObj } from "@storybook/react-vite";
import { RTL } from "../../.storybook/modes";
import { Breadcrumb } from "./Breadcrumb";
import { TextField } from "./TextField";

const meta = {
  title: "Patterns/RTL",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/**
 * The direction axis, composed.
 *
 * Individual components are checked for physical properties by a test
 * that reads their stylesheets, and that test cannot see what happens
 * when a mirrored breadcrumb sits beside a mirrored field. This page is
 * where that shows, and it is the reason the breadcrumb separator, the
 * toast edges and the switch knob's travel are written on logical axes.
 *
 * Right-to-left smoke test: logical CSS properties keep layout,
 * breadcrumbs and fields readable under `dir="rtl"`. Components use
 * logical properties where direction matters; anything hard-coded
 * to left/right shows up here.
 */
export const RightToLeft: Story = {
  parameters: { chromatic: { disableSnapshot: false, modes: { ...RTL } } },
  render: () => (
    <div dir="rtl" style={{ display: "grid", gap: "1.2rem" }}>
      <Breadcrumb
        items={[
          { label: "الرئيسية", href: "/" },
          { label: "الطلبات", href: "/orders" },
          { label: "طلب 4711" },
        ]}
      />
      <TextField
        label="رقم الطلب"
        placeholder="4711"
        hint="أدخل رقم الطلب من التأكيد."
      />
    </div>
  ),
};
