/**
 * The film's shared, mutable state.
 *
 * Read every frame by the WebGL scene and written by the DOM (scroll, pointer,
 * loading). It lives outside React on purpose: a per-frame value in React
 * state would re-render the tree sixty times a second.
 */

export type FilmBeat = 'intro' | 'stone' | 'fire' | 'hand' | 'finale';

type Listener = () => void;

type FilmState = {
  /** 0 → 1 across the whole film section. */
  progress: number;
  /** Normalised pointer, -1 → 1 on both axes. */
  pointerX: number;
  pointerY: number;
  /** True once the ring, diamonds and environment have loaded. */
  loaded: boolean;
  /** 0 → 1 while the gold dust assembles into the ring. */
  assemble: number;
  /** True once the assembly has finished; the hero copy waits on this. */
  assembled: boolean;
  /** True while the film section is on screen; the canvas sleeps otherwise. */
  active: boolean;
};

const state: FilmState = {
  progress: 0,
  pointerX: 0,
  pointerY: 0,
  loaded: false,
  assemble: 0,
  assembled: false,
  active: true,
};

const listeners = new Set<Listener>();

export const film = {
  get: (): Readonly<FilmState> => state,

  setProgress(value: number) {
    state.progress = Math.min(1, Math.max(0, value));
  },

  setPointer(x: number, y: number) {
    state.pointerX = x;
    state.pointerY = y;
  },

  setAssemble(value: number) {
    state.assemble = value;
  },

  markLoaded() {
    if (state.loaded) return;
    state.loaded = true;
    emit();
  },

  markAssembled() {
    if (state.assembled) return;
    state.assembled = true;
    emit();
  },

  setActive(value: boolean) {
    if (state.active === value) return;
    state.active = value;
    emit();
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

function emit() {
  listeners.forEach((listener) => listener());
}

/**
 * Beat windows in film progress. The DOM cards and the camera keyframes both
 * read these, so copy and picture can never drift apart.
 */
export const BEATS: Record<FilmBeat, { start: number; peak: number; end: number }> = {
  intro: { start: 0, peak: 0, end: 0.14 },
  stone: { start: 0.12, peak: 0.24, end: 0.38 },
  fire: { start: 0.36, peak: 0.48, end: 0.6 },
  hand: { start: 0.58, peak: 0.7, end: 0.82 },
  finale: { start: 0.8, peak: 0.94, end: 1 },
};

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** 0 outside a beat, rising to 1 at its peak and falling back by its end. */
export function beatWeight(beat: FilmBeat, progress: number): number {
  const { start, peak, end } = BEATS[beat];
  if (progress <= peak) return smoothstep(start, peak, progress);
  return 1 - smoothstep(peak, end, progress);
}
