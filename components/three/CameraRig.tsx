'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, PerspectiveCamera, Spherical, Vector3 } from 'three';
import { useCameraRig } from './CameraRigContext';
import { INTRO_DOLLY_MS, INTRO_SHOT, PARALLAX_MAX_RAD, SHOTS } from './shots';

/** outExpo — the only curve the camera is allowed to use. */
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

const scratchPosition = new Vector3();
const scratchTarget = new Vector3();
const scratchOffset = new Vector3();
const scratchSpherical = new Spherical();

/** Portrait screens need a wider lens or the ring is cropped at the girdle. */
const portraitBoost = (aspect: number) => (aspect < 1 ? Math.min(1.55, 1.12 / aspect) : 1);

/** Frame-rate independent damping, so a 30fps phone matches a 120fps display. */
const damp = (current: number, target: number, lambda: number, dt: number) =>
  MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));

/**
 * The camera.
 *
 * Three behaviours, in order of authority:
 *   1. The dolly — three seconds from a far, high frame into the hero shot.
 *   2. Named shots — every later chapter moves the same rig, eased, never cut.
 *   3. Pointer parallax — at most six degrees of yaw and pitch, damped.
 * Reduced motion collapses all three into a single still frame.
 */
export function CameraRig() {
  const rig = useCameraRig();
  const camera = useThree((state) => state.camera);

  const dolly = useRef(0);
  const fov = useRef(INTRO_SHOT.fov);
  const position = useRef(new Vector3(...INTRO_SHOT.position));
  const target = useRef(new Vector3(...INTRO_SHOT.target));
  const parallax = useRef({ x: 0, y: 0 });
  const reportedSettle = useRef(false);

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
      scratchPosition.set(...shot.position);
      scratchTarget.set(...shot.target);

      const ease = 1 - Math.exp(-1.6 * dt);
      position.current.lerp(scratchPosition, ease);
      target.current.lerp(scratchTarget, ease);
      fov.current = damp(fov.current, shot.fov, 1.6, dt);
    }

    camera.position.copy(target.current);
    camera.fov = fov.current * portraitBoost(camera.aspect);

    if (reportedSettle.current && rig.introComplete) {
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

  return null;
}
