'use client';

import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
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
 * Reports the ring's arrival to the DOM layer.
 *
 * Mounting inside the Ring's Suspense boundary means this only runs once the
 * object (model or procedural) is actually in the scene — the dolly-in never
 * starts over an empty stage.
 */
function StageReady() {
  const markStageReady = useCameraRig().markStageReady;

  useEffect(() => {
    markStageReady();
  }, [markStageReady]);

  return null;
}
