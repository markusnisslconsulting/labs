import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const client = () => true;
const server = () => false;

/** Match static HTML before reading URL state or starting browser-only demos. */
export const useHydrated = () =>
  useSyncExternalStore(subscribe, client, server);
