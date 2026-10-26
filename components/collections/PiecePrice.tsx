'use client';

import dynamic from 'next/dynamic';
import { formatINR } from '@/lib/collections';

/**
 * The price, counted up.
 *
 * React Bits `Counter` touches the canvas, so it lives behind a client-only
 * dynamic import; the plain formatted price is in the accessible name either
 * way, and is what a visitor without JavaScript reads.
 */

const Counter = dynamic(() => import('@/components/reactbits/Counter/Counter'), { ssr: false });

export function PiecePrice({ value }: { value: number }) {
  return (
    <>
      <span className="sr-only">{formatINR(value)}</span>
      <span aria-hidden>
        <Counter
          value={value}
          locale="en-IN"
          format={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }}
          duration={1600}
          intro
          fontSize="inherit"
          fontWeight="inherit"
          textColor="inherit"
          tabular
        />
      </span>
    </>
  );
}
