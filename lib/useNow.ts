"use client";

import { useSyncExternalStore } from "react";
import { localZone } from "./time";

/*
 * The current time, to the whole second, as an external store. The static
 * build has no "now", so the server snapshot is null and the page fills in
 * once it runs in the browser.
 */

let nowSec = 0;

const floorSec = () => Math.floor(Date.now() / 1000) * 1000;

function subscribeNow(onChange: () => void) {
  const tick = () => {
    const next = floorSec();
    if (next !== nowSec) {
      nowSec = next;
      onChange();
    }
  };
  tick();
  const id = setInterval(tick, 250);
  return () => clearInterval(id);
}

function readNow() {
  if (!nowSec) nowSec = floorSec();
  return nowSec;
}

/** Epoch ms of the current second, or null before the page runs in a browser. */
export function useNow(): number | null {
  return useSyncExternalStore(subscribeNow, readNow, () => null);
}

const noSubscribe = () => () => {};

/** The device's IANA zone, or null during the static build. */
export function useLocalZone(): string | null {
  return useSyncExternalStore(noSubscribe, localZone, () => null);
}
