'use client';

import { CSS_PLATE } from '@/lib/assets';
import { useResolvedImage } from '@/lib/useResolvedImage';
import { cn } from '@/lib/utils';

type AssetFrameProps = {
  /** From `lib/assets` — the primary path in a declared fallback chain. */
  src: string;
  /** Describes the photograph, for a figure that carries no <img>. */
  alt: string;
  /** Tailwind aspect class, e.g. `aspect-[4/5]`. Reserved from first paint. */
  ratio: string;
  className?: string;
  /** Optional label pinned inside the frame. */
  caption?: string;
};

/**
 * A picture that can never break.
 *
 * The frame is a fixed aspect box painted with the declared CSS plate from the
 * first frame; the photograph is a background layer that fades in only once the
 * probe confirms the file exists. No `<img>` means no broken-image glyph, and
 * the reserved ratio means no layout shift — delivered or not.
 */
export function AssetFrame({ src, alt, ratio, className, caption }: AssetFrameProps) {
  const resolved = useResolvedImage(src);

  return (
    <figure
      role="img"
      aria-label={alt}
      className={cn(
        'group relative isolate overflow-hidden rounded-xs border border-line',
        CSS_PLATE,
        ratio,
        className
      )}
      data-asset={src}
      data-asset-state={resolved === undefined ? 'checking' : resolved ? 'ready' : 'plate'}
    >
      {resolved ? (
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-0 transition-opacity duration-[1200ms] ease-out-expo [animation:veil-in_1400ms_cubic-bezier(0.16,1,0.3,1)_forwards]"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(10,9,7,0.12), rgba(10,9,7,0.58)), url(${resolved})`,
          }}
        />
      ) : null}

      {/* Hairline inner light: the frame reads as lit even when the plate is empty. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgba(235,216,166,0.10),inset_0_-40px_60px_-40px_rgba(10,9,7,0.9)]"
      />

      {caption ? (
        <figcaption className="label absolute inset-x-0 bottom-0 px-4 pb-3 text-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
