'use client';

import * as React from 'react';
import { LoadingVisual } from './loading-visual';

const MIN_VISIBLE_MS = 2000;
const MAX_VISIBLE_MS = 2400;

/**
 * Branded full-screen loader for the first paint of a page. It stays up until
 * the window has finished loading (with a short minimum so it does not flicker)
 * and then fades away.
 */
export function AppLoading() {
  const [mounted, setMounted] = React.useState(true);
  const [hiding, setHiding] = React.useState(false);
  const started = React.useRef(0);

  React.useEffect(() => {
    started.current = performance.now();
    let done = false;
    let hideTimer: number | undefined;
    let removeTimer: number | undefined;

    const finish = () => {
      if (done) return;
      done = true;
      const elapsed = performance.now() - started.current;
      hideTimer = window.setTimeout(() => {
        setHiding(true);
        removeTimer = window.setTimeout(() => setMounted(false), 320);
      }, Math.max(0, MIN_VISIBLE_MS - elapsed));
    };

    if (document.readyState === 'complete') {
      finish();
    } else {
      window.addEventListener('load', finish, { once: true });
    }
    const maxTimer = window.setTimeout(finish, MAX_VISIBLE_MS);

    return () => {
      window.removeEventListener('load', finish);
      window.clearTimeout(maxTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
      if (removeTimer) window.clearTimeout(removeTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] transition-opacity duration-300"
      style={{ opacity: hiding ? 0 : 1, pointerEvents: hiding ? 'none' : 'auto' }}
      aria-hidden={hiding}
    >
      <LoadingVisual />
    </div>
  );
}