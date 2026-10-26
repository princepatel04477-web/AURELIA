'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useGLTF, MeshTransmissionMaterial } from '@react-three/drei';
import { Box3, Group, Mesh, MeshPhysicalMaterial, Vector3 } from 'three';
import {
  createBrilliantGeometry,
  createComfortBandGeometry,
  createProngGeometry,
  PRONG_ANGLES,
  STONE,
} from './ringGeometry';
import { MODELS } from '@/lib/assets';

/** A real model always wins; the procedural solitaire is the stand-in. */
const MODEL_PATH = MODELS.ring;

type RingProps = {
  isMobile: boolean;
};

export function Ring({ isMobile }: RingProps) {
  const presence = useRingModelPresence();

  if (presence === 'present') {
    return (
      <Suspense fallback={<ProceduralRing isMobile={isMobile} />}>
        <ModelRing />
      </Suspense>
    );
  }

  return <ProceduralRing isMobile={isMobile} />;
}

/**
 * Gold, and only gold.
 * Metalness 1 / roughness 0.12 with a clearcoat: the band is polished, but not
 * a mirror — the soft boxes should read as long bands of light, not hot spots.
 */
function GoldMaterial() {
  return (
    <meshPhysicalMaterial
      color="#E6C574"
      metalness={1}
      roughness={0.12}
      clearcoat={1}
      clearcoatRoughness={0.06}
      envMapIntensity={1.45}
    />
  );
}

/**
 * The procedural solitaire.
 *
 * Comfort-fit lathe band, four tapered prongs, and a faceted brilliant held in
 * transmission. The group is tilted a few degrees so the composition reads as a
 * photograph rather than a product turntable.
 */
function ProceduralRing({ isMobile }: RingProps) {
  const band = useMemo(createComfortBandGeometry, []);
  const prong = useMemo(createProngGeometry, []);
  const stone = useMemo(createBrilliantGeometry, []);

  useEffect(
    () => () => {
      band.dispose();
      prong.dispose();
      stone.dispose();
    },
    [band, prong, stone]
  );

  return (
    <group position={[0, 0.05, 0]} rotation={[0.06, -0.42, -0.035]}>
      {/* The lathe is built around Y; a ring is worn around the finger, so the
          band stands up — axis along Z, its crown at y = +0.655. */}
      <mesh geometry={band} rotation={[Math.PI / 2, 0, 0]}>
        <GoldMaterial />
      </mesh>

      {/* Gallery: a thin gold collar that seats the four prongs. */}
      <mesh position={[0, 0.735, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.276, 0.013, 8, 64]} />
        <GoldMaterial />
      </mesh>

      {PRONG_ANGLES.map((angle) => {
        const radius = STONE.girdleRadius - 0.012;
        return (
          <group
            key={angle}
            position={[Math.cos(angle) * radius, 0.56, Math.sin(angle) * radius]}
            rotation={[0, -angle, 0]}
          >
            <mesh geometry={prong} scale={[0.03, 0.3, 0.03]} rotation={[0, 0, 0.1]}>
              <GoldMaterial />
            </mesh>
          </group>
        );
      })}

      <mesh geometry={stone} position={[0, STONE.girdleY, 0]}>
        <MeshTransmissionMaterial
          ior={2.42}
          chromaticAberration={0.08}
          samples={isMobile ? 3 : 6}
          transmission={1}
          thickness={0.42}
          roughness={0.02}
          anisotropy={0.12}
          distortion={0.04}
          distortionScale={0.28}
          temporalDistortion={isMobile ? 0 : 0.015}
          attenuationColor="#F3EEE4"
          attenuationDistance={1.8}
          resolution={isMobile ? 256 : 512}
          background={undefined}
        />
      </mesh>
    </group>
  );
}

/** Loads the delivered GLB, normalises it to the stage's scale, and lights it. */
function ModelRing() {
  const { scene } = useGLTF(MODEL_PATH);

  const normalised = useMemo(() => {
    const group = new Group();
    const model = scene.clone(true);

    const bounds = new Box3().setFromObject(model);
    const size = new Vector3();
    const centre = new Vector3();
    bounds.getSize(size);
    bounds.getCenter(centre);

    const scale = 0.95 / (size.y || 1);
    model.scale.setScalar(scale);
    model.position.set(-centre.x * scale, -centre.y * scale, -centre.z * scale);

    model.traverse((child) => {
      if (child instanceof Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (material instanceof MeshPhysicalMaterial) {
            material.envMapIntensity = 1.45;
            material.needsUpdate = true;
          }
        });
      }
    });

    group.add(model);
    group.position.set(0, 0.05, 0);
    group.rotation.set(0.06, -0.42, -0.035);
    return group;
  }, [scene]);

  return <primitive object={normalised} />;
}

type ModelPresence = 'checking' | 'present' | 'absent';

/**
 * HEAD request against the model path. The stage never blocks on it: until the
 * answer arrives the procedural ring is already on screen.
 */
function useRingModelPresence(): ModelPresence {
  const [presence, setPresence] = useState<ModelPresence>('checking');

  useEffect(() => {
    let cancelled = false;

    fetch(MODEL_PATH, { method: 'HEAD' })
      .then((response) => {
        if (!cancelled) setPresence(response.ok ? 'present' : 'absent');
      })
      .catch(() => {
        if (!cancelled) setPresence('absent');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return presence;
}
