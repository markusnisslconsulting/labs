import type { ComponentPropsWithRef, ReactNode } from "react";

import { cx } from "../cx";
import { Avatar } from "./Avatar";
import "./Avatar.css";
import "./AvatarGroup.css";

interface AvatarGroupOwnProps {
  /**
   * Who is in the group, in the order they should be shown.
   *
   * Names and optional images rather than `Avatar` children, because the
   * component has to know how many there are to decide what the overflow
   * counter says — and counting children means either `React.Children`
   * arithmetic or trusting the caller to pass the same number twice.
   */
  people: Array<{ name: string; src?: string }>;
  /**
   * How many faces to show before the counter. Defaults to 4.
   *
   * The rest become "+3", and the accessible name lists them, so the
   * information is not lost — only the space.
   */
  max?: number;
  size?: "sm" | "md" | "lg";
  /**
   * Render one face yourself.
   *
   * The door out of the fixed arrangement, and the reason `people` being a
   * list is not a dead end. A presence dot on each avatar, a link to the
   * person, a tooltip — none of those can be expressed by a list of names,
   * and a component whose only input is a list can only ever draw what its
   * author imagined.
   *
   * Returns a node per person and replaces the default `Avatar`. Keep the
   * result the same size, or the overlap arithmetic has nothing to work
   * from.
   */
  person?: (entry: { name: string; src?: string }) => ReactNode;
  /**
   * What the group is, for assistive technology. Required.
   *
   * A row of overlapping avatars is one thing to a reader and not five, so
   * it needs a name of its own: "Assigned to" or "Reviewers". Without it a
   * screen reader reads five names in a row with no idea what they have in
   * common, which is the reason this pattern is usually unreadable.
   */
  label: string;
}

/**
 * **Use it for** the handful of people attached to one thing — assignees,
 * reviewers, attendees. **Reach for something else when** the reader needs
 * to act on an individual: overlapping faces are not reliable click
 * targets, so use a list.
 *
 * ```tsx
 * <AvatarGroup
 *   label="Reviewers"
 *   people={[{ name: "Ada Lovelace" }, { name: "Grace Hopper" }]}
 * />
 * ```
 *
 * Accessibility: one `role="group"` with `label` as its name, and every
 * avatar inside it `decorative` — so a reader announces the group once and
 * then the names, rather than the word "avatar" five times. The names of
 * everyone past `max` are in the counter's own label, so nobody disappears
 * because the layout ran out of room.
 *
 * The overlap is drawn with a ring in the page's own background colour, not
 * a gap, because a gap between overlapping circles is what makes them read
 * as separate. That ring is why the group needs to know nothing about what
 * is behind it: `--uix-bg-page` is the same value the page paints.
 */
export type AvatarGroupProps = AvatarGroupOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof AvatarGroupOwnProps | "children">;

export function AvatarGroup({
  people,
  max = 4,
  size = "md",
  person,
  label,
  className,
  ...rest
}: AvatarGroupProps) {
  const shown = people.slice(0, max);
  const hidden = people.slice(max);

  return (
    <div
      className={cx("uix-avatargroup", className)}
      data-size={size}
      role="group"
      aria-label={label}
      {...rest}
    >
      {/* One element per person, holding the face and that person's name.
          Two separate maps put every hidden name *after* every avatar, which
          broke the overlap: the rule below is a sibling selector, and with
          five name spans sitting between the last avatar and the counter the
          counter matched nothing and sat a full gap away. Visible in a
          screenshot and invisible to every assertion in this repository.

          It also reads better. A block of five names after five silent
          images is not the same thing as five named faces. */}
      {shown.map((entry) => (
        <div key={entry.name} className="uix-avatargroup-item">
          {person ? (
            person(entry)
          ) : (
            <Avatar
              name={entry.name}
              src={entry.src}
              size={size}
              /* Decorative, because the name is beside it. Otherwise a
                 reader says "Ada Lovelace, image" for each one, and the
                 word "image" five times is the noise that makes people turn
                 a page off. */
              decorative
            />
          )}
          <span className="uix-visually-hidden">{entry.name}</span>
        </div>
      ))}
      {hidden.length ? (
        <span
          className="uix-avatargroup-item uix-avatargroup-more"
          /* The names, not just the number. "+3" tells a sighted reader
             there is more to see and tells a screen reader nothing, so the
             three names go in the label. */
          aria-label={`${hidden.length} more: ${hidden
            .map((person) => person.name)
            .join(", ")}`}
          role="img"
        >
          +{hidden.length}
        </span>
      ) : null}
    </div>
  );
}
