'use client';

import Image from 'next/image';
import { CSS_PLATE } from '@/lib/assets';
import { useResolvedImage } from '@/lib/useResolvedImage';
import { cn } from '@/lib/utils';

type AssetFrameProps = {
  /** From `lib/assets` — the primary path in a declared fallback chain. */
  src: string;
  /** Describes the photograph. */
  alt: string;
  /** Tailwind aspect class, e.g. `aspect-[4/5]`. Reserved from first paint. */
  ratio: string;
  className?: string;
  /** Optional label pinned inside the frame. */
  caption?: string;
  /** Rendered width hint for `next/image`, so a phone never fetches a 2x plate. */
  sizes?: string;
};

/**
 * A picture that can never break.
 *
 * The frame is a fixed aspect box painted with the declared CSS plate from the
 * first frame; a real `next/image` is mounted only once the probe confirms the
 * file exists. An absent file means no element at all — no broken-image glyph —
 * and the reserved ratio means no layout shift either way.
 */
export function AssetFrame({
  src,
  alt,
  ratio,
  className,
  caption,
  sizes = '(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 40vw',
}: AssetFrameProps) {
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
        <>
          <Image
            src={resolved}
            alt=""
            aria-hidden
            fill
            sizes={sizes}
            loading="lazy"
            className="object-cover opacity-0 [animation:veil-in_1400ms_cubic-bezier(0.16,1,0.3,1)_forwards]"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-bg/10 to-bg/60"
          />
        </>
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
