'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const BlurText = dynamic(() => import('@/components/reactbits/BlurText/BlurText'), {
  ssr: false,
  loading: () => null,
});

const ScrollExpand = dynamic(() => import('@/components/reactbits/ScrollExpand/ScrollExpand'), {
  ssr: false,
});

interface ChapterData {
  numeral: string;
  title: string;
  headline: string;
  body: string;
  image: string;
  alt: string;
}

const CHAPTER_STONE: ChapterData = {
  numeral: 'II',
  title: 'The Stone',
  headline: 'The Stone',
  body: 'Every stone is chosen by hand, under north light.',
  image: '/cinematic/chapter-stone.jpg',
  alt: 'Rough and cut diamonds inspected under north light',
};

const CHAPTER_FIRE: ChapterData = {
  numeral: 'III',
  title: 'The Fire',
  headline: 'The Fire',
  body: 'Gold is worked at the temperature where it remembers.',
  image: '/cinematic/chapter-fire.jpg',
  alt: 'Molten gold and torch flames in the Surat jewellery atelier',
};

const CHAPTER_HAND: ChapterData = {
  numeral: 'IV',
  title: 'The Hand',
  headline: 'The Hand',
  body: 'A pattern cut by hand, then worn smooth by a lifetime.',
  image: '/cinematic/chapter-hand.jpg',
  alt: 'Master artisan hand-engraving fine jewellery',
};

function ChapterSection({ chapter, isFirst = false }: { chapter: ChapterData; isFirst?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const imageWrap = imageWrapRef.current;
    if (!section || !imageWrap) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const tween = gsap.fromTo(
      imageWrap,
      { yPercent: -12 },
      {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id={isFirst ? 'story' : undefined}
      aria-label={`Chapter ${chapter.numeral} — ${chapter.title}`}
      className="relative flex min-h-[80svh] w-full items-center overflow-hidden bg-bg lg:h-[100svh]"
    >
      {/* Background with GSAP ScrollTrigger parallax: yPercent -12 -> 12, scrub true */}
      <div
        ref={imageWrapRef}
        className="absolute inset-x-0 -bottom-[14%] -top-[14%] z-0 h-[128%] w-full overflow-hidden will-change-transform"
      >
        <Image
          src={chapter.image}
          alt={chapter.alt}
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Overlay: gradient from #0A0907 at 90% on the left to transparent at 60% */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(to right, rgba(10, 9, 7, 0.92) 0%, rgba(10, 9, 7, 0.82) 35%, rgba(10, 9, 7, 0.4) 50%, transparent 60%)',
        }}
      />

      {/* Left-aligned text content */}
      <div className="frame relative z-20 w-full py-16">
        <div className="max-w-2xl text-left">
          {/* Gold chapter label */}
          <span className="label block text-gold tracking-[0.32em]">
            Chapter {chapter.numeral} — {chapter.title}
          </span>

          <div className="mt-4 flex items-baseline gap-6 sm:gap-8">
            {/* Giant italic numeral (II / III / IV): Cormorant italic, gold, 8–10rem */}
            <span
              aria-hidden
              className="display-italic block shrink-0 select-none text-gold text-[clamp(6rem,11vw,10rem)] leading-[0.82]"
            >
              {chapter.numeral}
            </span>

            <div className="min-w-0 flex-1">
              {/* Headline: Cormorant 300, ivory, 3.5–5rem, BlurText by word 900ms */}
              <BlurText
                text={chapter.headline}
                animateBy="words"
                stepDuration={0.45}
                delay={120}
                className="font-display font-[300] text-ivory text-[clamp(3.5rem,6vw,5rem)] leading-[0.92]"
              />
            </div>
          </div>

          {/* One line of body copy */}
          <p className="mt-6 max-w-md text-base leading-relaxed text-ivory/80 sm:text-lg">
            {chapter.body}
          </p>
        </div>
      </div>
    </section>
  );
}

function InterludeSection() {
  const caption = (
    <p className="display-italic text-[clamp(1.5rem,4.4vw,3.6rem)] leading-tight text-ivory">
      Forty hours.
      <br />
      One ring.
    </p>
  );

  return (
    <section aria-label="Interlude — the atelier" className="relative">
      <ScrollExpand
        src="/cinematic/atelier-hands.jpg"
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
    </section>
  );
}

export default function StoryChapters() {
  return (
    <div className="relative">
      {/* Chapter II — The Stone */}
      <ChapterSection chapter={CHAPTER_STONE} isFirst />

      {/* Chapter III — The Fire */}
      <ChapterSection chapter={CHAPTER_FIRE} />

      {/* Interlude — the atelier (ScrollExpand kept intact) */}
      <InterludeSection />

      {/* Chapter IV — The Hand */}
      <ChapterSection chapter={CHAPTER_HAND} />
    </div>
  );
}
