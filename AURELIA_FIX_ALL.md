# AURELIA — ONE-PASS FIX (paste this whole file into Antigravity)

You are fixing the AURELIA jewellery site so it can be shown to a client tonight. The issues below come from rendering every page in a browser. They are not guesses. Work through the 7 fixes IN ORDER.

## RULES (read first, apply to every fix)
- Do only what each fix says. No new sections, no renaming files, no redesigning things that aren't listed.
- After EACH fix: run `npm run build`. If it fails, fix it before moving on. Then `git add -A && git commit -m "fix N: <title>"`.
- No `any`, no `@ts-ignore`, no `console.log`, no TODO, no lorem ipsum.
- anime.js v4 syntax only: `animate`, `createTimeline`, `stagger`, `ease`. Never `anime()` or `easing`.
- Never change the internal animation code inside `components/reactbits/*`. Only change props and styling.
- If a fix can't be done as written, stop and report why. Don't improvise a different design.

---

## FIX 1 — Undo the half-finished light theme
Run `git revert --no-edit 88b9c97`.
Why: that commit changed the CSS colour tokens only. The 3D stage, the GradualBlur tints (#0A0907), the ember particles, MetallicPaint and every image in /public were all built for a near-black background, so the page now shows black boxes and black bands on ivory.
Check after: `--bg` is `#0A0907`, the body is dark, the Hero canvas wrapper uses `mixBlendMode: 'screen'`, and Vignette is back in `components/three/Effects.tsx`.

## FIX 2 — Stop the crash, remove the grain
Files: `components/sections/FeaturedPiece.tsx`, `components/sections/Footer.tsx`, `components/sections/Collections.tsx`, `components/sections/Hero.tsx`, `app/layout.tsx`, `components/chrome/NoiseOverlay.tsx`.
1. When WebGL is unavailable, the home page shows "Application error: a client-side exception". The cause is that MorphSlider's OGL Renderer receives a null context ("Cannot set properties of null (setting 'renderer')").
   - Mount every OGL/three component only when `useWebGL2Support()` reports supported. That means MorphSlider, Silk, LightRays, MetallicPaint, CircularCarousel and Stage.
   - Otherwise render a static fallback: an image, a CSS gradient, or gold-gradient text.
   - Wrap each of these components in a small React error boundary that renders the same fallback if it throws.
2. Remove `<NoiseOverlay />` from `app/layout.tsx` completely. Its dust and scratches show as black specks and a visible grid of tiles over every section.
3. Check: launch Chrome with `--disable-webgl`. The home page must render every section from top to bottom with no error overlay.

## FIX 3 — Hero: a photograph instead of the 3D ring
Files: `components/sections/Hero.tsx`, `components/three/Stage.tsx`. Do NOT delete `Ring.tsx`.
Problem: the procedural ring looks like a toy, and the fixed full-screen Stage canvas covers the wordmark, the navbar and everything below the hero.
Build this hero instead:
- **Background:** `/jewelry/featured-1.webp` as a full-viewport `next/image` (object-cover, priority). On load, scale it slowly from 1.08 to 1.0 over 2.4s with anime.js.
- **Overlay:** a gradient from `#0A0907` at 85% (bottom) to transparent at 55%, so the text stays readable.
- **Wordmark:** a giant "AURELIA" at bottom-left.
  - Cormorant 300, `clamp(4rem,14vw,13rem)`.
  - Gold gradient text: `#C9A961` → `#EBD8A6` → `#C9A961`.
  - Reveal it with React Bits SplitText: per character, 40ms stagger, from y 60 and opacity 0.
- **Below the wordmark:**
  - The line "Fine Jewellery · Surat · Since 1998" (use the `label` class).
  - "Enter the Collection ↓" as a gold outline button linking to `#collection`.
  - "Book a Private Viewing" as a text link to the commission section.
- **Stage canvas:** remove it from the hero entirely. Nothing may be `position: fixed` and full-screen except the navbar.
- **Navbar:** ivory text. After 40px of scroll, add `backdrop-blur` and a `bg-[#0A0907]/70` background.

## FIX 4 — Story chapters: real images, no empty pinned screens
File: `components/sections/StoryChapters.tsx`.
Problems:
- Each chapter stays pinned for +170% of a screen with nothing in it, so visitors scroll through 4–5 empty screens.
- MaskedHeading renders only the letter "T".
- GradualBlur draws hard black bars.

Rebuild Chapter II (The Stone), III (The Fire) and IV (The Hand) as full-bleed image sections with NO pinning:
- **Background:** `/cinematic/chapter-stone.jpg`, `chapter-fire.jpg` and `chapter-hand.jpg` via `next/image` (object-cover), with a GSAP ScrollTrigger parallax: yPercent -12 → 12, scrub true.
- **Overlay:** a gradient from `#0A0907` at 90% on the left to transparent at 60%.
- **Text, left-aligned:**
  - Gold chapter label.
  - Giant italic numeral (II / III / IV): Cormorant italic, gold, 8–10rem.
  - Headline: Cormorant 300, ivory, 3.5–5rem.
  - One line of body copy.
- **Headline animation:** React Bits BlurText, by word, 900ms. Delete every use of MaskedHeading and GradualBlur from this file.
- **Height:** 100svh on desktop; on mobile, auto with a minimum of 80svh.
- Keep the atelier-hands ScrollExpand image between III and IV as it is now. It already works.

## FIX 5 — Collection: missing images + a grid that works
Files: `components/sections/Collections.tsx`, `lib/collections.ts`, `/public/jewelry/*`. Create the new file `components/collections/CollectionGrid.tsx`.

**Step 1: generate the 7 missing images (they currently fail to load).**
- Use the style block in Part 2 of `aurelia-image-brief.md`.
- Every image: near-black background, 4:5 ratio, 1600px on the long edge, saved as JPG at quality 84.
- Save under EXACTLY these paths, because `lib/assets.ts` decides the filenames:

| Path | Subject |
|---|---|
| `/jewelry/eternity-band.jpg` | Eternity band of baguette diamonds in white gold, side-on macro |
| `/jewelry/signet-ring.jpg` | Hand-engraved yellow gold signet ring |
| `/jewelry/emerald-drop-earrings.jpg` | A matching pair of emerald drop earrings with diamond halos |
| `/jewelry/gold-hoops.jpg` | A matching pair of sculpted yellow gold hoops |
| `/jewelry/pear-pendant.jpg` | Pear-cut diamond pendant on a fine gold chain |
| `/jewelry/tennis-bracelet.jpg` | Diamond line bracelet, macro on the clasp |
| `/jewelry/polki-choker.jpg` | Polki diamond choker in yellow gold, flat lay |

- Reject and regenerate any image with melted prongs, mismatched earrings, or any text or watermark.

**Step 2: replace CircularCarousel with a grid.** CircularCarousel currently renders as a squashed strip of blank cards. Build `CollectionGrid.tsx`:
- **Desktop:** 4 columns. The first card (The Aurelia Solitaire) spans 2 columns × 2 rows.
- **Each card:** React Bits TiltedCard (rotateAmplitude 6, scaleOnHover 1.03, tooltip off) holding the image, then:
  - name in Cormorant 1.5rem
  - category · metal as a label
  - price in en-IN ₹ format
- **Filters:** category pills above the grid filter it, with an anime.js crossfade.
- **Mobile:** 2 columns, no tilt.
- **Click:** a card opens `/collections/[slug]`.

## FIX 6 — Inner pages: no blank blocks
Files: `components/collections/PieceGrid.tsx`, `components/collections/CategoryGallery.tsx`, `components/bespoke/BespokeProcess.tsx`, `app/bespoke/page.tsx`, `app/collections/[slug]/page.tsx`.
- **/collections:**
  - The Masonry grid renders as a huge empty area. Replace it with `CollectionGrid` from Fix 5.
  - The AccordionGallery panels are grey. When a `/cinematic/category-*.jpg` file is missing, use the matching product image from `/jewelry/`.
- **/collections/[slug]:** the "Also on the bench" cards are white boxes. Use the product images.
- **/bespoke:** the pinned horizontal sequence leaves a full empty screen and white cards.
  - Remove the pin.
  - Render the 4 steps as a vertical 2-column list. Each step shows a number, a title, two lines of copy, and an image.
  - Image order: `/cinematic/bespoke-1..4.jpg`. If those are missing, fall back to `atelier-hands.jpg`, `chapter-hand.jpg`, `chapter-fire.jpg`, `featured-4.webp`.

## FIX 7 — Check with screenshots
1. Run `npm run build && npm run start`.
2. With Playwright, take a screenshot at every viewport-height scroll step of `/`, `/collections`, `/collections/aurelia-solitaire` and `/bespoke`.
   - Sizes: 1440×900 and 390×844.
   - Do each page twice: once normally, once with Chrome launched with `--disable-webgl`.
   - Save to `/qa/` (add `/qa` to `.gitignore`).
3. Check every screenshot for:
   - a blank viewport (more than 70% of the frame is one flat colour)
   - a black band or bar
   - a broken or missing image
   - overlapping text
   - a visible error overlay
4. Fix each problem with the smallest change in the file that owns it, then take the screenshots again.

## FINAL REPORT
- One line per fix: done or blocked, plus the commit hash.
- The final screenshot check list, which must be empty.
- `npm run build` output (route table).
- Confirm `.aurelia-src.tgz` is deleted from the repo root and is not committed.
