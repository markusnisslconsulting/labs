import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { catalogReturn } from "../catalog/filters";
import { RecoveryBoundary } from "./RecoveryBoundary";
import { RecoveryNotice } from "./RecoveryNotice";

export function RouteRecovery({ children }: { children: ReactNode }) {
  const location = useLocation();
  const state = location.state as { catalogReturn?: unknown } | null;
  return (
    <RecoveryBoundary
      key={location.pathname}
      onReset={() =>
        document.getElementById("main")?.focus({ preventScroll: true })
      }
      fallback={(_error, retry) => (
        <RecoveryNotice
          kind="page"
          returnTo={catalogReturn(state?.catalogReturn)}
          retry={retry}
        />
      )}
    >
      {children}
    </RecoveryBoundary>
  );
}
