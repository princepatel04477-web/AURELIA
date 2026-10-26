'use client';

import { useEffect, useState } from 'react';
import { CINEMATIC, CSS_PLATE, FIRE_PLATE_STYLE, fallbackChain } from '@/lib/assets';
import { getStageBeat, subscribeStageBeat, type StageBeat } from './CameraRig';

/**
 * The still that carries the film when WebGL cannot.
 *
 * Two moments call for it:
 *   • the device has no WebGL2 at all — the hero opens on a plate, with the
 *     same type choreography over it;
 *   • the stage's context is lost mid-scroll — the canvas fades out and the
 *     plate matching the current chapter takes the frame.
 *
 * Every plate is painted as a CSS background over a declared fallback plate, so
 * a missing file is a darker frame. No `<img>`, so no broken-image icon and no
 * layout shift: the layer is fixed and full-bleed from the first paint.
 *
 * Stacking: above the rays (z-0), below the wordmark (z-10) — the plate is a
 * backdrop, never a curtain over the brand.
 */

type Plate = {
  src: string;
  fire: boolean;
};

const PLATES: Record<StageBeat | 'hero', Plate> = {
  hero: { src: CINEMATIC.chapterLight, fire: false },
  stone: { src: CINEMATIC.chapterStone, fire: false },
  fire: { src: CINEMATIC.chapterFire, fire: true },
  interlude: { src: CINEMATIC.chapterHand, fire: false },
  hand: { src: CINEMATIC.chapterHand, fire: false },
};

const probe = (src: string): Promise<boolean> =>
  fetch(src, { method: 'HEAD' })
    .then((response) => response.ok)
    .catch(() => false);

/** First existing file in a declared chain; `undefined` while still checking. */
function useResolvedImage(primary: string): string | null | undefined {
  const [resolved, setResolved] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      for (const candidate of fallbackChain(primary)) {
        const ok = await probe(candidate);
        if (cancelled) return;
        if (ok) {
          setResolved(candidate);
          return;
        }
      }
      if (!cancelled) setResolved(null);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [primary]);

  return resolved;
}

export function HeroPlate({ visible }: { visible: boolean }) {
  const [beat, setBeat] = useState<StageBeat | null>(() => getStageBeat());

  useEffect(() => subscribeStageBeat(setBeat), []);

  const plate = PLATES[beat ?? 'hero'];
  const resolved = useResolvedImage(plate.src);

  const baseStyle = plate.fire ? FIRE_PLATE_STYLE : { backgroundColor: 'var(--bg)' };

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5] transition-opacity duration-[1400ms] ease-out-expo"
      style={{ opacity: visible ? 1 : 0 }}
      data-plate={plate.src}
    >
      {/* Declared CSS plate — always painted, so a missing file never flashes. */}
      <div className={`absolute inset-0 ${plate.fire ? '' : CSS_PLATE}`} style={baseStyle} />

      {/* The delivered film still, faded in only once it is known to exist. */}
      {resolved ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1400ms] ease-out-expo"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(250,247,242,0.4), rgba(250,247,242,0.7)), url(${resolved})`,
          }}
        />
      ) : null}

      {/* Cinematic floor: keeps plate and canvas reading as the same frame. */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_94%_at_50%_0%,transparent_42%,transparent_100%)]" />
    </div>
  );
}
