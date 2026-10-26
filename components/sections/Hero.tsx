'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { createTimeline, stagger, type Timeline } from 'animejs';
import {
  CameraRigProvider,
  useCameraRig,
  useCameraRigStore,
} from '@/components/three/CameraRigContext';
import { useAnimatingCanvasSlot } from '@/components/three/canvasPolicy';
import { useViewportTier, useWebGL2Support } from '@/components/three/useViewportTier';

/**
 * Title card.
 *
 * Layer order, back to front:
 *   0   LightRays        — one warm gold source at top centre
 *   10  AURELIA wordmark — MetallicPaint, 82vw, gold
 *   20  Stage            — the ring, fixed, overlaps the letters
 *   30  copy             — one small-caps line, one link
 *
 * Nothing else. The brand is the composition.
 */

const Stage = dynamic(() => import('@/components/three/Stage'), { ssr: false });
const LightRays = dynamic(() => import('@/components/reactbits/LightRays/LightRays'), { ssr: false });
const MetallicPaint = dynamic(() => import('@/components/reactbits/MetallicPaint/MetallicPaint'), {
  ssr: false,
});

const TAGLINE = 'Fine Jewellery · Surat · Since 1998';

export default function Hero() {
  const rig = useCameraRigStore();

  return (
    <CameraRigProvider value={rig}>
      <HeroFrame />
    </CameraRigProvider>
  );
}

function HeroFrame() {
  const rig = useCameraRig();
  const webgl = useWebGL2Support();

  const wordmarkRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const timelineRef = useRef<Timeline | null>(null);

  const [displayFamily, setDisplayFamily] = useState('Georgia, Times New Roman, serif');

  // The canvas needs a real family list, not a CSS variable.
  useEffect(() => {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim();
    if (value) setDisplayFamily(value);
  }, []);

  // No WebGL, no dolly: settle quickly so the type is never held hostage.
  const markSettled = rig.markSettled;
  useEffect(() => {
    if (!webgl.ready || webgl.supported) return undefined;
    const timer = window.setTimeout(() => markSettled(), 900);
    return () => window.clearTimeout(timer);
  }, [webgl.ready, webgl.supported, markSettled]);

  // Ring settles → wordmark fades up → the line arrives letter by letter.
  useEffect(() => {
    if (!rig.settled) return undefined;

    const wordmark = wordmarkRef.current;
    const tagline = taglineRef.current;
    const link = linkRef.current;
    if (!wordmark || !tagline || !link) return undefined;

    const letters = Array.from(tagline.querySelectorAll<HTMLElement>('[data-letter]'));

    timelineRef.current?.revert();

    if (rig.reducedMotion) {
      wordmark.style.opacity = '1';
      wordmark.style.transform = 'none';
      letters.forEach((letter) => {
        letter.style.opacity = '1';
        letter.style.transform = 'none';
      });
      link.style.opacity = '1';
      return undefined;
    }

    const timeline = createTimeline({ defaults: { ease: 'outExpo' } });

    timeline
      .add(wordmark, { opacity: [0, 1], translateY: [28, 0], duration: 1600 }, 0)
      .add(letters, { opacity: [0, 1], translateY: [6, 0], duration: 1200, delay: stagger(26) }, 420)
      .add(link, { opacity: [0, 1], translateY: [8, 0], duration: 1200 }, 940);

    timelineRef.current = timeline;

    return () => {
      timeline.revert();
      timelineRef.current = null;
    };
  }, [rig.settled, rig.reducedMotion]);

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate min-h-dvh w-full overflow-hidden bg-bg"
    >
      <h1 id="hero-title" className="sr-only">
        AURELIA — Fine Jewellery, Surat
      </h1>

      {/* Back layer: one warm source at top centre, slow. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <RaysLayer supported={webgl.supported} />
      </div>

      {/* Middle layer: the wordmark, behind the ring. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[45%] z-10 -translate-y-1/2"
      >
        <div
          ref={wordmarkRef}
          className="mx-auto flex h-[clamp(3.25rem,12.6vw,12.6rem)] w-[82vw] max-w-[1680px] items-center justify-center opacity-0"
        >
          {webgl.supported ? (
            <MetallicPaint
              text="AURELIA"
              fontFamily={displayFamily}
              fontWeight={300}
              color="#C9A961"
              backgroundColor="transparent"
              density={2.4}
              softness={0.16}
              dispersion={0.34}
              distortion={0.05}
              edgeBend={0.5}
              angle={68}
              speed={0}
              scale={1}
              rotation={0}
              mouseTilt={0}
              lightMode={false}
              intro={false}
              paused
              dpr={1.5}
              className="h-full w-full"
            />
          ) : (
            <span className="display gold-gradient text-[clamp(3rem,12.2vw,12.2rem)] uppercase leading-none">
              Aurelia
            </span>
          )}
        </div>
      </div>

      {/*
        Front layer: the ring, fixed for the whole home page, above the letters.
        `screen` blending is deliberate insurance — a post-processed transparent
        canvas is composited as light, never as an opaque card, so the wordmark
        can never be buried by a black frame.
      */}
      <div
        className="pointer-events-none fixed inset-0 z-20"
        style={{ mixBlendMode: 'screen' }}
      >
        <Stage />
      </div>

      {/* Copy: a small-caps line and one link. */}
      <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-end">
        <div className="frame flex w-full flex-col gap-6 pb-[calc(var(--letterbox)+2.25rem)] sm:flex-row sm:items-end sm:justify-between">
          <p ref={taglineRef} className="label max-w-[18rem] leading-[1.9] text-ivory/70">
            {TAGLINE.split('').map((character, index) => (
              <span
                key={`${character}-${index}`}
                data-letter
                className="inline-block translate-y-[6px] opacity-0"
              >
                {character === ' ' ? '\u00A0' : character}
              </span>
            ))}
          </p>

          <a
            ref={linkRef}
            href="#collection"
            className="group pointer-events-auto inline-flex translate-y-2 items-center gap-5 opacity-0 focus-visible:outline-offset-8"
          >
            <span className="label text-ivory/85 transition-colors duration-[900ms] ease-out-expo group-hover:text-gold-bright">
              Enter the Collection
            </span>
            <span
              aria-hidden
              className="relative flex h-px w-14 overflow-hidden bg-line-soft"
            >
              <span className="absolute inset-0 origin-left scale-x-0 bg-gold transition-transform duration-[1200ms] ease-out-expo group-hover:scale-x-100" />
            </span>
            <span
              aria-hidden
              className="text-[0.9rem] text-gold transition-transform duration-[900ms] ease-out-expo group-hover:translate-y-1"
            >
              ↓
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

/**
 * The back layer.
 * Claims one of the two animating WebGL slots; if it cannot, a static CSS light
 * field takes over so the hero is never flat black.
 */
function RaysLayer({ supported }: { supported: boolean }) {
  const hasSlot = useAnimatingCanvasSlot('rays', supported);
  const { isMobile } = useViewportTier();

  if (!supported || !hasSlot) return <LightFallback />;

  return (
    <LightRays
      raysOrigin="top-center"
      raysColor="#EBD8A6"
      raysSpeed={0.28}
      lightSpread={0.44}
      rayLength={2.6}
      rayDensity={0.85}
      tilt={0}
      raySharpness={0.72}
      glow={0.34}
      haze={0.16}
      atmosphere={0.55}
      intensity={0.5}
      saturation={0.35}
      fadeDistance={1.1}
      noiseAmount={0.05}
      distortion={0.02}
      pulsating={false}
      followMouse={false}
      clickPulse={false}
      cursorShadow={false}
      intro
      opacity={0.9}
      maxDevicePixelRatio={isMobile ? 1.25 : 1.5}
      className="h-full w-full"
    />
  );
}

function LightFallback() {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          'radial-gradient(58% 46% at 50% -6%, rgba(235,216,166,0.22), rgba(201,169,97,0.08) 44%, transparent 72%)',
      }}
    />
  );
}
