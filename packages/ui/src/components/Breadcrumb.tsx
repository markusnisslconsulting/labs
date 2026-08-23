export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Breadcrumb trail. The last item is the current page:
 * `aria-current="page"`, rendered as text, not a link to itself.
 *
 * Accessibility: `nav` with a label, list semantics, separators
 * hidden from assistive technology.
 */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="uix-breadcrumb" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {isLast || !item.href ? (
                <span aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              ) : (
                <a href={item.href}>{item.label}</a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
