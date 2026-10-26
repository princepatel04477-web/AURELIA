# AURELIA — Image Generation Brief + Antigravity Instructions

Project: AURELIA Fine Jewellery, Surat — cinematic 3D prototype
Delivery: tonight
Owner: Varunya Technologies

---

## PART 1 — INSTRUCTIONS FOR ANTIGRAVITY (paste this whole section)

```
TASK: Generate and place every image for the AURELIA site. This is an asset task only.

HARD RULES
- Do NOT edit any .tsx / .ts / .css file. Code is frozen. Only write files under /public and update /public/IMAGES.md.
- /public/IMAGES.md and the paths referenced in code are the source of truth for filenames and extensions.
  Before generating anything:
    1. Read /public/IMAGES.md, lib/collections.ts, and lib/assets.ts.
    2. Build a list of every image path the code actually references.
    3. Match each path to a prompt in PART 3 of aurelia-image-brief.md by its purpose.
    4. If a path in this brief differs from the code (name or extension), the CODE path wins. Save under the code path.
    5. If the code references an image with no matching prompt here, write a prompt in the same style block and report it.
- Generate in tier order (Tier 1 → Tier 2 → Tier 3). Finish and verify a tier before starting the next.

GENERATION
- Use your built-in image generation tool.
- Every prompt = STYLE BLOCK (Part 2) + the image's subject prompt (Part 3). Never send the subject prompt alone.
- Apply the NEGATIVE list where the tool supports it; otherwise append "Avoid: <negative list>" to the prompt.
- Use the aspect ratio listed for each image.
- FEATURED ANGLES (featured-1..4): generate featured-1 first. Use featured-1 as the reference image for featured-2, -3 and -4 so it is visibly the SAME ring (same stone shape, same halo, same band) from different angles. If the tool cannot take a reference image, put the exact ring description in every prompt word for word.
- COLLECTION: each of the 8 pieces must look like a different piece. Same lighting and background across all 8 so they read as one catalogue.

QUALITY CHECK — inspect every generated image before saving. Regenerate (max 3 attempts) if any of these:
- prongs melted, missing, merged, or uneven count
- stones merging into metal, wrong stone count in a pair (earrings must match)
- chain links broken or fused
- visible text, logo, watermark, signature
- hands with wrong finger count or warped tools (atelier / bespoke images)
- background not near-black (except menu-bespoke and bespoke-2, which may be cream paper)
After 3 failed attempts, keep the best one, and list it in the report as NEEDS REVIEW.

EXPORT
- Use sharp (install if missing) to resize and encode.
- Product shots (jewelry/*): 1600px on the long edge.
- Cinematic 16:9 plates (cinematic/chapter-*, gold-texture, atelier-hands): 2560px wide.
- Portrait/menu/category/bespoke: 1600px on the long edge.
- .webp → quality 82. .jpg → quality 84, progressive, mozjpeg.
- Strip metadata. Target under 400 KB per product shot, under 700 KB per 16:9 plate.

AFTER EACH TIER
1. Update /public/IMAGES.md: mark each path as DONE / NEEDS REVIEW / MISSING.
2. Run the dev-only asset check in lib/assets.ts and confirm every Tier path now resolves (no fallback plate used).
3. Run `npm run build`. Must pass.
4. Report: tier, files written (path + size in KB), anything NEEDS REVIEW, build result. Then continue to the next tier.

FINAL REPORT
- Full table of every path with status and size.
- List of any code-referenced paths still missing.
- Confirm no source files were modified (git status should show only /public changes).
```

---

## PART 2 — STYLE BLOCK + NEGATIVE

### Style block (prefix every prompt)

```
Luxury high-jewellery campaign photography, shot on medium format, 100mm macro lens, deep near-black warm background (#0A0907), single soft key light from upper left with a thin gold rim light, dramatic chiaroscuro, rich 18k yellow gold with warm reflections, brilliant-cut diamonds with crisp fire and dispersion, physically accurate prongs and settings, shallow depth of field, subtle film grain, cinematic colour grade with lifted blacks and warm highlights, editorial minimalism, no text, no logo, no watermark.
```

### Negative

```
deformed prongs, melted metal, extra stones, asymmetric setting, mismatched earring pair, fused chain links, plastic look, cartoon, CGI render look, oversaturated, cluttered background, text, letters, logo, watermark, signature, extra fingers, warped hands, blurry subject
```

---

## PART 3 — IMAGE PROMPTS

Paths below are the intended paths. If the code references a different name/extension for the same purpose, use the code's path.

### TIER 1 — the site looks finished after this (do first)

| # | Path | Ratio | Subject prompt |
|---|---|---|---|
| 1 | `/jewelry/featured-1.webp` | 1:1 | Oval-cut 2 carat diamond engagement ring with a single halo of small round diamonds and a slim yellow gold pavé band, photographed straight-on from the front, ring standing upright on a black obsidian slab with a soft reflection below. |
| 2 | `/jewelry/featured-2.webp` | 1:1 | The same oval-cut diamond halo ring with slim yellow gold pavé band (identical design to featured-1), side profile view showing the gallery and basket under the stone, standing upright on black obsidian. |
| 3 | `/jewelry/featured-3.webp` | 1:1 | The same oval-cut diamond halo ring with slim yellow gold pavé band (identical design to featured-1), top-down overhead view looking straight into the stone, lying on black obsidian. |
| 4 | `/jewelry/featured-4.webp` | 1:1 | The same oval-cut diamond halo ring (identical design to featured-1), extreme macro close-up on the centre stone and halo, facets and spectral fire filling most of the frame. |
| 5 | `/cinematic/chapter-light.jpg` | 16:9 | A single beam of warm light falling across a dark surface, catching one diamond ring at the right third of the frame, vast negative space on the left, atmospheric haze in the beam. |
| 6 | `/cinematic/chapter-stone.jpg` | 16:9 | Extreme macro inside a brilliant-cut diamond, facets and spectral fire filling the frame, abstract, deep black between facets. |
| 7 | `/cinematic/chapter-fire.jpg` | 16:9 | Molten gold being poured from a crucible into a mould, bright orange-gold stream, sparks rising, dark foundry, motion blur on sparks. |
| 8 | `/cinematic/chapter-hand.jpg` | 16:9 | A jeweller's hand polishing a gold ring on a leather bench pad, warm tungsten light, gold dust on the bench, documentary realism, face not visible. |
| 9 | `/cinematic/atelier-hands.jpg` | 16:9 | Close-up of a master jeweller's hands setting a diamond with fine tweezers under a loupe lamp, workbench with gold shavings and small files, warm tungsten light, Indian atelier, documentary realism, face not visible. |
| 10 | `/cinematic/gold-texture.jpg` | 16:9 | Abstract macro of a molten gold surface with soft liquid ripples and warm specular highlights, no objects, fills the entire frame edge to edge. |

### TIER 2 — the collection

All 8 share the same black obsidian surface and lighting so they read as one catalogue.

| # | Path | Ratio | Subject prompt |
|---|---|---|---|
| 11 | `/jewelry/ring-1.webp` | 4:5 | Solitaire engagement ring, 2 carat round brilliant diamond in a six-prong yellow gold setting, ring standing upright on black obsidian, reflection below. |
| 12 | `/jewelry/ring-2.webp` | 4:5 | Eternity band fully set with round diamonds all the way around in yellow gold, lying at a slight angle, light catching every stone. |
| 13 | `/jewelry/ring-3.webp` | 4:5 | Emerald-cut diamond ring with tapered baguette side stones on a yellow gold band, three-quarter view, standing upright. |
| 14 | `/jewelry/pendant-1.webp` | 4:5 | Pear-cut diamond teardrop pendant on a fine yellow gold chain, chain draping in a soft S-curve on black velvet. |
| 15 | `/jewelry/pendant-2.webp` | 4:5 | Indian-inspired gold pendant with fine filigree work and a central uncut polki diamond, suspended on an invisible thread, floating against black. |
| 16 | `/jewelry/earring-1.webp` | 4:5 | Matching pair of diamond drop earrings with cascading graduated round stones in yellow gold, hanging from a minimal black stand, both earrings identical. |
| 17 | `/jewelry/earring-2.webp` | 4:5 | Matching pair of contemporary gold jhumka-inspired earrings with a diamond pavé dome, arranged diagonally, both earrings identical. |
| 18 | `/jewelry/bracelet-1.webp` | 4:5 | Diamond tennis bracelet in yellow gold, coiled loosely on black obsidian, macro focus near the clasp. |
| 19 | `/jewelry/necklace-1.webp` | 4:5 | Bridal diamond and yellow gold collar necklace laid flat in a perfect arc on black velvet, overhead shot. |

> Note: 9 pieces listed. If lib/collections.ts references 8, match its list exactly and skip any extra.

### TIER 3 — menu, categories, bespoke (polish)

**Menu previews** (shown on hover in the full-screen menu)

| # | Path | Ratio | Subject prompt |
|---|---|---|---|
| 20 | `/cinematic/menu-collections.jpg` | 3:4 | Still life of three different gold rings on stacked black stone blocks, low camera angle. |
| 21 | `/cinematic/menu-bespoke.jpg` | 3:4 | Pencil jewellery design sketches on cream paper with a loose diamond and a coil of gold wire beside them, soft warm light. |
| 22 | `/cinematic/menu-maison.jpg` | 3:4 | Dark luxury boutique interior with a single lit glass display case, gold accents, deep shadows. |
| 23 | `/cinematic/menu-atelier.jpg` | 3:4 | Jeweller's bench tools arranged neatly: loupe, files, pliers, gold wire, warm tungsten light. |
| 24 | `/cinematic/menu-contact.jpg` | 3:4 | An elegant black jewellery box opened, empty velvet ring slot, single soft spotlight. |

**Category panels** (Accordion Gallery on /collections — tall, lots of space above the piece)

| # | Path | Ratio | Subject prompt |
|---|---|---|---|
| 25 | `/cinematic/category-rings.jpg` | 9:16 | A single diamond ring standing upright at the bottom third, vast dark negative space above, thin beam of light from above. |
| 26 | `/cinematic/category-pendants.jpg` | 9:16 | A single diamond pendant hanging from a chain that disappears upward into darkness, pendant in the lower third. |
| 27 | `/cinematic/category-earrings.jpg` | 9:16 | A matching pair of long diamond drop earrings hanging side by side in the lower half, darkness above. |
| 28 | `/cinematic/category-bracelets.jpg` | 9:16 | A gold and diamond bracelet standing on its edge as an oval in the lower third, dark negative space above. |
| 29 | `/cinematic/category-necklaces.jpg` | 9:16 | A diamond necklace draped vertically over a black velvet bust form, lower two-thirds of the frame. |

**Bespoke process** (pinned horizontal sequence on /bespoke)

| # | Path | Ratio | Subject prompt |
|---|---|---|---|
| 30 | `/cinematic/bespoke-1.jpg` | 4:3 | Consultation table with loose diamonds on a black grading tray, tweezers and a loupe beside them, warm light. |
| 31 | `/cinematic/bespoke-2.jpg` | 4:3 | Close-up of a hand-drawn pencil ring sketch on cream paper, eraser marks visible, a pencil resting across it. |
| 32 | `/cinematic/bespoke-3.jpg` | 4:3 | A green wax ring model being carved with a fine tool, wax shavings on the bench, macro. |
| 33 | `/cinematic/bespoke-4.jpg` | 4:3 | A finished diamond ring presented in an open black velvet box, soft spotlight, celebratory but minimal. |

**Optional lifestyle** (only if a component references it)

| # | Path | Ratio | Subject prompt |
|---|---|---|---|
| 34 | `/cinematic/model-1.jpg` | 3:4 | South Asian woman in black silk, three-quarter profile, wearing diamond drop earrings and a fine pendant, face partially in shadow, editorial beauty lighting. |

---

## PART 4 — If time runs out

Priority if you must stop early:
1. Tier 1 rows 1–4 (featured ring) — without these the hero product section is a flat plate.
2. Tier 1 rows 5–10 (chapter plates) — the scroll story falls back to CSS plates without them.
3. Tier 2 — any missing collection image shows as a dark plate in the carousel.
4. Tier 3 — falls back gracefully; safe to skip for tonight.

Every missing image already has a fallback in code, so the site never breaks. It just looks less finished.
