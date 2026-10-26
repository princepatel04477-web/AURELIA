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
];

/** Everything the app can request, images and the 3D object. */
export const CODE_ASSET_PATHS: readonly string[] = [...CODE_IMAGE_PATHS, MODELS.ring];

/**
 * The declared fallback treatment for any image that never arrives: a dark
 * surface inside a hairline frame, with a fixed aspect ratio so the swap can
 * never move the layout. Phase 4 product cards use exactly this.
 */
export const CSS_PLATE =
  'bg-surface border border-line rounded-xs [background-image:radial-gradient(60%_55%_at_50%_42%,rgba(201,169,97,0.10),transparent_72%)]';

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
