'use client';

import { MeshRefractionMaterial } from '@react-three/drei';
import type * as THREE from 'three';

type StoneMaterialProps = {
  envMap: THREE.Texture;
  /** Phones get the cheap stone: no per-pixel ray bounces. */
  lite: boolean;
  bounces?: number;
};

/**
 * Diamond surface.
 *
 * Desktop: true refraction (BVH ray bounces inside the stone, chromatic fire).
 * Mobile: a mirror-polished environment reflection. At phone size the stones
 * read the same, and it costs a fraction of the fragment work — the refraction
 * shader was the single largest cost in the film on a phone GPU.
 */
export function StoneMaterial({ envMap, lite, bounces = 3 }: StoneMaterialProps) {
  if (lite) {
    return (
      <meshStandardMaterial
        envMap={envMap}
        envMapIntensity={5}
        color="#ffffff"
        emissive="#d9e2ef"
        emissiveIntensity={0.32}
        metalness={1}
        roughness={0}
        toneMapped={false}
      />
    );
  }

  return (
    <MeshRefractionMaterial
      envMap={envMap}
      bounces={bounces}
      ior={2.4}
      fresnel={1}
      aberrationStrength={0.02}
      fastChroma
      toneMapped={false}
    />
  );
}
