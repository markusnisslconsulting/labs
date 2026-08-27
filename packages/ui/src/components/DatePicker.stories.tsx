import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { DatePicker, type IsoDate } from "./DatePicker";
import { Form } from "./Form";

const meta = {
  title: "Components/DatePicker",
  component: DatePicker,
  tags: ["autodocs", "beta"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Closed, open, a range, a locale that starts its week on Sunday, refused
 * days, disabled, and holding an error.
 *
 * The two open calendars are the frame to compare: `de-DE` starts its week
 * on Monday and `en-US` on Sunday, and that is real `Intl` locale data
 * rather than a default this component picked. A component that chose one
 * would be wrong in half the world.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "20rem", maxWidth: "22rem" }}>
      <DatePicker label="Delivery date" locale="de-DE" />
      <DatePicker
        label="Delivery date"
        locale="de-DE"
        defaultValue="2026-08-27"
        defaultOpen
      />
      <DatePicker
        label="Contract period"
        locale="en-US"
        range
        defaultValue={["2026-08-10", "2026-08-19"]}
      />
      <DatePicker
        label="Delivery date"
        locale="de-DE"
        min="2026-08-20"
        max="2026-09-05"
        disabledDate={(date) => date === "2026-08-26"}
      />
      <DatePicker label="Delivery date" disabled />
      <DatePicker
        label="Delivery date"
        required
        error="A delivery date is required."
      />
    </div>
  ),
};

/**
 * A date is a string, and that is the whole point.
 *
 * `new Date("2026-08-27")` is midnight UTC, which is the 26th in Los
 * Angeles — so a date entered in Berlin and read in California is a day
 * early, for some users and not others, months after release. The value
 * never becomes a `Date`, so there is no instant for a timezone to be wrong
 * about.
 */
export const AValueIsAnIsoString: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: function Render() {
    const [value, setValue] = useState<IsoDate | null>(null);
    return (
      <>
        <DatePicker
          label="Delivery date"
          locale="de-DE"
          value={value}
          onValueChange={(next) => setValue(next as IsoDate | null)}
        />
        <p data-testid="value">{value ?? "none"}</p>
        <p data-testid="type">{typeof value}</p>
      </>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Delivery date" }),
      "2026-08-27",
    );
    await expect(canvas.getByTestId("value")).toHaveTextContent("2026-08-27");
    await expect(
      canvas.getByTestId("type"),
      "the value became a Date, so a timezone can shift it by a day",
    ).toHaveTextContent("string");
  },
};

/**
 * An impossible date is refused, and the length of February is why.
 *
 * `2026-02-31` passes every bound a range check could apply. Building the
 * date and asking what came back is the only test that knows how long a
 * month is, and leap years make the alternative a table somebody has to
 * maintain.
 */
export const ImpossibleDatesAreRefused: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: function Render() {
    const [value, setValue] = useState<IsoDate | null>(null);
    return (
      <>
        <DatePicker
          label="Delivery date"
          locale="de-DE"
          value={value}
          onValueChange={(next) => setValue(next as IsoDate | null)}
        />
        <p data-testid="value">{value ?? "none"}</p>
      </>
    );
  },
  play: async ({ canvas }) => {
    const field = canvas.getByRole("textbox", { name: "Delivery date" });

    await userEvent.type(field, "2026-02-31");
    await expect(
      canvas.getByTestId("value"),
      "February was given 31 days",
    ).toHaveTextContent("none");

    await userEvent.clear(field);
    await userEvent.type(field, "2024-02-29");
    await expect(
      canvas.getByTestId("value"),
      "2024 is a leap year and the 29th is a real date",
    ).toHaveTextContent("2024-02-29");
  },
};

/**
 * The week starts where the locale says.
 *
 * `de-DE` on Monday, `en-US` on Sunday, from `Intl.Locale`'s week info. The
 * weekday headings show a short form and announce the long one: "Mo" is
 * unreadable aloud, and a full name in a seven-column grid is unreadable on
 * screen.
 */
export const TheWeekStartsWhereTheLocaleSays: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => (
    <>
      <DatePicker label="German" locale="de-DE" defaultValue="2026-08-27" />
      <DatePicker label="American" locale="en-US" defaultValue="2026-08-27" />
    </>
  ),
  play: async ({ canvas }) => {
    /* Scoped per picker. Two of them means two buttons called "Open
       calendar", and Testing Library throws on the ambiguity rather than
       picking one — the same protection Playwright's strict mode gives the
       other suite, and the reason `test/locators.spec.ts` exists there. */
    const picker = (label: string) =>
      within(
        canvas
          .getByRole("textbox", { name: label })
          .closest(".uix-datepicker") as HTMLElement,
      );

    const german = picker("German");
    await userEvent.click(
      german.getByRole("button", { name: "Open calendar" }),
    );
    const germanHeaders = german.getAllByRole("columnheader");
    await expect(germanHeaders).toHaveLength(7);
    await expect(
      germanHeaders[0],
      "de-DE starts its week on Monday",
    ).toHaveAccessibleName("Montag");
    /* And the visible text is the short form, so the grid stays seven
       columns wide. */
    await expect(germanHeaders[0]).toHaveTextContent(/^Mo/);

    const american = picker("American");
    await userEvent.click(
      american.getByRole("button", { name: "Open calendar" }),
    );
    await expect(
      american.getAllByRole("columnheader")[0],
      "en-US starts its week on Sunday, which is the whole claim",
    ).toHaveAccessibleName("Sunday");
  },
};

/**
 * One tab stop for the grid, and the arrows change the month by themselves.
 *
 * Thirty-five stops to reach one day is why this pattern needs a roving
 * tabindex. Moving the cursor past the end of a month pages the calendar, so
 * a reader never has to go and find the paging buttons to keep going — which
 * is asserted here because it is the part that is easy to leave out.
 */
export const TheGridIsOneTabStop: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => (
    <DatePicker
      label="Delivery date"
      locale="de-DE"
      defaultValue="2026-08-31"
    />
  ),
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Open calendar" }),
    );

    const cursor = () =>
      canvas.getAllByRole("gridcell").find((cell) => cell.tabIndex === 0);

    await expect(
      canvas.getAllByRole("gridcell").filter((cell) => cell.tabIndex === 0),
      "more than one day is a tab stop, so the grid is thirty-five stops",
    ).toHaveLength(1);
    await expect(cursor()).toHaveAttribute("data-date", "2026-08-31");

    await userEvent.keyboard("{ArrowRight}");
    await expect(
      cursor(),
      "moving past the end of the month did not page the calendar",
    ).toHaveAttribute("data-date", "2026-09-01");

    await userEvent.keyboard("{PageUp}");
    await expect(cursor()).toHaveAttribute("data-date", "2026-08-01");
  },
};

/**
 * A range keeps its half-picked state, because that is what the reader sees.
 *
 * Between two clicks there is a start and no end, and a value shape that
 * could not express it would push that state onto every caller. Clicking
 * before the start begins again rather than refusing — people do that by
 * accident, and refusing it teaches nothing.
 */
export const ARangeHoldsOneEnd: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: function Render() {
    const [value, setValue] = useState<
      IsoDate | [IsoDate, IsoDate | null] | null
    >(null);
    return (
      <>
        <DatePicker
          label="Contract period"
          locale="de-DE"
          range
          value={value}
          onValueChange={setValue}
        />
        <p data-testid="value">{JSON.stringify(value)}</p>
      </>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Open calendar" }),
    );

    const day = (date: string) =>
      canvas
        .getAllByRole("gridcell")
        .find((cell) => cell.getAttribute("data-date") === date)!;

    /* The calendar opens on today, so page to a month the test controls. */
    const anyCell = canvas.getAllByRole("gridcell")[10]!;
    const start = anyCell.getAttribute("data-date")!;
    await userEvent.click(anyCell);
    await expect(
      canvas.getByTestId("value"),
      "the first click has to leave a start with no end",
    ).toHaveTextContent(`["${start}",null]`);

    const laterDate = day(start).nextElementSibling
      ? (day(start).nextElementSibling as HTMLElement).getAttribute(
          "data-date",
        )!
      : start;
    await userEvent.click(day(laterDate));
    await expect(canvas.getByTestId("value")).toHaveTextContent(
      `["${start}","${laterDate}"]`,
    );
  },
};

/**
 * Refused days are shown, struck through, and cannot be picked.
 *
 * Struck rather than only dimmed: "cannot be picked" carried by colour alone
 * is WCAG 1.4.1, and a calendar of booked days is exactly the case where it
 * matters. Shown rather than removed, because a missing day reads as a
 * rendering fault.
 */
export const RefusedDaysAreVisible: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: function Render() {
    const [value, setValue] = useState<IsoDate | null>(null);
    return (
      <>
        <DatePicker
          label="Delivery date"
          locale="de-DE"
          value={value}
          onValueChange={(next) => setValue(next as IsoDate | null)}
          defaultValue={null}
          min="2026-08-20"
          disabledDate={(date) => date === "2026-08-26"}
        />
        <p data-testid="value">{value ?? "none"}</p>
      </>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Open calendar" }),
    );

    const cells = canvas.getAllByRole("gridcell");
    const refused = cells.filter(
      (cell) => cell.getAttribute("aria-disabled") === "true",
    );
    await expect(
      refused.length,
      "nothing was refused, so min and disabledDate did nothing",
    ).toBeGreaterThan(0);

    await userEvent.click(refused[0]!);
    await expect(
      canvas.getByTestId("value"),
      "a refused day was picked",
    ).toHaveTextContent("none");
  },
};

/**
 * Inside a form, an error reaches it by name.
 */
export const InAForm: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => (
    <Form errors={{ delivery: "A delivery date is required." }}>
      <DatePicker name="delivery" label="Delivery date" locale="de-DE" />
    </Form>
  ),
  play: async ({ canvas }) => {
    const field = canvas.getByRole("textbox", { name: "Delivery date" });
    await expect(field).toHaveAttribute("aria-invalid", "true");
    const described = field.getAttribute("aria-describedby");
    await expect(described).toBeTruthy();
    await expect(document.getElementById(described!)).toHaveTextContent(
      /delivery date is required/,
    );
  },
};

/**
 * A fixture: one picker, open, on a known date, with no `play` of its own.
 *
 * `browser/keyboard.spec.ts` drives this. It exists because the three
 * keyboard rows first pointed at `TheGridIsOneTabStop`, which has a `play`
 * that moves the cursor — and in a built Storybook that play autoplays, so
 * the Playwright test read the state *after* it and saw 2026-08-01 where the
 * fixture says the 31st. That is the third time in this repository that a
 * story with a `play` function has been used as a Playwright fixture and
 * raced it.
 *
 * 31 August 2026 on purpose: it is the last day of a 31-day month and itself
 * a Monday, so one press crosses a month boundary and Home has somewhere
 * locale-dependent to go.
 */
export const AKnownMonth: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => (
    <DatePicker
      label="Delivery date"
      locale="de-DE"
      defaultValue="2026-08-31"
      defaultOpen
    />
  ),
};

/**
 * Days rendered by the caller.
 *
 * The ninth component here with this door, and the one where it earns the
 * most: a price per night, a dot for a booking, a holiday name. The date
 * arrives as the same `YYYY-MM-DD` string the value uses — handing back a
 * `Date` would put the timezone bug straight back into the caller's code.
 */
export const DaysRenderedByTheCaller: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => (
    <DatePicker
      label="Delivery date"
      locale="de-DE"
      defaultValue="2026-08-27"
      defaultOpen
      day={(date, { selected }) => (
        <span
          style={{
            display: "grid",
            justifyItems: "center",
            lineHeight: 1.1,
          }}
        >
          <span>{Number(date.slice(8))}</span>
          <span
            aria-hidden
            style={{
              fontSize: "0.6em",
              color: selected
                ? "var(--uix-text-on-accent)"
                : "var(--uix-text-caption)",
            }}
          >
            {date.endsWith("5") ? "€9" : ""}
          </span>
        </span>
      )}
    />
  ),
  play: async ({ canvas }) => {
    /* Asserted, because a story that demonstrates a prop and never reads the
       result documents an intention. */
    const cell = canvas
      .getAllByRole("gridcell")
      .find((one) => one.getAttribute("data-date") === "2026-08-25")!;
    await expect(cell).toHaveTextContent("25");
    await expect(cell, "the custom body did not render").toHaveTextContent(
      "€9",
    );
  },
};
