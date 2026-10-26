'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { createTimeline, type Timeline } from 'animejs';
import { useEffect, useRef } from 'react';
import { PLATE_URI } from '@/lib/assets';
import {
  CATEGORIES,
  formatINR,
  type CategoryFilter,
  type CollectionPiece,
} from '@/lib/collections';
import { usePlateImages } from '@/lib/useAssetProbe';
import { useReducedMotion } from '@/lib/useReducedMotion';

/**
 * THE GRID.
 *
 * Every piece, filtered, as a React Bits Masonry: hover gives the name and the
 * price, a click opens the lightbox on the still. The index beneath carries the
 * same list as links, which is how a piece gets to its own page — the lightbox
 * is for looking, not for navigating.
 */

const Masonry = dynamic(() => import('@/components/reactbits/Masonry/Masonry'), { ssr: false });

type PieceGridProps = {
  pieces: CollectionPiece[];
};

export function PieceGrid({ pieces }: PieceGridProps) {
  const reducedMotion = useReducedMotion();
  const [category, setCategory] = useState<CategoryFilter>('All');
  const captionRef = useRef<HTMLParagraphElement>(null);
  const timeline = useRef<Timeline | null>(null);

  const filtered = useMemo(
    () => (category === 'All' ? pieces : pieces.filter((piece) => piece.category === category)),
    [category, pieces]
  );
  const images = usePlateImages(filtered.map((piece) => piece.image));

  useEffect(() => {
    const node = captionRef.current;
    if (!node) return undefined;

    timeline.current?.revert();
    if (reducedMotion) {
      node.style.opacity = '1';
      return undefined;
    }

    const instance = createTimeline({ defaults: { ease: 'outExpo' } });
    instance.add(node, { opacity: [0, 1], translateY: [8, 0], duration: 900 }, 0);
    timeline.current = instance;

    return () => {
      instance.revert();
      timeline.current = null;
    };
  }, [category, reducedMotion]);

  return (
    <div id="pieces" className="scroll-mt-[calc(var(--letterbox)+2rem)]">
      {/* Filter bar. Every target is at least 44px tall. */}
      <div className="flex flex-col gap-5 border-t border-line/30 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Filter by category" className="flex flex-wrap gap-x-1 gap-y-2">
          {CATEGORIES.map((entry) => {
            const active = entry === category;
            return (
              <button
                key={entry}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(entry)}
                className={`label inline-flex min-h-11 items-center px-3 transition-colors duration-[900ms] ease-out-expo ${
                  active ? 'text-gold-bright' : 'text-ivory/55 hover:text-ivory/85'
                }`}
              >
                {entry}
                <span
                  aria-hidden
                  className={`ml-3 h-px w-6 origin-left bg-gold transition-transform duration-[900ms] ease-out-expo ${
                    active ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <p ref={captionRef} className="label text-muted">
          {filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}
        </p>
      </div>

      <div className="mt-8">
        {images ? (
          <Masonry
            key={category}
            items={filtered.map((piece) => ({
              id: piece.id,
              img: images[piece.image] ?? PLATE_URI,
              width: 800,
              height: 1000,
              title: piece.name,
              description: `${formatINR(piece.priceINR)} · ${piece.metal}`,
              alt: `${piece.name} — ${piece.stone} in ${piece.metal}.`,
            }))}
            columns="auto"
            columnWidth={300}
            gap={16}
            radius={2}
            animateFrom={reducedMotion ? 'none' : 'bottom'}
            stagger={40}
            duration={700}
            bounce={0.16}
            blurToFocus
            revealOnScroll
            hoverEffect="lift"
            focusOnHover
            captions="hover"
            lightbox
            draggable={false}
          />
        ) : (
          <div
            aria-hidden
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            data-grid="checking"
          >
            {filtered.map((piece) => (
              <div key={piece.id} className="aspect-[4/5] rounded-xs border border-line/40 bg-surface" />
            ))}
          </div>
        )}
      </div>

      {/* The index: the way to a piece's own page. */}
      <ul className="mt-14 grid grid-cols-1 gap-x-10 border-t border-line/30 sm:grid-cols-2">
        {filtered.map((piece) => (
          <li key={piece.id} className="border-b border-line/20">
            <Link
              href={`/collections/${piece.slug}`}
              className="group flex min-h-[3.5rem] items-baseline justify-between gap-4 py-4"
            >
              <span className="text-meta text-ivory/85 transition-colors duration-[900ms] ease-out-expo group-hover:text-gold-bright">
                {piece.name}
              </span>
              <span className="label text-muted tabular-nums">{formatINR(piece.priceINR)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
