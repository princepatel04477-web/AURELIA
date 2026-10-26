'use client';

import dynamic from 'next/dynamic';
import { useReducedMotion } from '@/lib/useReducedMotion';

const Noise = dynamic(() => import('@/components/reactbits/Noise/Noise'), { ssr: false });

/**
 * Global 35mm grain.
 * A single fixed layer above the film, never interactive — the only thing that
 * touches every chapter of the site.
 */
export function NoiseOverlay() {
  const reducedMotion = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70]">
      <Noise
        opacity={0.015}
        size={220}
        fps={reducedMotion ? 0 : 18}
        blendMode="soft-light"
        contrast={0.42}
        dust={0.16}
        scratches={0.06}
        scanlines={0}
        flicker={reducedMotion ? 0 : 0.12}
        fixed
        zIndex={70}
        className="h-full w-full"
      />
      <div className="absolute inset-0 grain-veil" />
      <div className="absolute inset-0 bg-[radial-gradient(125%_95%_at_50%_0%,transparent_45%,rgba(250,247,242,0)_100%)]" />
    </div>
  );
}
