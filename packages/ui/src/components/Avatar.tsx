import type { ComponentPropsWithoutRef } from "react";
import { cx } from "../cx";
import "./Avatar.css";

interface AvatarOwnProps {
  /** Full name; initials derive from it when no image is given. */
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
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
 * A person marker. With `src`, the image is decorative
 * (`alt=""`) because the name is already next to it in context —
 * double announcement is the bug this avoids.
 */
export function Avatar({
  name,
  src,
  size = "md",
  className,
  ...rest
}: AvatarProps) {
  if (src) {
    return (
      <img
        className={cx("uix-avatar", className)}
        data-size={size}
        src={src}
        alt=""
        width={40}
        height={40}
        {...rest}
      />
    );
  }
  return (
    <span className="uix-avatar" data-size={size} role="img" aria-label={name}>
      {initials(name)}
    </span>
  );
}
