'use client';

import { useMemo } from 'react';
import { useEnvironment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export const RING_URL = '/models/ring.glb';
export const DIAMOND_URL = '/models/diamond.glb';
export const HDRI_URL = '/hdri/studio.hdr';
const DRACO_PATH = '/draco/';

type RingNodes = {
  band: THREE.BufferGeometry;
  diamonds: THREE.BufferGeometry;
};

/**
 * The halo ring, normalised once:
 * - stood upright (the file lies flat, stone towards +Z),
 * - centred on the origin,
 * - scaled so the band is 2.6 units across.
 *
 * Both geometries share one transform, so the stones stay seated.
 */
export function useRingGeometry(): RingNodes & { stoneY: number; radius: number } {
  const gltf = useGLTF(RING_URL, DRACO_PATH);

  return useMemo(() => {
    const meshes: THREE.Mesh[] = [];
    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) meshes.push(child);
    });

    const diamondMesh = meshes.find((mesh) => mesh.name.toLowerCase().includes('diamond')) ?? meshes[0];
    const bandMesh = meshes.find((mesh) => mesh !== diamondMesh) ?? meshes[0];

    const band = bandMesh.geometry.clone();
    const diamonds = diamondMesh.geometry.clone();

    const upright = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
    band.applyMatrix4(upright);
    diamonds.applyMatrix4(upright);

    band.computeBoundingBox();
    const box = band.boundingBox ?? new THREE.Box3();
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const scale = 2.6 / Math.max(size.x, 0.0001);

    const normalise = new THREE.Matrix4()
      .makeScale(scale, scale, scale)
      .multiply(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));

    band.applyMatrix4(normalise);
    diamonds.applyMatrix4(normalise);
    band.computeVertexNormals();
    band.computeBoundingBox();
    diamonds.computeBoundingBox();

    const stoneBox = diamonds.boundingBox ?? new THREE.Box3();
    const stoneY = stoneBox.max.y - 0.32;

    return { band, diamonds, stoneY, radius: 1.3 };
  }, [gltf]);
}

export function useStudioEnvironment(): THREE.Texture {
  const texture = useEnvironment({ files: HDRI_URL });
  return texture as THREE.Texture;
}

export function useLooseDiamond(): THREE.BufferGeometry {
  const gltf = useGLTF(DIAMOND_URL, DRACO_PATH);
  return useMemo(() => {
    gltf.scene.updateMatrixWorld(true);
    const meshes: THREE.Mesh[] = [];
    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) meshes.push(child);
    });
    const first = meshes[0];
    const result: THREE.BufferGeometry = first
      ? first.geometry.clone().applyMatrix4(first.matrixWorld)
      : new THREE.OctahedronGeometry(1, 0);
    result.center();
    result.computeBoundingBox();
    const size = result.boundingBox?.getSize(new THREE.Vector3()) ?? new THREE.Vector3(1, 1, 1);
    const s = 1 / Math.max(size.x, size.y, size.z, 0.0001);
    result.scale(s, s, s);
    return result;
  }, [gltf]);
}

/** Metal finishes, shared by the film and the configurator. */
export const METALS = {
  yellow: { label: '18k Yellow Gold', color: '#e8c070', roughness: 0.14 },
  rose: { label: '18k Rose Gold', color: '#e7a58d', roughness: 0.16 },
  white: { label: '18k White Gold', color: '#e6e6e9', roughness: 0.12 },
  platinum: { label: 'Platinum', color: '#c9ccd1', roughness: 0.2 },
} as const;

export type MetalKey = keyof typeof METALS;

useGLTF.preload(RING_URL, DRACO_PATH);
useGLTF.preload(DIAMOND_URL, DRACO_PATH);
