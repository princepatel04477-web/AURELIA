import { ChapterCard } from '@/components/chrome/ChapterCard';
import { COLLECTION, formatPrice } from '@/lib/data';

/**
 * CHAPTER VIII — THE ATELIER.
 *
 * The film ends where the work begins: the house, the address, one instruction
 * and one price list headline. No forms, no newsletter, no social icons, and no
 * sign-off — the closing wordmark and the copyright live in Footer.tsx.
 */
export function Atelier() {
  const from = Math.min(...COLLECTION.map((piece) => piece.price));

  return (
    <section
      id="atelier"
      aria-labelledby="atelier-heading"
      className="relative overflow-hidden border-t border-line/40 bg-bg"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(50% 60% at 50% 120%, rgba(201,169,97,0.12), transparent 70%)',
        }}
      />

      <div className="frame relative z-10 pb-[calc(var(--letterbox)+2rem)] pt-[calc(var(--letterbox)+5rem)]">
        <ChapterCard numeral="VIII" title="The Atelier" meta="Surat · Gujarat" />

        <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2
              id="atelier-heading"
              className="display text-[clamp(2.2rem,5.4vw,4.8rem)] leading-[0.95] text-ivory"
            >
              Made by hand,
              <br />
              <span className="display-italic text-gold">signed once.</span>
            </h2>

            <p className="mt-8 max-w-md text-body leading-relaxed text-ivory/70">
              A single bench, four hands, and a north window. Every piece leaves the atelier with
              the same three marks: the maker&rsquo;s stamp, the year, and the weight of its gold.
            </p>

            <a
              href="#collection"
              className="group mt-10 inline-flex min-h-11 items-center gap-5"
            >
              <span className="label text-ivory/85 transition-colors duration-[900ms] ease-out-expo group-hover:text-gold-bright">
                Return to the collection
              </span>
              <span aria-hidden className="relative flex h-px w-14 overflow-hidden bg-line-soft">
                <span className="absolute inset-0 origin-left scale-x-0 bg-gold transition-transform duration-[1200ms] ease-out-expo group-hover:scale-x-100" />
              </span>
            </a>
          </div>

          <div className="flex flex-col gap-10 lg:col-span-5 lg:pl-10">
            <div>
              <span className="label text-muted">The atelier</span>
              <p className="mt-4 text-body leading-relaxed text-ivory/75">
                By appointment only
                <br />
                Surat, Gujarat, India
              </p>
            </div>

            <div>
              <span className="label text-muted">Pieces from</span>
              <p className="mt-4 display text-[1.8rem] tabular-nums text-gold-bright">
                {formatPrice(from)}
              </p>
            </div>

            <div>
              <span className="label text-muted">Commissions</span>
              <p className="mt-4 text-body leading-relaxed text-ivory/75">
                Six to eight weeks from wax to polish.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
