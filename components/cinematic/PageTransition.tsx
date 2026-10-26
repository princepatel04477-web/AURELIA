'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createTimeline, type Timeline } from 'animejs';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setStageDirection, setStageShot } from '@/components/three/CameraRig';
import { useReducedMotion } from '@/lib/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

/** The cut: bars meet at the centre, then part again. */
const CLOSE_MS = 600;
const OPEN_MS = 700;
const REST = '6vh';
const SHUT = '50vh';

/**
 * ROUTE TRANSITION.
 *
 * Click → the letterbox bars close to the centre on a 600ms inOutQuart →
 * the route swaps behind the closed frame (the Stage stays mounted; the camera
 * is told to drop its override so it lands on the new page's first shot) →
 * the bars part to 6vh → the new page's sections stagger in from `template.tsx`.
 *
 * `Letterbox` still owns the load-in and still animates on a route change; the
 * real panels are hidden while this curtain is on screen and handed back once
 * they have settled at rest, so the two timelines never fight over the same
 * height. Reduced motion swaps instantly and touches nothing.
 */
export function PageTransition() {
  const pathname = usePathname();
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const timeline = useRef<Timeline | null>(null);
  const navigating = useRef(false);
  const handoverTimer = useRef<number | null>(null);
  const previousPath = useRef(pathname);

  /** Hide the real letterbox for as long as this curtain is the frame. */
  const holdLetterbox = useCallback((hidden: boolean) => {
    const panels = document.querySelectorAll<HTMLElement>('.letterbox-panel');
    panels.forEach((panel) => {
      panel.style.display = hidden ? 'none' : '';
    });
  }, []);

  const setPanel = (node: HTMLDivElement | null, height: string) => {
    if (node) node.style.height = height;
  };

  const close = useCallback(
    (onClosed: () => void) => {
      const top = topRef.current;
      const bottom = bottomRef.current;
      if (!top || !bottom) {
        onClosed();
        return;
      }

      holdLetterbox(true);
      timeline.current?.revert();

      const instance = createTimeline({
        defaults: { ease: 'inOutQuart' },
        onComplete: onClosed,
      });

      setPanel(top, REST);
      setPanel(bottom, REST);

      instance
        .add([top, bottom], { height: SHUT, duration: CLOSE_MS }, 0)
        // The curtain is at rest only once the bars are shut.
        .add(top, { opacity: 1, duration: 1 }, 0);

      timeline.current = instance;
    },
    [holdLetterbox]
  );

  const open = useCallback(() => {
    const top = topRef.current;
    const bottom = bottomRef.current;
    if (!top || !bottom) return;

    timeline.current?.revert();

    const instance = createTimeline({
      defaults: { ease: 'outExpo' },
      onComplete: () => {
        // Hand the frame back to `Letterbox`, which has settled at 6vh by now.
        if (handoverTimer.current) window.clearTimeout(handoverTimer.current);
        handoverTimer.current = window.setTimeout(() => {
          holdLetterbox(false);
          navigating.current = false;
        }, 120);
      },
    });

    instance.add([top, bottom], { height: REST, duration: OPEN_MS }, 0);
    timeline.current = instance;
  }, [holdLetterbox]);

  // Intercept internal navigation so the frame can close *before* the swap.
  useEffect(() => {
    if (reducedMotion) return undefined;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return; // in-page anchor
      if (navigating.current) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      navigating.current = true;

      close(() => {
        // Behind the closed frame: the camera drops its override and the new
        // page takes over from its own first shot.
        setStageShot(null);
        setStageDirection({ beat: null });
        router.push(`${url.pathname}${url.search}${url.hash}`);
      });
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [close, reducedMotion, router]);

  // The swap has happened: clear the old scroll state, then part the bars.
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;

    if (reducedMotion) {
      navigating.current = false;
      ScrollTrigger.refresh();
      return;
    }

    // Every trigger belongs to the page that just left.
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

    // One frame for the new tree to mount and measure.
    const frame = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      open();
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname, reducedMotion, open]);

  // A push that never lands (e.g. cancelled) must not leave the frame shut.
  useEffect(() => {
    if (!navigating.current) return undefined;
    const failsafe = window.setTimeout(() => {
      if (!navigating.current) return;
      navigating.current = false;
      holdLetterbox(false);
      open();
    }, 6000);
    return () => window.clearTimeout(failsafe);
  }, [pathname, open, holdLetterbox]);

  useEffect(
    () => () => {
      timeline.current?.revert();
      if (handoverTimer.current) window.clearTimeout(handoverTimer.current);
      holdLetterbox(false);
    },
    [holdLetterbox]
  );

  if (reducedMotion) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[68]">
      <div
        ref={topRef}
        className="absolute inset-x-0 top-0 overflow-hidden bg-bg"
        style={{ height: REST }}
      >
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent" />
      </div>
      <div
        ref={bottomRef}
        className="absolute inset-x-0 bottom-0 overflow-hidden bg-bg"
        style={{ height: REST }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent" />
      </div>
    </div>
  );
}
