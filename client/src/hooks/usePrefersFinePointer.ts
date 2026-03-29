import { useSyncExternalStore } from "react";

/** True when the primary pointer is a mouse / trackpad (desktop). Touch devices are false. */
export function usePrefersFinePointer(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia("(pointer: fine)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(pointer: fine)").matches,
    () => false,
  );
}
