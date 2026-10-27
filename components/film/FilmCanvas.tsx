'use client';

import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { FilmScene } from './FilmScene';
import { film } from './filmStore';

type FilmCanvasProps = {
  isMobile: boolean;
  reducedMotion: boolean;
};

/** Pixel-ratio range: phones start sharp and only step down if the frame rate does. */
const DPR_RANGE = { mobile: [1.5, 2] as const, desktop: [1.5, 2] as const };

/**
 * The fixed stage behind the film. It sleeps (frameloop "never") whenever the
 * film section is off screen, so the rest of the page costs nothing.
 *
 * Resolution is adaptive rather than fixed low: a frame-rate monitor raises or
 * lowers the pixel ratio within the device's range, so a fast phone renders at
 * retina sharpness and a slow one trades a little sharpness for smoothness.
 */
export default function FilmCanvas({ isMobile, reducedMotion }: FilmCanvasProps) {
  const [active, setActive] = useState(film.get().active);
  const [lo, hi] = isMobile ? DPR_RANGE.mobile : DPR_RANGE.desktop;
  const [dpr, setDpr] = useState<number>(isMobile ? 1.75 : 2);

  useEffect(() => film.subscribe(() => setActive(film.get().active)), []);

  return (
    <div
      aria-hidden
      // 100lvh, not inset-0: the canvas keeps one size while a phone's URL bar slides in
      // and out, so the GPU never reallocates its buffers mid-scroll.
      className="pointer-events-none fixed left-0 top-0 z-0 h-[100lvh] w-full transition-opacity duration-700"
      style={{ opacity: active ? 1 : 0 }}
    >
      <Canvas
        frameloop={active ? 'always' : 'never'}
        // Tone mapping happens in the lens (post stack) on every device.
        flat
        dpr={dpr}
        resize={{ debounce: 250, scroll: false }}
        camera={{ position: [0, 0.15, 8.6], fov: 32, near: 0.1, far: 60 }}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false }}
      >
        <PerformanceMonitor
          flipflops={4}
          onChange={({ factor }) => setDpr(Math.round((lo + (hi - lo) * factor) * 20) / 20)}
          onFallback={() => setDpr(lo)}
        >
          <Suspense fallback={null}>
            <FilmScene isMobile={isMobile} reducedMotion={reducedMotion} />
          </Suspense>
        </PerformanceMonitor>
      </Canvas>
    </div>
  );
}
