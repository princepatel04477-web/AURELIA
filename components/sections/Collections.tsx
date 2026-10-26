'use client';

import { ChapterCard } from '@/components/chrome/ChapterCard';
import { CollectionGrid } from '@/components/collections/CollectionGrid';

/**
 * CHAPTER V — THE COLLECTION.
 *
 * Eight pieces, one bench.
 * Renders the clean, resilient CollectionGrid with category filter crossfade,
 * responsive 2-col (mobile) / 4-col (desktop) layout, and interactive TiltedCards.
 */
export default function Collections() {
  return (
    <section
      id="collection"
      aria-labelledby="collections-title"
      className="relative overflow-hidden border-t border-line/40 bg-bg"
    >
      {/* Subtle gold radial aura */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(70% 46% at 50% 8%, rgba(201,169,97,0.09), transparent 70%)',
        }}
      />

      <div className="frame relative z-10 pb-24 pt-[calc(var(--letterbox)+5rem)]">
        <ChapterCard numeral="V" title="The Collection" meta="Eight pieces" />

        <div className="mb-12 mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <h2
            id="collections-title"
            className="display max-w-xl text-[clamp(2.1rem,4.6vw,3.8rem)] leading-[0.98] text-ivory"
          >
            Eight pieces,
            <span className="display-italic text-gold"> one bench.</span>
          </h2>
          <p className="label text-muted max-w-xs">
            Handcrafted in 18k and 22k gold. Made to be inherited.
          </p>
        </div>

        {/* The responsive Collection Grid with TiltedCards and Category Filters */}
        <CollectionGrid initialCategory="All" showFilters={true} />
      </div>
    </section>
  );
}
