import { expect } from "storybook/test";
import { useEffect, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar } from "../components/Avatar";
import { Breadcrumb } from "../components/Breadcrumb";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { IconButton } from "../components/IconButton";
import { Panel } from "../components/Panel";
import { SearchInput } from "../components/SearchInput";
import { Select } from "../components/Select";
import { Slider } from "../components/Slider";
import { Table } from "../components/Table";
import { Tabs } from "../components/Tabs";
import { TextField } from "../components/TextField";

const meta = {
  title: "Foundations/Contract",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

/**
 * A ref reaches a real element.
 *
 * Nothing checked this. A design system whose components cannot be
 * measured or focused programmatically is unusable for the things
 * applications actually do — scroll a field into view after a validation
 * error, focus the first input on mount, measure a card to position
 * something against it. React 19 passes `ref` as an ordinary prop, so it
 * arrives only if the component spreads its rest onto a DOM node; that is
 * an implementation detail no consumer should have to read the source to
 * discover.
 *
 * The assertion is deliberately about the *element*, not about truthiness:
 * a ref that lands on nothing is null, and a ref that lands on a React
 * component instance is not an element either.
 */
export const RefsReachElements: StoryObj = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: function Render() {
    const refs = {
      Button: useRef<HTMLButtonElement>(null),
      IconButton: useRef<HTMLButtonElement>(null),
      Chip: useRef<HTMLSpanElement>(null),
      TextField: useRef<HTMLInputElement>(null),
      SearchInput: useRef<HTMLInputElement>(null),
      Select: useRef<HTMLSelectElement>(null),
      Card: useRef<HTMLElement>(null),
      Panel: useRef<HTMLElement>(null),
      Table: useRef<HTMLDivElement>(null),
    };

    /*
     * Read after mount, not during render.
     *
     * The first version built the report from `ref.current` in the same
     * pass, where every ref is still null, so the attribute it asserted on
     * was baked in as "none" and the test failed for its own reason rather
     * than the component's. A ref is a thing you have *after* the commit.
     */
    const [landed, setLanded] = useState<Record<string, string>>({});
    useEffect(() => {
      setLanded(
        Object.fromEntries(
          Object.entries(refs).map(([name, ref]) => [
            name,
            ref.current?.tagName?.toLowerCase() ?? "none",
          ]),
        ),
      );
      // Once: the refs do not move.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div style={{ display: "grid", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Button ref={refs.Button}>Button</Button>
          <IconButton ref={refs.IconButton} label="Close">
            ×
          </IconButton>
          <Chip ref={refs.Chip}>Chip</Chip>
        </div>
        <TextField ref={refs.TextField} label="Text field" />
        <SearchInput ref={refs.SearchInput} label="Search" />
        <Select
          ref={refs.Select}
          label="Select"
          options={[{ value: "a", label: "A" }]}
        />
        <Card ref={refs.Card}>
          <Card.Body>Card</Card.Body>
        </Card>
        <Panel ref={refs.Panel} label="Panel">
          Panel
        </Panel>
        <Table ref={refs.Table} caption="Table">
          <tbody>
            <tr>
              <td>cell</td>
            </tr>
          </tbody>
        </Table>
        <ul aria-label="Ref report">
          {Object.keys(refs).map((name) => (
            <li key={name} data-target={name} data-tag={landed[name] ?? "none"}>
              {name}: {landed[name] ?? "…"}
            </li>
          ))}
        </ul>
      </div>
    );
  },
  play: async ({ canvas }) => {
    // findAllByRole, so the assertion waits for the effect to have run.
    const items = await canvas.findAllByRole("listitem");
    for (const item of items) {
      const target = item.getAttribute("data-target");
      await expect(
        item.getAttribute("data-tag"),
        `${target} did not give its ref a DOM element`,
      ).not.toBe("none");
    }
  },
};

/**
 * Degenerate input, which is the input production actually sends.
 *
 * Every list here is empty or contradictory: no options, no crumbs, no
 * name, a minimum above the maximum. None of it is exotic — it is what a
 * filter returns before anyone has typed, what a breadcrumb holds on a
 * root page, what a name field holds while a profile is still loading.
 *
 * The assertion is deliberately weak on purpose: nothing must throw, and
 * nothing must render an element with an empty accessible name. The a11y
 * addon runs over this story in both themes, so the stronger statement is
 * made by axe rather than by me guessing what to look for.
 */
export const DegenerateInput: StoryObj = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <div style={{ display: "grid", gap: "1.2rem", justifyItems: "start" }}>
      <Avatar name="" />
      <Avatar name="Cher" />
      <Breadcrumb items={[]} label="Empty trail" />
      <Breadcrumb items={[{ label: "Only" }]} label="Single crumb" />
      <Select label="No options" options={[]} />
      <Tabs tabs={[]} label="No tabs" />
      <Slider label="Backwards range" min={100} max={0} defaultValue={50} />
      <Table caption="No rows">
        <tbody />
      </Table>
    </div>
  ),
  play: async ({ canvas }) => {
    // An element in the accessibility tree with no name at all is worse
    // than one that is absent: a screen reader announces "image" and the
    // reader learns nothing.
    const named = canvas.getAllByRole("img", { hidden: false });
    for (const el of named) {
      await expect(
        el.getAttribute("aria-label") ?? el.getAttribute("alt") ?? "",
        "an element is in the accessibility tree with an empty name",
      ).not.toBe("");
    }
  },
};
