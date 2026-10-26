'use client';

import { useEffect, useRef, useState } from 'react';
import { createTimeline, type Timeline } from 'animejs';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from '@/lib/useReducedMotion';

const OPEN = '0px';
const CLOSED = '0px';

/**
 * Cinematic chrome.
 *
 * The frame arrives closed (a black screen split in two), opens to 6vh bars on
 * first load, and closes again on every route change — the film cuts, the frame
 * shuts, then it opens on the next chapter.
 */
export function Letterbox() {
  const reducedMotion = useReducedMotion();
  const pathname = usePathname();
  const topRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<Timeline | null>(null);
  const firstLoad = useRef(true);
  const [opening, setOpening] = useState(true);

  useEffect(() => {
    const top = topRef.current;
    const bottom = bottomRef.current;
    const label = labelRef.current;
    if (!top || !bottom) return;

    timelineRef.current?.revert();

    if (reducedMotion) {
      top.style.height = OPEN;
      bottom.style.height = OPEN;
      if (label) label.style.opacity = '1';
      setOpening(false);
      return;
    }

    const timeline = createTimeline({
      defaults: { ease: 'outExpo', duration: 1400 },
    });

    timelineRef.current = timeline;

    timeline
      .add([top, bottom], { height: OPEN, duration: 1600 }, 240)
      .add([label], { opacity: [0, 1], duration: 900, ease: 'inOutQuart' }, 900);

    setOpening(false);

    return () => {
      timeline.revert();
      timelineRef.current = null;
    };
  }, [reducedMotion]);

  // Route change: shut the frame, hold for a breath, open on the new chapter.
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }

    const top = topRef.current;
    const bottom = bottomRef.current;
    const label = labelRef.current;
    if (!top || !bottom) return;

    timelineRef.current?.revert();

    if (reducedMotion) {
      top.style.height = OPEN;
      bottom.style.height = OPEN;
      return;
    }

    const timeline = createTimeline({
      defaults: { ease: 'inOutQuart', duration: 800 },
    });

    timelineRef.current = timeline;

    timeline
      .add([label], { opacity: 0, duration: 260 }, 0)
      .add([top, bottom], { height: CLOSED, duration: 800 }, 0)
      .add([top, bottom], { height: OPEN, duration: 1600, ease: 'outExpo' }, 980);

    return () => {
      timeline.revert();
      timelineRef.current = null;
    };
  }, [pathname, reducedMotion]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
      <div
        ref={topRef}
        className="letterbox-panel absolute inset-x-0 top-0 flex items-end justify-center overflow-hidden bg-transparent"
        style={{ height: CLOSED }}
      >
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div
          ref={labelRef}
          className="absolute bottom-[1.6vh] left-0 right-0 flex items-center justify-between px-[clamp(1.25rem,5vw,5rem)] opacity-0"
          data-opening={opening}
        >
          <span className="label">Aurelia — Surat</span>
          <span className="label hidden sm:block">Fine Jewellery</span>
        </div>
      </div>

      <div
        ref={bottomRef}
        className="letterbox-panel absolute inset-x-0 bottom-0 flex items-start justify-center overflow-hidden bg-transparent"
        style={{ height: CLOSED }}
      >
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      </div>
    </div>
  );
}
