'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createTimeline, stagger, type Timeline } from 'animejs';
import { useReducedMotion } from '@/lib/useReducedMotion';

/**
 * TEMPLATE — the page's arrival.
 *
 * A template remounts on every navigation (a layout does not), which is exactly
 * what the transition needs: the new page's sections are fresh nodes, so they
 * can be staggered in behind the reopened letterbox, and every ScrollTrigger
 * rebuilt by the page's own effects starts from a clean state.
 */
export default function Template({ children }: { children: ReactNode }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const timeline = useRef<Timeline | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const node = wrapper.current;
    if (!node || reducedMotion) return undefined;

    const sections = Array.from(node.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement
    );
    if (sections.length === 0) return undefined;

    timeline.current?.revert();

    const instance = createTimeline({ defaults: { ease: 'outExpo' } });
    instance.add(
      sections,
      { opacity: [0, 1], translateY: [18, 0], duration: 1100, delay: stagger(90) },
      0
    );

    timeline.current = instance;

    return () => {
      instance.revert();
      timeline.current = null;
    };
  }, [reducedMotion]);

  return <div ref={wrapper}>{children}</div>;
}
