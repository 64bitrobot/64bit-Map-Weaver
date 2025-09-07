import type { VectorPoint } from '../types';

/**
 * Calculates the cross product of three points.
 * A positive value means a counter-clockwise turn, negative is clockwise, zero is collinear.
 */
const crossProduct = (p1: VectorPoint, p2: VectorPoint, p3: VectorPoint): number => {
  return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
};

/**
 * Computes the convex hull of a set of points using the Monotone Chain algorithm.
 * @param points An array of VectorPoints.
 * @returns An array of VectorPoints representing the convex hull.
 */
export const getConvexHull = (points: VectorPoint[]): VectorPoint[] => {
  if (points.length <= 2) {
    return [...points];
  }

  // Sort points lexicographically (first by x, then by y)
  const sortedPoints = [...points].sort((a, b) => {
    if (a.x !== b.x) {
      return a.x - b.x;
    }
    return a.y - b.y;
  });

  const buildHull = (points: VectorPoint[]): VectorPoint[] => {
    const hull: VectorPoint[] = [];
    for (const point of points) {
      while (hull.length >= 2 && crossProduct(hull[hull.length - 2], hull[hull.length - 1], point) <= 0) {
        hull.pop();
      }
      hull.push(point);
    }
    return hull;
  };

  // Build the lower hull
  const lowerHull = buildHull(sortedPoints);

  // Build the upper hull
  const upperHull = buildHull([...sortedPoints].reverse());

  // Combine the hulls, removing duplicates (first and last points of each)
  return lowerHull.slice(0, -1).concat(upperHull.slice(0, -1));
};
