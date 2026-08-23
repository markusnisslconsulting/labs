import type { ReactNode } from "react";

type Severity = "info" | "success" | "warning" | "danger";

export interface BannerProps {
  severity: Severity;
  children: ReactNode;
}

const roleFor: Record<Severity, "status" | "alert"> = {
  info: "status",
  success: "status",
  warning: "alert",
  danger: "alert",
};

/**
 * Page-level strip for announcements that concern the whole view.
 * Same role semantics as Alert; the difference is placement and
 * weight, not behaviour.
 */
export function Banner({ severity, children }: BannerProps) {
  return (
    <div
      className="uix-banner"
      data-severity={severity}
      role={roleFor[severity]}
    >
      {children}
    </div>
  );
}
