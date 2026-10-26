'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { animate, svg as animeSvg, type JSAnimation } from 'animejs';
import { STAGE_PAUSE_EVENT } from '@/components/three/CameraRig';
import { JEWELRY } from '@/lib/assets';
import { formatINR } from '@/lib/collections';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { useWebGL2Support } from '@/components/three/useViewportTier';
import { SafeWebGLBoundary } from '@/components/three/SafeWebGLBoundary';

/**
 * CHAPTER VI — THE ONE.
 *
 * The Call-to-Buy pattern, end to end: one object (four angles of it), one
 * price, one action. Nothing else is on this screen.
 */

const MorphSlider = dynamic(() => import('@/components/reactbits/MorphSlider/MorphSlider'), {
  ssr: false,
});
const Counter = dynamic(() => import('@/components/reactbits/Counter/Counter'), { ssr: false });
/** Same footprint as the real button, so the CTA is present before hydration. */
function ButtonGhost({ label }: { label: string }) {
  return (
    <span className="label inline-flex border border-gold/40 bg-surface/90 px-9 py-4 text-ivory/70">
      {label}
    </span>
  );
}

const StarBorder = dynamic(() => import('@/components/reactbits/StarBorder/StarBorder'), {
  ssr: false,
  loading: () => <ButtonGhost label="Reserve a Viewing" />,
});
const GlareHover = dynamic(() => import('@/components/reactbits/GlareHover/GlareHover'), {
  ssr: false,
});
const TiltedCard = dynamic(() => import('@/components/reactbits/TiltedCard/TiltedCard'), {
  ssr: false,
});

const THE_PIECE = {
  name: 'The Noor Solitaire',
  metal: '18k yellow gold',
  stone: 'Brilliant-cut diamond',
  carat: '2.04 ct',
  clarity: 'VVS1 · D colour',
  setting: 'Four-prong, low cathedral',
  priceINR: 1285000,
  angles: [JEWELRY.featured1, JEWELRY.featured2, JEWELRY.featured3, JEWELRY.featured4],
};

const SPECS = [
  { label: 'Metal', value: THE_PIECE.metal },
  { label: 'Stone', value: THE_PIECE.stone },
  { label: 'Carat', value: THE_PIECE.carat },
  { label: 'Clarity', value: THE_PIECE.clarity },
  { label: 'Setting', value: THE_PIECE.setting },
] as const;

/** Inline plate so a missing angle never reaches the slider as a 404. */
const PLATE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="g" cx="50%" cy="42%" r="62%"><stop offset="0" stop-color="#C9A961" stop-opacity="0.16"/><stop offset="0.62" stop-color="#C9A961" stop-opacity="0.03"/><stop offset="1" stop-color="#0A0907" stop-opacity="0"/></radialGradient></defs><rect width="800" height="1000" fill="#14110D"/><rect width="800" height="1000" fill="url(#g)"/><rect x="24" y="24" width="752" height="952" fill="none" stroke="#C9A961" stroke-opacity="0.24"/></svg>`;

const PLATE_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(PLATE_SVG)}`;

const probe = (src: string): Promise<boolean> =>
  fetch(src, { method: 'HEAD' })
    .then((response) => response.ok)
    .catch(() => false);

type AngleSet = {
  /** The angles that actually exist, in order. */
  real: string[];
  /** What a still card should show: the one real angle, or the plate. */
  still: string;
};

/**
 * Probe the four angles once.
 *
 * One real image is not a slide show — it is a photograph. The slider only
 * earns its WebGL context at two or more real angles and cycles only those.
 */
function useAngles(): AngleSet | undefined {
  const [set, setSet] = useState<AngleSet | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      THE_PIECE.angles.map(async (src): Promise<string | null> => ((await probe(src)) ? src : null))
    )
      .then((results) => {
        if (cancelled) return;
        const real = results.filter((src): src is string => src !== null);
        setSet({ real, still: real[0] ?? PLATE_URI });
      })
      .catch(() => {
        if (!cancelled) setSet({ real: [], still: PLATE_URI });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return set;
}

export default function FeaturedPiece() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const specRef = useRef<HTMLDListElement>(null);
  const angles = useAngles();
  const webgl = useWebGL2Support();
  const useSlider = webgl.ready && webgl.supported && (angles?.real.length ?? 0) >= 2;

  // The slider is its own WebGL surface: park the stage while it is on screen.
  // With fewer than two real angles there is no slider, so nothing to park.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || !useSlider) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        window.dispatchEvent(
          new CustomEvent(STAGE_PAUSE_EVENT, { detail: { paused: entry.isIntersecting } })
        );
      },
      { threshold: 0.05 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      window.dispatchEvent(new CustomEvent(STAGE_PAUSE_EVENT, { detail: { paused: false } }));
    };
  }, [useSlider]);

  // Spec rules draw themselves, once, when the rows are in view.
  useEffect(() => {
    if (reducedMotion) return undefined;
    const list = specRef.current;
    if (!list) return undefined;

    const lines = list.querySelectorAll<SVGLineElement>('[data-spec-line]');
    if (lines.length === 0) return undefined;

    let animation: JSAnimation | null = null;
    let cancelled = false;

    const drawable = animeSvg.createDrawable(lines, 0, 1);
    animation = animate(drawable, {
      draw: ['0 0', '0 1'],
      duration: 1400,
      delay: (_target, index) => 120 * (index ?? 0),
      ease: 'inOutQuart',
      autoplay: false,
    });

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || cancelled) return;
        observer.disconnect();
        animation?.play();
      },
      { threshold: 0.35 }
    );

    observer.observe(list);

    return () => {
      cancelled = true;
      observer.disconnect();
      animation?.revert();
    };
  }, [reducedMotion]);

  return (
    <section
      id="the-one"
      ref={sectionRef}
      aria-labelledby="featured-title"
      className="relative overflow-hidden border-t border-line/40 bg-bg"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(58% 44% at 22% 46%, rgba(201,169,97,0.10), transparent 70%)',
        }}
      />

      <div className="frame relative z-10 pb-24 pt-[calc(var(--letterbox)+5rem)]">
        <div className="flex items-center gap-4">
          <span className="label whitespace-nowrap">
            <span className="text-gold">Chapter VI</span>
            <span className="px-2 text-muted">—</span>
            <span>The One</span>
          </span>
          <span className="hairline hidden flex-1 sm:block" />
          <span className="label hidden whitespace-nowrap text-muted sm:block">
            Made once
          </span>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* The object. */}
          <div className="lg:col-span-7">
            <GlareHover
              width="100%"
              height="auto"
              background="#14110D"
              borderColor="rgba(201, 169, 97, 0.28)"
              borderRadius="2px"
              glareColor="#EBD8A6"
              glareOpacity={0.16}
              glareAngle={-30}
              glareSize={340}
              softness={0.6}
              variant="sheen"
              mode="hover"
              transitionDuration={1600}
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                {angles === undefined ? (
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        'radial-gradient(64% 56% at 50% 42%, rgba(201,169,97,0.14), transparent 74%)',
                    }}
                  />
                ) : useSlider ? (
                  <SafeWebGLBoundary
                    fallback={
                      <div className="absolute inset-0 flex items-center justify-center p-2">
                        <TiltedCard
                          imageSrc={angles.still}
                          altText={`${THE_PIECE.name} — ${THE_PIECE.stone} in ${THE_PIECE.metal}.`}
                          captionText={THE_PIECE.name}
                          containerHeight="100%"
                          containerWidth="100%"
                          imageHeight="100%"
                          imageWidth="100%"
                          scaleOnHover={1.02}
                          rotateAmplitude={6}
                          showTooltip={false}
                          radius={0}
                        />
                      </div>
                    }
                  >
                    <MorphSlider
                      items={angles.real.map((image, index) => ({
                        image,
                        caption: `Angle ${index + 1}`,
                      }))}
                      transition="melt"
                      duration={1400}
                      ease="power2.inOut"
                      intensity={0.62}
                      scale={1.04}
                      aberration={0.32}
                      drift={0.18}
                      autoplay
                      autoplayDelay={5000}
                      loop
                      radius={0}
                      overlayColor="#0A0907"
                      showCaptions={false}
                      showControls={false}
                      showIndicators
                      className="absolute inset-0 h-full w-full"
                    />
                  </SafeWebGLBoundary>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    <TiltedCard
                      imageSrc={angles.still}
                      altText={`${THE_PIECE.name} — ${THE_PIECE.stone} in ${THE_PIECE.metal}.`}
                      captionText={THE_PIECE.name}
                      containerHeight="100%"
                      containerWidth="100%"
                      imageHeight="100%"
                      imageWidth="100%"
                      scaleOnHover={1.02}
                      rotateAmplitude={6}
                      showTooltip={false}
                      radius={0}
                    />
                  </div>
                )}
              </div>
            </GlareHover>

            <p className="label mt-4 text-muted">
              {useSlider ? 'Four angles · drag to turn the piece' : 'The piece, as it is'}
            </p>
          </div>

          {/* The facts, the price, the action. */}
          <div className="flex flex-col justify-center lg:col-span-5">
            <h2
              id="featured-title"
              className="display-italic text-[clamp(2.6rem,5.6vw,4.6rem)] leading-[0.98] text-ivory"
            >
              {THE_PIECE.name}
            </h2>

            <dl ref={specRef} className="mt-10">
              {SPECS.map((spec) => (
                <div
                  key={spec.label}
                  className="relative flex items-baseline justify-between gap-6 py-3"
                >
                  <dt className="label text-muted">{spec.label}</dt>
                  <dd className="text-right text-body text-ivory/85">{spec.value}</dd>
                  <svg
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-full overflow-visible"
                    preserveAspectRatio="none"
                    viewBox="0 0 100 1"
                  >
                    <line
                      data-spec-line
                      x1="0"
                      y1="0.5"
                      x2="100"
                      y2="0.5"
                      stroke="#C9A961"
                      strokeOpacity="0.45"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>
              ))}
            </dl>

            <div className="mt-10 flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <span className="display text-[clamp(1.7rem,3vw,2.4rem)] tabular-nums text-gold-bright">
                <Counter
                  value={THE_PIECE.priceINR}
                  locale="en-IN"
                  format={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }}
                  duration={1600}
                  stagger={70}
                  motionBlur
                  fontSize="inherit"
                  textColor="inherit"
                  gap={0}
                />
              </span>
              <span className="label text-muted">Inclusive of duties</span>
            </div>

            <div className="mt-9 self-start">
              <StarBorder
                as="button"
                type="button"
                onClick={() => {
                  const target = document.getElementById('bespoke');
                  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                color="#C9A961"
                trailColor="#EBD8A6"
                backgroundColor="rgba(20, 17, 13, 0.9)"
                textColor="#F3EEE4"
                borderColor="rgba(201, 169, 97, 0.35)"
                duration={8}
                thickness={1.4}
                radius={2}
                stars={3}
                glow={0.5}
                trailLength={0.45}
                sparkle
                hover="lap"
                clickPulse
                theme="dark"
                className="label px-9 py-4"
              >
                Reserve a Viewing
              </StarBorder>
            </div>

            <p className="mt-6 max-w-xs text-meta leading-relaxed text-muted">
              One stone, one setting, one price. {formatINR(THE_PIECE.priceINR)} — held for seven
              days against a viewing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
