/**
 * ASSET REGISTRY — the code-side mirror of `/public/IMAGES.md`.
 *
 * Contract:
 *   • `public/IMAGES.md` is the single source of truth for image paths.
 *   • Every path used in a component comes from this file, never from a literal.
 *   • A new path may only appear here if it already has a row in IMAGES.md.
 *
 * `auditAssets()` is the dev-only check: it reports paths this file requests
 * that are not on disk, and tells you which of those have no fallback. Nothing
 * here touches the filesystem — the caller supplies what exists — so this
 * module stays safe to import from client components.
 */

/* -------------------------------------------------------------------------
   Paths (exactly as written in IMAGES.md, including extension).
   ------------------------------------------------------------------------- */

export const CINEMATIC = {
  /** Chapter headline fill. 16:9 molten gold macro. */
  goldTexture: '/cinematic/gold-texture.jpg',
  /** Interlude plate. 16:9, hands setting a diamond under a loupe lamp. */
  atelierHands: '/cinematic/atelier-hands.jpg',
  /** Chapter stills, also the reduced-motion plates. */
  chapterStone: '/cinematic/chapter-stone.jpg',
  chapterLight: '/cinematic/chapter-light.jpg',
  /** Chapter III plate. 16:9, molten gold poured into a crucible. */
  chapterFire: '/cinematic/chapter-fire.jpg',
  chapterHand: '/cinematic/chapter-hand.jpg',
  /** Hero/atmosphere plates reserved for later phases. */
  heroPlate: '/cinematic/hero-plate.jpg',
  introPoster: '/cinematic/intro-poster.jpg',
  /** Category panels — the `/collections` accordion gallery, one per category. */
  categoryRings: '/cinematic/category-rings.jpg',
  categoryPendants: '/cinematic/category-pendants.jpg',
  categoryEarrings: '/cinematic/category-earrings.jpg',
  categoryBracelets: '/cinematic/category-bracelets.jpg',
  categoryNecklaces: '/cinematic/category-necklaces.jpg',
  /** Open Graph card, 1200×630. Referenced by every route's metadata. */
  ogImage: '/cinematic/og-aurelia.jpg',
  /** The commission, in four movements — the `/bespoke` horizontal sequence. */
  bespoke1: '/cinematic/bespoke-1.jpg',
  bespoke2: '/cinematic/bespoke-2.jpg',
  bespoke3: '/cinematic/bespoke-3.jpg',
  bespoke4: '/cinematic/bespoke-4.jpg',
} as const;

export const JEWELRY = {
  solitaire: '/jewelry/aurelia-solitaire-ring.jpg',
  eternity: '/jewelry/eternity-band.jpg',
  emeraldDrop: '/jewelry/emerald-drop-earrings.jpg',
  pearPendant: '/jewelry/pear-pendant.jpg',
  signet: '/jewelry/signet-ring.jpg',
  bridalSet: '/jewelry/bridal-set.jpg',
  polkiChoker: '/jewelry/polki-choker.jpg',
  tennisBracelet: '/jewelry/tennis-bracelet.jpg',
  goldHoops: '/jewelry/gold-hoops.jpg',
  atelierBench: '/jewelry/atelier-bench.jpg',
  stoneMacro: '/jewelry/stone-macro.jpg',
  handModel: '/jewelry/hand-model.jpg',
  /** Four angles of the featured piece (Chapter VI). */
  featured1: '/jewelry/featured-1.webp',
  featured2: '/jewelry/featured-2.webp',
  featured3: '/jewelry/featured-3.webp',
  featured4: '/jewelry/featured-4.webp',
} as const;

/** The 3D object. Same rule: no literal paths inside components. */
export const MODELS = {
  ring: '/models/ring.glb',
} as const;

/**
 * Per-piece models for the `ModelViewer` on a piece page.
 *
 * A piece only gets a viewer when its own `.glb` is delivered; the component
 * probes first and falls back to the still, so an absent model costs nothing.
 */
export const PIECE_MODELS: Readonly<Record<string, string>> = {
  'aurelia-solitaire': '/models/aurelia-solitaire.glb',
  'eternity-line-band': '/models/eternity-line-band.glb',
  'surat-signet': '/models/surat-signet.glb',
  'emerald-halo-drops': '/models/emerald-halo-drops.glb',
  'sculpted-hoops': '/models/sculpted-hoops.glb',
  'pear-luminous-pendant': '/models/pear-luminous-pendant.glb',
  'line-tennis-bracelet': '/models/line-tennis-bracelet.glb',
  'polki-choker': '/models/polki-choker.glb',
};

/** Every per-piece model path, for the audit. */
export const PIECE_MODEL_PATHS: readonly string[] = Object.values(PIECE_MODELS);

/** The model a piece page may offer, or `undefined` when none is declared. */
export function modelForSlug(slug: string): string | undefined {
  return PIECE_MODELS[slug];
}

/* -------------------------------------------------------------------------
   Fallback chains — consulted left to right, first existing file wins.
   `[]` means "no file fallback": the component must render a CSS plate.
   ------------------------------------------------------------------------- */

export const ASSET_FALLBACKS: Readonly<Record<string, readonly string[]>> = {
  [CINEMATIC.goldTexture]: [],
  [CINEMATIC.atelierHands]: [CINEMATIC.chapterHand],
  [CINEMATIC.chapterStone]: [],
  [CINEMATIC.chapterLight]: [],
  [CINEMATIC.chapterFire]: [],
  [CINEMATIC.chapterHand]: [],
  [CINEMATIC.heroPlate]: [],
  [CINEMATIC.introPoster]: [CINEMATIC.heroPlate],
  /** No file fallback: `Ring.tsx` builds the procedural solitaire. */
  [MODELS.ring]: [],
  [CINEMATIC.categoryRings]: [],
  [CINEMATIC.categoryPendants]: [],
  [CINEMATIC.categoryEarrings]: [],
  [CINEMATIC.categoryBracelets]: [],
  [CINEMATIC.categoryNecklaces]: [],
  [CINEMATIC.ogImage]: [],
  [CINEMATIC.bespoke1]: [],
  [CINEMATIC.bespoke2]: [],
  [CINEMATIC.bespoke3]: [],
  [CINEMATIC.bespoke4]: [],
  /** Absent model: the piece still stands in for it, so there is nothing to swap to. */
  ...Object.fromEntries(PIECE_MODEL_PATHS.map((path) => [path, []])),
  [JEWELRY.featured1]: [],
  [JEWELRY.featured2]: [],
  [JEWELRY.featured3]: [],
  [JEWELRY.featured4]: [],
};

/**
 * Every image path the app can request.
 *
 * Only paths actually wired into a component belong here — an entry that is
 * merely planned stays in IMAGES.md until it is used, so the audit never
 * reports a used-looking path that nothing renders.
 */
export const CODE_IMAGE_PATHS: readonly string[] = [
  CINEMATIC.goldTexture,
  CINEMATIC.atelierHands,
  CINEMATIC.chapterStone,
  CINEMATIC.chapterLight,
  CINEMATIC.chapterFire,
  CINEMATIC.chapterHand,
  JEWELRY.featured1,
  JEWELRY.featured2,
  JEWELRY.featured3,
  JEWELRY.featured4,
  CINEMATIC.categoryRings,
  CINEMATIC.categoryPendants,
  CINEMATIC.categoryEarrings,
  CINEMATIC.categoryBracelets,
  CINEMATIC.categoryNecklaces,
  CINEMATIC.bespoke1,
  CINEMATIC.bespoke2,
  CINEMATIC.bespoke3,
  CINEMATIC.bespoke4,
  CINEMATIC.ogImage,
];

/** Everything the app can request, images and the 3D object. */
export const CODE_ASSET_PATHS: readonly string[] = [
  ...CODE_IMAGE_PATHS,
  MODELS.ring,
  ...PIECE_MODEL_PATHS,
];

/**
 * The declared fallback treatment for any image that never arrives: a dark
 * surface inside a hairline frame, with a fixed aspect ratio so the swap can
 * never move the layout. Phase 4 product cards use exactly this.
 */
export const CSS_PLATE =
  'bg-surface border border-line rounded-xs [background-image:radial-gradient(60%_55%_at_50%_42%,rgba(201,169,97,0.10),transparent_72%)]';

/**
 * The inline plate in use wherever a vendor component insists on rendering its
 * own `<img>`: a dark surface with a gold hairline, as a data URI so the element
 * always has a valid, self-contained source.
 */
const PLATE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="g" cx="50%" cy="42%" r="62%"><stop offset="0" stop-color="#C9A961" stop-opacity="0.14"/><stop offset="0.6" stop-color="#C9A961" stop-opacity="0.03"/><stop offset="1" stop-color="#FAF7F2" stop-opacity="0"/></radialGradient></defs><rect width="800" height="1000" fill="#FFFFFF"/><rect width="800" height="1000" fill="url(#g)"/><rect x="24" y="24" width="752" height="952" fill="none" stroke="#C9A961" stroke-opacity="0.22"/></svg>';

export const PLATE_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(PLATE_SVG)}`;

/** The declared CSS stand-in for the fire plate: a gold glow at 8% on --bg. */
export const FIRE_PLATE_STYLE = {
  backgroundColor: 'var(--bg)',
  backgroundImage:
    'radial-gradient(58% 52% at 50% 56%, rgba(201, 169, 97, 0.08), rgba(201, 169, 97, 0.03) 46%, transparent 76%)',
} as const;

/* -------------------------------------------------------------------------
   Resolution helpers.
   ------------------------------------------------------------------------- */

/**
 * First candidate that is known to exist. `null` means the caller must draw a
 * CSS plate — never an `<img>` with an empty or missing source.
 */
export function resolveImage(
  candidates: readonly string[],
  present: readonly string[]
): string | null {
  for (const candidate of candidates) {
    if (present.includes(candidate)) return candidate;
  }
  return null;
}

/** Chain for a primary image: the file itself, then its declared fallbacks. */
export function fallbackChain(path: string): readonly string[] {
  const own = ASSET_FALLBACKS[path] ?? [];
  return [path, ...own];
}

/* -------------------------------------------------------------------------
   The dev-only audit.
   ------------------------------------------------------------------------- */

export type AssetAudit = {
  /** Paths the code can request. */
  referenced: readonly string[];
  /** Referenced and on disk. */
  present: readonly string[];
  /** Listed in IMAGES.md but not (yet) requested by any component. */
  unused: readonly string[];
  /** Referenced, absent from /public, absent from IMAGES.md — a manifest breach. */
  undeclared: readonly string[];
  /** Referenced, absent, but a declared fallback file exists on disk. */
  covered: readonly string[];
  /** Referenced, absent, no file fallback — the component draws a CSS plate. */
  plated: readonly string[];
  /** Referenced, absent, and no fallback declared at all: a real bug. */
  uncovered: readonly string[];
  /** Nothing can break: every absent path is handled one way or another. */
  ok: boolean;
};

export type AuditInput = {
  /** Files that actually exist under /public, as absolute web paths. */
  present: readonly string[];
  /** Paths parsed out of IMAGES.md. */
  manifest?: readonly string[];
  /** Defaults to `CODE_ASSET_PATHS`. */
  referenced?: readonly string[];
  /** Defaults to `ASSET_FALLBACKS`. */
  fallbacks?: Readonly<Record<string, readonly string[]>>;
};

/**
 * Diff code ↔ disk ↔ manifest.
 *
 * Runs in development only when a caller invokes it (see `npm run check:assets`
 * or the dev overlay); it is deliberately free of side effects so it cannot
 * throw during a production render.
 */
export function auditAssets({
  present,
  manifest = [],
  referenced = CODE_ASSET_PATHS,
  fallbacks = ASSET_FALLBACKS,
}: AuditInput): AssetAudit {
  const onDisk = new Set(present);
  const listed = new Set(manifest);

  const missing = referenced.filter((path) => !onDisk.has(path));

  const covered: string[] = [];
  const plated: string[] = [];
  const uncovered: string[] = [];

  for (const path of missing) {
    // A path with no entry at all in ASSET_FALLBACKS was never thought about.
    if (!(path in fallbacks)) {
      uncovered.push(path);
      continue;
    }
    const chain = fallbacks[path] ?? [];
    if (chain.some((next) => onDisk.has(next))) covered.push(path);
    else plated.push(path);
  }

  // Single-source-of-truth breach: code asks for a file IMAGES.md never lists.
  const undeclared = referenced.filter((path) => !listed.has(path));

  const unused = manifest.filter((path) => listed.has(path) && !referenced.includes(path));

  return {
    referenced,
    present: referenced.filter((path) => onDisk.has(path)),
    unused: Array.from(new Set(unused)),
    undeclared: Array.from(new Set(undeclared)),
    covered,
    plated,
    uncovered,
    ok: uncovered.length === 0 && undeclared.length === 0,
  };
}

/** Human-readable report, used by the dev runner. */
export function formatAudit(audit: AssetAudit): string {
  const line = (label: string, paths: readonly string[]) =>
    `${label} (${paths.length})${paths.length ? `\n  ${paths.join('\n  ')}` : ''}`;

  return [
    line('present', audit.present),
    line('missing — fallback file exists', audit.covered),
    line('missing — CSS plate (declared)', audit.plated),
    line('MISSING — no fallback declared', audit.uncovered),
    line('NOT IN IMAGES.md', audit.undeclared),
    line('in IMAGES.md, not yet requested', audit.unused),
    audit.ok ? 'audit: every absent path is handled' : 'audit: fix the paths above',
  ].join('\n');
}
