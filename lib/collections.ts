import { JEWELRY } from '@/lib/assets';

/**
 * THE COLLECTION — eight pieces.
 *
 * Image paths come from the asset registry, which mirrors `/public/IMAGES.md`;
 * the manifest is still the only place a path may be introduced. Prices live
 * here and nowhere else, and are always rendered through `formatINR`.
 */

export const CATEGORIES = [
  'All',
  'Rings',
  'Pendants',
  'Earrings',
  'Bracelets',
  'Necklaces',
] as const;

export type CollectionCategory = Exclude<(typeof CATEGORIES)[number], 'All'>;
export type CategoryFilter = (typeof CATEGORIES)[number];

export type CollectionPiece = {
  id: string;
  slug: string;
  name: string;
  category: CollectionCategory;
  metal: string;
  stone: string;
  /** Total carat weight of the principal stones. */
  caratWeight: number;
  priceINR: number;
  /** Path from `lib/assets` — never a literal. */
  image: string;
  description: string;
};

export const COLLECTION_PIECES: CollectionPiece[] = [
  {
    id: 'aurelia-solitaire',
    slug: 'aurelia-solitaire',
    name: 'The Aurelia Solitaire',
    category: 'Rings',
    metal: '18k yellow gold',
    stone: 'Brilliant-cut diamond',
    caratWeight: 1.42,
    priceINR: 640000,
    image: JEWELRY.solitaire,
    description:
      'The house stone. A single brilliant held in four tapered prongs, cut to return light rather than shout it. Set low, so the band sits flush against the finger.',
  },
  {
    id: 'eternity-line',
    slug: 'eternity-line-band',
    name: 'Eternity Line Band',
    category: 'Rings',
    metal: '18k white gold',
    stone: 'Baguette diamonds',
    caratWeight: 2.1,
    priceINR: 215000,
    image: JEWELRY.eternity,
    description:
      'Twenty-two baguettes set edge to edge, each one matched by hand for depth. No beginning, no clasp, no interruption in the line.',
  },
  {
    id: 'surat-signet',
    slug: 'surat-signet',
    name: 'Surat Signet',
    category: 'Rings',
    metal: '18k yellow gold',
    stone: 'Hand engraving',
    caratWeight: 0,
    priceINR: 145000,
    image: JEWELRY.signet,
    description:
      'Cut at the bench over three weeks, from wax to polish. The engraving is drawn by the maker, not the machine, so no two faces match.',
  },
  {
    id: 'emerald-halo-drops',
    slug: 'emerald-halo-drops',
    name: 'Emerald Halo Drops',
    category: 'Earrings',
    metal: '18k white gold',
    stone: 'Colombian emerald, diamond halo',
    caratWeight: 3.6,
    priceINR: 890000,
    image: JEWELRY.emeraldDrop,
    description:
      'A matched pair of emeralds, chosen for tone rather than size, ringed in brilliants and hung from a fine articulated hook.',
  },
  {
    id: 'sculpted-hoops',
    slug: 'sculpted-hoops',
    name: 'Sculpted Hoops',
    category: 'Earrings',
    metal: '18k yellow gold',
    stone: 'None — gold only',
    caratWeight: 0,
    priceINR: 96000,
    image: JEWELRY.goldHoops,
    description:
      'Hammered from a single gold rod, then weighted so they hang like a drawn line. The only piece in the house with no stone at all.',
  },
  {
    id: 'pear-luminous',
    slug: 'pear-luminous-pendant',
    name: 'Pear Luminous Pendant',
    category: 'Pendants',
    metal: '18k yellow gold',
    stone: 'Pear-cut diamond',
    caratWeight: 1.05,
    priceINR: 325000,
    image: JEWELRY.pearPendant,
    description:
      'A pear cut set north to south on a chain fine enough to disappear at the collarbone. The bail is hand-filed so the stone never tips.',
  },
  {
    id: 'line-tennis',
    slug: 'line-tennis-bracelet',
    name: 'Line Tennis Bracelet',
    category: 'Bracelets',
    metal: '18k white gold',
    stone: 'Brilliant-cut diamonds',
    caratWeight: 4.25,
    priceINR: 1250000,
    image: JEWELRY.tennisBracelet,
    description:
      'Forty stones in a continuous line, each link tested by hand for movement. The clasp is hidden so the line never breaks.',
  },
  {
    id: 'polki-choker',
    slug: 'polki-choker',
    name: 'Polki Choker No. 1',
    category: 'Necklaces',
    metal: '22k yellow gold',
    stone: 'Uncut polki diamonds',
    caratWeight: 12.8,
    priceINR: 1875000,
    image: JEWELRY.polkiChoker,
    description:
      'Cut in the old way, at Surat, with the natural face of the stone left intact. Set in kundan gold and finished with a woven thread back.',
  },
];

/** `₹6,40,000` — Indian grouping, no decimals, no currency drift. */
export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function piecesForCategory(category: CategoryFilter): CollectionPiece[] {
  return category === 'All'
    ? COLLECTION_PIECES
    : COLLECTION_PIECES.filter((piece) => piece.category === category);
}

export function getPieceBySlug(slug: string): CollectionPiece | undefined {
  return COLLECTION_PIECES.find((piece) => piece.slug === slug);
}

export const ALL_SLUGS = COLLECTION_PIECES.map((piece) => piece.slug);
