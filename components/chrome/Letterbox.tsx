'use client';

/**
 * Cinematic chrome.
 *
 * The bottom letterbox bar. The top of the frame belongs to the navigation bar,
 * which carries its own ground and hairline, so there is no second bar (and no
 * second wordmark) behind it.
 */
export function Letterbox() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 z-[60]">
      <div
        className="letterbox-panel flex items-start justify-center overflow-hidden bg-bg"
        style={{ height: 'var(--letterbox)' }}
      >
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      </div>
    </div>
  );
}

export default Letterbox;
