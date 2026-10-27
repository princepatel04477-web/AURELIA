'use client';

import { MeshRefractionMaterial } from '@react-three/drei';
import type * as THREE from 'three';

type StoneMaterialProps = {
  envMap: THREE.Texture;
  /** Phones: fewer internal bounces and softer dispersion — still real refraction. */
  lite: boolean;
  bounces?: number;
};

/**
 * Diamond: true refraction — rays bounce inside the stone's facets (BVH),
 * with chromatic dispersion for fire. Phones keep the same shader with two
 * bounces; the frame-rate monitor in the canvas trims resolution if needed.
 */
export function StoneMaterial({ envMap, lite, bounces = 3 }: StoneMaterialProps) {
  return (
    <MeshRefractionMaterial
      envMap={envMap}
      bounces={lite ? Math.min(2, bounces) : bounces}
      ior={2.42}
      fresnel={1}
      aberrationStrength={lite ? 0.004 : 0.006}
      // Full three-channel dispersion on desktop (fast mode left a red streak in the table).
      fastChroma={lite}
      toneMapped={false}
    />
  );
}
