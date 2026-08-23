export interface AvatarProps {
  /** Full name; initials derive from it when no image is given. */
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
}

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
export function Avatar({ name, src, size = "md" }: AvatarProps) {
  if (src) {
    return (
      <img
        className="uix-avatar"
        data-size={size}
        src={src}
        alt=""
        width={40}
        height={40}
      />
    );
  }
  return (
    <span className="uix-avatar" data-size={size} role="img" aria-label={name}>
      {initials(name)}
    </span>
  );
}
