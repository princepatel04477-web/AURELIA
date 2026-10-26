import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AssetFrame } from '@/components/chrome/AssetFrame';
import { ChapterCard } from '@/components/chrome/ChapterCard';
import { ALL_SLUGS, formatINR, getPieceBySlug } from '@/lib/collections';

type PiecePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return ALL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PiecePageProps): Promise<Metadata> {
  const { slug } = await params;
  const piece = getPieceBySlug(slug);

  if (!piece) return { title: 'Piece not found' };

  return {
    title: `${piece.name} — ${formatINR(piece.priceINR)}`,
    description: piece.description,
  };
}

/** One piece, one price, one action — the deep end of the Call to Buy. */
export default async function PiecePage({ params }: PiecePageProps) {
  const { slug } = await params;
  const piece = getPieceBySlug(slug);

  if (!piece) notFound();

  return (
    <article className="relative min-h-dvh bg-bg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(60% 44% at 50% 0%, rgba(201,169,97,0.10), transparent 70%)',
        }}
      />

      <div className="frame relative z-10 pb-[calc(var(--letterbox)+3rem)] pt-[calc(var(--letterbox)+4rem)]">
        <ChapterCard numeral="V" title={piece.category} meta={piece.metal} />

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <AssetFrame
              src={piece.image}
              alt={`${piece.name} — ${piece.stone} in ${piece.metal}.`}
              ratio="aspect-[4/5]"
              className="w-full"
              caption={`${piece.category} — ${piece.name}`}
            />
          </div>

          <div className="flex flex-col justify-center lg:col-span-5">
            <h1 className="display text-[clamp(2rem,4vw,3.4rem)] leading-tight text-ivory">
              {piece.name}
            </h1>

            <p className="mt-6 max-w-sm text-body leading-relaxed text-ivory/72">
              {piece.description}
            </p>

            <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-line/40 pt-6">
              <div>
                <dt className="label text-muted">Metal</dt>
                <dd className="mt-2 text-body text-ivory/80">{piece.metal}</dd>
              </div>
              <div>
                <dt className="label text-muted">Stone</dt>
                <dd className="mt-2 text-body text-ivory/80">{piece.stone}</dd>
              </div>
              <div>
                <dt className="label text-muted">Carat</dt>
                <dd className="mt-2 text-body tabular-nums text-ivory/80">
                  {piece.caratWeight > 0 ? `${piece.caratWeight.toFixed(2)} ct` : '—'}
                </dd>
              </div>
              <div>
                <dt className="label text-muted">Price</dt>
                <dd className="mt-2 display text-[1.25rem] tabular-nums text-gold-bright">
                  {formatINR(piece.priceINR)}
                </dd>
              </div>
            </dl>

            <a
              href={`mailto:atelier@aurelia.example?subject=${encodeURIComponent(`Enquiry — ${piece.name}`)}`}
              className="label mt-10 inline-flex items-center gap-4 self-start border border-gold/40 px-8 py-4 text-ivory transition-colors duration-[900ms] ease-out-expo hover:border-gold hover:text-gold-bright"
            >
              Enquire about this piece
              <span aria-hidden className="text-gold">
                →
              </span>
            </a>

            <Link
              href="/#collection"
              className="label mt-8 inline-flex items-center gap-3 text-muted transition-colors duration-[900ms] ease-out-expo hover:text-gold-bright"
            >
              <span aria-hidden>←</span>
              Back to the collection
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
