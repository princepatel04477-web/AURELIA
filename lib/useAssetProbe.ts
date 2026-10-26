'use client';

import { useEffect, useState } from 'react';
import { fallbackChain, PLATE_URI } from '@/lib/assets';

const probe = (src: string): Promise<boolean> =>
  fetch(src, { method: 'HEAD' })
    .then((response) => response.ok)
    .catch(() => false);

/**
 * Resolves a declared fallback chain to the first file that exists.
 *
 *   undefined — still checking (callers render the reserved frame)
 *   null      — nothing on disk, draw the CSS plate
 *   string    — the path to paint
 *
 * Same contract as `useResolvedImage`, exposed for vendor components that
 * cannot take a CSS plate and must be handed a real URL.
 */
export function useFirstExisting(chain: readonly string[]): string | null | undefined {
  const key = chain.join('|');
  const [found, setFound] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      for (const candidate of key.split('|')) {
        const ok = await probe(candidate);
        if (cancelled) return;
        if (ok) {
          setFound(candidate);
          return;
        }
      }
      if (!cancelled) setFound(null);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return found;
}

/**
 * Resolves many paths at once. Anything absent becomes the inline plate, so a
 * gallery that insists on an `<img>` still renders a lit frame, never a glyph.
 */
export function usePlateImages(paths: readonly string[]): Record<string, string> | undefined {
  const key = paths.join('|');
  const [resolved, setResolved] = useState<Record<string, string> | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const primaries = key.length === 0 ? [] : key.split('|');

      const entries = await Promise.all(
        primaries.map(async (primary) => {
          for (const candidate of fallbackChain(primary)) {
            if (await probe(candidate)) {
              return [primary, candidate] as const;
            }
          }
          return [primary, PLATE_URI] as const;
        })
      );

      if (!cancelled) setResolved(Object.fromEntries(entries));
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return resolved;
}

/** True below the 768px breakpoint — used to size vendor galleries. */
export function useIsCompact(): boolean {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const sync = () => setCompact(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return compact;
}
