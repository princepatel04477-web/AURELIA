'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { INTRO_DOLLY_MS, INTRO_FALLBACK_MS, type CameraShot } from './shots';

export type PointerState = {
  /** −1 … 1, left to right. */
  x: number;
  /** −1 … 1, top to bottom. */
  y: number;
};

/**
 * Typed camera-rig context.
 *
 * The stage owns the camera; the page only names a shot. Everything the DOM
 * needs in order to stay in sync with the 3D layer (intro state, settle state,
 * pointer vector) lives here, so no section ever reaches into three.js directly.
 */
export type CameraRigValue = {
  /** Shot the rig is currently easing towards. */
  shot: CameraShot;
  /** Move the rig to a named shot. */
  goTo: (shot: CameraShot) => void;
  /**
   * True once the film has started: the frame is open *and* the ring exists.
   * The 3s dolly-in runs from this moment, never over an empty stage.
   */
  introComplete: boolean;
  /** True once the stage has rendered its first real frame (ring in place). */
  stageReady: boolean;
  /** False when the browser has no WebGL2 at all — the plate carries the film. */
  webglAvailable: boolean;
  /** True after `webglcontextlost`: the canvas has been replaced by a plate. */
  contextLost: boolean;
  /** True once the ring has settled in the hero shot. */
  settled: boolean;
  /** Mirrors prefers-reduced-motion for DOM choreography. */
  reducedMotion: boolean;
  /** Normalised pointer, read per frame by the rig — never triggers a render. */
  pointer: RefObject<PointerState>;
  /** Called by the rig when the dolly lands. */
  markSettled: () => void;
  /** Called from inside the canvas on its first rendered frame. */
  markStageReady: () => void;
  /** Called by the capability probe: no WebGL2 on this device. */
  markWebglUnavailable: () => void;
  /** Called by the canvas when its context is lost. */
  markContextLost: () => void;
  /** Called with every `webglcontextrestored`. */
  markContextRestored: () => void;
};

const FALLBACK: CameraRigValue = {
  shot: 'hero',
  goTo: () => undefined,
  introComplete: false,
  stageReady: false,
  webglAvailable: true,
  contextLost: false,
  settled: false,
  reducedMotion: true,
  pointer: { current: { x: 0, y: 0 } },
  markSettled: () => undefined,
  markStageReady: () => undefined,
  markWebglUnavailable: () => undefined,
  markContextLost: () => undefined,
  markContextRestored: () => undefined,
};

const CameraRigContext = createContext<CameraRigValue>(FALLBACK);

export function CameraRigProvider({
  value,
  children,
}: {
  value: CameraRigValue;
  children: ReactNode;
}) {
  return <CameraRigContext.Provider value={value}>{children}</CameraRigContext.Provider>;
}

/** Never throws: a section may render before the canvas has mounted. */
export function useCameraRig(): CameraRigValue {
  return useContext(CameraRigContext);
}

/**
 * Owns the film's clock.
 *
 * The intro never waits on WebGL:
 *
 *   introComplete = frame open AND ( first Stage frame
 *                                    OR INTRO_FALLBACK_MS after the preloader exits
 *                                    OR WebGL unavailable )
 *
 * Whichever lands first releases the 3s dolly — or, with no stage at all, the
 * type choreography runs over the plate. Nothing here logs.
 */
export function useCameraRigStore(): CameraRigValue {
  const reducedMotion = useReducedMotion();
  const [shot, setShot] = useState<CameraShot>('hero');
  const [frameOpen, setFrameOpen] = useState(false);
  const [stageReady, setStageReady] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState(true);
  const [contextLost, setContextLost] = useState(false);
  const [fallbackElapsed, setFallbackElapsed] = useState(false);
  const [settled, setSettled] = useState(false);
  const pointer = useRef<PointerState>({ x: 0, y: 0 });

  // The intro the DOM controls: the frame opens, then it hands over to the rig.
  useEffect(() => {
    if (reducedMotion) {
      setFrameOpen(true);
      return undefined;
    }
    const timer = window.setTimeout(() => setFrameOpen(true), 340);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  // The clock starts when the preloader begins to exit, not on hydration.
  useEffect(() => {
    if (!frameOpen || stageReady || fallbackElapsed || reducedMotion) return undefined;
    const timer = window.setTimeout(() => setFallbackElapsed(true), INTRO_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [frameOpen, stageReady, fallbackElapsed, reducedMotion]);

  const introComplete =
    frameOpen && (stageReady || fallbackElapsed || !webglAvailable || reducedMotion);

  // Pointer parallax source. Passive, allocation-free, never re-renders.
  useEffect(() => {
    if (reducedMotion) return undefined;

    const onPointerMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = (event.clientY / window.innerHeight) * 2 - 1;
      pointer.current = { x, y };
    };
    const onLeave = () => {
      pointer.current = { x: 0, y: 0 };
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, [reducedMotion]);

  // Fail-safe: if the canvas never reports back, the type still arrives.
  useEffect(() => {
    if (!introComplete || settled || reducedMotion) return undefined;
    const timer = window.setTimeout(() => setSettled(true), INTRO_DOLLY_MS + 2200);
    return () => window.clearTimeout(timer);
  }, [introComplete, settled, reducedMotion]);

  // No canvas (or a dead one): there is no dolly to wait for, so the type is
  // released on a short beat instead of the full fail-safe.
  useEffect(() => {
    if (settled || reducedMotion) return undefined;
    if (webglAvailable && !contextLost) return undefined;
    const timer = window.setTimeout(() => setSettled(true), 900);
    return () => window.clearTimeout(timer);
  }, [webglAvailable, contextLost, settled, reducedMotion]);

  // Reduced motion: no dolly, no reveal choreography — a finished still.
  useEffect(() => {
    if (reducedMotion) setSettled(true);
  }, [reducedMotion]);

  const goTo = useCallback((next: CameraShot) => setShot(next), []);
  const markSettled = useCallback(() => setSettled(true), []);
  const markStageReady = useCallback(() => setStageReady(true), []);
  const markWebglUnavailable = useCallback(() => {
    setWebglAvailable(false);
    setStageReady(false);
  }, []);
  const markContextLost = useCallback(() => setContextLost(true), []);
  const markContextRestored = useCallback(() => setContextLost(false), []);

  return useMemo(
    () => ({
      shot,
      goTo,
      introComplete,
      stageReady,
      webglAvailable,
      contextLost,
      settled,
      reducedMotion,
      pointer,
      markSettled,
      markStageReady,
      markWebglUnavailable,
      markContextLost,
      markContextRestored,
    }),
    [
      shot,
      goTo,
      introComplete,
      stageReady,
      webglAvailable,
      contextLost,
      settled,
      reducedMotion,
      markSettled,
      markStageReady,
      markWebglUnavailable,
      markContextLost,
      markContextRestored,
    ]
  );
}
