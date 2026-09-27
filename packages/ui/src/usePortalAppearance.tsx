"use client";

import { useDirection } from "@base-ui-components/react/direction-provider";
import { useLayoutEffect, useState } from "react";

type Scope = {
  "data-brand"?: string;
  "data-density"?: string;
};

/** Preserve named appearance scopes when an overlay moves to document.body. */
export function usePortalAppearance() {
  const direction = useDirection();
  const [anchor, setAnchor] = useState<HTMLSpanElement | null>(null);
  const [scope, setScope] = useState<Scope>({});

  useLayoutEffect(() => {
    if (!anchor) return;
    const read = () => {
      const next: Scope = {
        "data-brand":
          anchor.closest("[data-brand]")?.getAttribute("data-brand") ??
          undefined,
        "data-density":
          anchor.closest("[data-density]")?.getAttribute("data-density") ??
          undefined,
      };
      setScope((previous) =>
        previous["data-brand"] === next["data-brand"] &&
        previous["data-density"] === next["data-density"]
          ? previous
          : next,
      );
    };
    read();
    const observer = new MutationObserver(read);
    for (let node = anchor.parentElement; node; node = node.parentElement) {
      observer.observe(node, {
        attributes: true,
        attributeFilter: ["data-brand", "data-density"],
      });
    }
    return () => observer.disconnect();
  }, [anchor]);

  return {
    anchor: <span hidden ref={setAnchor} />,
    props: { ...scope, dir: direction },
  };
}
