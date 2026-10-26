'use client';

import dynamic from 'next/dynamic';
import { CINEMATIC, PLATE_URI } from '@/lib/assets';
import { useIsCompact, usePlateImages } from '@/lib/useAssetProbe';

/**
 * THE FIVE CATEGORIES, AS PANELS.
 *
 * One accordion per category, driven by the category plates. The panels jump to
 * the grid below; filtering is the grid's own bar, so the gallery stays purely
 * editorial. Every panel is probed once — an undelivered plate becomes the
 * inline gold-hairline plate rather than a broken image.
 */

const AccordionGallery = dynamic(
  () => import('@/components/reactbits/AccordionGallery/AccordionGallery'),
  { ssr: false }
);

const PANELS = [
  {
    label: 'Rings',
    image: CINEMATIC.categoryRings,
    alt: 'Solitaire and band on a black ground',
  },
  {
    label: 'Pendants',
    image: CINEMATIC.categoryPendants,
    alt: 'Pear-cut pendant on a fine gold chain',
  },
  {
    label: 'Earrings',
    image: CINEMATIC.categoryEarrings,
    alt: 'Emerald drop earrings under a single side light',
  },
  {
    label: 'Bracelets',
    image: CINEMATIC.categoryBracelets,
    alt: 'Line bracelet, clasp detail',
  },
  {
    label: 'Necklaces',
    image: CINEMATIC.categoryNecklaces,
    alt: 'Polki choker on dark ground',
  },
] as const;

export function CategoryGallery() {
  const compact = useIsCompact();
  const images = usePlateImages(PANELS.map((panel) => panel.image));

  const height = compact ? 300 : 520;

  // Reserved height from first paint, so the gallery never shifts on resolve.
  if (!images) {
    return (
      <div
        aria-hidden
        className="w-full animate-pulse rounded-xs border border-line/40 bg-surface"
        style={{ height }}
        data-gallery="checking"
      />
    );
  }

  return (
    <AccordionGallery
      items={PANELS.map((panel) => ({
        image: images[panel.image] ?? PLATE_URI,
        label: panel.label,
        alt: panel.alt,
        link: '#pieces',
      }))}
      defaultIndex={0}
      accentColor="#C9A961"
      overlayColor="#0A0907"
      textColor="#F3EEE4"
      height={height}
      gap={compact ? 6 : 10}
      radius={2}
      expandRatio={0.5}
      orientation="horizontal"
      duration={0.8}
      ease="power3.out"
      parallax={0.2}
      tilt={compact ? 0 : 3}
      stagger={0.06}
      trigger="hover"
      showLabels
      grayscale={false}
      className="w-full"
    />
  );
}
