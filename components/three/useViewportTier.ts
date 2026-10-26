'use client';

import { useEffect, useState } from 'react';

export type ViewportTier = {
  /** Coarse pointer or a narrow viewport: fewer samples, smaller dpr cap. */
  isMobile: boolean;
  /** Client-only flag so the first paint never guesses. */
  ready: boolean;
};

const MOBILE_QUERY = '(max-width: 768px), (pointer: coarse)';

/**
 * Rendering tier. Desktop gets the full post stack and a sweeping environment;
 * mobile gets vignette only, a static environment and dpr [1, 1.5].
 */
export function useViewportTier(): ViewportTier {
  const [tier, setTier] = useState<ViewportTier>({ isMobile: false, ready: false });

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const sync = () => setTier({ isMobile: mql.matches, ready: true });

    sync();
    mql.addEventListener('change', sync);

    return () => mql.removeEventListener('change', sync);
  }, []);

  return tier;
}

/**
 * One-shot capability probe for the CSS fallbacks in the hero.
 * Never creates a persistent context — it is drawn and destroyed immediately.
 */
export type WebGL2Support = {
  supported: boolean;
  /** False until the probe has answered — the reveal must not act on a guess. */
  ready: boolean;
};

export function useWebGL2Support(): WebGL2Support {
  const [support, setSupport] = useState<WebGL2Support>({ supported: false, ready: false });

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const gl = canvas.getContext('webgl2');
      setSupport({ supported: Boolean(gl), ready: true });
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      setSupport({ supported: false, ready: true });
    }
  }, []);

  return support;
}
