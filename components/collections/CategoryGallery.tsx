'use client';

import dynamic from 'next/dynamic';
import { JEWELRY } from '@/lib/assets';
import { useIsCompact } from '@/lib/useAssetProbe';

const AccordionGallery = dynamic(
  () => import('@/components/reactbits/AccordionGallery/AccordionGallery'),
  { ssr: false }
);

const CATEGORY_ITEMS = [
  {
    label: 'Rings',
    image: JEWELRY.solitaire,
    alt: 'Solitaire and band on a black ground',
  },
  {
    label: 'Pendants',
    image: JEWELRY.pearPendant,
    alt: 'Pear-cut pendant on a fine gold chain',
  },
  {
    label: 'Earrings',
    image: JEWELRY.emeraldDrop,
    alt: 'Emerald drop earrings under a single side light',
  },
  {
    label: 'Bracelets',
    image: JEWELRY.tennisBracelet,
    alt: 'Line bracelet, clasp detail',
  },
  {
    label: 'Necklaces',
    image: JEWELRY.polkiChoker,
    alt: 'Polki choker on dark ground',
  },
] as const;

export function CategoryGallery() {
  const compact = useIsCompact();
  const height = compact ? 300 : 520;

  return (
    <div className="w-full">
      <AccordionGallery
        items={CATEGORY_ITEMS.map((item) => ({
          image: item.image,
          label: item.label,
          alt: item.alt,
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
    </div>
  );
}

export default CategoryGallery;
