'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  CatmullRomCurve3,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  PerspectiveCamera,
  Spherical,
  Texture,
  Vector3,
  CanvasTexture,
  SRGBColorSpace,
  RepeatWrapping,
} from 'three';
import { useCameraRig } from './CameraRigContext';
import { INTRO_DOLLY_MS, INTRO_SHOT, PARALLAX_MAX_RAD, SHOTS } from './shots';

/* -------------------------------------------------------------------------
   Stage direction — the contract between the DOM and the camera.

   `StoryChapters` owns the scroll; it writes a single normalised `progress`
   plus the beat that is currently on screen. Everything the film needs to
   know is read here, per frame, without a single React render.
   ------------------------------------------------------------------------- */

export type StageBeat = 'stone' | 'fire' | 'interlude' | 'hand';

type StageState = {
  /** Null while the hero owns the camera. */
  beat: StageBeat | null;
  /** 0 → 1 across the whole four-beat passage. */
  progress: number;
};

const stageState: StageState = { beat: null, progress: 0 };

let requestFrames: ((on: boolean) => void) | null = null;

type BeatListener = (beat: StageBeat | null) => void;
const beatListeners = new Set<BeatListener>();

/** Lets the plate layer follow whichever chapter is on screen. */
export function subscribeStageBeat(listener: BeatListener): () => void {
  beatListeners.add(listener);
  return () => {
    beatListeners.delete(listener);
  };
}

export function getStageBeat(): StageBeat | null {
  return stageState.beat;
}

const emitBeat = () => {
  beatListeners.forEach((listener) => listener(stageState.beat));
};

/**
 * Called by the chapter ScrollTriggers (scrub 1.2).
 * Silently no-ops when the canvas is not on screen, so the DOM never has to
 * guard against a missing stage.
 */
export function setStageDirection(next: { beat: StageBeat | null; progress?: number }): void {
  const wasIdle = stageState.beat === null;
  const changed = stageState.beat !== next.beat;
  stageState.beat = next.beat;
  if (changed) emitBeat();
  if (typeof next.progress === 'number') {
    stageState.progress = MathUtils.clamp(next.progress, 0, 1);
  }

  if (next.beat !== null) {
    // Beat active: the stage must render even though it sits under the copy.
    requestFrames?.(true);
  } else if (!wasIdle) {
    // Back at the hero, where the canvas is always meant to run.
    requestFrames?.(true);
  }
}

/** For the progress rail and any DOM affordance that mirrors the camera. */
export function getStageProgress(): number {
  return stageState.progress;
}

/* -------------------------------------------------------------------------
   The path.
   ------------------------------------------------------------------------- */

const BREAKS = [0, 0.3, 0.55, 0.75, 1] as const;

const PATH_POSITIONS = [
  new Vector3(0.12, 0.62, 4.2), // hero — the settled title shot
  new Vector3(0.2, 0.95, 1.05), // stone — extreme close-up on the gem
  new Vector3(-2.9, 0.45, 0.85), // fire — edge-on, the band in profile
  new Vector3(0.4, 0.7, 3.2), // interlude — pulling away
  new Vector3(1.9, 1.05, 5.2), // hand — three-quarter pull-back
];

const PATH_TARGETS = [
  new Vector3(0, 0.18, 0),
  new Vector3(0, 0.8, 0),
  new Vector3(0, 0.3, 0),
  new Vector3(0, 0.4, 0),
  new Vector3(0, 0.25, 0),
];

const PATH_FOV = [32, 26, 30, 34, 32];

/** How far the ring turns to present its profile, per control point. */
const PATH_YAW = [0, 0.22, 1.35, 0.9, 0.3];

const positionCurve = new CatmullRomCurve3(PATH_POSITIONS, false, 'catmullrom', 0.5);
const targetCurve = new CatmullRomCurve3(PATH_TARGETS, false, 'catmullrom', 0.5);

type PathSample = { position: Vector3; target: Vector3; fov: number; yaw: number };

const sampleScratch: PathSample = {
  position: new Vector3(),
  target: new Vector3(),
  fov: PATH_FOV[0],
  yaw: 0,
};

/**
 * Catmull-Rom is sampled by control-point index, not by arc length, so the
 * scroll is mapped through the breakpoints first — that way a beat can hold
 * longer on screen than another without the camera speeding up.
 */
function samplePath(progress: number): PathSample {
  const clamped = MathUtils.clamp(progress, 0, 1);
  let segment = 0;
  for (let index = 0; index < BREAKS.length - 1; index += 1) {
    if (clamped >= BREAKS[index]) segment = index;
  }

  const start = BREAKS[segment];
  const end = BREAKS[segment + 1];
  const local = end === start ? 0 : (clamped - start) / (end - start);
  const t = (segment + local) / (BREAKS.length - 1);

  positionCurve.getPoint(t, sampleScratch.position);
  targetCurve.getPoint(t, sampleScratch.target);
  sampleScratch.fov = MathUtils.lerp(PATH_FOV[segment], PATH_FOV[segment + 1], local);
  sampleScratch.yaw = MathUtils.lerp(PATH_YAW[segment], PATH_YAW[segment + 1], local);

  return sampleScratch;
}

/* -------------------------------------------------------------------------
   Engraving — a procedural roughness map, swept across the band.
   ------------------------------------------------------------------------- */

const ENGRAVE_SIZE = 512;

/** A quiet repeat of rosettes and hairlines: cut by hand, not by a machine. */
function createEngravingTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = ENGRAVE_SIZE;
  canvas.height = ENGRAVE_SIZE;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#d8d8d8';
    ctx.fillRect(0, 0, ENGRAVE_SIZE, ENGRAVE_SIZE);

    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 2;
    for (let x = 0; x <= ENGRAVE_SIZE; x += ENGRAVE_SIZE / 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ENGRAVE_SIZE);
      ctx.stroke();
    }

    ctx.strokeStyle = '#2f2f2f';
    ctx.lineWidth = 3;
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        const cx = (column + 0.5) * (ENGRAVE_SIZE / 8);
        const cy = (row + 0.5) * (ENGRAVE_SIZE / 4);
        ctx.beginPath();
        ctx.arc(cx, cy, ENGRAVE_SIZE / 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, ENGRAVE_SIZE / 52, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 1);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/* -------------------------------------------------------------------------
   The camera.
   ------------------------------------------------------------------------- */

/** outExpo — the only curve the camera is allowed to use. */
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

const scratchOffset = new Vector3();
const scratchSpherical = new Spherical();
const scratchLookAt = new Vector3();

/** Portrait screens need a wider lens or the ring is cropped at the girdle. */
const portraitBoost = (aspect: number) => (aspect < 1 ? Math.min(1.55, 1.12 / aspect) : 1);

/** Frame-rate independent damping, so a 30fps phone matches a 120fps display. */
const damp = (current: number, target: number, lambda: number, dt: number) =>
  MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));

/**
 * The camera.
 *
 * Four behaviours, in order of authority:
 *   1. The chapter path — four scroll-scrubbed beats along a Catmull-Rom curve.
 *   2. The dolly — three seconds from a far, high frame into the hero shot.
 *   3. Named shots — every other chapter moves the same rig, eased, never cut.
 *   4. Pointer parallax — at most six degrees of yaw and pitch, damped.
 * Reduced motion collapses all four into a single still frame.
 *
 * It also directs the object: the ring turns to profile for THE FIRE, and a
 * procedural roughness map sweeps across the band for THE HAND.
 */
export function CameraRig() {
  const rig = useCameraRig();
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);
  const setFrameloop = useThree((state) => state.setFrameloop);

  const dolly = useRef(0);
  const fov = useRef(INTRO_SHOT.fov);
  const position = useRef(new Vector3(...INTRO_SHOT.position));
  const target = useRef(new Vector3(...INTRO_SHOT.target));
  const parallax = useRef({ x: 0, y: 0 });
  const reportedSettle = useRef(false);

  const ring = useRef<{ root: Object3D; baseYaw: number } | null>(null);
  const engraving = useRef<{
    mesh: Mesh;
    original: MeshPhysicalMaterial;
    applied: MeshPhysicalMaterial | null;
    texture: Texture | null;
  } | null>(null);
  const scanClock = useRef(0);

  useEffect(() => {
    requestFrames = (on: boolean) => setFrameloop(on ? 'always' : 'demand');
    return () => {
      requestFrames = null;
    };
  }, [setFrameloop]);

  // Tear the engraving down completely — material, map, canvas.
  useEffect(
    () => () => {
      const state = engraving.current;
      if (!state) return;
      if (state.applied) {
        state.applied.dispose();
        state.mesh.material = state.original;
      }
      state.texture?.dispose();
      engraving.current = null;
    },
    []
  );

  /** The band is our lathe; its parent group is the ring. Re-scanned until found. */
  const findRing = () => {
    if (ring.current) return;
    let band: Mesh | null = null;
    scene.traverse((child) => {
      if (!band && child instanceof Mesh && child.geometry?.type === 'LatheGeometry') {
        band = child;
      }
    });
    if (!band) return;
    const mesh: Mesh = band;
    const root = mesh.parent ?? mesh;
    ring.current = { root, baseYaw: root.rotation.y };

    const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    if (material instanceof MeshPhysicalMaterial) {
      engraving.current = { mesh, original: material, applied: null, texture: null };
    }
  };

  const applyEngraving = (amount: number) => {
    const state = engraving.current;
    if (!state) return;

    if (amount <= 0.002) {
      if (state.applied) {
        state.applied.dispose();
        state.mesh.material = state.original;
        state.applied = null;
      }
      return;
    }

    if (!state.applied) {
      const texture = state.texture ?? createEngravingTexture();
      state.texture = texture;
      const clone = state.original.clone();
      clone.roughnessMap = texture;
      clone.roughness = 0.12;
      clone.needsUpdate = true;
      state.mesh.material = clone;
      state.applied = clone;
    }

    const applied = state.applied;
    const texture = state.texture;
    if (!applied || !texture) return;

    // The pattern travels across the band as it is cut.
    texture.offset.x = MathUtils.lerp(-0.55, 0.12, amount);
    applied.roughness = MathUtils.lerp(0.12, 0.62, amount);
  };

  useFrame((_, delta) => {
    if (!(camera instanceof PerspectiveCamera)) return;

    if (rig.reducedMotion) {
      // Stillness: the shot is real, it just does not move.
      const still = SHOTS[rig.shot];
      camera.position.set(...still.position);
      camera.fov = still.fov * portraitBoost(camera.aspect);
      camera.lookAt(new Vector3(...still.target));
      camera.updateProjectionMatrix();
      return;
    }

    const dt = Math.min(delta, 0.05);
    const heroShot = SHOTS.hero;

    scanClock.current += dt;
    if (!ring.current && scanClock.current > 0.5) {
      scanClock.current = 0;
      findRing();
    }

    if (stageState.beat !== null) {
      const sample = samplePath(stageState.progress);
      const ease = 1 - Math.exp(-3.4 * dt);

      position.current.lerp(sample.position, ease);
      target.current.lerp(sample.target, ease);
      fov.current = damp(fov.current, sample.fov, 3.4, dt);

      if (ring.current) {
        ring.current.root.rotation.y = damp(
          ring.current.root.rotation.y,
          ring.current.baseYaw + sample.yaw,
          2.2,
          dt
        );
      }

      // THE HAND: the engraving arrives over the last beat.
      const engrave = MathUtils.clamp((stageState.progress - 0.72) / 0.26, 0, 1);
      applyEngraving(engrave);
    } else {
      const beatLeftRing = ring.current;
      if (beatLeftRing) {
        beatLeftRing.root.rotation.y = damp(
          beatLeftRing.root.rotation.y,
          beatLeftRing.baseYaw,
          2,
          dt
        );
      }
      applyEngraving(0);

      if (!rig.introComplete) {
        // Hold the opening frame: far, high, nothing moving yet.
        dolly.current = 0;
        position.current.set(...INTRO_SHOT.position);
        target.current.set(...INTRO_SHOT.target);
        fov.current = INTRO_SHOT.fov;
      } else if (dolly.current < 1) {
        // The 3s dolly-in. Weighted, decelerating, no overshoot.
        dolly.current = Math.min(1, dolly.current + (dt * 1000) / INTRO_DOLLY_MS);
        const eased = easeOutExpo(dolly.current);

        position.current.set(
          MathUtils.lerp(INTRO_SHOT.position[0], heroShot.position[0], eased),
          MathUtils.lerp(INTRO_SHOT.position[1], heroShot.position[1], eased),
          MathUtils.lerp(INTRO_SHOT.position[2], heroShot.position[2], eased)
        );
        target.current.set(
          MathUtils.lerp(INTRO_SHOT.target[0], heroShot.target[0], eased),
          MathUtils.lerp(INTRO_SHOT.target[1], heroShot.target[1], eased),
          MathUtils.lerp(INTRO_SHOT.target[2], heroShot.target[2], eased)
        );
        fov.current = MathUtils.lerp(INTRO_SHOT.fov, heroShot.fov, eased);

        if (dolly.current >= 1 && !reportedSettle.current) {
          reportedSettle.current = true;
          rig.markSettled();
        }
      } else {
        // Hand over to named shots; a shot change is a slow ease, never a cut.
        const shot = SHOTS[rig.shot];
        const ease = 1 - Math.exp(-1.6 * dt);
        position.current.lerp(scratchLookAt.set(...shot.position), ease);
        target.current.lerp(scratchLookAt.set(...shot.target), ease);
        fov.current = damp(fov.current, shot.fov, 1.6, dt);
      }
    }

    camera.position.copy(target.current);
    camera.fov = fov.current * portraitBoost(camera.aspect);

    if (reportedSettle.current && rig.introComplete && stageState.beat === null) {
      const pointer = rig.pointer.current;
      parallax.current.x = damp(parallax.current.x, pointer.x, 2.4, dt);
      parallax.current.y = damp(parallax.current.y, pointer.y, 2.4, dt);
    }

    // Parallax is an orbit of the eye around the subject, capped at six degrees.
    scratchOffset.copy(position.current).sub(target.current);
    scratchSpherical.setFromVector3(scratchOffset);
    scratchSpherical.theta += parallax.current.x * PARALLAX_MAX_RAD;
    scratchSpherical.phi = MathUtils.clamp(
      scratchSpherical.phi + parallax.current.y * PARALLAX_MAX_RAD * 0.6,
      0.18,
      Math.PI - 0.18
    );
    scratchOffset.setFromSpherical(scratchSpherical);

    camera.position.copy(target.current).add(scratchOffset);
    camera.lookAt(target.current);
    camera.updateProjectionMatrix();
  });

  return <CastingSparks />;
}

/* -------------------------------------------------------------------------
   THE FIRE — instanced embers.
   ------------------------------------------------------------------------- */

const SPARK_COUNT = 72;
const SPARK_CEILING = 1.65;

type SparkSeed = { x: number; z: number; speed: number; phase: number; scale: number };

const sparkSeeds: SparkSeed[] = Array.from({ length: SPARK_COUNT }, (_, index) => {
  // Deterministic scatter — no randomness at runtime, no hydration drift.
  const golden = index * 0.61803398875;
  return {
    x: (Math.sin(golden * Math.PI * 4) * 0.5 + Math.cos(index * 1.7) * 0.18) * 0.42,
    z: (Math.cos(golden * Math.PI * 3) * 0.5 + Math.sin(index * 2.3) * 0.2) * 0.42,
    speed: 0.16 + ((index * 37) % 11) * 0.022,
    phase: ((index * 53) % 100) / 100,
    scale: 0.5 + ((index * 29) % 9) * 0.08,
  };
});

const sparkDummy = new Object3D();

/**
 * Gold embers rising off the band during THE FIRE.
 *
 * One InstancedMesh, one draw call. The mesh is hidden — not unmounted — the
 * rest of the time, and its matrices are only written while the beat is live.
 */
function CastingSparks() {
  const meshRef = useRef<InstancedMesh>(null);
  const clock = useRef(0);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const live =
      stageState.beat === 'fire' ||
      (stageState.beat !== null && stageState.progress > 0.26 && stageState.progress < 0.64);

    mesh.visible = live;
    if (!live) return;

    clock.current += Math.min(delta, 0.05);

    // Embers rise through the fire beat and thin out at its edges.
    const envelope = MathUtils.clamp(
      1 - Math.abs((stageState.progress - 0.42) / 0.2),
      0,
      1
    );

    for (let index = 0; index < SPARK_COUNT; index += 1) {
      const seed = sparkSeeds[index];
      const travel = (clock.current * seed.speed + seed.phase) % 1;
      const rise = travel * SPARK_CEILING;
      const fade = Math.sin(travel * Math.PI) ** 1.4;

      sparkDummy.position.set(
        seed.x * (0.5 + travel * 1.4),
        rise,
        seed.z * (0.5 + travel * 1.4)
      );
      sparkDummy.rotation.set(travel * 6.1, travel * 4.3, 0);
      sparkDummy.scale.setScalar(0.008 * seed.scale * fade * envelope);
      sparkDummy.updateMatrix();
      mesh.setMatrixAt(index, sparkDummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, SPARK_COUNT]}
      visible={false}
      frustumCulled={false}
    >
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#EBD8A6" toneMapped={false} transparent opacity={0.85} />
    </instancedMesh>
  );
}
