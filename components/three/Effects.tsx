'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Bloom, DepthOfField, EffectComposer, Vignette } from '@react-three/postprocessing';
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
 * Desktop: bloom whose intensity is keyed to the shot (hero 0.6, stone 0.8,
 * fire 1.2, hand 0.7, collection 0.4, finale 1.1) and eased over 800ms, so the
 * light lifts into THE FIRE and settles at the finale; threshold stays at 0.85
 * so the gold streak survives while the black ground stays black. Depth of
 * field on the stone, then a closing vignette.
 *
 * Mobile: vignette only — no bloom, no depth of field, no second depth pass.
 */
export function Effects({ isMobile }: { isMobile: boolean }) {
  if (isMobile) {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Vignette offset={0.26} darkness={0.78} eskil={false} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <BloomController />
      <DepthOfField target={[0, 0.84, 0]} focalLength={0.02} bokehScale={2.4} height={480} />
      <Vignette offset={0.24} darkness={0.74} eskil={false} />
    </EffectComposer>
  );
}

/**
 * Owns the live bloom effect and drives its intensity.
 *
 * The shot target is published by the camera rig each frame; this damps
 * towards it, so a shot change reads as the lens opening rather than a switch.
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
