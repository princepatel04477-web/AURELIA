import type { Vector3Tuple } from 'three';

/**
 * Named camera shots for the persistent stage.
 *
 * One shot per chapter. The rig never invents a camera position — it eases
 * between these six, so the whole film can be re-cut by editing this table.
 */
export type CameraShot = 'hero' | 'stone' | 'fire' | 'hand' | 'collection' | 'finale';

export type ShotDefinition = {
  /** Camera position in stage units. */
  position: Vector3Tuple;
  /** Look-at target in stage units. */
  target: Vector3Tuple;
  /** Vertical field of view for this shot. */
  fov: number;
  /** Bloom intensity this shot is lit for (desktop post stack only). */
  bloomIntensity: number;
};

export const SHOTS: Record<CameraShot, ShotDefinition> = {
  /** Title card: ring stands upright, slightly above eye line. */
  hero: {
    position: [0.12, 0.62, 4.2],
    target: [0, 0.18, 0],
    fov: 32,
    bloomIntensity: 0.6,
  },
  /** Macro on the stone — the chapter about the cut. */
  stone: {
    position: [0.52, 1.38, 1.72],
    target: [0.02, 0.82, 0],
    fov: 28,
    bloomIntensity: 0.8,
  },
  /** Fire: low three-quarter, light raking across the pavilion. */
  fire: {
    position: [-2.1, 0.55, 3.0],
    target: [0, 0.2, 0],
    fov: 34,
    bloomIntensity: 1.2,
  },
  /** Hand: worn, closer to the body, gentler angle. */
  hand: {
    position: [0.36, 0.02, 3.05],
    target: [0, 0.06, 0],
    fov: 36,
    bloomIntensity: 0.7,
  },
  /** Collection: a wide, quiet step back. */
  collection: {
    position: [0, 1.9, 6.2],
    target: [0, 0.02, 0],
    fov: 30,
    bloomIntensity: 0.4,
  },
  /** Finale: the house pulls away and leaves the object lit. */
  finale: {
    position: [0, 1.15, 8.0],
    target: [0, 0.0, 0],
    fov: 26,
    bloomIntensity: 1.1,
  },
};

export const SHOT_ORDER: CameraShot[] = ['hero', 'stone', 'fire', 'hand', 'collection', 'finale'];

/** Opening frame of the title sequence — far and high, before the dolly-in. */
export const INTRO_SHOT: ShotDefinition = {
  position: [0.5, 3.2, 8.8],
  target: [0, 0.0, 0],
  fov: 30,
  bloomIntensity: 0.5,
};

/** The dolly-in is a deliberate 3 seconds. */
export const INTRO_DOLLY_MS = 3000;

/**
 * Hard ceiling on waiting for the first Stage frame, measured from the moment
 * the preloader starts to exit. Whichever comes first — a rendered frame or
 * this timeout — releases the intro. WebGL never blocks the film.
 */
export const INTRO_FALLBACK_MS = 4000;

/** Pointer parallax never exceeds six degrees of yaw or pitch. */
export const PARALLAX_MAX_RAD = (6 * Math.PI) / 180;

export function isCameraShot(value: string): value is CameraShot {
  return SHOT_ORDER.some((shot) => shot === value);
}
