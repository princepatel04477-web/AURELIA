'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import type { Group } from 'three';

const SWEEP_SECONDS = 6;

/**
 * The one light that moves.
 *
 * A narrow soft box orbits the ring once every six seconds. As it passes the
 * band, a gold streak travels across the metal — this is the only animated
 * light in the scene, and it never touches the ring's own material.
 */
function SweepingSoftbox({ still }: { still: boolean }) {
  const group = useRef<Group>(null);

  useFrame((state) => {
    const node = group.current;
    if (!node || still) return;

    const phase = ((state.clock.elapsedTime % SWEEP_SECONDS) / SWEEP_SECONDS) * Math.PI * 2;
    node.position.set(Math.sin(phase) * 3.3, 1.55 + Math.cos(phase * 0.5) * 0.45, Math.cos(phase) * 2.5 + 0.7);
  });

  return (
    <group ref={group} position={[3.3, 1.55, 0.7]}>
      <Lightformer form="rect" intensity={3.0} color="#FFF1CE" scale={[0.5, 3.6, 1]} target={[0, 0.3, 0]} />
    </group>
  );
}

type StudioEnvironmentProps = {
  isMobile: boolean;
  reducedMotion: boolean;
};

/**
 * drei Environment built from Lightformers — no HDRI file, no network.
 * Two large soft boxes give the metal its long highlights; a ring light in
 * front draws the round catchlight a brilliant cut always has.
 */
export function StudioEnvironment({ isMobile, reducedMotion }: StudioEnvironmentProps) {
  return (
    <Environment resolution={isMobile ? 128 : 256} frames={isMobile || reducedMotion ? 1 : Infinity}>
      

      {/* Key softbox — camera left, high, warm. */}
      <Lightformer form="rect" intensity={2.2} color="#FFF8EB" scale={[5, 7, 1]} position={[-5, 3, -2.5]} target={[0, 0.4, 0]} />
      {/* Fill softbox — camera right, cooler and softer. */}
      <Lightformer form="rect" intensity={1.4} color="#F5E8D0" scale={[4, 6, 1]} position={[5, 2, -2]} target={[0, 0.4, 0]} />
      {/* Ring light — front, tight, reads as the catchlight in the stone. */}
      <Lightformer form="ring" intensity={2.8} color="#FFFFFF" scale={2.6} position={[0, 2.3, 3.2]} target={[0, 0.5, 0]} />
      {/* Floor bounce — keeps the lower band from going dead black. */}
      <Lightformer form="rect" intensity={0.65} color="#E0C285" scale={[12, 12, 1]} position={[0, -4, 0]} rotation={[Math.PI / 2, 0, 0]} />

      <SweepingSoftbox still={reducedMotion} />
    </Environment>
  );
}
