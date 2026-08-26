import type { ComponentPropsWithoutRef } from "react";
import { cx } from "../cx";
import "./Avatar.css";

interface AvatarOwnProps {
  /** Full name; initials derive from it when no image is given. */
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  /**
   * Silence the avatar for assistive technology.
   *
   * Use it where the name is already written next to the avatar, which is
   * most rows and most comments — otherwise the name is announced twice.
   * Opt-in rather than the default because the failure modes are not
   * symmetrical: a duplicated name is noise, and a silent avatar in a
   * list of avatars is a row nobody can identify.
   */
  decorative?: boolean;
}

/**
 * Accepts every attribute of `<img>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type AvatarProps = AvatarOwnProps &
  Omit<ComponentPropsWithoutRef<"img">, keyof AvatarOwnProps>;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * **Use it for** marking who a row or comment belongs to. **Reach for something else when** the image carries meaning of its own (a plain img with alt text).
 *
 * A person marker, as an image or as initials.
 *
 * Accessibility: both branches announce the same thing. The image takes
 * `alt={name}`, the initials take `role="img"` with the same label, so
 * whether someone uploaded a picture does not change what a screen reader
 * says about them. Pass `decorative` where the name is already beside the
 * avatar. The two branches used to disagree — the image silent, the
 * initials announcing — which meant a row's accessibility depended on
 * whether that person had a photo.
 *
 * The intrinsic `width`/`height` follow `size`. They were 40 for all
 * three, so small and large avatars reserved the wrong space and the page
 * shifted when the image arrived.
 */
export function Avatar({
  name,
  src,
  size = "md",
  decorative,
  className,
  ...rest
}: AvatarProps) {
  // The rendered sizes from Avatar.css (1.6rem / 2.5rem / 3.5rem) at the
  // default root size. An aspect hint has to match what CSS will do, or
  // it causes the shift it exists to prevent.
  const px = { sm: 26, md: 40, lg: 56 }[size];

  if (src) {
    return (
      <img
        className={cx("uix-avatar", className)}
        data-size={size}
        src={src}
        alt={decorative ? "" : name}
        width={px}
        height={px}
        {...rest}
      />
    );
  }
  return (
    <span
      className={cx("uix-avatar", className)}
      data-size={size}
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": name })}
      {...(rest as ComponentPropsWithoutRef<"span">)}
    >
      {initials(name)}
    </span>
  );
}
