'use client';

import { useWebGLSlot } from '@/components/providers/WebGLBudget';

/**
 * CANVAS POLICY — the hero composition, written down so it stays honest.
 *
 * The brief asks for three visual layers:
 *   1. LightRays        — animated backdrop            (WebGL2)
 *   2. Stage            — persistent ring              (WebGL2 / R3F)
 *   3. MetallicPaint    — painted gold wordmark        (WebGL2)
 *
 * AGENT_RULES §5.5 caps *live* WebGL work at two contexts. The reconciliation:
 *
 *   • ANIMATING (rAF-driven, counted against the two-canvas budget)
 *       – `stage`   : the ring, always the first claim
 *       – `rays`    : the backdrop, claims the second slot
 *   • STATIC (mounted, drawn, then frozen — zero per-frame GPU work)
 *       – `wordmark`: MetallicPaint in `paused` mode. It paints one frame,
 *         plays its own intro reveal, and never ticks again.
 *
 * So at most two canvases are ever rendering per frame, and the third is a
 * still plate. If either animating canvas cannot get a slot, it degrades to a
 * CSS light field instead of queueing a third context.
 */
export const ANIMATING_CANVAS_LIMIT = 2;

export type AnimatingCanvasId = 'stage' | 'rays' | 'carousel' | 'silk' | 'piece';

/** Human-readable reason each surface exists, for the audit trail. */
export const CANVAS_REGISTER: Readonly<Record<AnimatingCanvasId, string>> = {
  stage: 'Hero — the persistent ring (R3F)',
  rays: 'Hero — LightRays backdrop',
  carousel: 'Chapter V — CircularCarousel (ogl)',
  silk: 'Footer — Silk (ogl)',
  piece: 'Piece page — ModelViewer (R3F)',
};

/** Reserve one of the two animating slots. Returns false when the budget is full. */
export function useAnimatingCanvasSlot(id: AnimatingCanvasId, request = true): boolean {
  return useWebGLSlot(`canvas:${id}`, request);
}
