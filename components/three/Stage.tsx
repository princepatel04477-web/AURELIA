'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useCameraRig } from './CameraRigContext';
import { useAnimatingCanvasSlot } from './canvasPolicy';
import { useViewportTier } from './useViewportTier';
import { INTRO_SHOT } from './shots';
import { CameraRig } from './CameraRig';
import { Ring } from './Ring';
import { StudioEnvironment } from './StudioEnvironment';
import { Effects } from './Effects';

/**
 * Persistent stage.
 *
 * One canvas for the whole home page, fixed behind the type. The camera is
 * driven by named shots; the ring never moves on its own.
 *
 * Perf gates:
 *   • one of the two animating WebGL slots (see `canvasPolicy.ts`)
 *   • `frameloop` stays at `demand` until the intro starts, then drops back to
 *     `demand` when the hero is scrolled out of frame or the tab is hidden —
 *     the ring keeps its context but burns no frames
 *   • `webglcontextlost` is reported to the rig, which swaps in a still plate.
 *     Nothing is restored automatically: a dead context is a still frame.
 */
export default function Stage() {
  const { isMobile } = useViewportTier();
  const rig = useCameraRig();
  const hasSlot = useAnimatingCanvasSlot('stage');
  const [awake, setAwake] = useState(true);

  useEffect(() => {
    const sync = () => {
      const pastHero = window.scrollY > window.innerHeight * 1.4;
      setAwake(!pastHero && !document.hidden);
    };

    sync();
    window.addEventListener('scroll', sync, { passive: true });
    document.addEventListener('visibilitychange', sync);

    return () => {
      window.removeEventListener('scroll', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  if (!hasSlot) return null;

  return (
    <Canvas
      dpr={isMobile ? [1, 1.5] : [1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: INTRO_SHOT.position, fov: INTRO_SHOT.fov, near: 0.1, far: 80 }}
      frameloop={!rig.introComplete || rig.reducedMotion ? 'demand' : awake ? 'always' : 'demand'}
      style={{ pointerEvents: 'none', background: 'transparent' }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.05;

        const canvas = gl.domElement;
        const onLost = () => {
          rig.markContextLost();
        };
        const onRestored = () => {
          rig.markContextRestored();
        };

        canvas.addEventListener('webglcontextlost', onLost);
        canvas.addEventListener('webglcontextrestored', onRestored);

        // React Three Fiber owns the canvas for the life of the stage; these
        // listeners die with the element, so no manual teardown is needed here.
      }}
    >
      <CameraRig />

      <ambientLight intensity={0.05} />
      <spotLight
        position={[2.6, 4.4, 2.8]}
        angle={0.62}
        penumbra={1}
        intensity={14}
        color="#FFF3DC"
        distance={16}
      />

      <Suspense fallback={null}>
        <StudioEnvironment isMobile={isMobile} reducedMotion={rig.reducedMotion} />
      </Suspense>

      <Suspense fallback={null}>
        <Ring isMobile={isMobile} />
        <StageReady />
      </Suspense>

      <Effects isMobile={isMobile} />
    </Canvas>
  );
}

/**
 * Reports the first *rendered* frame to the DOM layer.
 *
 * It sits inside the Ring's Suspense boundary, so it only starts counting once
 * the object (model or procedural) is in the scene — and it reports from
 * `useFrame`, i.e. after the frame that actually contains the ring. The dolly-in
 * never starts over an empty stage, and never waits longer than the fallback.
 */
function StageReady() {
  const markStageReady = useCameraRig().markStageReady;
  const invalidate = useThree((state) => state.invalidate);
  const reported = useRef(false);

  // The stage runs at `demand` until the intro starts, so ask for a frame
  // explicitly — otherwise nothing would ever be rendered to report.
  useEffect(() => {
    let frames = 0;
    let raf = 0;
    const pump = () => {
      invalidate();
      frames += 1;
      if (frames < 8 && !reported.current) raf = requestAnimationFrame(pump);
    };
    pump();
    return () => cancelAnimationFrame(raf);
  }, [invalidate]);

  useFrame(() => {
    if (reported.current) return;
    reported.current = true;
    markStageReady();
  });

  return null;
}
