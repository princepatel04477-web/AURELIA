'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Bloom, DepthOfField, EffectComposer } from '@react-three/postprocessing';
import type { BloomEffect } from 'postprocessing';
import { MathUtils } from 'three';
import { getStageBloomTarget } from './CameraRig';
import { SHOTS } from './shots';
import { useCameraRig } from './CameraRigContext';

/** The bloom follows the cut, eased over 800ms — never snapped. */
const BLOOM_LERP_SECONDS = 0.8;
/** Exponential time constant that lands ~95% of the way in that window. */
const TAU = BLOOM_LERP_SECONDS / 3;

/**
 * Post stack.
 *
 * Desktop: bloom whose intensity is keyed to the shot and eased over 800ms.
 * Mobile: null — saves fill-rate and battery.
 */
export function Effects({ isMobile }: { isMobile: boolean }) {
  if (isMobile) return null;

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <BloomController />
      <DepthOfField target={[0, 0.84, 0]} focalLength={0.02} bokehScale={2.4} height={480} />
    </EffectComposer>
  );
}

/**
 * Owns the live bloom effect and drives its intensity.
 */
function BloomController() {
  const reducedMotion = useCameraRig().reducedMotion;
  const ref = useRef<BloomEffect>(null);
  const current = useRef(SHOTS.hero.bloomIntensity);

  useFrame((_, delta) => {
    const effect = ref.current;
    if (!effect) return;

    const target = getStageBloomTarget();

    if (reducedMotion) {
      current.current = target;
    } else {
      const dt = Math.min(delta, 0.05);
      const step = 1 - Math.exp(-dt / TAU);
      current.current = MathUtils.lerp(current.current, target, step);
    }

    effect.intensity = current.current;
  });

  return (
    <Bloom
      ref={ref}
      intensity={SHOTS.hero.bloomIntensity}
      luminanceThreshold={0.85}
      luminanceSmoothing={0.22}
      mipmapBlur
      radius={0.62}
      levels={7}
    />
  );
}
