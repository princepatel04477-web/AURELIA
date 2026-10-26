'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { film } from './filmStore';

const vertex = /* glsl */ `
  attribute vec3 aStart;
  attribute float aRand;
  uniform float uAssemble;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uFade;
  varying float vAlpha;
  varying float vSettle;

  vec3 rotateY(vec3 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  }

  void main() {
    // Each grain leaves on its own beat, so the ring is drawn, not snapped.
    float delay = aRand * 0.42;
    float t = clamp((uAssemble - delay) / (1.0 - 0.42), 0.0, 1.0);
    float settle = 1.0 - pow(1.0 - t, 4.0);

    vec3 orbit = rotateY(aStart, uTime * 0.18 + aRand * 6.2831 * (1.0 - settle) * 1.6);
    vec3 drift = vec3(
      sin(uTime * 0.9 + aRand * 41.0),
      cos(uTime * 0.7 + aRand * 29.0),
      sin(uTime * 0.6 + aRand * 17.0)
    ) * 0.22 * (1.0 - settle);

    vec3 p = mix(orbit + drift, position, settle);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float size = uSize * (0.55 + aRand * 0.9) * (1.0 + (1.0 - settle) * 1.4);
    gl_PointSize = size * uPixelRatio / max(-mv.z, 0.001);

    vAlpha = uFade * (0.35 + 0.65 * aRand);
    vSettle = settle;
  }
`;

const fragment = /* glsl */ `
  varying float vAlpha;
  varying float vSettle;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float core = smoothstep(0.5, 0.0, d);
    float glow = pow(core, 2.6);
    vec3 deep = vec3(0.79, 0.55, 0.22);
    vec3 bright = vec3(1.0, 0.91, 0.68);
    vec3 color = mix(deep, bright, glow * (0.4 + 0.6 * vSettle));
    gl_FragColor = vec4(color * 1.6, glow * vAlpha);
  }
`;

type GoldDustProps = {
  geometries: THREE.BufferGeometry[];
  count: number;
};

/**
 * The ring, drawn in gold dust.
 * Grains are sampled from the real band and stones, start scattered in a slow
 * orbit, and settle onto the surface as `film.assemble` runs 0 → 1.
 */
export function GoldDust({ geometries, count }: GoldDustProps) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const dpr = useThree((s) => s.viewport.dpr);

  const geometry = useMemo(() => {
    const targets = new Float32Array(count * 3);
    const starts = new Float32Array(count * 3);
    const rands = new Float32Array(count);
    const point = new THREE.Vector3();

    const samplers = geometries.map((g) => new MeshSurfaceSampler(new THREE.Mesh(g)).build());

    for (let i = 0; i < count; i += 1) {
      // Four in five grains belong to the metal; the rest find the stones.
      const sampler = samplers.length > 1 && i % 5 === 0 ? samplers[1] : samplers[0];
      sampler.sample(point);
      targets.set([point.x, point.y, point.z], i * 3);

      const radius = 5 + Math.random() * 9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starts.set(
        [
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi) * 0.55,
          radius * Math.sin(phi) * Math.sin(theta),
        ],
        i * 3
      );
      rands[i] = Math.random();
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(targets, 3));
    g.setAttribute('aStart', new THREE.BufferAttribute(starts, 3));
    g.setAttribute('aRand', new THREE.BufferAttribute(rands, 1));
    g.computeBoundingSphere();
    if (g.boundingSphere) g.boundingSphere.radius = 20;
    return g;
  }, [geometries, count]);

  const uniforms = useMemo(
    () => ({
      uAssemble: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: 26 },
      uPixelRatio: { value: 1 },
      uFade: { value: 1 },
    }),
    []
  );

  useFrame((state) => {
    const m = material.current;
    if (!m) return;
    const assemble = film.get().assemble;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uPixelRatio.value = dpr;
    m.uniforms.uAssemble.value = assemble;
    // Dust burns off as the metal takes over.
    m.uniforms.uFade.value = 1 - THREE.MathUtils.smoothstep(assemble, 0.86, 1);
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        name="gold-dust"
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
