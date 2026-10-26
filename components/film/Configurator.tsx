'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import { useViewportTier, useWebGL2Support } from '@/components/three/useViewportTier';
import { SafeWebGLBoundary } from '@/components/three/SafeWebGLBoundary';
import { METALS, type MetalKey } from './useRingAsset';

const ConfiguratorScene = dynamic(() => import('./ConfiguratorScene'), { ssr: false });

const BASE_PRICE = 1285000;
const METAL_PRICE: Record<MetalKey, number> = { yellow: 0, rose: 0, white: 18000, platinum: 96000 };
const FINISH_PRICE = { polished: 0, satin: 12000 } as const;
const SWATCH: Record<MetalKey, string> = {
  yellow: 'linear-gradient(135deg,#7d5f28,#f2d48c 45%,#b48a3c)',
  rose: 'linear-gradient(135deg,#8c5443,#f3c0aa 45%,#b77a64)',
  white: 'linear-gradient(135deg,#8d8f95,#f4f4f6 45%,#b3b5bb)',
  platinum: 'linear-gradient(135deg,#6f7278,#dfe2e7 45%,#9a9da3)',
};

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

/**
 * MAKE IT YOURS — the halo ring on a turntable.
 * Drag to turn it; choose the metal and the finish; the price follows.
 */
export default function Configurator() {
  const [metal, setMetal] = useState<MetalKey>('yellow');
  const [finish, setFinish] = useState<'polished' | 'satin'>('polished');
  const [inView, setInView] = useState(false);
  const [ready, setReady] = useState(false);
  const webgl = useWebGL2Support();
  const tier = useViewportTier();
  const section = useRef<HTMLElement>(null);
  const priceRef = useRef<HTMLSpanElement>(null);
  const shown = useRef(BASE_PRICE);

  const price = BASE_PRICE + METAL_PRICE[metal] + FINISH_PRICE[finish];

  // Mount the turntable only near the viewport; drop it again when far away.
  useEffect(() => {
    const node = section.current;
    if (!node) return undefined;
    const io = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), { rootMargin: '40% 0px' });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  // The price rolls to its new value.
  useEffect(() => {
    const el = priceRef.current;
    if (!el) return undefined;
    const counter = { value: shown.current };
    const anim = animate(counter, {
      value: price,
      duration: 900,
      ease: 'outExpo',
      onUpdate: () => {
        el.textContent = inr.format(Math.round(counter.value));
      },
      onComplete: () => {
        shown.current = price;
      },
    });
    return () => {
      anim.revert();
    };
  }, [price]);

  const onReady = useCallback(() => setReady(true), []);
  const canRender = webgl.ready && webgl.supported && tier.ready;

  return (
    <section ref={section} id="configure" aria-labelledby="configure-title" className="relative z-10 overflow-hidden bg-bg py-[clamp(5rem,12vh,9rem)]">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_62%_50%,rgba(201,169,97,0.14),transparent_70%)]" />

      <div className="frame relative grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="relative z-10 order-2 lg:order-1">
          <p className="label text-gold">VI — Make it yours</p>
          <h2 id="configure-title" className="mt-5 font-display text-[clamp(2.6rem,5vw,4.8rem)] font-[300] leading-[0.98] text-ivory">
            The Aurelia Halo, <em className="text-gold-bright">in your metal.</em>
          </h2>
          <p className="mt-6 max-w-md text-[0.95rem] leading-[1.8] text-ivory/70">
            A 2.04 ct oval centre stone in a halo of thirty-two brilliants. Drag the ring to turn it. Every
            combination is cast to order at the Surat bench.
          </p>

          <fieldset className="mt-10">
            <legend className="label text-ivory/50">Metal — {METALS[metal].label}</legend>
            <div className="mt-4 flex gap-4">
              {(Object.keys(METALS) as MetalKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMetal(key)}
                  aria-pressed={metal === key}
                  aria-label={METALS[key].label}
                  className={`relative h-12 w-12 rounded-full transition-transform duration-500 hover:scale-110 ${
                    metal === key ? 'ring-1 ring-gold ring-offset-4 ring-offset-bg' : ''
                  }`}
                  style={{ background: SWATCH[key] }}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-8">
            <legend className="label text-ivory/50">Finish</legend>
            <div className="mt-4 inline-flex border border-line">
              {(['polished', 'satin'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFinish(f)}
                  aria-pressed={finish === f}
                  className={`label min-h-11 px-6 transition-colors duration-500 ${
                    finish === f ? 'bg-gold text-bg' : 'text-ivory/70 hover:text-gold-bright'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-10 flex flex-wrap items-end gap-x-8 gap-y-4 border-t border-line pt-8">
            <div>
              <p className="label text-ivory/50">From</p>
              <span ref={priceRef} className="mt-2 block font-display text-[clamp(2rem,3.4vw,3rem)] font-[300] tabular-nums text-gold-bright">
                {inr.format(BASE_PRICE)}
              </span>
            </div>
            <a href="#bespoke" className="label inline-flex min-h-12 items-center border border-gold/60 px-8 text-gold-bright transition-colors duration-700 hover:bg-gold hover:text-bg">
              Reserve a viewing
            </a>
          </div>
        </div>

        <div className="relative order-1 aspect-square w-full lg:order-2 lg:aspect-[7/6]">
          {canRender && inView ? (
            <SafeWebGLBoundary fallback={<StillRing />}>
              <div className={`absolute inset-0 cursor-grab transition-opacity duration-1000 active:cursor-grabbing ${ready ? 'opacity-100' : 'opacity-0'}`}>
                <ConfiguratorScene metal={metal} finish={finish} isMobile={tier.isMobile} onReady={onReady} />
              </div>
            </SafeWebGLBoundary>
          ) : null}
          {webgl.ready && !webgl.supported ? <StillRing /> : null}
          <p className="label pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-ivory/40">Drag to turn</p>
        </div>
      </div>
    </section>
  );
}

function StillRing() {
  return (
    <Image src="/jewelry/featured-1.webp" alt="The Aurelia Halo ring" fill sizes="(min-width:1024px) 58vw, 100vw" className="object-contain" />
  );
}
