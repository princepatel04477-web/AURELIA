'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { beatWeight, film } from './filmStore';

const vertex = /* glsl */ `
  attribute float aRand;
  attribute float aSpeed;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uHeat;
  varying float vLife;
  varying float vHeat;

  void main() {
    float life = fract(uTime * aSpeed * 0.22 + aRand);
    vec3 p = position;
    p.y += life * 4.2;
    p.x += sin(uTime * 2.0 + aRand * 30.0) * 0.18 * life;
    p.z += cos(uTime * 1.7 + aRand * 21.0) * 0.18 * life;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (1.0 - life) * (0.5 + aRand) * uPixelRatio / max(-mv.z, 0.001);
    vLife = life;
    vHeat = uHeat;
  }
`;

const fragment = /* glsl */ `
  varying float vLife;
  varying float vHeat;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = pow(smoothstep(0.5, 0.0, d), 2.2);
    vec3 hot = vec3(1.0, 0.86, 0.55);
    vec3 cool = vec3(1.0, 0.38, 0.08);
    vec3 color = mix(hot, cool, vLife);
    gl_FragColor = vec4(color * 2.2, a * (1.0 - vLife) * vHeat);
  }
`;

/** Casting sparks for THE FIRE — they only exist while that beat is on. */
export function Sparks({ count }: { count: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const dpr = useThree((s) => s.viewport.dpr);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const rands = new Float32Array(count);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.6 + Math.random() * 1.4;
      positions.set([Math.cos(a) * r, -1.8 + Math.random() * 0.6, Math.sin(a) * r], i * 3);
      rands[i] = Math.random();
      speeds[i] = 0.6 + Math.random() * 1.4;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aRand', new THREE.BufferAttribute(rands, 1));
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 34 },
      uPixelRatio: { value: 1 },
      uHeat: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    const m = material.current;
    if (!m) return;
    const heat = beatWeight('fire', film.get().progress);
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uPixelRatio.value = dpr;
    m.uniforms.uHeat.value = heat;
    m.visible = heat > 0.01;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
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
