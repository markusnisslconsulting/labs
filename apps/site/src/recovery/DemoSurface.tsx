import { Suspense, useRef, type ComponentType } from "react";
import { Stack } from "@labs/ui/components/Stack";
import { useSiteStrings } from "../i18n/SiteStrings";
import { DemoLoadError } from "./DemoLoadError";
import { RecoveryBoundary } from "./RecoveryBoundary";
import { RecoveryNotice } from "./RecoveryNotice";
import { useHydrated } from "../hydration";

export function DemoSurface({
  component: Demo,
  returnTo,
}: {
  component: ComponentType;
  returnTo: string;
}) {
  const { strings } = useSiteStrings();
  const region = useRef<HTMLElement>(null);
  const hydrated = useHydrated();
  return (
    <Stack
      gap="lg"
      renderAs={
        <section
          ref={region}
          tabIndex={-1}
          aria-label={strings.interactiveDemo}
        />
      }
    >
      <RecoveryBoundary
        onReset={() => region.current?.focus({ preventScroll: true })}
        fallback={(error, retry) => (
          <RecoveryNotice
            kind={error instanceof DemoLoadError ? "load" : "render"}
            returnTo={returnTo}
            retry={retry}
          />
        )}
      >
        {hydrated ? (
          <Suspense
            fallback={
              <p className="lab-demo-loading" role="status">
                {strings.loadingDemo}
              </p>
            }
          >
            <Demo />
          </Suspense>
        ) : (
          <p>{strings.demoReady}</p>
        )}
      </RecoveryBoundary>
    </Stack>
  );
}
