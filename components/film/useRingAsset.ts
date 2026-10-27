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
  /** Baked ambient occlusion shipped with the model (second UV set). */
  ao: THREE.Texture | null;
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
    const sourceMaterial = bandMesh.material;
    const bakedAo =
      sourceMaterial instanceof THREE.MeshStandardMaterial ? sourceMaterial.aoMap ?? sourceMaterial.map : null;
    const ao = bakedAo ? bakedAo.clone() : null;
    if (ao) {
      // The file stores its occlusion bake as the base colour; keep the UV set the
      // loader assigned it (the first one) and read it as data, not colour.
      ao.colorSpace = THREE.NoColorSpace;
      ao.needsUpdate = true;
    }
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

    // Keep the model's authored normals — recomputing them faceted the band.
    band.applyMatrix4(normalise);
    diamonds.applyMatrix4(normalise);
    band.computeBoundingBox();
    diamonds.computeBoundingBox();

    const stoneBox = diamonds.boundingBox ?? new THREE.Box3();
    const stoneY = stoneBox.max.y - 0.32;

    return { band, diamonds, ao, stoneY, radius: 1.3 };
  }, [gltf]);
}

let microSurface: THREE.CanvasTexture | null = null;

/**
 * Micro-surface for polished metal: soft mottling plus fine hairline scratches,
 * drawn once on a canvas. Used as roughness and bump so highlights break up the
 * way they do on worn, hand-polished gold instead of a CAD-perfect mirror.
 */
export function getMicroSurface(): THREE.CanvasTexture {
  if (microSurface) return microSurface;
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const image = ctx.createImageData(size, size);
    // Low-frequency mottling: sum of a few sines + noise, centred on mid-grey.
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const v =
          0.66 +
          0.035 * Math.sin(x * 0.045 + Math.sin(y * 0.031) * 2) +
          0.03 * Math.sin(y * 0.052 + Math.cos(x * 0.027) * 2) +
          (Math.random() - 0.5) * 0.03;
        const c = Math.max(0, Math.min(255, Math.round(v * 255)));
        const i = (y * size + x) * 4;
        image.data[i] = c;
        image.data[i + 1] = c;
        image.data[i + 2] = c;
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    // Hairline scratches from polishing: mostly along one direction.
    ctx.lineCap = 'round';
    for (let i = 0; i < 420; i += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const angle = (Math.random() - 0.5) * 0.7 + (i % 7 === 0 ? Math.PI / 2 : 0);
      const length = 6 + Math.random() * 46;
      const light = Math.random() > 0.5;
      ctx.strokeStyle = light ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 0.4 + Math.random() * 0.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 8;
  microSurface = texture;
  return texture;
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
  yellow: { label: '18k Yellow Gold', color: '#f3cd7a', roughness: 0.2 },
  rose: { label: '18k Rose Gold', color: '#eab09a', roughness: 0.22 },
  white: { label: '18k White Gold', color: '#e9e9ec', roughness: 0.18 },
  platinum: { label: 'Platinum', color: '#cfd2d7', roughness: 0.26 },
} as const;

export type MetalKey = keyof typeof METALS;

useGLTF.preload(RING_URL, DRACO_PATH);
useGLTF.preload(DIAMOND_URL, DRACO_PATH);
