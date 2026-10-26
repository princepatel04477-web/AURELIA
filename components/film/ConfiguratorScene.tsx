'use client';

import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, MeshRefractionMaterial, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';
import { METALS, type MetalKey, useRingGeometry, useStudioEnvironment } from './useRingAsset';

type Props = {
  metal: MetalKey;
  finish: 'polished' | 'satin';
  isMobile: boolean;
  onReady: () => void;
};

/**
 * Transparent canvas, renderer tone mapping, no post stack: the ring sits on the
 * section's own ground with no visible frame.
 */
export default function ConfiguratorScene({ metal, finish, isMobile, onReady }: Props) {
  return (
    <Canvas
      dpr={isMobile ? [1, 1.5] : [1, 2]}
      camera={{ position: [0, 0.6, 7.4], fov: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <Suspense fallback={null}>
        <Turntable metal={metal} finish={finish} isMobile={isMobile} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}

function Turntable({ metal, finish, isMobile, onReady }: Props) {
  const { band, diamonds } = useRingGeometry();
  const envMap = useStudioEnvironment();
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  const spin = useRef<THREE.Group>(null);
  const targetColor = useRef(new THREE.Color(METALS[metal].color));

  useEffect(() => {
    targetColor.current.set(METALS[metal].color);
  }, [metal]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  useFrame((_, delta) => {
    const m = material.current;
    if (m) {
      // The metal changes like a reflection turning, not a swatch swap.
      m.color.lerp(targetColor.current, 1 - Math.exp(-delta * 5));
      const rough = finish === 'satin' ? 0.42 : METALS[metal].roughness;
      m.roughness = THREE.MathUtils.damp(m.roughness, rough, 5, delta);
      m.clearcoat = THREE.MathUtils.damp(m.clearcoat, finish === 'satin' ? 0 : 0.6, 5, delta);
    }
    if (spin.current) spin.current.rotation.y += delta * 0.22;
  });

  return (
    <>
      <PresentationControls
        global
        snap
        speed={1.4}
        rotation={[0.18, 0, 0]}
        polar={[-0.4, 0.5]}
        azimuth={[-Infinity, Infinity]}
      >
        <group ref={spin}>
          <mesh geometry={band}>
            <meshPhysicalMaterial
              ref={material}
              envMap={envMap}
              envMapIntensity={1.7}
              color={METALS[metal].color}
              metalness={1}
              roughness={METALS[metal].roughness}
              clearcoat={0.6}
              clearcoatRoughness={0.08}
            />
          </mesh>
          <mesh geometry={diamonds}>
            <MeshRefractionMaterial envMap={envMap} bounces={3} ior={2.4} fresnel={1} aberrationStrength={0.02} fastChroma toneMapped={false} />
          </mesh>
        </group>
      </PresentationControls>
      <ContactShadows position={[0, -1.75, 0]} opacity={0.55} scale={8} blur={2.6} far={3} color="#000000" />
    </>
  );
}
