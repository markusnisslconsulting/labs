import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar } from "./Avatar";
import { AvatarGroup } from "./AvatarGroup";

const meta = {
  title: "Components/AvatarGroup",
  component: AvatarGroup,
  tags: ["autodocs", "beta"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof AvatarGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const PEOPLE = [
  { name: "Ada Lovelace" },
  { name: "Grace Hopper" },
  { name: "Katherine Johnson" },
  { name: "Radia Perlman" },
  { name: "Barbara Liskov" },
  { name: "Frances Allen" },
];

/**
 * Every size, and the overflow, in one frame.
 *
 * The ring is what makes overlapping circles read as separate faces. It is
 * drawn in the page colour rather than left as a gap, because a gap cannot
 * exist between two shapes that overlap — which is why the group needs to
 * know nothing about what is behind it: `--uix-bg-page` is the value the
 * page itself paints.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "1.25rem", justifyItems: "start" }}>
      <AvatarGroup label="Reviewers" people={PEOPLE.slice(0, 3)} size="sm" />
      <AvatarGroup label="Reviewers" people={PEOPLE.slice(0, 3)} />
      <AvatarGroup label="Reviewers" people={PEOPLE.slice(0, 3)} size="lg" />
      <AvatarGroup label="Attendees" people={PEOPLE} />
      <AvatarGroup label="Attendees" people={PEOPLE} max={2} />
      {/* The counter at every size, not only the default. It took a control
          height rather than the face's diameter, so it was a 32px circle
          beside 25.6px faces at `sm` and a 48px one beside 56px faces at
          `lg` — and neither was in a story, so nothing had ever drawn it. */}
      <AvatarGroup label="Attendees" people={PEOPLE} max={2} size="sm" />
      <AvatarGroup label="Attendees" people={PEOPLE} max={2} size="lg" />
      <AvatarGroup label="Assigned to" people={PEOPLE.slice(0, 1)} />
    </div>
  ),
};

/**
 * Nobody disappears because the layout ran out of room.
 *
 * The two claims that make this pattern readable rather than the usual
 * unreadable version. The group has a name, so a reader knows what five
 * names in a row have in common — without it, an avatar row is five names
 * and no context. And the people past `max` are named in the counter's own
 * label, because "+3" tells a sighted reader there is more to see and tells
 * a screen reader nothing at all.
 */
export const TheOverflowStillNamesPeople: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", people: [] },
  render: () => <AvatarGroup label="Attendees" people={PEOPLE} max={2} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("group")).toHaveAccessibleName("Attendees");

    const counter = canvas.getByRole("img", { name: /4 more/ });
    await expect(
      counter,
      "the four hidden people have to be in the label, or they are gone",
    ).toHaveAccessibleName(
      "4 more: Katherine Johnson, Radia Perlman, Barbara Liskov, Frances Allen",
    );

    /* The shown names are readable too, and exactly once each. Every
       avatar is `decorative`, so the images announce nothing and the names
       come from the text beside them — otherwise a reader says the word
       "image" once per face, which is the noise that makes people turn a
       page off. */
    await expect(canvas.getByText("Ada Lovelace")).toBeInTheDocument();
    await expect(
      canvas.queryAllByRole("img", { name: "Ada Lovelace" }),
    ).toHaveLength(0);
  },
};

/**
 * A face rendered by the caller, which is the way out of a list of names.
 *
 * `people` describes who; `item` decides what each one looks like. A
 * presence dot, a link to the profile, a tooltip — none of those can be
 * expressed by a list of names, and a component whose only input is a list
 * can only draw what its author imagined.
 *
 * The overlap arithmetic works off the control size, so a custom face
 * should keep it. That is the one constraint, and it is why the entry is
 * handed back rather than the component being replaced wholesale.
 */
export const FacesRenderedByTheCaller: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", people: [] },
  render: () => (
    <AvatarGroup
      label="Online now"
      people={PEOPLE.slice(0, 4)}
      item={(entry) => (
        <span style={{ position: "relative", display: "inline-flex" }}>
          <Avatar name={entry.name} src={entry.src} decorative />
          <span
            aria-hidden
            style={{
              position: "absolute",
              insetInlineEnd: 0,
              insetBlockEnd: 0,
              inlineSize: "0.6rem",
              blockSize: "0.6rem",
              borderRadius: "var(--uix-radius-pill)",
              background: "var(--uix-status-ok)",
              boxShadow: "0 0 0 2px var(--uix-bg-page)",
            }}
          />
        </span>
      )}
    />
  ),
};
