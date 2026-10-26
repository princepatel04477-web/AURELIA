'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createTimeline, type Timeline } from 'animejs';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { useReducedMotion } from '@/lib/useReducedMotion';

const ITEMS = [
  { numeral: 'I', label: 'The House', href: '/', note: 'Surat · since 1998' },
  { numeral: 'II', label: 'The Chapters', href: '#story', note: 'Stone · Fire · Hand' },
  { numeral: 'III', label: 'The Collection', href: '#collection', note: 'Four pieces' },
  { numeral: 'IV', label: 'The Atelier', href: '#atelier', note: 'By appointment' },
] as const;

/**
 * Navigation — the full-screen menu pattern.
 *
 * A slim bar that opens a full-viewport editorial page: numbered chapters on
 * the left, a quiet note on the right, contact at the foot. The reveal is an
 * anime.js timeline (menu choreography); GSAP keeps the scroll, Lenis is held
 * still while the page is open.
 */
export function SiteNav() {
  const reducedMotion = useReducedMotion();
  const { lenis } = useSmoothScroll();
  const [open, setOpen] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<Timeline | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<(() => void) | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    closeRef.current = close;
  }, [close]);

  // Hold the film still while the menu is open.
  useEffect(() => {
    if (!open) return undefined;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    lenis?.stop();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeRef.current?.();
        toggleRef.current?.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    firstLinkRef.current?.focus({ preventScroll: true });

    return () => {
      body.style.overflow = previousOverflow;
      lenis?.start();
      window.removeEventListener('keydown', onKey);
    };
  }, [open, lenis]);

  // Choreography: the panel clips open, the items rise in sequence.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return undefined;

    const links = Array.from(panel.querySelectorAll<HTMLElement>('[data-nav-item]'));
    const meta = Array.from(panel.querySelectorAll<HTMLElement>('[data-nav-meta]'));

    timelineRef.current?.revert();

    if (reducedMotion) {
      panel.style.opacity = open ? '1' : '0';
      panel.style.pointerEvents = open ? 'auto' : 'none';
      links.forEach((link) => {
        link.style.opacity = open ? '1' : '0';
        link.style.transform = 'none';
      });
      meta.forEach((node) => {
        node.style.opacity = open ? '1' : '0';
      });
      return undefined;
    }

    const timeline = createTimeline({ defaults: { ease: 'outExpo' } });

    if (open) {
      timeline
        .set(panel, { pointerEvents: 'auto' })
        .add(panel, { opacity: [0, 1], duration: 700 }, 0)
        .add(links, { opacity: [0, 1], translateY: [26, 0], duration: 1200, delay: 70 }, 140)
        .add(meta, { opacity: [0, 1], duration: 1000, delay: 40 }, 420);
    } else {
      timeline
        .add(links, { opacity: 0, translateY: -12, duration: 420, delay: 30 }, 0)
        .add(meta, { opacity: 0, duration: 300 }, 0)
        .add(panel, { opacity: 0, duration: 700, ease: 'inOutQuart' }, 120)
        .set(panel, { pointerEvents: 'none' });
    }

    timelineRef.current = timeline;

    return () => {
      timeline.revert();
      timelineRef.current = null;
    };
  }, [open, reducedMotion]);

  return (
    <>
      {/* The slim bar. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[65] flex justify-center">
        <div className="pointer-events-auto flex w-full items-center justify-between px-[clamp(1.25rem,5vw,5rem)] pt-[2.4vh]">
          <Link
            href="/"
            className="label tracking-[0.42em] text-ivory/90 transition-colors duration-[900ms] ease-out-expo hover:text-gold-bright"
          >
            Aurelia
          </Link>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="site-menu"
            className="group flex items-center gap-4"
          >
            <span className="label text-ivory/80 transition-colors duration-[900ms] ease-out-expo group-hover:text-gold-bright">
              {open ? 'Close' : 'Menu'}
            </span>
            <span aria-hidden className="relative flex h-3 w-5 flex-col justify-between">
              <span
                className={`block h-px w-full bg-gold transition-transform duration-[900ms] ease-out-expo ${
                  open ? 'translate-y-[5.5px] rotate-45' : ''
                }`}
              />
              <span
                className={`block h-px w-full bg-gold transition-opacity duration-[900ms] ease-out-expo ${
                  open ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`block h-px w-full bg-gold transition-transform duration-[900ms] ease-out-expo ${
                  open ? '-translate-y-[5.5px] -rotate-45' : ''
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* The editorial page. */}
      <div
        id="site-menu"
        ref={panelRef}
        aria-hidden={!open}
        className="fixed inset-0 z-[64] flex flex-col justify-between bg-bg opacity-0"
        style={{ pointerEvents: 'none' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(62% 48% at 50% 0%, rgba(201,169,97,0.10), transparent 70%)',
          }}
        />

        <nav
          aria-label="Chapters"
          className="frame relative z-10 flex flex-1 flex-col justify-center gap-2 pt-[12vh]"
        >
          {ITEMS.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              ref={index === 0 ? firstLinkRef : undefined}
              onClick={close}
              data-nav-item
              className="group flex items-baseline gap-5 border-b border-line/30 py-4 opacity-0"
            >
              <span className="label w-8 shrink-0 text-muted transition-colors duration-[900ms] ease-out-expo group-hover:text-gold">
                {item.numeral}
              </span>
              <span className="display text-[clamp(2rem,6vw,4.4rem)] leading-[1.02] text-ivory transition-colors duration-[900ms] ease-out-expo group-hover:text-gold-bright">
                {item.label}
              </span>
              <span className="label ml-auto hidden self-center text-muted sm:block">
                {item.note}
              </span>
            </Link>
          ))}
        </nav>

        <div
          data-nav-meta
          className="frame relative z-10 flex flex-col gap-4 pb-[calc(var(--letterbox)+2rem)] pt-8 opacity-0 sm:flex-row sm:items-end sm:justify-between"
        >
          <p className="label max-w-xs leading-[1.9] text-muted">
            Fine jewellery · Surat · Since 1998
          </p>
          <p className="label text-muted">By appointment</p>
        </div>
      </div>
    </>
  );
}
