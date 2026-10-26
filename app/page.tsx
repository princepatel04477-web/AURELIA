import { ChapterCard } from '@/components/chrome/ChapterCard';

export default function Home() {
  return (
    <section className="relative isolate flex min-h-dvh flex-col justify-between overflow-hidden">
      {/* Light source — the only illumination in the frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-bg"
        style={{
          backgroundImage:
            'radial-gradient(58% 44% at 50% 42%, rgba(201,169,97,0.16), rgba(201,169,97,0.05) 46%, transparent 72%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(10,9,7,0.9) 0%, transparent 22%, transparent 78%, rgba(10,9,7,0.95) 100%)',
        }}
      />

      <header className="frame flex items-center justify-between pt-[calc(var(--letterbox)+1.75rem)]">
        <span className="label">Fine Jewellery</span>
        <span className="label hidden sm:block">Surat · Gujarat</span>
      </header>

      <div className="frame flex flex-col items-center gap-10 text-center">
        <ChapterCard numeral="I" title="The Light" align="center" className="max-w-xl" />

        <h1 className="display text-[clamp(3.5rem,13vw,12rem)] uppercase leading-[0.86] tracking-[-0.03em]">
          <span className="gold-gradient">Aurelia</span>
        </h1>

        <p className="display-italic max-w-md text-[clamp(1.05rem,2.2vw,1.6rem)] leading-snug text-ivory/80">
          Diamonds cut by hand, set in gold,
          <br className="hidden sm:block" /> made to be inherited.
        </p>
      </div>

      <footer className="frame flex items-end justify-between pb-[calc(var(--letterbox)+1.5rem)]">
        <span className="label">Est. Surat</span>
        <span className="label text-muted">Scroll</span>
      </footer>
    </section>
  );
}
