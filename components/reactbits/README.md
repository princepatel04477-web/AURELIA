# React Bits — vendored sources

These files are the **TS + Tailwind** variants of React Bits, kept verbatim so the site builds without
network access to the shadcn registry.

**Source:** `DavidHDev/react-bits` → `src/ts-tailwind/<Category>/<Name>/<Name>.tsx`
(the same source the component's Code tab renders).

**Rule:** never rewrite a component's internal animation library. Props, styling and colour only.
Wrap a component if it needs a different feel.

## Installed (22)

| Component | Category | Extra dependencies |
|---|---|---|
| SplitText | TextAnimations | `gsap`, `@gsap/react` |
| BlurText | TextAnimations | `motion` |
| CountUp | TextAnimations | `motion` |
| ShinyText | TextAnimations | — |
| MaskedHeading | TextAnimations | `gsap` |
| Noise | Animations | — |
| Magnet | Animations | — |
| MetallicPaint | Animations | — |
| ScrollExpand | Animations | — |
| GradualBlur | Animations | — |
| GlareHover | Animations | — |
| StarBorder | Animations | — |
| LightRays | Backgrounds | — |
| Silk | Backgrounds | — |
| StaggeredMenu | Components | `gsap` |
| CircularCarousel | Components | — |
| MorphSlider | Components | `ogl`, `gsap` |
| Counter | Components | — |
| Masonry | Components | `@hugeicons/react`, `@hugeicons/core-free-icons` |
| AccordionGallery | Components | `gsap` |
| ModelViewer | Components | `three`, `@react-three/fiber`, `@react-three/drei` |
| TiltedCard | Components | — |

## Deviations from the source (lint/TS only, zero behaviour change)

- `LightRays.tsx` — removed two `console.error` calls (project rule: no `console.*`). Shader failures
  already return `null` and the component degrades quietly.
- `StaggeredMenu.tsx` — replaced `as any` on two CSS custom properties with typed `gsap.TweenVars`
  and `React.CSSProperties` casts (project rule: no `any`); `let arr` → `const arr` (prefer-const).

## Usage contract

- Every component here is `'use client'`. Never import one from a Server Component.
- WebGL-bearing components (`MetallicPaint`, `LightRays`, `Silk`, `ModelViewer`, `MorphSlider`) must be
  loaded with `next/dynamic` + `ssr: false` and mounted inside `<WebGLBoundary>` from
  `components/providers/WebGLBudget.tsx` (max 2 canvases).
- Pass `AURELIA` palette values (`--gold`, `--gold-bright`, `--surface`, `--ivory`) as props;
  do not hardcode React Bits' demo colours.
