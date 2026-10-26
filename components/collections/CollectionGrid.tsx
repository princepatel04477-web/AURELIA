'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import {
  CATEGORIES,
  COLLECTION_PIECES,
  formatINR,
  type CategoryFilter,
} from '@/lib/collections';

const TiltedCard = dynamic(() => import('@/components/reactbits/TiltedCard/TiltedCard'), {
  ssr: false,
  loading: () => (
    <div className="aspect-[4/5] w-full bg-[#14110D] border border-gold/20" />
  ),
});

export interface CollectionGridProps {
  initialCategory?: CategoryFilter;
  showFilters?: boolean;
}

export function CollectionGrid({
  initialCategory = 'All',
  showFilters = true,
}: CollectionGridProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(initialCategory);
  const [isMobile, setIsMobile] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const filteredPieces =
    activeCategory === 'All'
      ? COLLECTION_PIECES
      : COLLECTION_PIECES.filter((piece) => piece.category === activeCategory);

  const handleCategoryChange = (cat: CategoryFilter) => {
    if (cat === activeCategory) return;
    setActiveCategory(cat);

    if (gridRef.current) {
      animate(gridRef.current, {
        opacity: [0, 1],
        translateY: [14, 0],
        duration: 450,
        ease: 'outQuad',
      });
    }
  };

  return (
    <div className="w-full">
      {/* Category Filter Pills */}
      {showFilters && (
        <div
          role="tablist"
          aria-label="Filter pieces by category"
          className="mb-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line/30 pb-4"
        >
          {CATEGORIES.map((cat) => {
            const active = cat === activeCategory;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleCategoryChange(cat)}
                className="group relative inline-flex min-h-11 items-center pb-1 text-left"
              >
                <span
                  className={`label transition-colors duration-300 ${
                    active ? 'text-gold-bright' : 'text-muted group-hover:text-ivory'
                  }`}
                >
                  {cat}
                </span>
                <span
                  aria-hidden
                  className={`absolute inset-x-0 bottom-0 h-px bg-gold transition-transform duration-300 origin-left ${
                    active ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Grid: 2 columns mobile, 4 columns desktop */}
      <div
        ref={gridRef}
        className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8"
      >
        {filteredPieces.map((piece, index) => {
          // In 'All' view, The Aurelia Solitaire spans 2 columns × 2 rows on desktop
          const isFeaturedSpan =
            activeCategory === 'All' &&
            (piece.slug === 'aurelia-solitaire' || index === 0);

          return (
            <Link
              key={piece.id}
              href={`/collections/${piece.slug}`}
              className={`group flex flex-col justify-between overflow-hidden border border-line/40 bg-surface/60 p-4 transition-all duration-500 hover:border-gold/60 hover:bg-surface/90 sm:p-5 ${
                isFeaturedSpan ? 'lg:col-span-2 lg:row-span-2 p-6 sm:p-8' : ''
              }`}
            >
              {/* Image with TiltedCard */}
              <div
                className={`relative w-full overflow-hidden ${
                  isFeaturedSpan ? 'aspect-[4/4.2]' : 'aspect-[4/5]'
                }`}
              >
                <TiltedCard
                  imageSrc={piece.image}
                  altText={piece.name}
                  captionText={piece.name}
                  containerHeight="100%"
                  containerWidth="100%"
                  imageHeight="100%"
                  imageWidth="100%"
                  scaleOnHover={isMobile ? 1 : 1.03}
                  rotateAmplitude={isMobile ? 0 : 6}
                  showTooltip={false}
                  radius={0}
                />
              </div>

              {/* Product Metadata */}
              <div className="mt-4 flex flex-col justify-end pt-2">
                <h3
                  className={`font-display font-[300] text-ivory leading-tight transition-colors duration-300 group-hover:text-gold-bright ${
                    isFeaturedSpan ? 'text-[1.85rem] sm:text-[2.2rem]' : 'text-[1.35rem] sm:text-[1.5rem]'
                  }`}
                >
                  {piece.name}
                </h3>
                <p className="label mt-1 text-muted">
                  {piece.category} · {piece.metal}
                </p>
                <p className="label mt-2.5 text-gold-bright font-medium">
                  {formatINR(piece.priceINR)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default CollectionGrid;
