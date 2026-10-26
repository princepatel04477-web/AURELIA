import { BufferGeometry, Float32BufferAttribute, LatheGeometry, Vector2, Vector3, CylinderGeometry } from 'three';

/**
 * Procedural solitaire.
 *
 * Everything here is geometry only — materials live in `Ring.tsx` so a designer
 * can retune the metal and the stone without touching the construction.
 * No file in this module touches the DOM or three's renderer.
 */

/** Band cross-section (millimetres-as-units). A comfort fit is convex *inside*. */
const BAND = {
  halfHeight: 0.17,
  outer: 0.655,
  inner: 0.55,
  chamfer: 0.022,
  comfortBulge: 0.02,
  segments: 224,
} as const;

/** Stone proportions for a brilliant cut, in band units. */
export const STONE = {
  girdleRadius: 0.3,
  girdleSegments: 16,
  tableRadius: 0.155,
  crownHeight: 0.15,
  pavilionDepth: 0.29,
  /**
   * Girdle plane in ring-assembly space. The band stands upright (its axis
   * along Z), so its crown sits at y = 0.655 and the stone rides above it.
   */
  girdleY: 0.78,
} as const;

/** Where the four prongs grab the stone, in radians. */
export const PRONG_ANGLES = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4] as const;

/**
 * Comfort-fit band: lathe a closed profile around Y.
 * Outer face chamfered top and bottom, inner face bulged so the ring sits
 * comfortably against the finger instead of cutting into it.
 */
export function createComfortBandGeometry(): LatheGeometry {
  const { halfHeight, outer, inner, chamfer, comfortBulge, segments } = BAND;

  const profile: Vector2[] = [
    new Vector2(outer - chamfer, -halfHeight),
    new Vector2(outer, -halfHeight + chamfer),
    new Vector2(outer, halfHeight - chamfer),
    new Vector2(outer - chamfer, halfHeight),
    new Vector2(inner + chamfer, halfHeight),
    new Vector2(inner, halfHeight - chamfer),
    new Vector2(inner - comfortBulge, 0),
    new Vector2(inner, -halfHeight + chamfer),
    new Vector2(inner + chamfer, -halfHeight),
  ];

  // Close the profile loop so the bottom face is a real surface, not a hole.
  profile.push(profile[0].clone());

  const geometry = new LatheGeometry(profile, segments);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * One tapered prong, unit height, base at y = 0, tip at y = 1.
 * Scaled per prong so all four can share a single geometry.
 */
export function createProngGeometry(): CylinderGeometry {
  const geometry = new CylinderGeometry(0.42, 1, 1, 12, 1, false);
  geometry.translate(0, 0.5, 0);
  geometry.computeVertexNormals();
  return geometry;
}

const ringPoints = (count: number, radius: number, y: number, offset: number): Vector3[] =>
  Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + offset;
    return new Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  });

/**
 * Faceted brilliant cut.
 *
 * 8 crown facets fanning out from a flat table, a 16-sided girdle, and 16
 * pavilion facets closing on the culet. Un-indexed on purpose: every triangle
 * gets its own normal, so the stone reads as cut glass rather than a blob.
 */
export function createBrilliantGeometry(): BufferGeometry {
  const { girdleRadius, girdleSegments, tableRadius, crownHeight, pavilionDepth } = STONE;

  const girdle = ringPoints(girdleSegments, girdleRadius, 0, 0);
  const tableCount = girdleSegments / 2;
  const table = ringPoints(tableCount, tableRadius, crownHeight, Math.PI / girdleSegments);
  const culet = new Vector3(0, -pavilionDepth, 0);

  const positions: number[] = [];
  const push = (a: Vector3, b: Vector3, c: Vector3) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };

  // Table — one flat facet, fanned from a single corner.
  const tableAnchor = table[0];
  for (let index = 1; index < tableCount - 1; index += 1) {
    push(tableAnchor, table[index], table[index + 1]);
  }

  // Crown — a bezel of facets from the table edge down to the girdle.
  for (let index = 0; index < tableCount; index += 1) {
    const next = (index + 1) % tableCount;
    const girdleA = girdle[index * 2 + 1];
    const girdleB = girdle[(index * 2 + 2) % girdleSegments];
    push(table[index], table[next], girdleB);
    push(table[index], girdleB, girdleA);
    push(table[index], girdleA, girdle[(index * 2) % girdleSegments]);
  }

  // Pavilion — every girdle edge falls to the culet.
  for (let index = 0; index < girdleSegments; index += 1) {
    push(girdle[index], girdle[(index + 1) % girdleSegments], culet);
  }

  // Wind every face outward from the solid's centre. Cheaper than trusting the
  // order above, and it keeps the transmission material on FrontSide.
  orientOutward(positions, new Vector3(0, crownHeight * 0.25, 0));

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Flip any triangle whose normal points back at the centre of the solid. */
function orientOutward(positions: number[], centre: Vector3): void {
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const normal = new Vector3();
  const centroid = new Vector3();

  for (let index = 0; index < positions.length; index += 9) {
    a.fromArray(positions, index);
    b.fromArray(positions, index + 3);
    c.fromArray(positions, index + 6);

    normal.copy(c).sub(b).cross(a.clone().sub(b)).normalize();
    centroid.copy(a).add(b).add(c).divideScalar(3).sub(centre);

    if (normal.dot(centroid) < 0) {
      positions[index] = b.x;
      positions[index + 1] = b.y;
      positions[index + 2] = b.z;
      positions[index + 3] = a.x;
      positions[index + 4] = a.y;
      positions[index + 5] = a.z;
    }
  }
}
