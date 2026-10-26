'use client';

import { Bloom, DepthOfField, EffectComposer, Vignette } from '@react-three/postprocessing';

/**
 * Post stack.
 *
 * Desktop: bloom only above 0.85 so the gold streak survives but the black
 * ground stays black; depth of field focused on the stone; a closing vignette.
 * Mobile: vignette only — no depth of field, no bloom, no second depth pass.
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
      <Bloom
        intensity={0.62}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.22}
        mipmapBlur
        radius={0.62}
        levels={7}
      />
      <DepthOfField target={[0, 0.84, 0]} focalLength={0.02} bokehScale={2.4} height={480} />
      <Vignette offset={0.24} darkness={0.74} eskil={false} />
    </EffectComposer>
  );
}
