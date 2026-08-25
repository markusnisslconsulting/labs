import { Menu as BaseMenu } from "@base-ui-components/react/menu";

export interface MenuItem {
  id: string;
  label: string;
  onSelect?: () => void;
  danger?: boolean;
}

export interface MenuProps {
  /** Trigger label. */
  label: string;
  items: MenuItem[];
}

/**
 * Dropdown menu on Base UI's menu root.
 *
 * Accessibility: Base UI renders the full menu pattern — trigger with
 * `aria-haspopup`/`aria-expanded`, roving focus, Arrow/Home/End/
 * Escape, and typeahead. Items announce `menuitem` within a labelled
 * menu.
 *
 * Performance: the popup mounts lazily on first open.
 */
export function Menu({ label, items }: MenuProps) {
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger
        className="uix-button"
        data-variant="outline"
        data-size="md"
        aria-haspopup="menu"
      >
        {label} ▾
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner
          className="uix-menu-positioner"
          sideOffset={6}
          align="end"
        >
          <BaseMenu.Popup className="uix-menu">
            {items.map((item) => (
              <BaseMenu.Item
                key={item.id}
                className="uix-menu-item"
                data-danger={item.danger || undefined}
                onClick={item.onSelect}
              >
                {item.label}
              </BaseMenu.Item>
            ))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
