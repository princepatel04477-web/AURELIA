import type { Metadata } from 'next';
import Link from 'next/link';
import { ChapterCard } from '@/components/chrome/ChapterCard';
import { CategoryGallery } from '@/components/collections/CategoryGallery';
import { PieceGrid } from '@/components/collections/PieceGrid';
import { CINEMATIC } from '@/lib/assets';
import { COLLECTION_PIECES, formatINR } from '@/lib/collections';

export const metadata: Metadata = {
  title: 'The Collection',
  description:
    'Eight pieces from the AURELIA bench in Surat: solitaires, bands, drops, hoops, pendants, line bracelets and polki. One bench, one hand, one price each.',
  alternates: { canonical: '/collections' },
  openGraph: {
    title: 'The Collection — AURELIA',
    description: 'Eight pieces, one bench. Fine jewellery made in Surat, Gujarat.',
    url: '/collections',
    type: 'website',
    images: [{ url: CINEMATIC.ogImage, width: 1200, height: 630, alt: 'AURELIA — the collection' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Collection — AURELIA',
    description: 'Eight pieces, one bench.',
    images: [CINEMATIC.ogImage],
  },
};

const LOWEST = Math.min(...COLLECTION_PIECES.map((piece) => piece.priceINR));

export default function CollectionsPage() {
  return (
    <div className="relative min-h-dvh bg-bg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(70% 34% at 50% 0%, rgba(201,169,97,0.10), transparent 72%)',
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
            <li aria-current="page" className="text-ivory/80">
              The Collection
            </li>
          </ol>
        </nav>

        <ChapterCard numeral="V" title="The Collection" meta={`${COLLECTION_PIECES.length} pieces`} />

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
          <h1 className="display lg:col-span-8 text-[clamp(2.4rem,6.4vw,5.2rem)] leading-[0.92] text-ivory">
            Everything on
            <br />
            <span className="display-italic text-gold">the one bench.</span>
          </h1>

          <p className="lg:col-span-4 max-w-sm text-body leading-relaxed text-ivory/70">
            Five lines, eight pieces, from {formatINR(LOWEST)}. Each is made once, numbered, and
            entered in the atelier ledger before it leaves Surat.
          </p>
        </div>

        <div className="mt-16">
          <CategoryGallery />
        </div>

        <div className="mt-24">
          <PieceGrid pieces={COLLECTION_PIECES} />
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-line/30 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="label text-muted">By appointment · Surat, Gujarat</p>
          <Link
            href="/bespoke"
            className="label inline-flex min-h-11 items-center gap-4 text-ivory/80 transition-colors duration-[900ms] ease-out-expo hover:text-gold-bright"
          >
            Commission a piece
            <span aria-hidden className="text-gold">
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
