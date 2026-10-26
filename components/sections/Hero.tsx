'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { animate } from 'animejs';

const SplitText = dynamic(() => import('@/components/reactbits/SplitText/SplitText'), {
  ssr: false,
  loading: () => (
    <h1 className="hero-wordmark font-display font-[300] text-[clamp(4rem,14vw,13rem)] leading-[0.88] tracking-[0.02em] uppercase">
      AURELIA
    </h1>
  ),
});

export default function Hero() {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imageRef.current) return;
    animate(imageRef.current, {
      scale: [1.08, 1.0],
      duration: 2400,
      ease: 'outCubic',
    });
  }, []);

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate min-h-dvh w-full overflow-hidden bg-bg"
    >
      {/* Background photograph: scales slowly from 1.08 to 1.0 over 2.4s */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          ref={imageRef}
          src="/jewelry/featured-1.webp"
          alt="AURELIA Solitaire fine diamond ring"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center will-change-transform"
        />
      </div>

      {/* Overlay: gradient from #0A0907 at 85% (bottom) to transparent at 55% */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(to top, rgba(10, 9, 7, 0.95) 0%, rgba(10, 9, 7, 0.85) 28%, rgba(10, 9, 7, 0.5) 42%, transparent 55%), linear-gradient(to bottom, rgba(10, 9, 7, 0.45) 0%, transparent 22%)',
        }}
      />

      {/* Content pinned to bottom-left */}
      <div className="relative z-20 flex min-h-dvh flex-col justify-end px-[clamp(1.25rem,5vw,5rem)] pb-[clamp(2.5rem,6vh,5.5rem)]">
        <div className="max-w-6xl">
          {/* Giant Wordmark: bottom-left, Cormorant 300, clamp(4rem,14vw,13rem), gold gradient */}
          <div className="flex">
            <SplitText
              text="AURELIA"
              tag="h1"
              splitType="chars"
              delay={40}
              duration={1.2}
              trigger="load"
              from={{ opacity: 0, y: 60 }}
              to={{ opacity: 1, y: 0 }}
              textAlign="left"
              className="hero-wordmark font-display font-[300] text-[clamp(4rem,14vw,13rem)] leading-[0.88] tracking-[0.02em] uppercase"
            />
          </div>

          {/* Below wordmark */}
          <div className="mt-8 flex flex-col gap-6 sm:mt-10 sm:flex-row sm:items-center sm:gap-10">
            <p className="label tracking-[0.32em] text-ivory/80">
              Fine Jewellery · Surat · Since 1998
            </p>

            <div className="flex flex-wrap items-center gap-6">
              <a
                href="#collection"
                className="label inline-flex items-center gap-3 border border-gold/70 bg-[#0A0907]/40 px-7 py-3.5 text-ivory backdrop-blur-sm transition-all duration-500 hover:border-gold hover:bg-gold/15 hover:text-gold-bright focus-visible:outline-offset-8"
              >
                <span>Enter the Collection</span>
                <span aria-hidden className="text-gold">↓</span>
              </a>

              <a
                href="#bespoke"
                className="label text-ivory/70 underline underline-offset-8 decoration-gold/40 transition-colors duration-500 hover:text-gold-bright hover:decoration-gold focus-visible:outline-offset-8"
              >
                Book a Private Viewing
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
