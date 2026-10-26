'use client';

import { useEffect, useRef } from 'react';
import { createTimeline, type Timeline } from 'animejs';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from '@/lib/useReducedMotion';

const OPEN = '6vh';

/**
 * Cinematic chrome.
 *
 * Cinematic 6vh letterbox bars framing the viewport top and bottom.
 * On first load and route changes, the label gently fades in.
 */
export function Letterbox() {
  const reducedMotion = useReducedMotion();
  const pathname = usePathname();
  const topRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<Timeline | null>(null);
  const firstLoad = useRef(true);

  useEffect(() => {
    const top = topRef.current;
    const bottom = bottomRef.current;
    const label = labelRef.current;
    if (!top || !bottom) return;

    top.style.height = OPEN;
    bottom.style.height = OPEN;

    if (reducedMotion) {
      if (label) label.style.opacity = '1';
      return;
    }

    timelineRef.current?.revert();

    const timeline = createTimeline({
      defaults: { ease: 'outExpo', duration: 1200 },
    });

    timelineRef.current = timeline;

    timeline.add([label], { opacity: [0, 1], duration: 900, ease: 'inOutQuart' }, 400);

    return () => {
      timeline.revert();
      timelineRef.current = null;
    };
  }, [reducedMotion]);

  // Route change: subtle label refresh
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }

    const label = labelRef.current;
    if (!label || reducedMotion) return;

    timelineRef.current?.revert();

    const timeline = createTimeline({
      defaults: { ease: 'inOutQuart', duration: 600 },
    });

    timelineRef.current = timeline;

    timeline
      .add([label], { opacity: [1, 0], duration: 250 }, 0)
      .add([label], { opacity: [0, 1], duration: 600 }, 300);

    return () => {
      timeline.revert();
      timelineRef.current = null;
    };
  }, [pathname, reducedMotion]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
      <div
        ref={topRef}
        className="letterbox-panel absolute inset-x-0 top-0 flex items-end justify-center overflow-hidden bg-bg"
        style={{ height: OPEN }}
      >
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div
          ref={labelRef}
          className="absolute bottom-[1.6vh] left-0 right-0 flex items-center justify-between px-[clamp(1.25rem,5vw,5rem)] opacity-0"
        >
          <span className="label">Aurelia — Surat</span>
          <span className="label hidden sm:block">Fine Jewellery</span>
        </div>
      </div>

      <div
        ref={bottomRef}
        className="letterbox-panel absolute inset-x-0 bottom-0 flex items-start justify-center overflow-hidden bg-bg"
        style={{ height: OPEN }}
      >
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      </div>
    </div>
  );
}

export default Letterbox;
