'use client';

import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import { FilmScene } from './FilmScene';
import { film } from './filmStore';

type FilmCanvasProps = {
  isMobile: boolean;
  reducedMotion: boolean;
};

/**
 * The fixed stage behind the film. It sleeps (frameloop "never") whenever the
 * film section is off screen, so the rest of the page costs nothing.
 */
export default function FilmCanvas({ isMobile, reducedMotion }: FilmCanvasProps) {
  const [active, setActive] = useState(film.get().active);

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
        // Desktop tone-maps in the post stack; mobile has none, so the renderer does it.
        flat={!isMobile}
        dpr={isMobile ? 1 : [1, 2]}
        resize={{ debounce: 250, scroll: false }}
        camera={{ position: [0, 0.15, 8.6], fov: 32, near: 0.1, far: 60 }}
        gl={{
          antialias: !isMobile,
          alpha: false,
          powerPreference: 'high-performance',
        }}
      >
        <Suspense fallback={null}>
          <FilmScene isMobile={isMobile} reducedMotion={reducedMotion} />
        </Suspense>
        {isMobile ? null : <AdaptiveDpr pixelated={false} />}
      </Canvas>
    </div>
  );
}
