'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { createTimeline, type Timeline } from 'animejs';
import { STAGE_PAUSE_EVENT } from '@/components/three/CameraRig';
import { useAnimatingCanvasSlot } from '@/components/three/canvasPolicy';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { useWebGL2Support } from '@/components/three/useViewportTier';
import { SafeWebGLBoundary } from '@/components/three/SafeWebGLBoundary';

/**
 * THE FOOTER.
 *
 * Silk behind, the house name in chrome-gold, three columns, one newsletter.
 * The silk is a WebGL surface, so it is loaded client-side only and parked —
 * not unmounted — whenever it is off screen or a form is being used, which
 * keeps the stage's canvas in budget while the visitor is reading the columns.
 */

const Silk = dynamic(() => import('@/components/reactbits/Silk/Silk'), { ssr: false });
const ShinyText = dynamic(() => import('@/components/reactbits/ShinyText/ShinyText'), {
  ssr: false,
});

const COLUMNS = [
  {
    title: 'Collections',
    links: [
      { label: 'Rings', href: '#collection' },
      { label: 'Pendants', href: '#collection' },
      { label: 'Earrings', href: '#collection' },
      { label: 'Bracelets', href: '#collection' },
      { label: 'Necklaces', href: '#collection' },
    ],
  },
  {
    title: 'Maison',
    links: [
      { label: 'The Chapters', href: '#story' },
      { label: 'The Collection', href: '#collection' },
      { label: 'The One', href: '#the-one' },
      { label: 'The Commission', href: '#bespoke' },
      { label: 'The Atelier', href: '#atelier' },
    ],
  },
] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function Footer() {
  const reducedMotion = useReducedMotion();
  const webgl = useWebGL2Support();
  const footerRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const successTimeline = useRef<Timeline | null>(null);

  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [subscribed, setSubscribed] = useState(false);

  // Silk is a WebGL surface; it asks the shared budget before it mounts.
  const silkSlot = useAnimatingCanvasSlot('silk', visible);

  // Silk only runs while the footer is on screen; the stage keeps its slot.
  useEffect(() => {
    const node = footerRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setVisible(entry.isIntersecting);
        window.dispatchEvent(
          new CustomEvent(STAGE_PAUSE_EVENT, { detail: { paused: entry.isIntersecting } })
        );
      },
      { threshold: 0.2 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      window.dispatchEvent(new CustomEvent(STAGE_PAUSE_EVENT, { detail: { paused: false } }));
    };
  }, []);

  // Success is a micro-interaction: the input gives way, the confirmation rises.
  useEffect(() => {
    if (!subscribed) return undefined;
    const confirmation = successRef.current;
    if (!confirmation) return undefined;

    const lines = Array.from(confirmation.querySelectorAll<HTMLElement>('[data-success-line]'));
    successTimeline.current?.revert();

    if (reducedMotion) {
      lines.forEach((line) => {
        line.style.opacity = '1';
        line.style.transform = 'none';
      });
      return undefined;
    }

    const timeline = createTimeline({ defaults: { ease: 'outExpo' } });
    timeline.add(lines, { opacity: [0, 1], translateY: [10, 0], duration: 900, delay: 70 }, 0);
    successTimeline.current = timeline;

    return () => {
      timeline.revert();
      successTimeline.current = null;
    };
  }, [subscribed, reducedMotion]);

  useEffect(
    () => () => {
      successTimeline.current?.revert();
    },
    []
  );

  const subscribe = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!EMAIL.test(email.trim())) {
      setError('An address we can reach you at.');
      return;
    }

    setError(undefined);
    setSubscribed(true);
  };

  return (
    <footer
      ref={footerRef}
      aria-labelledby="footer-title"
      className="relative overflow-hidden border-t border-line/40 bg-bg"
    >
      {/* Silk: deep gold-brown, slow. Parked when off screen. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(160deg, #2A2116 0%, #14110D 58%, #0A0907 100%)',
          }}
        />
        {visible && silkSlot && webgl.ready && webgl.supported ? (
          <SafeWebGLBoundary fallback={null}><div className="absolute inset-0 opacity-[0.55]">
            <Silk
              speed={0.22}
              scale={1.35}
              color="#2A2116"
              sheenColor="#8A6E3F"
              noiseIntensity={0.35}
              rotation={0.12}
              sheen={0.45}
              depth={1.1}
              glow={0.22}
              ripple={0.18}
              wave={0.55}
              variation={0.4}
              mouseInteraction={false}
              intro
              fade={0.6}
              paused={!visible}
              dpr={1}
              className="h-full w-full"
            />
          </div></SafeWebGLBoundary>
        ) : null}
        {/* Floor: keeps the silk from ever washing out the type. */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/45 to-bg/85" />
      </div>

      <div className="frame relative z-10 pb-10 pt-[calc(var(--letterbox)+4rem)]">
        {/* The house name, held wide. */}
        <h2 id="footer-title" className="display uppercase leading-[0.82]">
          <span className="block text-[clamp(3.2rem,15vw,13rem)] tracking-[-0.03em]">
            <ShinyText
              text="AURELIA"
              color="#C9A961"
              shineColor="#F3EEE4"
              speed={4.5}
              angle={-18}
              shineWidth={22}
              softness={0.4}
              bands={2}
              glow={0.35}
              direction="left"
              trigger="view"
              className="block"
              style={{ fontFamily: 'inherit' }}
            />
          </span>
        </h2>

        <div className="mt-16 grid grid-cols-2 gap-x-8 gap-y-12 border-t border-line/30 pt-10 sm:grid-cols-4">
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <span className="label text-gold">{column.title}</span>
              <ul className="mt-5 flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="inline-flex min-h-11 items-center text-meta text-ivory/70 transition-colors duration-[900ms] ease-out-expo hover:text-gold-bright"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Visit. */}
          <div>
            <span className="label text-gold">Visit</span>
            <address className="mt-5 flex flex-col gap-3 not-italic">
              <span className="text-meta leading-relaxed text-ivory/70">
                Surat, Gujarat
                <br />
                India
              </span>
              <span className="text-meta text-ivory/70">By appointment</span>
              <a
                href="mailto:atelier@aurelia.example"
                className="inline-flex min-h-11 items-center text-meta text-ivory/70 transition-colors duration-[900ms] ease-out-expo hover:text-gold-bright"
              >
                atelier@aurelia.example
              </a>
            </address>
          </div>

          {/* Newsletter. */}
          <div className="col-span-2 sm:col-span-1">
            <span className="label text-gold">Letters</span>

            {subscribed ? (
              <div ref={successRef} className="mt-5">
                <p
                  data-success-line
                  className="display-italic text-[1.15rem] leading-snug text-gold-bright opacity-0"
                >
                  Noted. Four letters a year, no more.
                </p>
                <p data-success-line className="label mt-3 text-muted opacity-0">
                  {email.trim()}
                </p>
              </div>
            ) : (
              <form ref={formRef} onSubmit={subscribe} noValidate className="mt-5">
                <label htmlFor="footer-email" className="label text-muted">
                  Email
                </label>
                <div className="mt-2 flex items-center gap-3 border-b border-line pb-2 transition-colors duration-[900ms] ease-out-expo focus-within:border-gold">
                  <input
                    id="footer-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) setError(undefined);
                    }}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'footer-email-error' : undefined}
                    className="min-h-11 w-full appearance-none border-0 bg-transparent text-meta text-ivory outline-none placeholder:text-muted/60"
                  />
                  <button
                    type="submit"
                    className="label inline-flex min-h-11 shrink-0 items-center px-1 text-ivory/80 transition-colors duration-[900ms] ease-out-expo hover:text-gold-bright"
                  >
                    Join
                  </button>
                </div>

                {error ? (
                  <p id="footer-email-error" role="alert" className="mt-2 text-meta text-destructive">
                    {error}
                  </p>
                ) : (
                  <p className="mt-2 text-meta text-muted">Commissions, and new pieces. Nothing else.</p>
                )}
              </form>
            )}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-line/30 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="label text-muted">© 2026 Aurelia Fine Jewellery.</p>
          <p className="label text-muted">Surat · Gujarat · India</p>
        </div>
      </div>
    </footer>
  );
}
