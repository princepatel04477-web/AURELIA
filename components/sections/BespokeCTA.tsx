'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { animate, createTimeline, svg as animeSvg, type JSAnimation, type Timeline } from 'animejs';
import { setStageShot } from '@/components/three/CameraRig';
import { useReducedMotion } from '@/lib/useReducedMotion';

/**
 * THE BESPOKE COMMISSION — the closing panel.
 *
 * Full bleed, the stage on its `finale` shot, and one form. The gold frame and
 * the confirmation tick are drawn, not faded: anime.js `svg.createDrawable`
 * handles every line, so the panel reads as a piece of stationery being ruled.
 */

/** Same footprint as the real button: the CTA never pops in or shifts layout. */
function ButtonGhost({ label }: { label: string }) {
  return (
    <span className="label inline-flex border border-gold/40 bg-surface/90 px-10 py-4 text-ivory/70">
      {label}
    </span>
  );
}

const StarBorder = dynamic(() => import('@/components/reactbits/StarBorder/StarBorder'), {
  ssr: false,
  loading: () => <ButtonGhost label="Request a Viewing" />,
});
const Magnet = dynamic(() => import('@/components/reactbits/Magnet/Magnet'), { ssr: false });

const INTERESTS = ['Engagement', 'Bridal', 'Bespoke', 'Gifting'] as const;
type Interest = (typeof INTERESTS)[number];

type Fields = {
  name: string;
  phone: string;
  date: string;
  interest: Interest | '';
  message: string;
};

type Errors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = { name: '', phone: '', date: '', interest: '', message: '' };

/** 10-digit Indian mobile, optional +91 (spaces and dashes tolerated). */
const PHONE = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;

const todayISO = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

function validate(fields: Fields): Errors {
  const errors: Errors = {};

  if (fields.name.trim().length < 2) {
    errors.name = 'Please give the name we should ask for.';
  }

  const phone = fields.phone.replace(/[\s-]/g, '');
  if (phone.length === 0) {
    errors.phone = 'A number is needed to arrange the call.';
  } else if (!PHONE.test(phone)) {
    errors.phone = 'Ten digits, starting 6–9. The +91 prefix is optional.';
  }

  if (fields.date.length === 0) {
    errors.date = 'Choose a day for the viewing.';
  } else if (fields.date < todayISO()) {
    errors.date = 'That day has passed. Choose a date from today on.';
  }

  if (fields.interest === '') {
    errors.interest = 'Tell us which line this is for.';
  }

  if (fields.message.length > 600) {
    errors.message = 'Six hundred characters is enough for a note.';
  }

  return errors;
}

/** What a piece page may hand the form when it sends a visitor here. */
export type BespokePrefill = {
  /** One of `INTERESTS`, ignored if it is not. */
  interest?: string;
  /** The enquiry line, trimmed to the field's limit. */
  message?: string;
};

type BespokeCTAProps = {
  prefill?: BespokePrefill;
};

export default function BespokeCTA({ prefill }: BespokeCTAProps) {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<SVGSVGElement>(null);
  const confirmRef = useRef<SVGSVGElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const frameAnimation = useRef<JSAnimation | null>(null);
  const checkAnimation = useRef<JSAnimation | null>(null);
  const collapseTimeline = useRef<Timeline | null>(null);

  const [fields, setFields] = useState<Fields>(() => ({
    ...EMPTY,
    interest: (INTERESTS as readonly string[]).includes(prefill?.interest ?? '')
      ? (prefill?.interest as Interest)
      : '',
    message: prefill?.message?.slice(0, 600) ?? '',
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'collapsing' | 'sent'>('idle');

  // Chapter VII owns the stage's finale shot while it is on screen.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setStageShot(entry.isIntersecting ? 'finale' : null);
      },
      { threshold: 0.15 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      setStageShot(null);
    };
  }, []);

  // The gold frame rules itself on at 40% visibility; the corners pop after.
  useEffect(() => {
    const root = frameRef.current;
    if (!root) return undefined;

    const rules = root.querySelectorAll<SVGGeometryElement>('[data-frame-rule]');
    const glyphs = root.querySelectorAll<SVGGElement>('[data-frame-glyph]');
    if (rules.length === 0) return undefined;

    if (reducedMotion) {
      rules.forEach((rule) => rule.setAttribute('draw', '0 1'));
      glyphs.forEach((glyph) => {
        glyph.style.opacity = '1';
        glyph.style.transform = 'none';
      });
      return undefined;
    }

    glyphs.forEach((glyph) => {
      glyph.style.opacity = '0';
    });

    const drawable = animeSvg.createDrawable(rules, 0, 1);
    const draw = animate(drawable, {
      draw: ['0 0', '0 1'],
      duration: 1800,
      delay: (_target, index) => 90 * (index ?? 0),
      ease: 'inOutQuart',
      autoplay: false,
    });

    const pop = animate(glyphs, {
      opacity: [0, 1],
      scale: [0.6, 1],
      duration: 900,
      delay: (_target, index) => 240 + 120 * (index ?? 0),
      ease: 'outExpo',
      autoplay: false,
    });

    frameAnimation.current = draw;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        draw.play();
        pop.play();
      },
      { threshold: 0.4 }
    );

    observer.observe(root);

    return () => {
      observer.disconnect();
      draw.revert();
      pop.revert();
      frameAnimation.current = null;
    };
  }, [reducedMotion]);

  // The form folds away while it is still mounted, then the panel switches.
  useEffect(() => {
    if (status !== 'collapsing') return undefined;
    const form = formRef.current;

    if (reducedMotion || !form) {
      setStatus('sent');
      return undefined;
    }

    const timeline = createTimeline({
      defaults: { ease: 'inOutQuart' },
      onComplete: () => setStatus('sent'),
    });

    timeline
      .add(form, { opacity: [1, 0], translateY: [0, -12], duration: 520 }, 0)
      .add(form, { height: [form.offsetHeight, 0], duration: 720 }, 180);

    collapseTimeline.current = timeline;

    return () => {
      timeline.revert();
      collapseTimeline.current = null;
    };
  }, [status, reducedMotion]);

  // Success: the tick rules itself on.
  useEffect(() => {
    if (status !== 'sent') return undefined;
    const tick = confirmRef.current;
    if (!tick) return undefined;

    const strokes = tick.querySelectorAll<SVGGeometryElement>('[data-check]');

    if (reducedMotion) {
      strokes.forEach((stroke) => stroke.setAttribute('draw', '0 1'));
      return undefined;
    }

    const draw = animate(animeSvg.createDrawable(strokes, 0, 1), {
      draw: ['0 0', '0 1'],
      duration: 1400,
      delay: (_target, index) => 160 + 140 * (index ?? 0),
      ease: 'inOutQuart',
    });
    checkAnimation.current = draw;

    return () => {
      draw.revert();
      checkAnimation.current = null;
    };
  }, [status, reducedMotion]);

  useEffect(
    () => () => {
      frameAnimation.current?.revert();
      checkAnimation.current?.revert();
      collapseTimeline.current?.revert();
    },
    []
  );

  const setField = <K extends keyof Fields>(key: K, value: Fields[K]) => {
    const next = { ...fields, [key]: value };
    setFields(next);
    if (touched[key]) setErrors(validate(next));
  };

  const blur = (key: keyof Fields) => {
    setTouched((current) => ({ ...current, [key]: true }));
    setErrors(validate(fields));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(fields);
    setErrors(found);
    setTouched({ name: true, phone: true, date: true, interest: true, message: true });

    if (Object.keys(found).length > 0) return;

    setStatus('sending');
    // Resolves locally; no endpoint is wired in the prototype.
    window.setTimeout(() => setStatus('collapsing'), 1200);
  };

  const fieldClass = (key: keyof Fields) =>
    [
      'min-h-11 w-full appearance-none border-0 border-b bg-transparent pb-2 text-body text-ivory outline-none',
      'transition-colors duration-[900ms] ease-out-expo',
      errors[key] ? 'border-destructive' : 'border-line focus:border-gold',
    ].join(' ');

  return (
    <section
      id="bespoke"
      ref={sectionRef}
      aria-labelledby="bespoke-title"
      className="relative isolate overflow-hidden border-t border-line/40 bg-bg"
    >
      {/* Full-bleed field: the gold light the stage is sitting in. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(64% 54% at 50% 18%, rgba(235,216,166,0.16), rgba(201,169,97,0.05) 48%, transparent 76%)',
        }}
      />
      {/* The drawn gold frame. */}
      <svg
        ref={frameRef}
        aria-hidden
        className="pointer-events-none absolute inset-[clamp(1rem,4vw,3.5rem)] h-[calc(100%-2*clamp(1rem,4vw,3.5rem))] w-[calc(100%-2*clamp(1rem,4vw,3.5rem))] overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <rect
          data-frame-rule
          x="0.5"
          y="0.5"
          width="99"
          height="99"
          fill="none"
          stroke="#C9A961"
          strokeOpacity="0.5"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <line
          data-frame-rule
          x1="0.5"
          y1="0.5"
          x2="14"
          y2="0.5"
          stroke="#EBD8A6"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <line
          data-frame-rule
          x1="86"
          y1="99.5"
          x2="99.5"
          y2="99.5"
          stroke="#EBD8A6"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />

        {/* Diamond glyphs at the corners. */}
        {[
          { x: 0.5, y: 0.5, r: 0 },
          { x: 99.5, y: 0.5, r: 0 },
          { x: 0.5, y: 99.5, r: 0 },
          { x: 99.5, y: 99.5, r: 0 },
        ].map((corner) => (
          <g
            key={`${corner.x}-${corner.y}`}
            data-frame-glyph
            style={{ transformOrigin: `${corner.x}px ${corner.y}px` }}
          >
            <path
              d={`M ${corner.x} ${corner.y - 1.6} L ${corner.x + 1.6} ${corner.y} L ${corner.x} ${corner.y + 1.6} L ${corner.x - 1.6} ${corner.y} Z`}
              fill="#EBD8A6"
              fillOpacity="0.85"
            />
          </g>
        ))}
      </svg>

      <div className="frame relative z-10 flex min-h-[100svh] flex-col justify-center pb-[calc(var(--letterbox)+3rem)] pt-[calc(var(--letterbox)+4rem)]">
        <div className="mx-auto w-full max-w-2xl text-center">
          <span className="label text-gold">Chapter VII — The Commission</span>

          <h2
            id="bespoke-title"
            className="display mt-6 text-[clamp(2.1rem,5vw,4rem)] leading-[0.98] text-ivory"
          >
            Tell us what it is for,
            <br />
            <span className="display-italic text-gold">and we will draw it.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-md text-body leading-relaxed text-ivory/70">
            A viewing at the Surat atelier, or a commission from a sketch. Either way it starts
            with a conversation.
          </p>

          <div ref={formRef} className="mt-12 overflow-hidden text-left">
            {status === 'sent' ? null : (
              <form onSubmit={submit} noValidate className="flex flex-col gap-8">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <Field
                    label="Name"
                    error={touched.name ? errors.name : undefined}
                    htmlFor="bespoke-name"
                  >
                    <input
                      id="bespoke-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={fields.name}
                      onChange={(event) => setField('name', event.target.value)}
                      onBlur={() => blur('name')}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'bespoke-name-error' : undefined}
                      className={fieldClass('name')}
                    />
                  </Field>

                  <Field
                    label="Phone"
                    hint="Optional +91"
                    error={touched.phone ? errors.phone : undefined}
                    htmlFor="bespoke-phone"
                  >
                    <input
                      id="bespoke-phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+91 98250 00000"
                      value={fields.phone}
                      onChange={(event) => setField('phone', event.target.value)}
                      onBlur={() => blur('phone')}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? 'bespoke-phone-error' : undefined}
                      className={fieldClass('phone')}
                    />
                  </Field>

                  <Field
                    label="Preferred date"
                    error={touched.date ? errors.date : undefined}
                    htmlFor="bespoke-date"
                  >
                    <input
                      id="bespoke-date"
                      name="date"
                      type="date"
                      min={todayISO()}
                      value={fields.date}
                      onChange={(event) => setField('date', event.target.value)}
                      onBlur={() => blur('date')}
                      aria-invalid={Boolean(errors.date)}
                      aria-describedby={errors.date ? 'bespoke-date-error' : undefined}
                      className={`${fieldClass('date')} [color-scheme:dark]`}
                    />
                  </Field>

                  <Field
                    label="Interest"
                    error={touched.interest ? errors.interest : undefined}
                    htmlFor="bespoke-interest"
                  >
                    <select
                      id="bespoke-interest"
                      name="interest"
                      value={fields.interest}
                      onChange={(event) => setField('interest', event.target.value as Interest | '')}
                      onBlur={() => blur('interest')}
                      aria-invalid={Boolean(errors.interest)}
                      aria-describedby={errors.interest ? 'bespoke-interest-error' : undefined}
                      className={fieldClass('interest')}
                    >
                      <option value="" disabled>
                        Choose one
                      </option>
                      {INTERESTS.map((interest) => (
                        <option key={interest} value={interest} className="bg-surface">
                          {interest}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field
                  label="Message"
                  optional
                  error={touched.message ? errors.message : undefined}
                  htmlFor="bespoke-message"
                >
                  <textarea
                    id="bespoke-message"
                    name="message"
                    rows={3}
                    value={fields.message}
                    onChange={(event) => setField('message', event.target.value)}
                    onBlur={() => blur('message')}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? 'bespoke-message-error' : undefined}
                    className={`${fieldClass('message')} resize-none`}
                  />
                </Field>

                <div className="flex flex-col items-center gap-4">
                  <Magnet
                    padding={18}
                    magnetStrength={26}
                    maxOffset={18}
                    tilt={6}
                    scale={1.015}
                    axis="both"
                  >
                    <StarBorder
                      as="button"
                      type="submit"
                      disabled={status === 'sending'}
                      color="#C9A961"
                      trailColor="#EBD8A6"
                      backgroundColor="rgba(20, 17, 13, 0.92)"
                      textColor="#F3EEE4"
                      borderColor="rgba(201, 169, 97, 0.4)"
                      duration={7}
                      thickness={1.4}
                      radius={2}
                      stars={3}
                      glow={0.55}
                      trailLength={0.5}
                      sparkle
                      hover="lap"
                      clickPulse
                      theme="dark"
                      className="label px-10 py-4 disabled:opacity-60"
                    >
                      {status === 'sending' ? 'Sending' : 'Request a Viewing'}
                    </StarBorder>
                  </Magnet>

                  <p className="label text-muted">
                    {status === 'sending' ? 'One moment' : 'No lists. No forwarding. One reply.'}
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* The confirmation. */}
          {status === 'sent' ? (
            <div className="mt-12 flex flex-col items-center">
              <svg
                ref={confirmRef}
                aria-hidden
                viewBox="0 0 64 64"
                className="h-16 w-16 overflow-visible"
              >
                <circle
                  data-check
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke="#C9A961"
                  strokeOpacity="0.6"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  data-check
                  d="M 20 33.5 L 28.5 42 L 45 24"
                  fill="none"
                  stroke="#EBD8A6"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              <p className="display-italic mt-6 text-[clamp(1.4rem,3vw,2.2rem)] leading-tight text-ivory">
                Our atelier will call you within 24 hours.
              </p>
              <p className="label mt-4 text-muted">
                Thank you, {fields.name.trim().split(' ')[0] || 'friend'}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mx-auto mt-16 flex w-full max-w-2xl flex-col gap-3 border-t border-line/40 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="label text-muted">Aurelia — Surat, Gujarat</p>
          <p className="label text-muted">By appointment</p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   Field shell.
   ------------------------------------------------------------------------- */

function Field({
  label,
  htmlFor,
  hint,
  optional,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="label flex items-baseline justify-between text-muted">
        <span>{label}</span>
        {hint ? <span className="text-muted/70">{hint}</span> : null}
        {optional ? <span className="text-muted/70">Optional</span> : null}
      </label>

      {children}

      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-meta text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
