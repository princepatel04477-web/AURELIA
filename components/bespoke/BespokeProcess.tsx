'use client';

import { useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createTimeline, stagger, type Timeline } from 'animejs';
import { AssetFrame } from '@/components/chrome/AssetFrame';
import { ChapterCard } from '@/components/chrome/ChapterCard';
import { CINEMATIC } from '@/lib/assets';
import { useReducedMotion } from '@/lib/useReducedMotion';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * FOUR MOVEMENTS.
 *
 * Consult → Sketch → Craft → Deliver, laid out on one horizontal rail and pinned
 * to the scroll (desktop). Below 768px the same four become a vertical stack:
 * a sideways rail on a phone is a gesture nobody makes.
 *
 * The movement is GSAP's job — pinned scrub, no anime.js. The cards themselves
 * are anime.js, played once when the rail arrives, then reverted on unmount.
 */

const STEPS = [
  {
    numeral: 'I',
    title: 'Consult',
    meta: 'Week one',
    image: CINEMATIC.bespoke1,
    alt: 'Two hands over a tray of loose stones',
    copy: 'One hour, one table, a tray of loose stones. We photograph the hand, measure the finger, and write down what the piece has to survive.',
  },
  {
    numeral: 'II',
    title: 'Sketch',
    meta: 'Week two',
    image: CINEMATIC.bespoke2,
    alt: 'Graphite drawing of a setting on paper',
    copy: 'Drawn at actual size in graphite, then again in elevation. You approve the line before any metal is cut — changes are free until the wax.',
  },
  {
    numeral: 'III',
    title: 'Craft',
    meta: 'Weeks three to seven',
    image: CINEMATIC.bespoke3,
    alt: 'Piercing saw at the bench, gold dust on the tray',
    copy: 'Wax, casting, setting, and the long part: polishing by hand until the metal stops showing the tool. Four hands, one bench.',
  },
  {
    numeral: 'IV',
    title: 'Deliver',
    meta: 'Week eight',
    image: CINEMATIC.bespoke4,
    alt: 'Finished piece in a closed hand, low light',
    copy: 'Struck with the maker’s stamp, the year, and the weight of its gold. Boxed in Surat, handed over by appointment.',
  },
] as const;

export function BespokeProcess() {
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // The rail: pinned and scrubbed, only where there is room to travel.
  useGSAP(
    () => {
      if (reducedMotion) return undefined;

      const track = trackRef.current;
      if (!track) return undefined;

      const media = gsap.matchMedia();

      media.add('(min-width: 768px)', () => {
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top top',
            end: () => `+=${Math.max(distance(), 1)}`,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
          gsap.set(track, { clearProps: 'x' });
        };
      });

      return () => media.revert();
    },
    { scope: rootRef, dependencies: [reducedMotion] }
  );

  // The cards: one anime.js timeline, played when the sequence arrives.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const lines = Array.from(root.querySelectorAll<HTMLElement>('[data-step-line]'));
    if (lines.length === 0) return undefined;

    let timeline: Timeline | null = null;
    let trigger: ScrollTrigger | null = null;

    if (reducedMotion) {
      lines.forEach((line) => {
        line.style.opacity = '1';
        line.style.transform = 'none';
      });
      return undefined;
    }

    timeline = createTimeline({ autoplay: false, defaults: { ease: 'outExpo' } });
    timeline.add(lines, { opacity: [0, 1], translateY: [18, 0], duration: 1200, delay: stagger(70) }, 0);

    trigger = ScrollTrigger.create({
      trigger: root,
      start: 'top 70%',
      once: true,
      onEnter: () => timeline?.play(),
    });

    return () => {
      trigger?.kill();
      timeline?.revert();
      timeline = null;
      trigger = null;
    };
  }, [reducedMotion]);

  return (
    <section aria-labelledby="process-title" className="relative border-t border-line/40 bg-bg">
      <div ref={rootRef} className="relative overflow-hidden">
        <div className="frame pt-[calc(var(--letterbox)+4.5rem)]">
          <ChapterCard numeral="VII" title="The Commission" meta="Eight weeks" />
          <h2
            id="process-title"
            className="display mt-8 max-w-2xl text-[clamp(2rem,4.6vw,3.8rem)] leading-[0.98] text-ivory"
          >
            From a conversation
            <span className="display-italic text-gold"> to a stamp.</span>
          </h2>
        </div>

        <div
          ref={trackRef}
          className="mt-14 flex flex-col gap-14 px-[clamp(1.25rem,5vw,5rem)] pb-20 md:mt-20 md:w-[max-content] md:flex-row md:gap-[clamp(2rem,6vw,6rem)] md:pr-[12vw]"
        >
          {STEPS.map((step) => (
            <article
              key={step.numeral}
              data-step-card
              className="grid w-full grid-cols-1 gap-8 md:w-[clamp(20rem,52vw,34rem)] md:shrink-0 md:grid-cols-[1fr_1.15fr] md:items-end"
            >
              <div className="relative">
                <AssetFrame
                  src={step.image}
                  alt={step.alt}
                  ratio="aspect-[4/5]"
                  className="w-full"
                />
                <span className="label pointer-events-none absolute left-4 top-4 text-gold-bright">
                  {step.numeral}
                </span>
              </div>

              <div className="md:pb-4">
                <span className="label text-muted" data-step-line>
                  {step.meta}
                </span>
                <h3
                  className="display mt-3 text-[clamp(1.7rem,3vw,2.6rem)] leading-none text-ivory"
                  data-step-line
                >
                  {step.title}
                </h3>
                <p
                  className="mt-5 max-w-[26rem] text-body leading-relaxed text-ivory/70"
                  data-step-line
                >
                  {step.copy}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
