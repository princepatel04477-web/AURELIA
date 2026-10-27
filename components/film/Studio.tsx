'use client';

import { useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { Bloom, DepthOfField, EffectComposer, Noise, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import type * as THREE from 'three';

/**
 * A jewellery photographer's studio, baked once into the environment map.
 *
 * Jewellery reads as "real" because of what it reflects: long strip softboxes
 * that lay clean white lines along the band, a broad overhead box, a ring
 * light that puts the catchlight in the stone, and a thin rim from behind.
 */
export function StudioEnvironment({ isMobile }: { isMobile: boolean }) {
  return (
    // No HDRI fill: a real jewellery set is black with a few hard light sources,
    // which is what gives polished gold its dark reflections and crisp white lines.
    <Environment resolution={isMobile ? 256 : 512} frames={1} environmentIntensity={1}>
      <color attach="background" args={['#14110d']} />
      {/* Big white card behind the camera — the bright face reflection photographers bounce in. */}
      <Lightformer form="rect" intensity={1.6} color="#fff7ea" scale={[12, 6, 1]} position={[0, 1, 8]} target={[0, 0, 0]} />
      {/* Strip softboxes, left and right — the long highlights on the shank. */}
      <Lightformer form="rect" intensity={5} color="#fff6e8" scale={[0.8, 10, 1]} position={[-4.2, 1, 1.4]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={3.5} color="#fff2dc" scale={[0.6, 10, 1]} position={[4.4, 0.6, 1]} target={[0, 0, 0]} />
      {/* Overhead box — the soft top light on the setting. */}
      <Lightformer form="rect" intensity={1.6} color="#ffffff" scale={[8, 3, 1]} position={[0, 6, 0.5]} rotation={[Math.PI / 2, 0, 0]} />
      {/* Ring light, camera side — the catchlight in the centre stone. */}
      <Lightformer form="ring" intensity={4} color="#ffffff" scale={1.6} position={[0.6, 2.2, 5]} target={[0, 0, 0]} />
      {/* Rim strip from behind — separates the metal from the black ground. */}
      <Lightformer form="rect" intensity={3} color="#ffe7bd" scale={[9, 0.3, 1]} position={[0, 0.4, -6]} target={[0, 0, 0]} />
      {/* Warm bounce cards low left and right — keeps the dark side of the band gold, not grey. */}
      <Lightformer form="rect" intensity={0.5} color="#c9a061" scale={[5, 2, 1]} position={[-5, -3, 2]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={0.4} color="#c9a061" scale={[5, 2, 1]} position={[5, -3, -2]} target={[0, 0, 0]} />
    </Environment>
  );
}

/**
 * The baked studio as a texture, once `<StudioEnvironment>` has rendered it.
 * The refraction material needs the map handed to it explicitly.
 */
export function useBakedEnvironment(): THREE.Texture | null {
  const scene = useThree((s) => s.scene);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  useFrame(() => {
    if (!texture && scene.environment) setTexture(scene.environment);
  });
  return texture;
}

/**
 * The lens. AgX tone mapping keeps gold yellow instead of the orange-plastic
 * look ACES gives it; bloom turns the diamonds' fire into glints; a touch of
 * grain and vignette makes it a photograph. Desktop adds shallow depth of
 * field; phones get SMAA instead of multisampling.
 */
export function Lens({ isMobile, focus }: { isMobile: boolean; focus?: [number, number, number] }) {
  if (isMobile) {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom luminanceThreshold={1.15} luminanceSmoothing={0.15} intensity={0.5} levels={4} mipmapBlur />
        <ToneMapping mode={ToneMappingMode.AGX} />
        <SMAA />
        <Vignette offset={0.3} darkness={0.65} eskil={false} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      {/* Wide in-focus range: the ring stays crisp, only the dust and loose stones fall soft. */}
      <DepthOfField target={focus ?? [0, 0, 0]} focalLength={0.16} bokehScale={1.6} height={540} />
      <Bloom luminanceThreshold={1.15} luminanceSmoothing={0.15} intensity={0.65} levels={6} mipmapBlur />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.32} />
      <Vignette offset={0.28} darkness={0.7} eskil={false} />
    </EffectComposer>
  );
}
