'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createTimeline, type Timeline } from 'animejs';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import dynamic from 'next/dynamic';
import { setStageDirection, type StageBeat } from '@/components/three/CameraRig';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { CINEMATIC, CSS_PLATE, FIRE_PLATE_STYLE, fallbackChain } from '@/lib/assets';

gsap.registerPlugin(ScrollTrigger);

/** React Bits surfaces measure the DOM and run GSAP: client only, split out. */
const MaskedHeading = dynamic(() => import('@/components/reactbits/MaskedHeading/MaskedHeading'), {
  ssr: false,
});
const GradualBlur = dynamic(() => import('@/components/reactbits/GradualBlur/GradualBlur'), {
  ssr: false,
});
const ScrollExpand = dynamic(() => import('@/components/reactbits/ScrollExpand/ScrollExpand'), {
  ssr: false,
});

/* -------------------------------------------------------------------------
   The picture.
   ------------------------------------------------------------------------- */

const GOLD_TEXTURE = CINEMATIC.goldTexture;
const ATELIER_HANDS = CINEMATIC.atelierHands;

type RailKey =
  | 'stone'
  | 'fire'
  | 'interlude'
  | 'hand'
  | 'collection'
  | 'one'
  | 'atelier'
  | 'commission';

type Chapter = {
  beat: StageBeat;
  numeral: string;
  title: string;
  headline: string;
  body: string;
  /** Scroll share of the passage, in breakpoints. Mirrors CameraRig. */
  from: number;
  to: number;
  /** Still plate used when motion is reduced or an asset is missing. */
  still: string;
  /** Which tick of the progress rail this chapter owns. */
  rail: RailKey;
};

const CHAPTERS: Chapter[] = [
  {
    beat: 'stone',
    numeral: 'II',
    rail: 'stone',
    title: 'The Stone',
    headline: 'The Stone',
    body: 'Every stone is chosen by hand, under north light.',
    from: 0,
    to: 0.3,
    still: CINEMATIC.chapterStone,
  },
  {
    beat: 'fire',
    numeral: 'III',
    rail: 'fire',
    title: 'The Fire',
    headline: 'The Fire',
    body: 'Gold is worked at the temperature where it remembers.',
    from: 0.3,
    to: 0.55,
    still: CINEMATIC.chapterFire,
  },
  {
    beat: 'hand',
    numeral: 'IV',
    rail: 'hand',
    title: 'The Hand',
    headline: 'The Hand',
    body: 'A pattern cut by hand, then worn smooth by a lifetime.',
    from: 0.75,
    to: 1,
    still: CINEMATIC.chapterHand,
  },
];

const INTERLUDE: Chapter = {
  beat: 'interlude',
  numeral: 'III · IV',
  rail: 'interlude',
  title: 'The Hours',
  headline: 'The Hours',
  body: 'Forty hours. One ring.',
  from: 0.55,
  to: 0.75,
  still: CINEMATIC.chapterHand,
};

/**
 * The progress rail indexes the whole film, II → VIII. Only the chapter that
 * owns the screen is lit; the rest stay as hairlines.
 */
const RAIL: { key: RailKey; numeral: string; label: string }[] = [
  { key: 'stone', numeral: 'II', label: 'The Stone' },
  { key: 'fire', numeral: 'III', label: 'The Fire' },
  { key: 'interlude', numeral: '·', label: 'The Hours' },
  { key: 'hand', numeral: 'IV', label: 'The Hand' },
  { key: 'collection', numeral: 'V', label: 'The Collection' },
  { key: 'one', numeral: 'VI', label: 'The One' },
  { key: 'commission', numeral: 'VII', label: 'The Commission' },
  { key: 'atelier', numeral: 'VIII', label: 'The Atelier' },
];

/** Sections that live outside this component, mapped to their rail tick. */
const LATER_SECTIONS: { id: string; key: RailKey }[] = [
  { id: 'collection', key: 'collection' },
  { id: 'the-one', key: 'one' },
  { id: 'bespoke', key: 'commission' },
  { id: 'atelier', key: 'atelier' },
];

/* -------------------------------------------------------------------------
   Assets.
   ------------------------------------------------------------------------- */

const probe = (src: string): Promise<boolean> =>
  fetch(src, { method: 'HEAD' })
    .then((response) => response.ok)
    .catch(() => false);

/** Probe a path once. Missing art must never break the layout or hide type. */
function useAssetReady(src: string): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    probe(src).then((ok) => {
      if (!cancelled) setReady(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  return ready;
}

/**
 * Walk a fallback chain until something exists.
 * `undefined` = still checking, `null` = nothing on disk, caller draws a plate.
 */
function useResolvedImage(primary: string): string | null | undefined {
  const [resolved, setResolved] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      for (const candidate of fallbackChain(primary)) {
        const ok = await probe(candidate);
        if (cancelled) return;
        if (ok) {
          setResolved(candidate);
          return;
        }
      }
      if (!cancelled) setResolved(null);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [primary]);

  return resolved;
}

/* -------------------------------------------------------------------------
   Chapter card.
   ------------------------------------------------------------------------- */

type ChapterCardProps = {
  chapter: Chapter;
  index: number;
  goldReady: boolean;
  register: (timeline: Timeline) => void;
};

function ChapterCard({ chapter, index, goldReady, register }: ChapterCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const numeralRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);

  // The card introduces itself once, when its pin takes the screen.
  useEffect(() => {
    const numeral = numeralRef.current;
    const label = labelRef.current;
    const body = bodyRef.current;
    if (!numeral || !label || !body) return undefined;

    const timeline = createTimeline({
      defaults: { ease: 'outExpo' },
      autoplay: false,
    });

    timeline
      .add(label, { opacity: [0, 1], translateY: [10, 0], duration: 900 }, 0)
      .add(numeral, { opacity: [0, 1], translateY: [56, 0], scale: [1.06, 1], duration: 1600 }, 120)
      .add(body, { opacity: [0, 1], translateY: [14, 0], duration: 1200, ease: 'inOutQuart' }, 620);

    register(timeline);

    const trigger = ScrollTrigger.create({
      trigger: cardRef.current,
      start: 'top 65%',
      once: true,
      onEnter: () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          timeline.seek(timeline.duration);
          return;
        }
        timeline.play();
      },
    });

    return () => {
      trigger.kill();
      timeline.revert();
    };
  }, [register, index]);

  return (
    <div ref={cardRef} className="relative flex min-h-[100svh] flex-col justify-center">
      <div className="frame relative z-10 max-w-5xl">
        <span ref={labelRef} className="label block text-gold opacity-0">
          Chapter {chapter.numeral} — {chapter.title}
        </span>

        <div className="mt-5 flex items-start gap-6">
          <span
            ref={numeralRef}
            aria-hidden
            className="display-italic block shrink-0 text-[clamp(4.5rem,11vw,10rem)] leading-[0.8] text-ivory/[0.14] opacity-0"
          >
            {chapter.numeral}
          </span>

          <div className="min-w-0 flex-1">
            <ChapterHeadline text={chapter.headline} goldReady={goldReady} />
            <p
              ref={bodyRef}
              className="mt-6 max-w-[26rem] text-body text-ivory/72 opacity-0"
            >
              {chapter.body}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The headline.
 *
 * React Bits MaskedHeading carries the gold texture as its fill. Until that
 * texture is delivered the same words are set behind it in the house gradient,
 * so the chapter is never headlined by an empty frame.
 */
function ChapterHeadline({ text, goldReady }: { text: string; goldReady: boolean }) {
  return (
    <div className="relative">
      <h2
        aria-hidden={goldReady}
        className={`display text-[clamp(2.6rem,7.2vw,6rem)] uppercase leading-[0.92] transition-opacity duration-[1200ms] ease-out-expo ${
          goldReady ? 'gold-gradient opacity-0' : 'gold-gradient opacity-100'
        }`}
      >
        {text}
      </h2>

      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 transition-opacity duration-[1200ms] ease-out-expo ${
          goldReady ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {goldReady ? (
          <MaskedHeading
            text={text}
            tag="h2"
            src={GOLD_TEXTURE}
            weight={300}
            tracking={-0.02}
            lineHeight={0.92}
            textScale={0.14}
            fillScale={1.1}
            parallax={18}
            brightness={1.15}
            saturation={1}
            reveal="rise"
            duration={1.4}
            stagger={0.08}
            trigger="view"
            align="left"
            style={{ textTransform: 'uppercase' }}
          />
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Reduced motion: a stack of stills, no pins, no scrubbing.
   ------------------------------------------------------------------------- */

/** One still, with its declared CSS plate underneath — never a broken image. */
function StillPlate({ chapter }: { chapter: Chapter }) {
  const resolved = useResolvedImage(chapter.still);
  const isFire = chapter.still === CINEMATIC.chapterFire;

  return (
    <div
      aria-hidden
      className={`absolute inset-0 ${isFire ? '' : CSS_PLATE}`}
      style={isFire ? FIRE_PLATE_STYLE : undefined}
    >
      {resolved ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(10,9,7,0.72), rgba(10,9,7,0.94)), url(${resolved})`,
          }}
        />
      ) : null}
    </div>
  );
}

function StillChapters() {
  const all = [CHAPTERS[0], CHAPTERS[1], INTERLUDE, CHAPTERS[2]];

  return (
    <div className="relative">
      {all.map((chapter) => (
        <section
          key={chapter.numeral}
          aria-label={`Chapter ${chapter.numeral} — ${chapter.title}`}
          className="relative flex min-h-[80svh] items-end overflow-hidden border-t border-line/40 bg-surface"
        >
          <StillPlate chapter={chapter} />
          <div className="frame relative z-10 w-full py-16">
            <span className="label block text-gold">
              Chapter {chapter.numeral} — {chapter.title}
            </span>
            <h2 className="display mt-4 text-[clamp(2.2rem,6vw,4.4rem)] uppercase leading-none gold-gradient">
              {chapter.headline}
            </h2>
            <p
              className={`mt-5 max-w-[24rem] text-ivory/72 ${
                chapter.beat === 'interlude' ? 'display-italic text-[1.4rem]' : 'text-body'
              }`}
            >
              {chapter.body}
            </p>
          </div>
        </section>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Interlude plate.

   The atelier image grows from a rounded frame to full bleed. When neither
   `atelier-hands.jpg` nor its fallback exists, the same frame expands as a
   dark surface inside a hairline rule — the gesture survives, the bytes do not.
   ------------------------------------------------------------------------- */

function InterludePlate() {
  const resolved = useResolvedImage(ATELIER_HANDS);

  const caption = (
    <p className="display-italic text-[clamp(1.5rem,4.4vw,3.6rem)] leading-tight text-ivory">
      Forty hours.
      <br />
      One ring.
    </p>
  );

  // Still checking: reserve the exact pinned height so nothing jumps when the
  // answer arrives. No image, no frame, no shift.
  if (resolved === undefined) {
    return <div aria-hidden className="h-[240svh]" />;
  }

  if (resolved === null) {
    return (
      <div className="relative h-[240svh]">
        <div className="sticky top-0 flex h-[100svh] items-center justify-center">
          <div className="relative flex h-[54svh] w-[46vw] min-w-[16rem] items-center justify-center overflow-hidden rounded-[18px] border border-line bg-surface">
            <div
              aria-hidden
              className="absolute inset-0 grain-veil opacity-70"
              style={{
                backgroundImage:
                  'radial-gradient(64% 58% at 50% 42%, rgba(201,169,97,0.14), transparent 72%)',
              }}
            />
            <div className="relative px-8 text-center">{caption}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollExpand
      src={resolved}
      alt="A jeweller's hands setting a diamond under a loupe lamp."
      startWidth={46}
      startHeight={54}
      startRadius={18}
      endRadius={0}
      mediaZoom={1.14}
      scrollDistance={1.2}
      holdDistance={0.2}
      smoothing={0.9}
      overlayScrim={0.42}
      useWindowScroll
    >
      {caption}
    </ScrollExpand>
  );
}

/* -------------------------------------------------------------------------
   The passage.
   ------------------------------------------------------------------------- */

export default function StoryChapters() {
  const reducedMotion = useReducedMotion();
  const goldReady = useAssetReady(GOLD_TEXTURE);

  const rootRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const timelines = useRef<Timeline[]>([]);
  /** −1 while the hero owns the screen; 0–3 inside the passage. */
  const [activeRail, setActiveRail] = useState<RailKey | null>(null);

  // Stable identity: cards must not rebuild their timelines on every scroll tick.
  const register = useCallback((timeline: Timeline) => {
    timelines.current.push(timeline);
  }, []);

  useEffect(
    () => () => {
      timelines.current.forEach((timeline) => timeline.revert());
      timelines.current = [];
    },
    []
  );

  // Scroll wiring. Nothing is created when motion is reduced.
  useEffect(() => {
    if (reducedMotion) return undefined;
    const root = rootRef.current;
    if (!root) return undefined;

    const sections = Array.from(
      root.querySelectorAll<HTMLElement>('[data-chapter]')
    );

    /** Letterbox tightens to 9vh for the length of a pin, then releases. */
    const setLetterbox = (tight: boolean) => {
      const value = tight ? '9vh' : '6vh';
      document.documentElement.style.setProperty('--letterbox', value);
      gsap.to('.letterbox-panel', {
        height: value,
        duration: tight ? 1.2 : 1.4,
        ease: 'expo.out',
        overwrite: 'auto',
      });
    };

    const triggers: ScrollTrigger[] = [];

    sections.forEach((section) => {
      const chapter = CHAPTERS.find((entry) => entry.numeral === section.dataset.numeral);
      const isInterlude = section.dataset.beat === 'interlude';
      const beat: StageBeat = isInterlude ? 'interlude' : chapter?.beat ?? 'stone';
      const from = isInterlude ? INTERLUDE.from : chapter?.from ?? 0;
      const to = isInterlude ? INTERLUDE.to : chapter?.to ?? 0.3;

      // The interlude is driven by ScrollExpand's own sticky track, so it is
      // observed rather than pinned twice.
      const shouldPin = !isInterlude;

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: isInterlude ? 'bottom bottom' : '+=170%',
        pin: shouldPin,
        pinSpacing: shouldPin,
        scrub: 1.2,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          setStageDirection({ beat, progress: from + self.progress * (to - from) });
        },
        onToggle: (self) => {
          setLetterbox(self.isActive);
        },
        onEnter: () => {
          setActiveRail(isInterlude ? 'interlude' : (chapter?.rail ?? 'stone'));
          setLetterbox(true);
        },
        onEnterBack: () => {
          setActiveRail(isInterlude ? 'interlude' : (chapter?.rail ?? 'stone'));
          setLetterbox(true);
        },
        onLeave: () => setLetterbox(false),
        onLeaveBack: () => setLetterbox(false),
      });

      triggers.push(trigger);

      // THE STONE: the room darkens as the camera closes on the gem.
      const veil = section.querySelector<HTMLElement>('[data-veil]');
      if (veil) {
        const darken = gsap.fromTo(
          veil,
          { opacity: 0.25 },
          {
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: shouldPin ? '+=170%' : 'bottom bottom',
              scrub: 1.2,
            },
          }
        );
        if (darken.scrollTrigger) triggers.push(darken.scrollTrigger);
      }
    });

    // The rail also indexes the chapters that live below this component.
    LATER_SECTIONS.forEach(({ id, key }) => {
      const node = document.getElementById(id);
      if (!node) return;

      triggers.push(
        ScrollTrigger.create({
          trigger: node,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => setActiveRail(key),
          onEnterBack: () => setActiveRail(key),
          onLeaveBack: () => setActiveRail(null),
        })
      );
    });

    // Leaving the passage entirely hands the camera back to the hero.
    const release = ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom bottom',
      onLeave: () => {
        setStageDirection({ beat: null });
        setLetterbox(false);
      },
      onLeaveBack: () => {
        setStageDirection({ beat: null });
        setActiveRail(null);
        setLetterbox(false);
      },
    });
    triggers.push(release);

    ScrollTrigger.refresh();

    // Web fonts and the art land after the pins are measured.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      triggers.forEach((trigger) => trigger.kill());
      document.documentElement.style.removeProperty('--letterbox');
      gsap.set('.letterbox-panel', { height: '6vh', overwrite: true });
      setStageDirection({ beat: null });
    };
  }, [reducedMotion]);

  if (reducedMotion) {
    return (
      <div id="story" className="relative">
        <div className="frame pb-4 pt-[calc(var(--letterbox)+4rem)]">
          <span className="label">Chapters — the making</span>
        </div>
        <StillChapters />
      </div>
    );
  }

  return (
    <div id="story" ref={rootRef} className="relative">
      {/* Progress rail — a quiet index of the passage. */}
      <div
        ref={railRef}
        aria-hidden
        className={`pointer-events-none fixed left-[clamp(0.6rem,2vw,1.6rem)] top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-5 transition-opacity duration-1200 ease-out-expo sm:flex ${
          activeRail !== null ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="block h-14 w-px bg-gradient-to-b from-transparent to-line" />
        {RAIL.map((tick) => (
          <div key={tick.key} className="flex items-center gap-3">
            <span
              className={`block transition-all duration-[900ms] ease-out-expo ${
                tick.key === activeRail ? 'h-px w-7 bg-gold-bright' : 'h-px w-3.5 bg-muted/60'
              }`}
            />
            <span
              className={`label whitespace-nowrap transition-opacity duration-[900ms] ease-out-expo ${
                tick.key === activeRail ? 'text-gold opacity-100' : 'opacity-0'
              }`}
            >
              {tick.label}
            </span>
            <span className="label text-muted/50">{tick.numeral}</span>
          </div>
        ))}
        <span className="block h-14 w-px bg-gradient-to-t from-transparent to-line" />
      </div>

      {/* CHAPTER II — THE STONE. The room darkens around the gem. */}
      <section
        data-chapter
        data-numeral="II"
        data-beat="stone"
        aria-label="Chapter II — The Stone"
        className="relative"
      >
        <div
          data-veil
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(58% 48% at 50% 46%, rgba(10,9,7,0.35), rgba(10,9,7,0.94) 76%)',
          }}
        />
        <GradualBlur position="top" target="parent" height="9vh" strength={2.4} tint="#0A0907" />
        <GradualBlur position="bottom" target="parent" height="9vh" strength={2.4} tint="#0A0907" />
        <ChapterCard chapter={CHAPTERS[0]} index={0} goldReady={goldReady} register={register} />
      </section>

      {/* CHAPTER III — THE FIRE. */}
      <section
        data-chapter
        data-numeral="III"
        data-beat="fire"
        aria-label="Chapter III — The Fire"
        className="relative border-t border-line/30"
      >
        <GradualBlur position="top" target="parent" height="8vh" strength={2} tint="#0A0907" />
        <GradualBlur position="bottom" target="parent" height="8vh" strength={2} tint="#0A0907" />
        <div className="flex min-h-[100svh] flex-col justify-center">
          <ChapterCard chapter={CHAPTERS[1]} index={1} goldReady={goldReady} register={register} />
        </div>
      </section>

      {/* INTERLUDE — the atelier, growing from a frame to full bleed. */}
      <section
        data-chapter
        data-beat="interlude"
        data-numeral="III · IV"
        aria-label="Interlude — the atelier"
        className="relative"
      >
        <InterludePlate />
      </section>

      {/* CHAPTER IV — THE HAND. */}
      <section
        data-chapter
        data-numeral="IV"
        data-beat="hand"
        aria-label="Chapter IV — The Hand"
        className="relative border-t border-line/30"
      >
        <GradualBlur position="top" target="parent" height="9vh" strength={2.4} tint="#0A0907" />
        <GradualBlur position="bottom" target="parent" height="9vh" strength={2.4} tint="#0A0907" />
        <ChapterCard chapter={CHAPTERS[2]} index={3} goldReady={goldReady} register={register} />
      </section>
    </div>
  );
}
