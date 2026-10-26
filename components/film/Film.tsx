'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useProgress } from '@react-three/drei';
import { createTimeline, stagger } from 'animejs';
import { useViewportTier, useWebGL2Support } from '@/components/three/useViewportTier';
import { SafeWebGLBoundary } from '@/components/three/SafeWebGLBoundary';
import { useReducedMotion } from '@/lib/useReducedMotion';
import Hero from '@/components/sections/Hero';
import StoryChapters from '@/components/sections/StoryChapters';
import { beatWeight, film, type FilmBeat } from './filmStore';

gsap.registerPlugin(ScrollTrigger);

const FilmCanvas = dynamic(() => import('./FilmCanvas'), { ssr: false });

type Card = {
  beat: Exclude<FilmBeat, 'intro'>;
  numeral: string;
  label: string;
  title: string;
  titleItalic: string;
  body: string;
  side: 'left' | 'right' | 'center';
};

const CARDS: Card[] = [
  {
    beat: 'stone',
    numeral: 'II',
    label: 'The Stone',
    title: 'Chosen under',
    titleItalic: 'north light.',
    body: 'Every diamond is graded by eye before a single prong is drawn. Most are refused.',
    side: 'left',
  },
  {
    beat: 'fire',
    numeral: 'III',
    label: 'The Fire',
    title: 'Gold, at the heat',
    titleItalic: 'where it remembers.',
    body: 'Cast at 1,064°C in our Surat foundry, then cooled slowly so the metal keeps its weight.',
    side: 'right',
  },
  {
    beat: 'hand',
    numeral: 'IV',
    label: 'The Hand',
    title: 'Forty hours,',
    titleItalic: 'one bench.',
    body: 'Set, polished and signed by the same pair of hands. No line. No shift change.',
    side: 'left',
  },
];

const RAIL: { beat: FilmBeat; numeral: string }[] = [
  { beat: 'intro', numeral: 'I' },
  { beat: 'stone', numeral: 'II' },
  { beat: 'fire', numeral: 'III' },
  { beat: 'hand', numeral: 'IV' },
  { beat: 'finale', numeral: 'V' },
];

/**
 * THE FILM — the home page's opening, in one take.
 *
 * A 640vh scroll track drives a single WebGL scene: gold dust assembles into
 * the ring, the camera dives into the stone, the band is heated and cooled,
 * polished, and finally presented. The copy rides on a sticky layer above.
 *
 * No WebGL → the photographic hero and chapters take over, unchanged.
 */
export default function Film() {
  const webgl = useWebGL2Support();
  const tier = useViewportTier();
  const reducedMotion = useReducedMotion();
  const [crashed, setCrashed] = useState(false);

  if (!webgl.ready || !tier.ready) {
    return <section aria-label="AURELIA" className="relative h-dvh bg-bg" />;
  }

  if (!webgl.supported || crashed) {
    return (
      <>
        <Hero />
        <StoryChapters />
      </>
    );
  }

  return (
    <>
      <SafeWebGLBoundary fallback={<CrashReporter onCrash={() => setCrashed(true)} />}>
        <FilmCanvas isMobile={tier.isMobile} reducedMotion={reducedMotion} />
      </SafeWebGLBoundary>
      <FilmTrack reducedMotion={reducedMotion} />
      <Loader />
    </>
  );
}

function CrashReporter({ onCrash }: { onCrash: () => void }) {
  useEffect(() => {
    film.markLoaded();
    onCrash();
  }, [onCrash]);
  return null;
}

function FilmTrack({ reducedMotion }: { reducedMotion: boolean }) {
  const track = useRef<HTMLElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const hero = useRef<HTMLDivElement>(null);
  const finale = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const railFill = useRef<HTMLSpanElement>(null);
  const cue = useRef<HTMLDivElement>(null);

  // Scroll → film progress → copy.
  useEffect(() => {
    const node = track.current;
    if (!node) return undefined;

    const paint = (progress: number) => {
      film.setProgress(progress);

      const heroOut = 1 - Math.min(1, progress / 0.09);
      if (hero.current) {
        hero.current.style.opacity = String(film.get().assembled ? heroOut : 0);
        hero.current.style.transform = `translate3d(0, ${-progress * 260}px, 0)`;
      }
      if (cue.current) cue.current.style.opacity = String(film.get().assembled ? heroOut : 0);

      CARDS.forEach((card, i) => {
        const el = cards.current[i];
        if (!el) return;
        const w = beatWeight(card.beat, progress);
        el.style.opacity = String(w);
        el.style.transform = `translate3d(0, ${(1 - w) * 36}px, 0)`;
        el.style.filter = `blur(${(1 - w) * 8}px)`;
        el.style.visibility = w > 0.002 ? 'visible' : 'hidden';
      });

      if (finale.current) {
        const w = beatWeight('finale', progress);
        finale.current.style.opacity = String(w);
        finale.current.style.transform = `translate3d(0, ${(1 - w) * 30}px, 0)`;
        finale.current.style.visibility = w > 0.002 ? 'visible' : 'hidden';
        finale.current.style.pointerEvents = w > 0.6 ? 'auto' : 'none';
      }

      if (railFill.current) railFill.current.style.transform = `scaleY(${progress})`;
      if (rail.current) rail.current.style.opacity = String(progress > 0.04 && progress < 0.99 ? 1 : 0);
    };

    const trigger = ScrollTrigger.create({
      trigger: node,
      start: 'top top',
      end: 'bottom bottom',
      scrub: reducedMotion ? false : 0.6,
      onUpdate: (self) => paint(self.progress),
      onLeave: () => film.setActive(false),
      onEnterBack: () => film.setActive(true),
    });

    paint(trigger.progress);
    const unsubscribe = film.subscribe(() => paint(trigger.progress));

    return () => {
      unsubscribe();
      trigger.kill();
      film.setActive(true);
    };
  }, [reducedMotion]);

  // Pointer → camera parallax.
  useEffect(() => {
    if (reducedMotion) return undefined;
    const onMove = (event: PointerEvent) => {
      film.setPointer((event.clientX / window.innerWidth) * 2 - 1, -((event.clientY / window.innerHeight) * 2 - 1));
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reducedMotion]);

  // The title arrives the moment the ring is whole.
  useEffect(() => {
    const el = hero.current;
    if (!el) return undefined;
    let timeline: ReturnType<typeof createTimeline> | null = null;

    const play = () => {
      if (!film.get().assembled || timeline) return;
      const letters = el.querySelectorAll<HTMLElement>('[data-letter]');
      const lines = el.querySelectorAll<HTMLElement>('[data-line]');
      if (reducedMotion) {
        letters.forEach((l) => {
          l.style.opacity = '1';
          l.style.transform = 'none';
        });
        lines.forEach((l) => (l.style.opacity = '1'));
        return;
      }
      timeline = createTimeline({ defaults: { ease: 'outExpo' } })
        .add(letters, { opacity: [0, 1], translateY: ['0.6em', '0em'], rotateX: [70, 0], filter: ['blur(12px)', 'blur(0px)'], duration: 1600, delay: stagger(70) }, 0)
        .add(lines, { opacity: [0, 1], translateY: [14, 0], duration: 1200, delay: stagger(140) }, 650);
    };

    play();
    const unsubscribe = film.subscribe(play);
    return () => {
      unsubscribe();
      timeline?.revert();
    };
  }, [reducedMotion]);

  return (
    <section ref={track} id="film" aria-label="The making of an Aurelia ring" className="relative z-10 h-[640vh]">
      <div className="sticky top-0 h-dvh w-full overflow-hidden">
        {/* I — Title */}
        <div ref={hero} className="pointer-events-none absolute inset-x-0 bottom-0 frame pb-[calc(var(--letterbox)+3.5rem)] opacity-0 will-change-transform">
          <p data-line className="label mb-6 text-gold opacity-0">Fine Jewellery · Surat · Since 1998</p>
          <h1
            aria-label="AURELIA"
            className="font-display font-[300] uppercase leading-[0.82] tracking-[0.04em] text-[clamp(4.2rem,15vw,15rem)] [perspective:900px]"
          >
            {'AURELIA'.split('').map((letter, i) => (
              <span
                key={`${letter}-${i}`}
                data-letter
                aria-hidden
                className="gold-letter inline-block opacity-0 [transform-origin:50%_100%]"
                // One continuous gradient across seven letters, each showing its own slice.
                style={{ backgroundSize: '700% 100%', backgroundPosition: `${(i / 6) * 100}% 50%` }}
              >
                {letter}
              </span>
            ))}
          </h1>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <p data-line className="max-w-sm font-display text-[clamp(1.25rem,2vw,1.6rem)] italic leading-snug text-ivory/85 opacity-0">
              Made once. Made to be inherited.
            </p>
          </div>
        </div>

        <div ref={cue} className="pointer-events-none absolute bottom-[calc(var(--letterbox)+1.4rem)] right-[clamp(1.25rem,5vw,5rem)] flex items-center gap-4 opacity-0">
          <span className="label text-ivory/60">Scroll to begin</span>
          <span className="relative block h-12 w-px overflow-hidden bg-line">
            <span className="scroll-cue absolute inset-x-0 top-0 h-1/2 bg-gold" />
          </span>
        </div>

        {/* II–IV — chapter cards */}
        {CARDS.map((card, i) => (
          <div
            key={card.beat}
            ref={(el) => {
              cards.current[i] = el;
            }}
            className={`pointer-events-none invisible absolute top-1/2 w-[min(92vw,30rem)] -translate-y-1/2 opacity-0 ${
              card.side === 'left' ? 'left-[clamp(1.25rem,6vw,7rem)]' : 'right-[clamp(1.25rem,6vw,7rem)]'
            }`}
          >
            <div className="film-card">
              <div className="flex items-baseline gap-4">
                <span className="font-display text-[clamp(3.5rem,6vw,5.5rem)] italic leading-none text-gold">{card.numeral}</span>
                <span className="label text-gold-bright/80">{card.label}</span>
              </div>
              <h2 className="mt-6 font-display text-[clamp(2.1rem,3.6vw,3.4rem)] font-[300] leading-[1.02] text-ivory">
                {card.title} <em className="text-gold-bright">{card.titleItalic}</em>
              </h2>
              <span aria-hidden className="mt-6 block h-px w-16 bg-gold/60" />
              <p className="mt-6 max-w-[24rem] text-[0.95rem] leading-[1.8] text-ivory/75">{card.body}</p>
            </div>
          </div>
        ))}

        {/* V — the piece, presented */}
        <div ref={finale} className="invisible absolute inset-x-0 bottom-[calc(var(--letterbox)+2.5rem)] frame flex flex-col items-center text-center opacity-0">
          <p className="label text-gold">V — The Aurelia Halo</p>
          <h2 className="mt-4 font-display text-[clamp(2.4rem,5vw,4.6rem)] font-[300] leading-[1] text-ivory">
            One ring. <em className="text-gold-bright">Made once.</em>
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            <a href="#configure" className="label inline-flex min-h-12 items-center border border-gold/60 px-8 text-gold-bright transition-colors duration-700 hover:bg-gold hover:text-bg">
              Make it yours
            </a>
            <a href="#bespoke" className="label inline-flex min-h-12 items-center text-ivory/80 underline decoration-gold/50 underline-offset-8 transition-colors duration-700 hover:text-gold-bright">
              Book a private viewing
            </a>
          </div>
        </div>

        {/* Chapter rail */}
        <div ref={rail} aria-hidden className="pointer-events-none absolute left-[clamp(0.75rem,2vw,2rem)] top-1/2 hidden -translate-y-1/2 items-stretch gap-4 opacity-0 transition-opacity duration-700 lg:flex">
          <span className="relative block w-px overflow-hidden bg-line">
            <span ref={railFill} className="absolute inset-0 origin-top scale-y-0 bg-gold" />
          </span>
          <ol className="flex flex-col justify-between gap-6">
            {RAIL.map((r) => (
              <li key={r.beat} className="label text-ivory/50">
                {r.numeral}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** Black frame with a live count until the ring, stones and studio are loaded. */
function Loader() {
  const { progress } = useProgress();
  const [gone, setGone] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const check = () => {
      if (film.get().loaded) setGone(true);
    };
    check();
    const unsubscribe = film.subscribe(check);
    // Never hold the visitor hostage: after 12s, open the curtain anyway.
    const timeout = window.setTimeout(() => setGone(true), 12000);
    return () => {
      unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!gone) return undefined;
    const t = window.setTimeout(() => setHidden(true), 1100);
    return () => window.clearTimeout(t);
  }, [gone]);

  if (hidden) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-bg transition-opacity duration-1000"
      style={{ opacity: gone ? 0 : 1 }}
    >
      <p className="font-display text-[clamp(1.6rem,3vw,2.4rem)] font-[300] tracking-[0.5em] text-gold-bright">AURELIA</p>
      <span className="mt-8 block h-px w-40 overflow-hidden bg-line">
        <span className="block h-full bg-gold transition-transform duration-500" style={{ transform: `scaleX(${progress / 100})`, transformOrigin: 'left' }} />
      </span>
      <p className="label mt-5 tabular-nums text-ivory/50">{String(Math.round(progress)).padStart(3, '0')}</p>
    </div>
  );
}
