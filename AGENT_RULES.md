# AGENT_RULES.md — AURELIA

> **Re-read this file at the start of every task.** It is the contract for the build.
> Project: **AURELIA — Fine Jewellery, Surat** · cinematic 3D luxury jewelry website prototype.

---

## 0. Project identity

- Brand: **AURELIA** — Fine Jewellery, Surat (Gujarat, India).
- Positioning: heirloom-grade high jewellery, slow craft, cinematic restraint.
- Deliverable: a working Next.js prototype that reads like a film title sequence, not a shop.
- Voice: near-zero copy. Brand-dominant. Understated confidence. No hype, no emoji, no exclamation marks.
- Never write: "Lorem ipsum", "TODO", placeholder marketing filler, fake claims about certifications,
  or prices that contradict `/lib/data.ts`.

---

## 1. Design references (study the pattern, do not copy assets)

**hero.gallery**
- *Infinite Machine* — magazine-cover hero: the brand name is the composition, copy is near-zero,
  asymmetric margin notes, a single cinematic image field.
- *Shareio* — oversized serif display type, kinetic type entrances, type as architecture.
- *Don Prod* — a WebGL intro that resolves into the hero (preloader → camera settle → hero reveal).
- *Console* — cinematic mood backdrop: deep blacks, one light source, grain, vignette.

**navbar.gallery**
- *Full Screen menu* category — a slim, quiet top bar that opens a **full-viewport editorial menu**
  (numbered chapters, oversized serif links, staggered reveal, image/journal column).

**cta.gallery**
- *Call to Buy* category — **one object, one price, one action.** No feature grids, no badge soup.

**Rule:** if a reference element cannot be earned by the jewellery, cut it.

---

## 2. Stack (no substitutions)

| Layer | Requirement |
|---|---|
| Framework | Next.js **15** App Router (`app/`) |
| UI runtime | React **19** |
| Language | TypeScript **strict** |
| Styling | Tailwind CSS **3.4** |
| 3D | `three`, `@react-three/fiber` **9**, `@react-three/drei` **10**, `@react-three/postprocessing` |
| Orchestration motion | `animejs` **v4** |
| Scroll motion | `gsap` + `@gsap/react` + `ScrollTrigger` |
| Smooth scroll | `lenis` |
| Primitives | React Bits (source-installed into `components/reactbits/`) |
| Icons (Masonry only) | `@hugeicons/react`, `@hugeicons/core-free-icons` |
| GLSL helper (MorphSlider) | `ogl` |
| Declarative tweens (BlurText, CountUp) | `motion` |

Do not swap, add or upgrade a layer without an explicit task instruction.

---

## 3. React Bits — source installs

- Run `npx shadcn@latest init` **before** any React Bits install.
- Install each component with:
  `npx shadcn@latest add @react-bits/<ComponentName>-TS-TW`
- Installed set (source of truth):
  `SplitText, BlurText, CountUp, Noise, StaggeredMenu, Magnet, MetallicPaint, LightRays, ScrollExpand,
  MaskedHeading, GradualBlur, CircularCarousel, MorphSlider, Counter, GlareHover, StarBorder, Masonry,
  AccordionGallery, ModelViewer, TiltedCard, ShinyText, Silk`
- Before each install, open `https://reactbits.dev/get-started/index`, find the component page, and confirm
  the exact component name from its **Code** tab.
- If the CLI fails for a component, copy the **TS + Tailwind** source from its Code tab into
  `/components/reactbits/<Name>/` and install the dependencies that tab lists.
- **Install status (recorded 2026-10-26):** `npx shadcn@latest init` could not reach the registry from this
  environment, so components were sourced from the official React Bits repository
  (`DavidHDev/react-bits`, `src/ts-tailwind/<Category>/<Name>/<Name>.tsx`) — the same TS+TW files the Code tab
  serves. They live verbatim in `/components/reactbits/<Name>/<Name>.tsx`.
- Only two lint-level edits were made to vendor sources (no animation-library changes): removed two
  `console.error` calls in `LightRays` (no-console rule) and typed two CSS custom-property casts in
  `StaggeredMenu` to satisfy TS strict. Provenance: `/components/reactbits/README.md`.
- **Never rewrite a React Bits component's internal animation library.** You may change props, styling and
  colours only. If a component needs a different feel, wrap it — do not edit its internals.
- Every React Bits component is a client component. No React Bits import inside a server component.

---

## 4. anime.js v4 — orchestration layer only

Permitted uses: **preloader, text sequencing, SVG drawing, route-transition choreography, form micro-interactions.**

```ts
import { animate, createTimeline, stagger, utils, svg } from 'animejs';
```

- Use the `ease` parameter (never the v3 `easing`).
- Never call the removed v3 global `anime()`.
- Store instances in refs; call `.revert()` on unmount (`useEffect` cleanup).
- Do not use anime.js for continuous scroll-linked animation — that is GSAP ScrollTrigger's job.
- Do not animate layout properties that force reflow; prefer transform/opacity/clip-path/filter.

---

## 5. Code rules (hard gates)

1. No `any`. No `@ts-ignore`, no `@ts-expect-error`, no `as unknown as` escape hatches in app code.
2. No `console.log` (or `console.*` debugging output) in committed code.
3. No `TODO`, no `FIXME`, no lorem ipsum, no dead commented-out blocks.
4. Every WebGL component is a **client component loaded via `next/dynamic` with `ssr: false`**.
5. **Max 2 WebGL canvases mounted at once.** Unmount or pause off-screen ones with `IntersectionObserver`
   (see `components/providers/WebGLBudget.tsx`).
6. Every animated component honours `prefers-reduced-motion` (see `lib/useReducedMotion.ts`).
7. Each task touches **only the files it names**. No drive-by refactors.
8. End every task with `npm run build` **and** `npm run lint`; fix all errors before reporting.
9. Report at the end of each task: **files changed + build result**.
10. Path alias `@/*` only. Server components by default; `'use client'` only where required.

---

## 6. Cinematic language

**Palette (CSS custom properties in `app/globals.css`)**

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0A0907` | page black, never pure #000 |
| `--surface` | `#14110D` | cards, panels, inset fields |
| `--gold` | `#C9A961` | primary metal accent |
| `--gold-bright` | `#EBD8A6` | highlights, hover, hairlines |
| `--ivory` | `#F3EEE4` | body text, display text on dark |
| `--muted` | `#857D6E` | labels, captions, meta |

**Typography**
- Display: **Cormorant Garamond** 300/400 + italic — **`next/font/local`** (`app/fonts/index.ts`),
  variable `--font-display`. Variable TTFs self-hosted in `/app/fonts/`.
- Body: **Inter** 300/400 — **`next/font/local`**, variable `--font-body`.
- Reason for `local` over `google`: the build environment has no access to `fonts.googleapis.com`;
  self-hosting keeps the build hermetic and removes a render-blocking third-party request. Same families,
  same weights, same axes — never substitute a different typeface.
- Labels: Inter, uppercase, **small caps at 0.32em tracking**, 10–11px, `--muted`.
- Never use a third family. Never bold display type past 400.

**Motion**
- Slow and weighted: **900–1600ms** durations.
- Easing: **outExpo / inOutQuart**. Nothing bounces. No spring. No elastic.
- Hover states settle, they do not snap.
- Reveals are staggered but never chaotic: one idea at a time.

**Chrome**
- Global React Bits **Noise** overlay — fine 35mm grain, ~4% opacity, `pointer-events: none`, fixed.
- **Letterbox bars** top/bottom (6vh) that open on load and close on route change.
- **Chapter cards**: `"CHAPTER I — THE LIGHT"` label before each section.

---

## 7. Asset conventions

- Jewellery stills: `/public/jewelry/`
- Cinematic backdrops / model textures: `/public/cinematic/`
- Expected filenames are enumerated in `/public/IMAGES.md` — code must reference exactly those paths.
- Images are art-directed, not decorative: each one has a caption, an aspect ratio, and a role.
- No stock-photo watermarks, no AI-garbled text inside an image, no logos on jewellery.

---

## 8. Definition of done

A task is done when:
- `npm run build` exits 0 (no warnings that indicate broken types).
- `npm run lint` exits 0.
- No rule in §5 is violated (`grep` for `any`, `console.log`, `TODO`, `@ts-ignore` comes back clean).
- The page still feels like a film: slow, dark, gold-lit, quiet.
