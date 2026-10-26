'use client';

import { useEffect, useState } from 'react';
import { fallbackChain } from '@/lib/assets';

const probe = (src: string): Promise<boolean> =>
  fetch(src, { method: 'HEAD' })
    .then((response) => response.ok)
    .catch(() => false);

/**
 * Walk a declared fallback chain until something exists.
 *
 *   undefined — still checking (render the reserved frame, never a guess)
 *   null      — nothing on disk, the caller draws the CSS plate
 *   string    — the path to paint
 *
 * Shared by every image surface so the manifest's fallback table is the only
 * place the behaviour is described.
 */
export function useResolvedImage(primary: string): string | null | undefined {
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
