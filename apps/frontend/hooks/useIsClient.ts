"use client";

import { useSyncExternalStore } from "react";

const subscribeToNothing = () => () => {};
const onClient = () => true;
const onServer = () => false;

export function useIsClient(): boolean {
  return useSyncExternalStore(subscribeToNothing, onClient, onServer);
}
