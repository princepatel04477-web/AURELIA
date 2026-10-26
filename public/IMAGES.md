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

## /public/cinematic/ — the atmosphere

| File | Role | Ratio | Used by | Alt / note |
|---|---|---|---|---|
| `hero-plate.jpg` | Hero backdrop fallback still (behind WebGL intro) | 16:9 | Hero | Dark studio interior with a single warm light |
| `intro-poster.jpg` | Poster frame for the WebGL intro on slow devices | 16:9 | Preloader | Abstract gold light in black |
| `chapter-light.jpg` | Chapter I backing plate, light through fabric | 3:2 | Chapter I | Warm light falling through dark fabric |
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
| `menu-editorial.jpg` | Full-screen menu journal column | 3:4 | Navbar menu | Atelier detail, vertical crop |
| `og-aurelia.jpg` | Open Graph card (1200×630) | 1.91:1 | Metadata | Wordmark over a single stone |

---

## Technical contract

- **Hero plate**: 2400 × 1350 minimum, ≤ 420 KB AVIF.
- **Product stills**: 1600 px on the long edge, ≤ 260 KB each.
- **Textures** (`gold-foil`, `env-studio`): power-of-two where possible; HDR ≤ 1 MB.
- **GLB**: ≤ 2 MB, Draco-compressed, PBR Metallic-Roughness, Y-up, real-world scale in mm.
- Every `<Image>` needs `alt` text drawn from this table, explicit `width`/`height` (or `fill` + `sizes`),
  and `loading="lazy"` except the hero plate.
- Reduced motion / low-power: WebGL surfaces fall back to `hero-plate.jpg` or the product still.

## Delivery

Drop files into `/public/jewelry/` and `/public/cinematic/` with the exact names above.
Missing files are tolerated by the components (fallback plate), but the final QA pass
compares this manifest against the folder contents 1:1.
