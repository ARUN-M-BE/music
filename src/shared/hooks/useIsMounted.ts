"use client";

import { useSyncExternalStore } from "react";

// Nothing ever changes, so the store never notifies.
const subscribe = () => () => {};

/**
 * True only once the tree is running on the client.
 *
 * `getServerSnapshot` returns `false` and `getSnapshot` returns `true`, so React
 * hydrates with the server value and then re-renders on its own. That gives the
 * same result as the classic `useState` + `useEffect` mount flag, without the
 * extra render that `react-hooks/set-state-in-effect` warns about.
 *
 * Use it for values the server cannot know (stored theme, media queries, locale
 * formatting) so the first paint always matches the server HTML.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
