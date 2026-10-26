# AURELIA — Fix Prompts for Antigravity (from a real render audit, 26 Oct)

Run in order. One prompt per task. Wait for "build passes" before sending the next.
Do NOT let the agent add sections, rename files, or "improve" anything outside the named files.

---

## FIX 1 — Undo the half-finished light theme

```
Revert commit 88b9c97 ("transition site to luxury radiant light theme") with `git revert --no-edit 88b9c97`.
Reason: it swapped CSS tokens only. The 3D stage, GradualBlur tints (#0A0907), ember particles, MetallicPaint and every image in /public were built for a near-black ground, so the page now shows black boxes and black bands on ivory.
After the revert, confirm: --bg is #0A0907, body is dark, Hero mix-blend is 'screen', Vignette is back in Effects.tsx.
Run `npm run build`. Report files changed + build result. Change nothing else.
```

---

## FIX 2 — Stop the crash, remove the grain

```
Touch only: components/sections/FeaturedPiece.tsx, components/sections/Footer.tsx, components/sections/Collections.tsx, components/sections/Hero.tsx, app/layout.tsx, components/chrome/NoiseOverlay.tsx.

1. CRASH: with WebGL unavailable the home page shows "Application error: a client-side exception" — MorphSlider's OGL Renderer gets a null context ("Cannot set properties of null (setting 'renderer')"). Every OGL/three component (MorphSlider, Silk, LightRays, MetallicPaint, CircularCarousel, Stage) must only mount when useWebGL2Support() reports supported. Otherwise render its static fallback (image, CSS gradient, or plain gold-gradient text). Wrap each in a small React error boundary that renders the same fallback if the component throws.
2. GRAIN: remove <NoiseOverlay /> from app/layout.tsx entirely. Its dust/scratches render as black specks and a visible tile grid over every section. No grain anywhere.
3. Verify by launching Chrome with --disable-webgl: the home page must render every section top to bottom with no error overlay.
Build must pass. Report.
```

---

## FIX 3 — Hero: lead with a photograph, not the procedural ring

```
Touch only: components/sections/Hero.tsx, components/three/Stage.tsx, components/three/Ring.tsx (do not delete Ring.tsx).

The procedural ring reads as a toy (thick flat band, cloudy grey stone) and the fixed full-screen Stage canvas covers the wordmark, nav and every section below the hero.

New hero (magazine-cover composition):
- Full-viewport background: /jewelry/featured-1.webp via next/image, object-cover, priority, slow scale 1.08 → 1.0 over 2.4s on load (anime.js).
- Over it: a bottom-to-top gradient from #0A0907 at 85% to transparent at 55% so text reads.
- Giant "AURELIA" wordmark, bottom-left, Cormorant 300, clamp(4rem, 14vw, 13rem), gold gradient text (#C9A961 → #EBD8A6 → #C9A961), letters revealed with React Bits SplitText (chars, stagger 40ms, from y 60 + opacity 0).
- Under it, tagline "Fine Jewellery · Surat · Since 1998" (label class) and two links: "Enter the Collection ↓" (gold outline button) and "Book a Private Viewing" (text link).
- The Stage canvas must be absolute inside the hero only, NOT position: fixed. Remove it from the hero entirely if it can't be made transparent; the photo is the hero.
- Navbar must be readable over the hero: ivory text, and a 0→ backdrop-blur + #0A0907/70 background once scrolled 40px.
Build must pass. Report.
```

---

## FIX 4 — Story chapters: use the real plates, kill the empty pinned screens

```
Touch only: components/sections/StoryChapters.tsx.

Problems seen: each chapter pins for +170% while the 3D ring is gone, so the visitor scrolls through 4–5 empty screens; MaskedHeading renders only the letter "T"; the GradualBlur bands show as hard black bars.

Rebuild each chapter (II The Stone, III The Fire, IV The Hand) as a full-bleed image section, no pinning:
- Background: the existing plate (/cinematic/chapter-stone.jpg, chapter-fire.jpg, chapter-hand.jpg) with next/image, object-cover, and a GSAP ScrollTrigger parallax (yPercent -12 → 12, scrub true).
- Left-aligned overlay gradient #0A0907 90% → transparent 60%.
- Chapter label (label class, gold), giant italic numeral (II / III / IV, Cormorant italic, gold, 8–10rem), headline in Cormorant 300 ivory, 3.5–5rem, one line of body copy.
- Headline animation: React Bits BlurText (words, 900ms) — remove MaskedHeading and GradualBlur from this file entirely.
- Section height: 100svh desktop, auto with min 80svh on mobile.
- Keep the atelier-hands ScrollExpand interlude between III and IV.
Build must pass. Report.
```

---

## FIX 5 — Collection: images + a layout that works

```
Touch only: components/sections/Collections.tsx, lib/collections.ts, /public/jewelry/*.

1. Seven collection images return 404. Generate them with the style block from aurelia-image-brief.md (Part 2) and save under EXACTLY these paths (lib/assets.ts is the authority):
   /jewelry/eternity-band.jpg — eternity band of baguette diamonds, white gold, side-on macro
   /jewelry/signet-ring.jpg — hand-engraved yellow gold signet ring
   /jewelry/emerald-drop-earrings.jpg — matching pair of emerald drop earrings with diamond halos
   /jewelry/gold-hoops.jpg — matching pair of sculpted yellow gold hoops
   /jewelry/pear-pendant.jpg — pear-cut diamond pendant on fine gold chain
   /jewelry/tennis-bracelet.jpg — diamond line bracelet, macro on the clasp
   /jewelry/polki-choker.jpg — polki diamond choker in yellow gold, flat lay
   All on a near-black ground, 4:5, 1600px long edge, jpg q84.
2. Replace CircularCarousel (it renders as a squashed strip of blank cards) with an editorial grid:
   - Desktop: 4 columns, first card spans 2 columns × 2 rows (The Aurelia Solitaire).
   - Each card: React Bits TiltedCard (rotateAmplitude 6, scaleOnHover 1.03, no tooltip) with the image, then name (Cormorant 1.5rem), category · metal (label), price in en-IN ₹.
   - Category pills above filter the grid with an anime.js crossfade.
   - Mobile: 2 columns, no tilt.
   - Card click → /collections/[slug].
Build must pass. Report.
```

---

## FIX 6 — Inner pages: no blank blocks

```
Touch only: components/collections/PieceGrid.tsx, components/collections/CategoryGallery.tsx, components/bespoke/BespokeProcess.tsx, app/bespoke/page.tsx.

- /collections: the Masonry grid renders empty (huge blank area) and the AccordionGallery shows grey panels. Replace Masonry with the same editorial grid component built in FIX 5 (extract it to components/collections/CollectionGrid.tsx and reuse). Accordion panels use the matching /jewelry/ product image when the /cinematic/category-*.jpg file is missing.
- "Also on the bench" cards on /collections/[slug]: use the product images; they are currently white boxes.
- /bespoke: the pinned horizontal sequence leaves a full empty screen and white cards. Remove the pin. Render the four steps as a vertical 2-column list: number, title, two lines of copy, and an image (/cinematic/bespoke-1..4.jpg, falling back to /cinematic/atelier-hands.jpg, chapter-hand.jpg, chapter-fire.jpg, featured-4.webp in that order).
Build must pass. Report.
```

---

## FIX 7 — Verify with screenshots, not words

```
Start `npm run build && npm run start`. With Playwright, screenshot every viewport-height step of /, /collections, /collections/aurelia-solitaire, /bespoke at 1440×900 and 390×844, once with WebGL and once launched with --disable-webgl. Save to /qa/.
Then list, per screenshot: any blank viewport (more than 70% of the frame one flat colour), any black band, any broken/missing image, any text overlapping. Fix each with the smallest change in the file that owns it, re-shoot, and report the final list (must be empty).
```
