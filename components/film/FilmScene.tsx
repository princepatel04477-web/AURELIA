'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MeshRefractionMaterial } from '@react-three/drei';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { GoldDust } from './GoldDust';
import { Sparks } from './Sparks';
import { beatWeight, BEATS, film, smoothstep } from './filmStore';
import { METALS, useLooseDiamond, useRingGeometry, useStudioEnvironment } from './useRingAsset';

type Shot = {
  at: number;
  camera: [number, number, number];
  target: [number, number, number];
  /** Ring yaw (radians) and pitch. */
  yaw: number;
  pitch: number;
  /** Horizontal offset of the ring, so it sits opposite the copy. */
  shift: number;
};

const ASSEMBLE_SECONDS = 3.4;

/**
 * One take, five shots. Film progress picks the two shots either side and
 * eases between them; the camera then damps toward that, so a fast scroll
 * still reads as a dolly, never a cut.
 */
function useShots(stoneY: number): Shot[] {
  return useMemo(
    () => [
      { at: 0, camera: [0, 0.2, 10.2], target: [0, 0.32, 0], yaw: 0, pitch: 0.12, shift: 0 },
      { at: BEATS.stone.peak, camera: [0.2, stoneY + 0.75, 3.1], target: [0, stoneY - 0.1, 0], yaw: 0, pitch: 0.42, shift: 0.95 },
      { at: BEATS.fire.peak, camera: [-6.4, 0.45, 6.8], target: [0, 0, 0], yaw: Math.PI * 0.5, pitch: 0.05, shift: -1.35 },
      { at: BEATS.hand.peak, camera: [5.2, -0.7, 6.6], target: [0, 0.05, 0], yaw: Math.PI * 1.22, pitch: -0.18, shift: 1.4 },
      { at: 1, camera: [0, 0.4, 11.2], target: [0, -0.35, 0], yaw: Math.PI * 2, pitch: 0.16, shift: 0 },
    ],
    [stoneY]
  );
}

function sampleShots(shots: Shot[], progress: number) {
  let i = 0;
  while (i < shots.length - 2 && progress > shots[i + 1].at) i += 1;
  const a = shots[i];
  const b = shots[i + 1];
  const t = smoothstep(a.at, b.at, progress);
  const lerp3 = (x: [number, number, number], y: [number, number, number]) =>
    new THREE.Vector3(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
  return {
    camera: lerp3(a.camera, b.camera),
    target: lerp3(a.target, b.target),
    yaw: a.yaw + (b.yaw - a.yaw) * t,
    pitch: a.pitch + (b.pitch - a.pitch) * t,
    shift: a.shift + (b.shift - a.shift) * t,
  };
}

type FilmSceneProps = {
  isMobile: boolean;
  reducedMotion: boolean;
};

export function FilmScene({ isMobile, reducedMotion }: FilmSceneProps) {
  const { band, diamonds, stoneY } = useRingGeometry();
  const envMap = useStudioEnvironment();
  const shots = useShots(stoneY);

  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  const ringGroup = useRef<THREE.Group>(null);
  const bandMaterial = useRef<THREE.MeshPhysicalMaterial>(null);
  const diamondMesh = useRef<THREE.Mesh>(null);
  const lookAt = useRef(new THREE.Vector3(0, 0.1, 0));
  const assembleStart = useRef<number | null>(null);
  const idleYaw = useRef(0);

  useEffect(() => {
    scene.environment = envMap;
    scene.background = new THREE.Color('#0a0907');
    scene.environmentIntensity = 1;
    film.markLoaded();
    return () => {
      scene.environment = null;
    };
  }, [scene, envMap]);

  useFrame((state, delta) => {
    const f = film.get();
    const dt = Math.min(delta, 1 / 20);

    // --- Assembly: time-based, starts the first frame we are on screen. ---
    if (assembleStart.current === null) assembleStart.current = state.clock.elapsedTime;
    const raw = reducedMotion ? 1 : (state.clock.elapsedTime - assembleStart.current) / ASSEMBLE_SECONDS;
    const assemble = Math.min(1, raw);
    film.setAssemble(assemble);
    if (assemble >= 0.92) film.markAssembled();

    const metalIn = smoothstep(0.7, 1, assemble);
    const stonesIn = smoothstep(0.88, 1, assemble);

    // --- Shot ---
    const shot = sampleShots(shots, f.progress);
    const damp = 1 - Math.exp(-dt * 3.2);
    camera.position.lerp(
      shot.camera.clone().add(new THREE.Vector3(f.pointerX * 0.35, f.pointerY * 0.2, 0)),
      damp
    );
    lookAt.current.lerp(shot.target, damp);
    camera.lookAt(lookAt.current);

    // --- Ring ---
    const group = ringGroup.current;
    if (group) {
      if (!reducedMotion) idleYaw.current += dt * 0.12 * (1 - beatWeight('stone', f.progress));
      const yaw = shot.yaw + idleYaw.current + f.pointerX * 0.25;
      const pitch = shot.pitch - f.pointerY * 0.12;
      group.rotation.y = THREE.MathUtils.damp(group.rotation.y, yaw, 4, dt);
      group.rotation.x = THREE.MathUtils.damp(group.rotation.x, pitch, 4, dt);
      group.position.x = THREE.MathUtils.damp(group.position.x, isMobile ? 0 : shot.shift, 3, dt);
      group.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.04;
    }

    // --- Metal: heat for THE FIRE, then cools back to gold ---
    const m = bandMaterial.current;
    if (m) {
      const heat = beatWeight('fire', f.progress);
      m.opacity = metalIn;
      m.transparent = metalIn < 1;
      m.depthWrite = metalIn > 0.5;
      m.emissive.setRGB(1, 0.32 * (1 - heat * 0.4), 0.06);
      m.emissiveIntensity = heat * 1.35;
      m.roughness = METALS.yellow.roughness + heat * 0.18;
    }

    // Stones are seated last, the moment the dust has settled.
    if (diamondMesh.current) diamondMesh.current.visible = stonesIn > 0.35;

    // --- THE HAND: the studio turns, so a highlight polishes along the band ---
    const polish = beatWeight('hand', f.progress);
    scene.environmentRotation.y = f.progress * Math.PI * 1.4 + polish * Math.PI * 0.6;
    scene.environmentIntensity = 0.9 + polish * 0.5 + beatWeight('stone', f.progress) * 0.25;
  });

  return (
    <>
      <group ref={ringGroup}>
        <mesh geometry={band} castShadow>
          <meshPhysicalMaterial
            ref={bandMaterial}
            color={METALS.yellow.color}
            metalness={1}
            roughness={METALS.yellow.roughness}
            clearcoat={0.6}
            clearcoatRoughness={0.08}
            envMapIntensity={1.6}
            transparent
            opacity={0}
          />
        </mesh>
        <mesh ref={diamondMesh} geometry={diamonds} visible={false}>
          <MeshRefractionMaterial
            envMap={envMap}
            bounces={isMobile ? 2 : 3}
            ior={2.4}
            fresnel={1}
            aberrationStrength={isMobile ? 0.01 : 0.02}
            fastChroma
            toneMapped={false}
          />
        </mesh>
        <GoldDust geometries={[band, diamonds]} count={isMobile ? 4500 : 11000} />
      </group>

      <Sparks count={isMobile ? 260 : 700} />
      <LooseDiamonds envMap={envMap} count={isMobile ? 5 : 9} />
      <AmbientDust count={isMobile ? 220 : 520} />

      {isMobile ? null : (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom luminanceThreshold={0.95} intensity={0.9} levels={8} mipmapBlur />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette offset={0.28} darkness={0.72} eskil={false} />
        </EffectComposer>
      )}
    </>
  );
}

/** Loose stones that drift in around THE STONE, then leave. */
function LooseDiamonds({ envMap, count }: { envMap: THREE.Texture; count: number }) {
  const geometry = useLooseDiamond();
  const group = useRef<THREE.Group>(null);

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        return {
          base: new THREE.Vector3(Math.cos(a) * (2.2 + (i % 3) * 0.7), 0.6 + Math.sin(a * 2) * 1.2, Math.sin(a) * 1.6 - 0.6),
          size: 0.16 + ((i * 37) % 10) / 60,
          spin: 0.2 + ((i * 13) % 7) / 10,
          phase: i * 1.7,
        };
      }),
    [count]
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const w = beatWeight('stone', film.get().progress);
    g.visible = w > 0.01;
    g.children.forEach((child, i) => {
      const seed = seeds[i];
      if (!seed) return;
      const t = state.clock.elapsedTime;
      child.position.set(
        seed.base.x,
        seed.base.y + Math.sin(t * 0.5 + seed.phase) * 0.25 + (1 - w) * -2.5,
        seed.base.z
      );
      child.rotation.set(t * seed.spin * 0.6, t * seed.spin, 0.3);
      child.scale.setScalar(seed.size * w);
    });
  });

  return (
    <group ref={group} visible={false}>
      {seeds.map((seed) => (
        <mesh key={seed.phase} geometry={geometry}>
          <MeshRefractionMaterial envMap={envMap} bounces={2} ior={2.4} fresnel={1} aberrationStrength={0.015} fastChroma toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** A slow field of fine gold dust that stays after the ring is made. */
function AmbientDust({ count }: { count: number }) {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      p.set([(Math.random() - 0.5) * 18, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10 - 2], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return g;
  }, [count]);

  useFrame((_, delta) => {
    if (!points.current) return;
    points.current.rotation.y += delta * 0.015;
    points.current.position.y = -film.get().progress * 1.5;
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.025}
        sizeAttenuation
        color="#c9a961"
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
