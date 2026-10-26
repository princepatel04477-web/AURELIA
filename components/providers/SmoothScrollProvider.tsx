'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from '@/lib/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

type SmoothScrollContextValue = {
  lenis: Lenis | null;
};

const SmoothScrollContext = createContext<SmoothScrollContextValue>({ lenis: null });

export function useSmoothScroll(): SmoothScrollContextValue {
  return useContext(SmoothScrollContext);
}

/**
 * Lenis ↔ GSAP bridge.
 *
 * - `lenis.on('scroll', ScrollTrigger.update)` keeps every pinned section honest.
 * - GSAP's ticker drives `lenis.raf`, so there is exactly one animation loop.
 * - Reduced motion gets native scrolling: Lenis is never constructed.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (reducedMotion) {
      ScrollTrigger.refresh();
      return;
    }

    const instance = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.1,
      wheelMultiplier: 0.9,
      anchors: true,
    });

    lenisRef.current = instance;
    setLenis(instance);

    instance.on('scroll', ScrollTrigger.update);

    const raf = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(raf);
      instance.off('scroll', ScrollTrigger.update);
      instance.destroy();
      lenisRef.current = null;
      setLenis(null);
    };
  }, [reducedMotion]);

  // A new chapter always starts from the top of the frame.
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
    ScrollTrigger.refresh();
  }, [pathname]);

  return <SmoothScrollContext.Provider value={{ lenis }}>{children}</SmoothScrollContext.Provider>;
}
