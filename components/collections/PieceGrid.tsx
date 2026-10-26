'use client';

import { CollectionGrid } from './CollectionGrid';
import type { CollectionPiece } from '@/lib/collections';

export function PieceGrid({ pieces }: { pieces?: CollectionPiece[] } = {}) {
  void pieces;
  return <CollectionGrid showFilters={true} />;
}

export default PieceGrid;
