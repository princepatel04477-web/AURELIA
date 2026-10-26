'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createTimeline, stagger, type Timeline } from 'animejs';
import { ChapterCard } from '@/components/chrome/ChapterCard';
import { setStageShot, STAGE_PAUSE_EVENT } from '@/components/three/CameraRig';
import { useReducedMotion } from '@/lib/useReducedMotion';
import {
  CATEGORIES,
  formatINR,
  piecesForCategory,
  type CategoryFilter,
  type CollectionPiece,
} from '@/lib/collections';

const CircularCarousel = dynamic(
  () => import('@/components/reactbits/CircularCarousel/CircularCarousel'),
  { ssr: false }
);

/* -------------------------------------------------------------------------
   Missing-art handling.

   CircularCarousel renders its own <img>. Rather than let eight absent files
   become eight broken-image glyphs, every piece is probed once; anything not
   delivered is swapped for an inline plate that matches the house surface.
   ------------------------------------------------------------------------- */

const PLATE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="g" cx="50%" cy="42%" r="62%"><stop offset="0" stop-color="#C9A961" stop-opacity="0.14"/><stop offset="0.6" stop-color="#C9A961" stop-opacity="0.03"/><stop offset="1" stop-color="#0A0907" stop-opacity="0"/></radialGradient></defs><rect width="800" height="1000" fill="#14110D"/><rect width="800" height="1000" fill="url(#g)"/><rect x="24" y="24" width="752" height="952" fill="none" stroke="#C9A961" stroke-opacity="0.22"/></svg>`;

const PLATE_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(PLATE_SVG)}`;

const probe = (src: string): Promise<boolean> =>
  fetch(src, { method: 'HEAD' })
    .then((response) => response.ok)
    .catch(() => false);

/** Resolves each piece's image once; `undefined` while still checking. */
function usePieceImages(pieces: CollectionPiece[]): Record<string, string> | undefined {
  const [ready, setReady] = useState<Record<string, string> | undefined>(undefined);
  const key = pieces.map((piece) => piece.image).join('|');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const entries = await Promise.all(
        key.split('|').map(async (src) => [src, (await probe(src)) ? src : PLATE_URI] as const)
      );
      if (!cancelled) setReady(Object.fromEntries(entries));
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return ready;
}

/* -------------------------------------------------------------------------
   Viewport tier.
   ------------------------------------------------------------------------- */

function useIsCompact(): boolean {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const sync = () => setCompact(mql.matches);
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, []);

  return compact;
}

/* -------------------------------------------------------------------------
   The section.
   ------------------------------------------------------------------------- */

export default function Collections() {
  const reducedMotion = useReducedMotion();
  const compact = useIsCompact();
  const router = useRouter();

  const sectionRef = useRef<HTMLElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const tabTimeline = useRef<Timeline | null>(null);
  const captionTimeline = useRef<Timeline | null>(null);

  const [category, setCategory] = useState<CategoryFilter>('All');
  const [focused, setFocused] = useState(0);
  const [setVisible, setSetVisible] = useState(true);

  const pieces = useMemo(() => piecesForCategory(category), [category]);
  const images = usePieceImages(pieces);
  const focusedPiece = pieces[focused] ?? pieces[0];

  // Chapter V owns the stage's "collection" shot, and parks it while on screen.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        const visible = entry.isIntersecting;

        setStageShot(visible ? 'collection' : null);
        window.dispatchEvent(
          new CustomEvent(STAGE_PAUSE_EVENT, { detail: { paused: visible } })
        );
      },
      { threshold: 0.05 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      setStageShot(null);
      window.dispatchEvent(new CustomEvent(STAGE_PAUSE_EVENT, { detail: { paused: false } }));
    };
  }, []);

  // A category switch crossfades the whole set out and back in.
  useEffect(() => {
    const wrap = stageWrapRef.current;
    if (!wrap) return undefined;

    tabTimeline.current?.revert();

    if (reducedMotion) {
      wrap.style.opacity = '1';
      return undefined;
    }

    const timeline = createTimeline({ defaults: { ease: 'outExpo' } });
    timeline.add(wrap, { opacity: [0, 1], translateY: [18, 0], duration: 1200 }, 0);
    tabTimeline.current = timeline;

    return () => {
      timeline.revert();
      tabTimeline.current = null;
    };
  }, [category, reducedMotion, setVisible]);

  // The focused piece's caption arrives after the carousel settles.
  useEffect(() => {
    const caption = captionRef.current;
    if (!caption) return undefined;

    const lines = Array.from(caption.querySelectorAll<HTMLElement>('[data-caption-line]'));

    captionTimeline.current?.revert();

    if (reducedMotion) {
      lines.forEach((line) => {
        line.style.opacity = '1';
        line.style.transform = 'none';
      });
      return undefined;
    }

    const timeline = createTimeline({ defaults: { ease: 'outExpo' } });
    timeline.add(lines, { opacity: [0, 1], translateY: [10, 0], duration: 1000, delay: stagger(90) }, 0);

    captionTimeline.current = timeline;

    return () => {
      timeline.revert();
      captionTimeline.current = null;
    };
  }, [focusedPiece?.id, reducedMotion]);

  const openPiece = (piece: CollectionPiece, index: number) => {
    // Only the focused card navigates; the rest simply come forward.
    if (index !== focused) {
      setFocused(index);
      return;
    }
    router.push(`/collections/${piece.slug}`);
  };

  const changeCategory = (next: CategoryFilter) => {
    if (next === category) return;
    setSetVisible(false);
    setCategory(next);
    setFocused(0);
    // Re-open after the crossfade's exit beat.
    window.setTimeout(() => setSetVisible(true), reducedMotion ? 0 : 240);
  };

  return (
    <section
      id="collection"
      ref={sectionRef}
      aria-labelledby="collections-title"
      className="relative overflow-hidden border-t border-line/40 bg-bg"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(70% 46% at 50% 8%, rgba(201,169,97,0.09), transparent 70%)',
        }}
      />

      <div className="frame relative z-10 pb-24 pt-[calc(var(--letterbox)+5rem)]">
        <ChapterCard numeral="V" title="The Collection" meta={`${pieces.length} pieces`} />

        <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <h2
            id="collections-title"
            className="display max-w-xl text-[clamp(2.1rem,4.6vw,3.8rem)] leading-[0.98] text-ivory"
          >
            Eight pieces,
            <span className="display-italic text-gold"> one bench.</span>
          </h2>

          {/* Category pills. */}
          <div
            role="tablist"
            aria-label="Filter by category"
            className="flex flex-wrap gap-x-6 gap-y-3"
          >
            {CATEGORIES.map((entry) => {
              const active = entry === category;
              return (
                <button
                  key={entry}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => changeCategory(entry)}
                  className="group relative pb-1"
                >
                  <span
                    className={`label transition-colors duration-[900ms] ease-out-expo ${
                      active ? 'text-gold-bright' : 'text-muted group-hover:text-ivory/80'
                    }`}
                  >
                    {entry}
                  </span>
                  <span
                    aria-hidden
                    className={`absolute inset-x-0 bottom-0 h-px origin-left bg-gold transition-transform duration-[900ms] ease-out-expo ${
                      active ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* The carousel — desktop. */}
      <div ref={stageWrapRef} className="relative z-10">
        {compact ? (
          <CompactRow
            pieces={pieces}
            images={images}
            onOpen={(piece) => router.push(`/collections/${piece.slug}`)}
            reducedMotion={reducedMotion}
          />
        ) : (
          <div className="relative h-[clamp(22rem,46vw,34rem)] w-full">
            {images ? (
              <CircularCarousel
                items={pieces.map((piece) => ({
                  src: images[piece.image] ?? PLATE_URI,
                  alt: `${piece.name} — ${piece.metal}, ${piece.stone}`,
                  title: piece.name,
                  subtitle: piece.category,
                }))}
                preset="cylinder"
                intro="none"
                cardWidth={232}
                aspectRatio={1.28}
                gap={28}
                curve={0.94}
                tilt={6}
                perspective={1250}
                autoplay="drift"
                speed={0.35}
                direction="right"
                draggable
                momentum={0.92}
                snap
                pauseOnHover
                focusOnClick
                parallax={0.35}
                depthFade={0.72}
                fadeColor="#0A0907"
                innerShade={0.32}
                cornerRadius={2}
                captions={false}
                onChange={(index) => setFocused(index)}
                onItemClick={(_, index) => {
                  const piece = pieces[index];
                  if (piece) openPiece(piece, index);
                }}
              />
            ) : (
              <CarouselSkeleton />
            )}
          </div>
        )}
      </div>

      {/* The focused piece. */}
      {focusedPiece ? (
        <div ref={captionRef} className="frame relative z-10 mt-10">
          <div className="flex flex-col gap-6 border-t border-line/40 pt-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span data-caption-line className="label block text-gold opacity-0">
                {focusedPiece.category} · {focusedPiece.metal}
              </span>
              <h3
                data-caption-line
                className="display mt-3 text-[clamp(1.5rem,3vw,2.4rem)] leading-tight text-ivory opacity-0"
              >
                {focusedPiece.name}
              </h3>
              <p
                data-caption-line
                className="mt-3 max-w-md text-meta leading-relaxed text-muted opacity-0"
              >
                {focusedPiece.stone}
                {focusedPiece.caratWeight > 0 ? ` · ${focusedPiece.caratWeight.toFixed(2)} ct` : ''}
              </p>
            </div>

            <div className="flex items-end gap-8 sm:flex-col sm:items-end sm:gap-3">
              <span
                data-caption-line
                className="display text-[clamp(1.3rem,2.2vw,1.9rem)] tabular-nums text-gold-bright opacity-0"
              >
                {formatINR(focusedPiece.priceINR)}
              </span>
              <a
                data-caption-line
                href={`/collections/${focusedPiece.slug}`}
                className="label group inline-flex items-center gap-3 text-ivory/80 opacity-0 transition-colors duration-[900ms] ease-out-expo hover:text-gold-bright"
              >
                View the piece
                <span aria-hidden className="text-gold">
                  →
                </span>
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/* -------------------------------------------------------------------------
   Mobile: a scroll-snap row, cards entering with a stagger.
   ------------------------------------------------------------------------- */

function CompactRow({
  pieces,
  images,
  onOpen,
  reducedMotion,
}: {
  pieces: CollectionPiece[];
  images: Record<string, string> | undefined;
  onOpen: (piece: CollectionPiece) => void;
  reducedMotion: boolean;
}) {
  const rowRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return undefined;

    const cards = Array.from(row.querySelectorAll<HTMLElement>('[data-card]'));
    if (cards.length === 0) return undefined;

    if (reducedMotion) {
      cards.forEach((card) => {
        card.style.opacity = '1';
        card.style.transform = 'none';
      });
      return undefined;
    }

    // Cards start hidden, then rise in sequence — anime.js owns the entrance.
    cards.forEach((card) => {
      card.style.opacity = '0';
    });

    const timeline = createTimeline({ defaults: { ease: 'outExpo' } });
    timeline.add(cards, { opacity: [0, 1], translateY: [26, 0], duration: 1100, delay: stagger(80) }, 0);

    return () => {
      timeline.revert();
    };
  }, [pieces, reducedMotion]);

  return (
    <ul
      ref={rowRef}
      className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-[clamp(1.25rem,5vw,5rem)] pb-4"
    >
      {pieces.map((piece) => (
        <li key={piece.id} data-card className="w-[74vw] shrink-0 snap-center">
          <button type="button" onClick={() => onOpen(piece)} className="group block w-full text-left">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xs border border-line bg-surface">
              {images?.[piece.image] ? (
                <div
                  aria-hidden
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.03]"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(10,9,7,0.10), rgba(10,9,7,0.55)), url(${images[piece.image]})`,
                  }}
                />
              ) : (
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      'radial-gradient(64% 56% at 50% 42%, rgba(201,169,97,0.14), transparent 74%)',
                  }}
                />
              )}
            </div>

            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="display text-[1.2rem] leading-snug text-ivory">{piece.name}</h3>
                <span className="label mt-2 block text-muted">{piece.category}</span>
              </div>
              <span className="label shrink-0 whitespace-nowrap pt-1 tabular-nums text-gold-bright">
                {formatINR(piece.priceINR)}
              </span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Reserved frame while the eight probes are in flight — no shift on arrival. */
function CarouselSkeleton() {
  return (
    <div aria-hidden className="flex h-full items-center justify-center gap-6">
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className="h-[62%] w-[10.5rem] rounded-xs border border-line bg-surface"
          style={{ opacity: 1 - index * 0.18 }}
        />
      ))}
    </div>
  );
}
