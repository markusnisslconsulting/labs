export interface BadgeProps {
  tone?: "accent" | "neutral" | "danger" | "success";
  children: string;
}

/**
 * A short status label. The text is the content — tone only colours
 * it, so screen readers and greyscale both work.
 */
export function Badge({ tone = "neutral", children }: BadgeProps) {
  return (
    <span className="uix-badge" data-tone={tone}>
      {children}
    </span>
  );
}
