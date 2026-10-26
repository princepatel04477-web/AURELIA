import type { Metadata } from 'next';
import Link from 'next/link';
import { BespokeProcess } from '@/components/bespoke/BespokeProcess';
import BespokeCTA from '@/components/sections/BespokeCTA';
import { CINEMATIC } from '@/lib/assets';
import { formatINR, getPieceBySlug } from '@/lib/collections';

export const metadata: Metadata = {
  title: 'The Commission',
  description:
    'Commission a piece from AURELIA in Surat: one conversation, one drawing, eight weeks at the bench, one maker’s stamp. By appointment.',
  alternates: { canonical: '/bespoke' },
  openGraph: {
    title: 'The Commission — AURELIA',
    description: 'From a conversation to a stamp. Eight weeks at the bench in Surat.',
    url: '/bespoke',
    type: 'website',
    images: [{ url: CINEMATIC.ogImage, width: 1200, height: 630, alt: 'AURELIA — the commission' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Commission — AURELIA',
    description: 'From a conversation to a stamp.',
    images: [CINEMATIC.ogImage],
  },
};

type BespokePageProps = {
  searchParams: Promise<{ piece?: string }>;
};

export default async function BespokePage({ searchParams }: BespokePageProps) {
  const { piece: slug } = await searchParams;
  const piece = slug ? getPieceBySlug(slug) : undefined;

  const prefill = piece
    ? {
        interest: 'Bespoke',
        message: `Regarding ${piece.name} — ${piece.stone} in ${piece.metal}, ${formatINR(piece.priceINR)}.`,
      }
    : undefined;

  return (
    <div className="relative min-h-dvh bg-bg">
      <div className="frame pb-10 pt-[calc(var(--letterbox)+4.5rem)]">
        <nav aria-label="Breadcrumb">
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
              The Commission
            </li>
          </ol>
        </nav>

        <h1 className="display mt-10 max-w-3xl text-[clamp(2.4rem,6vw,4.8rem)] leading-[0.94] text-ivory">
          A piece that
          <br />
          <span className="display-italic text-gold">did not exist.</span>
        </h1>

        {piece ? (
          <p className="mt-6 max-w-xl text-body leading-relaxed text-ivory/70">
            The form below has been opened on{' '}
            <Link
              href={`/collections/${piece.slug}`}
              className="text-gold-bright underline decoration-gold/30 underline-offset-4"
            >
              {piece.name}
            </Link>
            . Change anything you like — the enquiry is only the beginning of the conversation.
          </p>
        ) : (
          <p className="mt-6 max-w-xl text-body leading-relaxed text-ivory/70">
            Four movements, eight weeks, one bench in Surat. Most commissions begin with a stone you
            already own, or one we have been keeping for you.
          </p>
        )}
      </div>

      <BespokeProcess />

      <BespokeCTA prefill={prefill} />
    </div>
  );
}
