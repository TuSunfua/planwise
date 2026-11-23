"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

// False on the server and until hydration, for controls that must keep working without JavaScript.
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
