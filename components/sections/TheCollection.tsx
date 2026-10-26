'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, type JSAnimation } from 'animejs';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChapterCard } from '@/components/chrome/ChapterCard';
import { AssetFrame } from '@/components/chrome/AssetFrame';
import { FEATURED, SECONDARY, formatPrice, RATIO_CLASS, type Piece } from '@/lib/data';
import { useReducedMotion } from '@/lib/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

/**
 * CHAPTER V — THE INHERITANCE.
 *
 * The Call-to-Buy pattern from the reference: one object, one price, one
 * action. Everything else on the page is a line sheet — name, fact, price —
 * separated by hairlines, with no badges, no carousels and no urgency.
 *
 * Every picture is an `AssetFrame`, so a missing photograph is a lit plate in
 * a hairline frame at a reserved ratio: no broken images, no shift.
 */
export default function TheCollection() {
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const [enquiring, setEnquiring] = useState(false);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const root = rootRef.current;
    if (!root) return undefined;

    const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (rows.length === 0) return undefined;

    const context = gsap.context(() => {
      gsap.from(rows, {
        y: 34,
        opacity: 0,
        duration: 1200,
        ease: 'expo.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: root,
          start: 'top 72%',
          once: true,
        },
      });
    }, root);

    return () => context.revert();
  }, [reducedMotion]);

  return (
    <section
      id="collection"
      ref={rootRef}
      aria-labelledby="collection-title"
      className="relative border-t border-line/40 bg-bg"
    >
      {/* A very quiet field behind the line sheet. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(70% 50% at 50% 0%, rgba(201,169,97,0.07), transparent 68%)',
        }}
      />

      <div className="frame relative z-10 pb-28 pt-[calc(var(--letterbox)+5rem)]">
        <ChapterCard numeral="V" title="The Inheritance" meta="Four pieces" />

        <h2
          id="collection-title"
          className="display mt-10 max-w-3xl text-[clamp(2.2rem,5.4vw,4.6rem)] leading-[0.95] text-ivory"
        >
          Pieces that outlive
          <span className="display-italic text-gold"> the occasion.</span>
        </h2>

        {/* Call to Buy — one object, one price, one action. */}
        <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div data-reveal className="lg:col-span-7">
            <AssetFrame
              src={FEATURED.image}
              alt={FEATURED.alt}
              ratio={RATIO_CLASS[FEATURED.ratio]}
              className="w-full"
              caption={`${FEATURED.line} — ${FEATURED.name}`}
            />
          </div>

          <div data-reveal className="flex flex-col justify-center lg:col-span-5">
            <span className="label text-gold">{FEATURED.line}</span>

            <h3 className="display mt-5 text-[clamp(1.9rem,3.4vw,3rem)] leading-tight text-ivory">
              {FEATURED.name}
            </h3>

            <p className="mt-5 max-w-sm text-body text-ivory/70">{FEATURED.detail}</p>

            <div className="mt-10 flex items-baseline gap-5">
              <span className="display text-[clamp(1.6rem,2.6vw,2.2rem)] tabular-nums text-gold-bright">
                {formatPrice(FEATURED.price)}
              </span>
              <span className="label text-muted">Made to order</span>
            </div>

            {/* The one action. Server-rendered, so it is there before hydration. */}
            <div className="mt-8 self-start">
              <button
                type="button"
                onClick={() => setEnquiring((open) => !open)}
                aria-expanded={enquiring}
                aria-controls="reserve-panel"
                className="group relative inline-flex items-center gap-5 overflow-hidden border border-gold/40 px-8 py-4"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 origin-left scale-x-0 bg-gold/10 transition-transform duration-[1200ms] ease-out-expo group-hover:scale-x-100"
                />
                <span className="relative label text-ivory transition-colors duration-[900ms] ease-out-expo group-hover:text-gold-bright">
                  {enquiring ? 'Close' : 'Reserve this piece'}
                </span>
                <span
                  aria-hidden
                  className={`relative text-[0.85rem] text-gold transition-transform duration-[900ms] ease-out-expo ${
                    enquiring ? 'rotate-90' : 'group-hover:translate-x-1'
                  }`}
                >
                  {enquiring ? '×' : '→'}
                </span>
              </button>
            </div>

            {enquiring ? <ReservePanel piece={FEATURED} /> : null}

            <p className="label mt-8 max-w-xs leading-[1.9] text-muted">
              Viewings by appointment · Surat atelier
            </p>
          </div>
        </div>

        {/* The line sheet — three more pieces. */}
        <div className="mt-24">
          <div className="flex items-center gap-4">
            <span className="label text-muted">Also in the vault</span>
            <span className="hairline flex-1" />
          </div>

          <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {SECONDARY.map((piece) => (
              <PieceRow key={piece.id} piece={piece} />
            ))}
          </div>
        </div>

        <div className="mt-24 flex flex-col gap-6 border-t border-line/40 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="label max-w-md leading-[1.9] text-muted">
            Each piece is made once. Nothing here is repeated.
          </p>
          <a href="#atelier" className="group inline-flex items-center gap-4 self-start">
            <span className="label text-ivory/80 transition-colors duration-[900ms] ease-out-expo group-hover:text-gold-bright">
              Speak to the atelier
            </span>
            <span aria-hidden className="relative flex h-px w-10 overflow-hidden bg-line">
              <span className="absolute inset-0 origin-left scale-x-0 bg-gold transition-transform duration-[1200ms] ease-out-expo group-hover:scale-x-100" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

/**
 * The follow-through of the Call to Buy.
 *
 * One object, one price, one action — the action opens this, a two-field
 * enquiry that confirms in place. anime.js handles the entrance only
 * (form micro-interaction); nothing here talks to a backend yet.
 */
function ReservePanel({ piece }: { piece: Piece }) {
  const reducedMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<JSAnimation | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return undefined;

    if (reducedMotion) {
      panel.style.opacity = '1';
      panel.style.transform = 'none';
      return undefined;
    }

    animationRef.current = animate(panel, {
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 900,
      ease: 'outExpo',
    });

    return () => {
      animationRef.current?.revert();
      animationRef.current = null;
    };
  }, [reducedMotion]);

  return (
    <div
      id="reserve-panel"
      ref={panelRef}
      className="mt-7 border-l border-line pl-6"
      style={reducedMotion ? undefined : { opacity: 0 }}
    >
      {sent ? (
        <p className="display-italic text-[1.25rem] leading-snug text-gold-bright">
          Noted. The atelier will write to you within two days.
        </p>
      ) : (
        <form
          className="flex max-w-sm flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
          }}
        >
          <p className="label leading-[1.9] text-muted">
            {piece.name} · {formatPrice(piece.price)}
          </p>

          <label className="flex flex-col gap-2">
            <span className="label text-muted">Name</span>
            <input
              type="text"
              name="name"
              required
              autoComplete="name"
              className="border-b border-line bg-transparent pb-2 text-body text-ivory outline-none transition-colors duration-[900ms] ease-out-expo focus:border-gold"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="label text-muted">Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="border-b border-line bg-transparent pb-2 text-body text-ivory outline-none transition-colors duration-[900ms] ease-out-expo focus:border-gold"
            />
          </label>

          <button
            type="submit"
            className="label mt-2 self-start border border-line px-6 py-3 text-ivory transition-colors duration-[900ms] ease-out-expo hover:border-gold hover:text-gold-bright"
          >
            Send enquiry
          </button>
        </form>
      )}
    </div>
  );
}

/** One line-sheet entry: picture, name, material fact, price. */
function PieceRow({ piece }: { piece: Piece }) {
  return (
    <a href="#enquire" data-reveal className="group block">
      <AssetFrame
        src={piece.image}
        alt={piece.alt}
        ratio={RATIO_CLASS[piece.ratio]}
        className="w-full transition-colors duration-[1200ms] ease-out-expo group-hover:border-gold/45"
      />

      <div className="mt-5 flex items-start justify-between gap-6">
        <div>
          <h3 className="display text-[1.35rem] leading-snug text-ivory transition-colors duration-[900ms] ease-out-expo group-hover:text-gold-bright">
            {piece.name}
          </h3>
          <p className="mt-2 max-w-[22rem] text-meta text-muted">{piece.detail}</p>
        </div>
        <span className="label shrink-0 whitespace-nowrap pt-1 tabular-nums text-ivory/70">
          {formatPrice(piece.price)}
        </span>
      </div>
    </a>
  );
}
