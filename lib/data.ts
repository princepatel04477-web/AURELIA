import { JEWELRY } from '@/lib/assets';

/**
 * The house, in data.
 *
 * One source of truth for every piece, price and caption. Components never
 * hardcode a name or a number — this file is what the copy in the chapters
 * must agree with, and it is the only place prices are allowed to live.
 */

export type Piece = {
  id: string;
  name: string;
  /** Which line of the house it belongs to. */
  line: string;
  /** One material fact. Never marketing. */
  detail: string;
  /** Price in whole rupees. */
  price: number;
  /** From the asset registry — never a literal path. */
  image: string;
  alt: string;
  /** Card proportion. Fixed so a swapped asset cannot move the layout. */
  ratio: 'portrait' | 'square' | 'wide';
};

export const COLLECTION: Piece[] = [
  {
    id: 'aurelia-solitaire',
    name: 'The Aurelia Solitaire',
    line: 'Signature',
    detail: '1.42 ct brilliant, D colour, set in 18k yellow gold.',
    price: 640000,
    image: JEWELRY.solitaire,
    alt: 'Solitaire diamond ring in yellow gold on black.',
    ratio: 'portrait',
  },
  {
    id: 'eternity-band',
    name: 'Eternity Band',
    line: 'Signature',
    detail: 'Twenty-two baguette diamonds, hand-set edge to edge.',
    price: 215000,
    image: JEWELRY.eternity,
    alt: 'Eternity band of baguette diamonds, seen side-on.',
    ratio: 'square',
  },
  {
    id: 'emerald-drops',
    name: 'Emerald Drops',
    line: 'Heirloom',
    detail: 'Colombian emeralds in a diamond halo, 18k white gold.',
    price: 890000,
    image: JEWELRY.emeraldDrop,
    alt: 'Emerald drop earrings with diamond halos.',
    ratio: 'portrait',
  },
  {
    id: 'signet',
    name: 'Hand-Engraved Signet',
    line: 'Atelier',
    detail: 'Cut by hand at the bench, three weeks from wax to polish.',
    price: 145000,
    image: JEWELRY.signet,
    alt: 'Engraved gold signet ring.',
    ratio: 'square',
  },
];

/** The Call-to-Buy piece: one object, one price, one action. */
export const FEATURED: Piece = COLLECTION[0];

export const SECONDARY: Piece[] = COLLECTION.slice(1);

/** `₹6,40,000` — Indian grouping, no decimals, no currency symbol drift. */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export const RATIO_CLASS: Record<Piece['ratio'], string> = {
  portrait: 'aspect-[4/5]',
  square: 'aspect-square',
  wide: 'aspect-[3/2]',
};
