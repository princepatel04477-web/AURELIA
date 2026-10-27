'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GoldDust } from './GoldDust';
import { Sparks } from './Sparks';
import { StoneMaterial } from './StoneMaterial';
import { Lens, StudioEnvironment, useBakedEnvironment } from './Studio';
import { beatWeight, BEATS, film, smoothstep } from './filmStore';
import { getMicroSurface, METALS, useLooseDiamond, useRingGeometry } from './useRingAsset';

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

type ShotSample = {
  camera: THREE.Vector3;
  target: THREE.Vector3;
  yaw: number;
  pitch: number;
  shift: number;
};

/** Writes into `out` — no allocation per frame, so no GC stutter on phones. */
function sampleShots(shots: Shot[], progress: number, out: ShotSample): ShotSample {
  let i = 0;
  while (i < shots.length - 2 && progress > shots[i + 1].at) i += 1;
  const a = shots[i];
  const b = shots[i + 1];
  const t = smoothstep(a.at, b.at, progress);
  out.camera.set(
    a.camera[0] + (b.camera[0] - a.camera[0]) * t,
    a.camera[1] + (b.camera[1] - a.camera[1]) * t,
    a.camera[2] + (b.camera[2] - a.camera[2]) * t
  );
  out.target.set(
    a.target[0] + (b.target[0] - a.target[0]) * t,
    a.target[1] + (b.target[1] - a.target[1]) * t,
    a.target[2] + (b.target[2] - a.target[2]) * t
  );
  out.yaw = a.yaw + (b.yaw - a.yaw) * t;
  out.pitch = a.pitch + (b.pitch - a.pitch) * t;
  out.shift = a.shift + (b.shift - a.shift) * t;
  return out;
}

type FilmSceneProps = {
  isMobile: boolean;
  reducedMotion: boolean;
};

export function FilmScene({ isMobile, reducedMotion }: FilmSceneProps) {
  const { band, diamonds, ao, stoneY } = useRingGeometry();
  const envMap = useBakedEnvironment();
  const micro = useMemo(() => getMicroSurface(), []);
  const shots = useShots(stoneY);

  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  const ringGroup = useRef<THREE.Group>(null);
  const bandMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const shotOut = useRef<ShotSample>({ camera: new THREE.Vector3(), target: new THREE.Vector3(), yaw: 0, pitch: 0, shift: 0 });
  const cameraGoal = useRef(new THREE.Vector3());
  const diamondMesh = useRef<THREE.Mesh>(null);
  const lookAt = useRef(new THREE.Vector3(0, 0.1, 0));
  const assembleStart = useRef<number | null>(null);
  const idleYaw = useRef(0);

  useEffect(() => {
    scene.background = new THREE.Color('#0a0907');
  }, [scene]);

  // The curtain lifts once the studio has been baked into the environment.
  useEffect(() => {
    if (envMap) film.markLoaded();
  }, [envMap]);

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
    const shot = sampleShots(shots, f.progress, shotOut.current);
    const damp = 1 - Math.exp(-dt * 3.2);
    // Portrait screens see far less width: pull the camera back along its own line of sight.
    const aspect = state.size.width / Math.max(1, state.size.height);
    const reach = aspect < 1 ? Math.min(1.75, 0.62 / aspect + 0.25) : 1;
    cameraGoal.current.copy(shot.camera).sub(shot.target).multiplyScalar(reach).add(shot.target);
    cameraGoal.current.x += f.pointerX * 0.35;
    cameraGoal.current.y += f.pointerY * 0.2;
    camera.position.lerp(cameraGoal.current, damp);
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
    scene.environmentIntensity = 1 + polish * 0.45 + beatWeight('stone', f.progress) * 0.2;
  });

  return (
    <>
      <group ref={ringGroup}>
        <mesh geometry={band}>
          {/*
            Gold is a bare metal — no clearcoat (that is what made it read as plastic CAD).
            The baked occlusion darkens the gallery and under the halo; the micro-surface
            breaks the reflections up the way hand-polished metal does.
          */}
          <meshStandardMaterial
            ref={bandMaterial}
            color={METALS.yellow.color}
            metalness={1}
            roughness={METALS.yellow.roughness}
            roughnessMap={micro}
            bumpMap={micro}
            bumpScale={0.0006}
            aoMap={ao}
            aoMapIntensity={0.85}
            envMapIntensity={1.35}
            transparent
            opacity={0}
          />
        </mesh>
        {envMap ? (
          <mesh ref={diamondMesh} geometry={diamonds} visible={false}>
            <StoneMaterial envMap={envMap} lite={isMobile} />
          </mesh>
        ) : null}
        <GoldDust geometries={[band, diamonds]} count={isMobile ? 3200 : 11000} />
      </group>

      <Sparks count={isMobile ? 220 : 700} />
      {envMap ? <LooseDiamonds envMap={envMap} count={isMobile ? 7 : 11} portrait={isMobile} stoneY={stoneY} lite={isMobile} /> : null}
      <AmbientDust count={isMobile ? 200 : 520} />

      <StudioEnvironment isMobile={isMobile} />
      <Lens isMobile={isMobile} />
    </>
  );
}

/** Loose stones that drift in around THE STONE, then leave. */
type LooseDiamondsProps = {
  envMap: THREE.Texture;
  count: number;
  /** Phones: a tall, narrow column in front of the stone instead of a wide ring around it. */
  portrait: boolean;
  stoneY: number;
  lite: boolean;
};

function LooseDiamonds({ envMap, count, portrait, stoneY, lite }: LooseDiamondsProps) {
  const geometry = useLooseDiamond();
  const group = useRef<THREE.Group>(null);

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        const base = portrait
          ? new THREE.Vector3(
              Math.cos(a * 1.7) * 0.75,
              stoneY - 1.9 + (i / Math.max(1, count - 1)) * 3.6,
              0.6 + Math.sin(a) * 0.9
            )
          : new THREE.Vector3(
              Math.cos(a) * (2.1 + (i % 3) * 0.65),
              stoneY - 0.5 + Math.sin(a * 2) * 1.3,
              Math.sin(a) * 1.5 - 0.4
            );
        return {
          base,
          size: (portrait ? 0.13 : 0.16) + ((i * 37) % 10) / (portrait ? 75 : 60),
          spin: 0.2 + ((i * 13) % 7) / 10,
          phase: i * 1.7,
        };
      }),
    [count, portrait, stoneY]
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
          <StoneMaterial envMap={envMap} lite={lite} bounces={2} />
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
