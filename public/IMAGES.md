# IMAGES.md — AURELIA image brief

The canonical manifest of every image the site expects. **Code must reference exactly these paths.**
Two folders, two jobs:

- `/public/jewelry/` — the objects. Studio light, black ground, one piece per frame.
- `/public/cinematic/` — the atmosphere. Backdrops, textures, model maps, grain plates.

Nothing in this list is decorative filler: each file has a section, an aspect ratio and an alt line.
Until a file is delivered, the component that uses it must render its `--surface` fallback plate
(the layout must never collapse).

---

## Art direction (applies to both folders)

| Rule | Detail |
|---|---|
| Ground | Near-black `#0A0907` → `#14110D`. Never pure `#000`, never white. |
| Light | One source, high and slightly camera-left. Gold rim light on metal edges. |
| Palette | Gold `#C9A961`, highlight `#EBD8A6`, ivory reflections, zero saturated colour. |
| Finish | Fine 35mm grain, slight halation on speculars, no lens flare, no sparkle stars. |
| Composition | Generous negative space. The object occupies 30–45% of frame. |
| Depth | Macro, 85–100mm look, shallow DOF; background falls to black by 1.2 m. |
| Format | AVIF/WebP delivered, JPG fallback. sRGB. No visible text, no watermark, no logos. |
| Naming | `kebab-case` only. Never rename a file after it ships. |

---

## /public/jewelry/ — the objects

| File | Role | Ratio | Section | Alt text |
|---|---|---|---|---|
| `aurelia-solitaire-ring.jpg` | Hero stone — the house signature solitaire | 4:5 | Hero | Solitaire diamond ring in yellow gold on black |
| `eternity-band.jpg` | Full eternity band, macro side-on | 1:1 | Chapter II — The Stone | Eternity band of baguette diamonds |
| `emerald-drop-earrings.jpg` | Drop earrings, emerald + diamond halo | 4:5 | Chapter II — The Stone | Emerald drop earrings with diamond halos |
| `pear-pendant.jpg` | Pear-cut pendant on fine chain | 3:4 | Chapter III — The Hand | Pear-cut diamond pendant on a gold chain |
| `signet-ring.jpg` | Hand-engraved signet, men's line | 1:1 | Chapter III — The Hand | Engraved gold signet ring |
| `bridal-set.jpg` | Bridal necklace + earrings, flat lay | 4:5 | Chapter IV — The Vow | Bridal gold and diamond necklace set |
| `polki-choker.jpg` | Polki choker, Indian craft chapter | 3:2 | Chapter IV — The Vow | Polki diamond choker in gold |
| `tennis-bracelet.jpg` | Line bracelet, macro clasp detail | 16:9 | Chapter V — The Inheritance | Diamond line bracelet, clasp detail |
| `gold-hoops.jpg` | Sculpted hoops, single pair | 1:1 | Chapter V — The Inheritance | Sculpted gold hoop earrings |
| `atelier-bench.jpg` | Bench, tools, unset stones (process) | 3:2 | Chapter III — The Hand | Jeweller's bench with tools and loose stones |
| `stone-macro.jpg` | Loose brilliant, inclusion detail | 1:1 | Chapter II — The Stone | Macro of a loose brilliant-cut diamond |
| `hand-model.jpg` | Worn scale — ring on hand, low light | 4:5 | CTA / Call to Buy | Hand wearing a gold ring in low light |
| `featured-1.webp` | Featured piece — three-quarter hero angle | 4:5 | Chapter VI — The One | Featured solitaire, three-quarter view |
| `featured-2.webp` | Featured piece — profile, band and gallery | 4:5 | Chapter VI — The One | Featured solitaire, profile |
| `featured-3.webp` | Featured piece — top-down on the stone | 4:5 | Chapter VI — The One | Featured solitaire, top view |
| `featured-4.webp` | Featured piece — macro of the setting | 4:5 | Chapter VI — The One | Featured solitaire, setting macro |

## /public/cinematic/ — the atmosphere

| File | Role | Ratio | Used by | Alt / note |
|---|---|---|---|---|
| `hero-plate.jpg` | Hero backdrop fallback still (behind WebGL intro) | 16:9 | Hero | Dark studio interior with a single warm light |
| `intro-poster.jpg` | Poster frame for the WebGL intro on slow devices | 16:9 | Preloader | Abstract gold light in black |
| `chapter-light.jpg` | Chapter I backing plate, light through fabric | 3:2 | Chapter I, hero plate fallback | Warm light falling through dark fabric |
| `chapter-fire.jpg` | Chapter III backing plate — the crucible | 16:9 | Chapter III — The Fire | Molten gold poured into a crucible, sparks rising, dark foundry |
| `chapter-stone.jpg` | Chapter II backing plate, stone texture | 3:2 | Chapter II | Macroscopic crystalline texture |
| `chapter-hand.jpg` | Chapter III backing plate, hands at work | 3:2 | Chapter III | Hands working at a jeweller's bench |
| `chapter-vow.jpg` | Chapter IV backing plate, drapery | 3:2 | Chapter IV | Ivory silk drapery in low light |
| `chapter-inheritance.jpg` | Chapter V backing plate, archive box | 3:2 | Chapter V | Velvet jewellery box, aged patina |
| `gold-foil.jpg` | MetallicPaint / MorphSlider fill texture | 1:1 | Product surfaces | Hammered gold leaf texture |
| `silk-drape.jpg` | Silk background texture (tone-on-tone) | 1:1 | Backgrounds | Folded silk, near-black |
| `noise-plate.png` | Static grain plate for reduced-motion fallback | 1:1 | Global grain | 35mm grain plate, tileable |
| `vignette.png` | Corner falloff overlay, 8-bit alpha | 16:9 | Global | Vignette mask, transparent centre |
| `env-studio.hdr` | Studio environment for the three.js scene | equirect | ModelViewer / 3D hero | Neutral dark studio HDRI |
| `ring-model.glb` | Hero ring — low-poly, 4k maps, < 2 MB | — | 3D hero | Drachma-style solitaire, PBR gold |
| `ring-normal.jpg` | Ring normal map | 1:1 | 3D hero | Tangent-space normal |
| `ring-metal.jpg` | Ring metalness/roughness map | 1:1 | 3D hero | Gold roughness variation |
| `gold-texture.jpg` | Molten gold surface — the fill for chapter headlines | 16:9 | Chapters II–IV headlines (`MaskedHeading`) | Abstract macro of a molten gold surface |
| `atelier-hands.jpg` | Interlude plate — the work itself | 16:9 | Interlude, between III and IV (`ScrollExpand`) | A jeweller's hands setting a diamond under a loupe lamp |
| `menu-editorial.jpg` | Full-screen menu journal column | 3:4 | Navbar menu | Atelier detail, vertical crop |
| `og-aurelia.jpg` | Open Graph card (1200×630) | 1.91:1 | Metadata | Wordmark over a single stone |
| `category-rings.jpg` | `/collections` accordion panel — Rings | 3:4 | Collections index | Solitaire and band on black |
| `category-pendants.jpg` | `/collections` accordion panel — Pendants | 3:4 | Collections index | Pear pendant on a gold chain |
| `category-earrings.jpg` | `/collections` accordion panel — Earrings | 3:4 | Collections index | Emerald drops, side light |
| `category-bracelets.jpg` | `/collections` accordion panel — Bracelets | 3:4 | Collections index | Line bracelet, clasp detail |
| `category-necklaces.jpg` | `/collections` accordion panel — Necklaces | 3:4 | Collections index | Polki choker on dark ground |
| `bespoke-1.jpg` | Commission I — Consult | 4:5 | `/bespoke` | Two hands over a tray of loose stones |
| `bespoke-2.jpg` | Commission II — Sketch | 4:5 | `/bespoke` | Graphite drawing of a setting on paper |
| `bespoke-3.jpg` | Commission III — Craft | 4:5 | `/bespoke` | Piercing saw at the bench, gold dust |
| `bespoke-4.jpg` | Commission IV — Deliver | 4:5 | `/bespoke` | Finished piece in a closed hand, low light |

## /public/models/ — the object

| File | Role | Format | Used by | Note |
|---|---|---|---|---|
| `ring.glb` | Hero ring, the real model | glTF 2.0 binary | 3D hero — `components/three/Ring.tsx` via `useGLTF` | ≤ 2 MB, Draco, PBR gold, Y-up. Absent → the procedural solitaire stands in. |
| `aurelia-solitaire.glb` | Piece model | glTF 2.0 binary | `/collections/aurelia-solitaire` — `ModelViewer` | Absent → `TiltedCard` with the piece still. |
| `eternity-line-band.glb` | Piece model | glTF 2.0 binary | `/collections/eternity-line-band` — `ModelViewer` | Same fallback. |
| `surat-signet.glb` | Piece model | glTF 2.0 binary | `/collections/surat-signet` — `ModelViewer` | Same fallback. |
| `emerald-halo-drops.glb` | Piece model | glTF 2.0 binary | `/collections/emerald-halo-drops` — `ModelViewer` | Same fallback. |
| `sculpted-hoops.glb` | Piece model | glTF 2.0 binary | `/collections/sculpted-hoops` — `ModelViewer` | Same fallback. |
| `pear-luminous-pendant.glb` | Piece model | glTF 2.0 binary | `/collections/pear-luminous-pendant` — `ModelViewer` | Same fallback. |
| `line-tennis-bracelet.glb` | Piece model | glTF 2.0 binary | `/collections/line-tennis-bracelet` — `ModelViewer` | Same fallback. |
| `polki-choker.glb` | Piece model | glTF 2.0 binary | `/collections/polki-choker` — `ModelViewer` | Same fallback. |

`cinematic/ring-model.glb` above stays reserved for the React Bits `ModelViewer`; the hero canvas reads
`models/ring.glb` first and only that path is treated as the hero object.

---

## Single source of truth — read this before adding an image

**This file is the only place an image path may be introduced.** A path that is not in this table must not
appear in code. The rule is enforced, not just documented:

- `/lib/assets.ts` mirrors this table as typed constants (`CINEMATIC`, `JEWELRY`) and exposes
  `CODE_IMAGE_PATHS` — every image path the app can request — plus `ASSET_FALLBACKS`.
- `auditAssets()` (dev only) diffs three things and returns them separately:
  `manifestOnly` (listed here, not used yet), `missing` (referenced in code, absent from `/public`),
  and `uncovered` (missing **and** without a fallback). The build is only honest when
  `uncovered` is empty.
- Extension convention: **cinematic plates are `.jpg`.** Do not switch a delivered file to `.webp`
  (or the reverse) without changing this table first — the audit keys off exact filenames.

### Fallbacks — required for every entry used in code

| Asset | When absent |
|---|---|
| `gold-texture.jpg` | Headline renders with the CSS gold gradient fill (`#C9A961 → #EBD8A6`). No swap, no shift: the gradient heading stays in normal flow, the textured heading is an absolutely-positioned overlay. |
| `atelier-hands.jpg` | Falls back to `chapter-hand.jpg`; if that is absent too, a dark `--surface` plate inside a 1px hairline frame, caption intact. Never an `<img>` with a broken source. |
| `chapter-*.jpg` stills | Rendered as a CSS `background-image` over `--surface`, so a missing plate is simply a darker frame — no broken-image glyph, no reflow. |
| `chapter-fire.jpg` | CSS plate: radial `#C9A961` glow at 8% on `--bg`.
| `featured-1..4.webp` | Any missing angle is replaced by an inline plate (dark surface, gold hairline) before the slider mounts, so the WebGL slider never points at a 404. | Same fixed frame, no `<img>`, no shift. |
| Any plate after `webglcontextlost` | The stage fades out and the current section's `chapter-*.jpg` plate takes the frame; if that file is absent, its CSS plate does. |
| `ring.glb` | The procedural solitaire in `components/three/Ring.tsx` stands in. |
| `category-*.jpg` | The accordion panel keeps its label over the `--surface` plate — no `<img>`, no glyph. |
| `bespoke-1..4.jpg` | The step keeps its drawn frame and caption; the plate is the same reserved 4:5 box. |
| `models/<slug>.glb` | The piece page renders `TiltedCard` with the piece still instead of `ModelViewer`. |
| Product cards (Phase 4) | Dark `--surface` card + hairline frame, fixed aspect ratio so nothing shifts. |

## Technical contract

- **Hero plate**: 2400 × 1350 minimum, ≤ 420 KB AVIF.
- **Product stills**: 1600 px on the long edge, ≤ 260 KB each.
- **Textures** (`gold-texture`, `gold-foil`, `env-studio`): power-of-two where possible; HDR ≤ 1 MB.
- **`gold-texture.jpg` / `atelier-hands.jpg` / `chapter-fire.jpg`**: all 16:9, 2400 × 1350, ≤ 320 KB — they
  run full-bleed behind pinned type, so banding and visible compression blocks are disqualifying.
- **GLB**: ≤ 2 MB, Draco-compressed, PBR Metallic-Roughness, Y-up, real-world scale in mm.
- Every `<Image>` needs `alt` text drawn from this table, explicit `width`/`height` (or `fill` + `sizes`),
  and `loading="lazy"` except the hero plate.
- Reduced motion / low-power: WebGL surfaces fall back to `hero-plate.jpg` or the product still.

## Delivery

Drop files into `/public/jewelry/` and `/public/cinematic/` with the exact names above.
Missing files are tolerated by the components (fallback plate), but the final QA pass
compares this manifest against the folder contents 1:1.

A delivery is accepted only when `auditAssets().uncovered` is empty — i.e. every path the code
requests either exists on disk or has a declared fallback in the table above.
