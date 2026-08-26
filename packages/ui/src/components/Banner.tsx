import type { ReactNode, ComponentPropsWithoutRef } from "react";

import { cx } from "../cx";
import "./Banner.css";
type Severity = "info" | "success" | "warning" | "danger";

interface BannerOwnProps {
  severity: Severity;
  children: ReactNode;
}

/**
 * Accepts every attribute of `<div>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type BannerProps = BannerOwnProps &
  Omit<ComponentPropsWithoutRef<"div">, keyof BannerOwnProps>;

const roleFor: Record<Severity, "status" | "alert"> = {
  info: "status",
  success: "status",
  warning: "alert",
  danger: "alert",
};

/**
 * **Use it for** an announcement that concerns the whole view. **Reach for something else when** the message belongs to one control or row (Alert).
 *
 * Page-level strip for announcements that concern the whole view.
 * Same role semantics as Alert; the difference is placement and
 * weight, not behaviour.
 */
export function Banner({
  severity,
  children,
  className,
  ...rest
}: BannerProps) {
  return (
    <div
      className={cx("uix-banner", className)}
      data-severity={severity}
      role={roleFor[severity]}
      {...rest}
    >
      {children}
    </div>
  );
}
