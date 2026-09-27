import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router";

type Position = { x: number; y: number; focusId?: string };

/** Keep route transitions separate from query edits, which retain input focus. */
export function Navigation() {
  const location = useLocation();
  const action = useNavigationType();
  const positions = useRef(new Map<string, Position>());
  const previous = useRef<{ key: string; pathname: string } | null>(null);

  useLayoutEffect(() => {
    const restoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = restoration;
    };
  }, []);

  useLayoutEffect(() => {
    const last = previous.current;
    const pathChanged = last !== null && last.pathname !== location.pathname;
    const saved = positions.current.get(location.key);
    const focus = (element: HTMLElement | null) => {
      if (!element) return;
      if (
        !element.hasAttribute("tabindex") &&
        !element.matches("a,button,input,select,textarea")
      )
        element.tabIndex = -1;
      element.focus({ preventScroll: true });
    };
    if (pathChanged) {
      const heading = document.querySelector<HTMLElement>("main h1");
      if (action === "POP" && saved) {
        focus(
          (saved.focusId && document.getElementById(saved.focusId)) || heading,
        );
        window.scrollTo(saved.x, saved.y);
      } else {
        focus(heading);
        window.scrollTo(0, 0);
      }
    }
    if (location.hash) {
      try {
        const target = document.getElementById(
          decodeURIComponent(location.hash.slice(1)),
        );
        if (target) {
          focus(target);
          target.scrollIntoView();
        }
      } catch {
        /* Invalid URL escapes do not prevent route navigation. */
      }
    }
    previous.current = { key: location.key, pathname: location.pathname };
    const save = () => {
      positions.current.set(location.key, {
        x: window.scrollX,
        y: window.scrollY,
        focusId:
          document.activeElement instanceof HTMLElement
            ? document.activeElement.id || undefined
            : undefined,
      });
      if (positions.current.size > 100)
        positions.current.delete(positions.current.keys().next().value!);
    };
    save();
    window.addEventListener("scroll", save, { passive: true });
    document.addEventListener("focusin", save);
    return () => {
      window.removeEventListener("scroll", save);
      document.removeEventListener("focusin", save);
    };
  }, [location.key, location.pathname, location.hash, action]);
  return null;
}
