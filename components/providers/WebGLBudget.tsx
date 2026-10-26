'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useReducedMotion } from '@/lib/useReducedMotion';

/**
 * Hard budget: never more than two WebGL canvases alive at once.
 * Slots are held by mounted canvases; the third one asking for a slot waits
 * until another releases. Components also stop rendering when off-screen.
 */
const MAX_CANVASES = 2;

const holders = new Set<string>();
const waiters = new Set<() => void>();

const notify = () => {
  waiters.forEach((waiter) => waiter());
};

function acquire(id: string): boolean {
  if (holders.has(id)) return true;
  if (holders.size >= MAX_CANVASES) return false;
  holders.add(id);
  return true;
}

function release(id: string) {
  if (!holders.delete(id)) return;
  notify();
}

/** Diagnostic helper for the two-canvas rule (no rendering side effects). */
export function activeCanvasCount(): number {
  return holders.size;
}

/**
 * Returns `true` when this component may mount a WebGL canvas.
 * `request` usually comes from an IntersectionObserver in `<WebGLBoundary>`.
 */
export function useWebGLSlot(id: string, request: boolean): boolean {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!request) {
      setGranted(false);
      release(id);
      return;
    }

    const attempt = () => {
      setGranted(acquire(id));
    };

    attempt();
    waiters.add(attempt);

    return () => {
      waiters.delete(attempt);
      release(id);
      setGranted(false);
    };
  }, [id, request]);

  return granted;
}

type WebGLBoundaryProps = {
  /** Stable identifier, unique per canvas in the tree. */
  id: string;
  children: ReactNode;
  /** Reserved height so the layout never jumps when the canvas mounts. */
  className?: string;
  /** Extra delay before the observer starts watching (used by scroll reveals). */
  rootMargin?: string;
  /** Pause instead of unmount when off-screen (cheaper for a single hero). */
  canvasLabel?: string;
};

/**
 * Visibility gate for a WebGL surface.
 * Off-screen or hidden tabs release their canvas slot entirely, which keeps the
 * cinematic scroll cheap and stays inside the two-canvas budget.
 */
export function WebGLBoundary({
  id,
  children,
  className,
  rootMargin = '200px',
  canvasLabel,
}: WebGLBoundaryProps) {
  const reducedMotion = useReducedMotion();
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const granted = useWebGLSlot(id, inView && !reducedMotion);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setInView(entry.isIntersecting);
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(element);

    const onVisibility = () => {
      if (document.hidden) setInView(false);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [element, rootMargin]);

  return (
    <div ref={setElement} className={className} data-webgl={canvasLabel ?? id} data-active={granted}>
      {granted ? children : null}
    </div>
  );
}
