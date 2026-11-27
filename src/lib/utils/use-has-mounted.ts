import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False on the server and during hydration, true afterwards. Use it to render text that depends on the
 * browser (stored language, localStorage) only after hydration, so the server HTML never mismatches.
 * The server always renders Spanish while the client may start in the stored language.
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
