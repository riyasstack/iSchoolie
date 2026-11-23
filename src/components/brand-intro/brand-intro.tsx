'use client';

import * as React from 'react';
import Image from 'next/image';

const STORAGE_KEY = 'ischoolie:intro:played';

function readPlayed(): boolean {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writePlayed(): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Storage unavailable (private mode): intro may replay; acceptable fallback.
  }
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

type Phase = 'enter' | 'reveal' | 'tagline' | 'exit' | 'done';

export function BrandIntro() {
  const [phase, setPhase] = React.useState<Phase>('enter');
  const [mounted, setMounted] = React.useState(false);

  // Decide skip before paint to avoid overlay flash on repeat visits.
  React.useLayoutEffect(() => {
    setMounted(true);
    const rp = readPlayed();
    const rm = prefersReducedMotion();
    if (rp || rm) {
      writePlayed();
      setPhase('done');
    }
  }, []);

  // Drive the animation after the first paint so CSS transitions trigger.
  React.useEffect(() => {
    if (phase === 'done') return;
    if (!mounted) return;

    const timers: number[] = [];
    const raf = window.requestAnimationFrame(() => {
      setPhase('reveal');
    });
    timers.push(window.setTimeout(() => setPhase('tagline'), 420));
    timers.push(window.setTimeout(() => setPhase('exit'), 1180));
    timers.push(window.setTimeout(() => {
      writePlayed();
      setPhase('done');
    }, 1620));

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        writePlayed();
        setPhase('done');
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const skip = React.useCallback(() => {
    writePlayed();
    setPhase('done');
  }, []);

  if (!mounted || phase === 'done') return null;

  const logoVisible = phase !== 'enter';
  const taglineVisible = phase === 'tagline' || phase === 'exit';
  const exiting = phase === 'exit';

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ opacity: exiting ? 0 : 1, pointerEvents: exiting ? 'none' : 'auto' }}
    >
      <div className="flex flex-col items-center justify-center gap-6 px-6">
        <div
          className="transition-all duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            opacity: logoVisible ? 1 : 0,
            transform: logoVisible ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(8px)',
            filter: logoVisible ? 'blur(0px)' : 'blur(8px)',
          }}
        >
          <Image
            src="/brand/ischoolie-logo.png"
            alt=""
            width={320}
            height={80}
            priority
            className="h-auto w-[min(72vw,320px)]"
            style={{ width: 'auto', height: 'auto' }}
          />
        </div>

        <p
          aria-hidden="true"
          className="text-center text-[0.85rem] font-semibold uppercase tracking-[0.22em] text-[#526078] transition-all duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            opacity: taglineVisible ? 1 : 0,
            transform: taglineVisible ? 'translateY(0)' : 'translateY(8px)',
          }}
        >
          Learn. Teach. Connect. Grow.
        </p>
      </div>

      <button
        type="button"
        onClick={skip}
        className="absolute bottom-6 right-6 rounded-full border border-[#d7dbe3] bg-white/80 px-4 py-2 text-xs font-semibold text-[#526078] backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]"
      >
        Skip
      </button>
    </div>
  );
}
