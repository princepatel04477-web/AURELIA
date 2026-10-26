import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AssetFrame } from '@/components/chrome/AssetFrame';
import { ChapterCard } from '@/components/chrome/ChapterCard';
import { PiecePrice } from '@/components/collections/PiecePrice';
import { PieceStage } from '@/components/collections/PieceStage';
import { CINEMATIC } from '@/lib/assets';
import {
  ALL_SLUGS,
  COLLECTION_PIECES,
  formatINR,
  getPieceBySlug,
  type CollectionPiece,
} from '@/lib/collections';

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

  const title = `${piece.name} — ${formatINR(piece.priceINR)}`;

  return {
    title,
    description: piece.description,
    alternates: { canonical: `/collections/${piece.slug}` },
    openGraph: {
      title: `${piece.name} — AURELIA`,
      description: `${piece.stone} in ${piece.metal}. ${formatINR(piece.priceINR)}.`,
      url: `/collections/${piece.slug}`,
      type: 'website',
      images: [
        { url: CINEMATIC.ogImage, width: 1200, height: 630, alt: `${piece.name} — AURELIA` },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${piece.name} — AURELIA`,
      description: `${piece.stone} in ${piece.metal}.`,
      images: [CINEMATIC.ogImage],
    },
  };
}

/** Related pieces: the same line first, then the rest of the bench. */
function relatedTo(piece: CollectionPiece): CollectionPiece[] {
  const sameLine = COLLECTION_PIECES.filter(
    (entry) => entry.category === piece.category && entry.slug !== piece.slug
  );
  const others = COLLECTION_PIECES.filter(
    (entry) => entry.category !== piece.category && entry.slug !== piece.slug
  );
  return [...sameLine, ...others].slice(0, 3);
}

/** One piece, one price, one action. */
export default async function PiecePage({ params }: PiecePageProps) {
  const { slug } = await params;
  const piece = getPieceBySlug(slug);

  if (!piece) notFound();

  const related = relatedTo(piece);

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

      <div className="frame relative z-10 pb-[calc(var(--letterbox)+3rem)] pt-[calc(var(--letterbox)+4.5rem)]">
        {/* Breadcrumbs. */}
        <nav aria-label="Breadcrumb" className="mb-10">
          <ol className="label flex flex-wrap items-center gap-3 text-muted">
            <li>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center transition-colors duration-[900ms] ease-out-expo hover:text-gold-bright"
              >
                AURELIA
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link
                href="/collections"
                className="inline-flex min-h-11 items-center transition-colors duration-[900ms] ease-out-expo hover:text-gold-bright"
              >
                The Collection
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ivory/80">
              {piece.name}
            </li>
          </ol>
        </nav>

        <ChapterCard numeral="V" title={piece.category} meta={piece.metal} />

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* The piece: a model when one is delivered, the still when not. */}
          <div className="lg:col-span-7">
            <PieceStage
              slug={piece.slug}
              name={piece.name}
              image={piece.image}
              alt={`${piece.name} — ${piece.stone} in ${piece.metal}.`}
            />
          </div>

          <div className="flex flex-col justify-center lg:col-span-5">
            <h1 className="display text-[clamp(2rem,4vw,3.4rem)] leading-tight text-ivory">
              {piece.name}
            </h1>

            <p className="mt-6 max-w-sm text-body leading-relaxed text-ivory/70">
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
                <dt className="label text-muted">Reference</dt>
                <dd className="mt-2 text-body tabular-nums text-ivory/80">
                  AU-{piece.slug.slice(0, 3).toUpperCase()}-{String(piece.priceINR).slice(0, 3)}
                </dd>
              </div>
            </dl>

            {/* Price, counted up. */}
            <div className="mt-10 border-t border-line/40 pt-6">
              <span className="label text-muted">Price</span>
              <p className="mt-3 display text-[clamp(1.8rem,3.4vw,2.6rem)] tabular-nums text-gold-bright">
                <PiecePrice value={piece.priceINR} />
              </p>
              <p className="mt-2 text-meta text-muted">Inclusive of duties within India.</p>
            </div>

            <div className="mt-8 flex flex-col gap-4">
              <Link
                href={`/bespoke?piece=${piece.slug}`}
                className="label inline-flex min-h-[3.25rem] items-center justify-between gap-6 border border-gold/45 px-8 text-ivory transition-colors duration-[900ms] ease-out-expo hover:border-gold hover:text-gold-bright"
              >
                Request This Piece
                <span aria-hidden className="text-gold">
                  →
                </span>
              </Link>

              <Link
                href="/collections"
                className="label inline-flex min-h-11 items-center gap-3 text-muted transition-colors duration-[900ms] ease-out-expo hover:text-gold-bright"
              >
                <span aria-hidden>←</span>
                All pieces
              </Link>
            </div>
          </div>
        </div>

        {/* Related. */}
        <section aria-labelledby="related-title" className="mt-24 border-t border-line/30 pt-10">
          <div className="flex items-baseline justify-between gap-6">
            <h2 id="related-title" className="label text-gold">
              Also on the bench
            </h2>
            <Link
              href="/collections"
              className="label inline-flex min-h-11 items-center text-muted transition-colors duration-[900ms] ease-out-expo hover:text-gold-bright"
            >
              View all
            </Link>
          </div>

          <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {related.map((entry) => (
              <li key={entry.slug}>
                <Link href={`/collections/${entry.slug}`} className="group block">
                  <AssetFrame
                    src={entry.image}
                    alt={`${entry.name} — ${entry.stone} in ${entry.metal}.`}
                    ratio="aspect-[4/5]"
                    className="w-full"
                  />
                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <span className="text-meta text-ivory/85 transition-colors duration-[900ms] ease-out-expo group-hover:text-gold-bright">
                      {entry.name}
                    </span>
                    <span className="label shrink-0 text-muted tabular-nums">
                      {formatINR(entry.priceINR)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
