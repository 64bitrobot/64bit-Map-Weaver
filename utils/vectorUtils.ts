import type { VectorPoint } from '../types';

// Ramer-Douglas-Peucker algorithm for path simplification.
// https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm

// Function to get the perpendicular distance from a point to a line segment.
const perpendicularDistance = (point: VectorPoint, lineStart: VectorPoint, lineEnd: VectorPoint): number => {
  const { x: px, y: py } = point;
  const { x: x1, y: y1 } = lineStart;
  const { x: x2, y: y2 } = lineEnd;
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  if (dx === 0 && dy === 0) { // lineStart and lineEnd are the same point
      const pdx = px - x1;
      const pdy = py - y1;
      return Math.sqrt(pdx * pdx + pdy * pdy);
  }

  const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
  
  let closestX, closestY;
  
  if (t < 0) {
      closestX = x1;
      closestY = y1;
  } else if (t > 1) {
      closestX = x2;
      closestY = y2;
  } else {
      closestX = x1 + t * dx;
      closestY = y1 + t * dy;
  }

  const pdx = px - closestX;
  const pdy = py - closestY;
  return Math.sqrt(pdx * pdx + pdy * pdy);
};

/**
 * Simplifies a path using the Ramer-Douglas-Peucker algorithm.
 * @param points The array of points to simplify.
 * @param epsilon The tolerance for simplification. A higher value results in more simplification.
 * @returns A new array of simplified points.
 */
export const simplifyPath = (points: VectorPoint[], epsilon: number): VectorPoint[] => {
  if (points.length < 3) {
    return points;
  }

  let dmax = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }

  if (dmax > epsilon) {
    const recResults1 = simplifyPath(points.slice(0, index + 1), epsilon);
    const recResults2 = simplifyPath(points.slice(index, points.length), epsilon);
    
    return recResults1.slice(0, recResults1.length - 1).concat(recResults2);
  } else {
    return [points[0], points[end]];
  }
};


/**
 * Checks if a point is inside a polygon using the ray-casting algorithm.
 * @param point The point to check.
 * @param polygon The array of points defining the polygon.
 * @returns True if the point is inside the polygon, false otherwise.
 */
export const pointInPolygon = (point: VectorPoint, polygon: VectorPoint[]): boolean => {
    const { x, y } = point;
    let isInside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x;
        const yi = polygon[i].y;
        const xj = polygon[j].x;
        const yj = polygon[j].y;

        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            
        if (intersect) {
            isInside = !isInside;
        }
    }

    return isInside;
};

/**
 * Checks if a point is near a polyline within a given threshold.
 * @param point The point to check.
 * @param polyline The array of points defining the polyline.
 * @param threshold The maximum distance allowed from the line.
 * @returns True if the point is near the polyline, false otherwise.
 */
export const isPointNearPolyline = (point: VectorPoint, polyline: VectorPoint[], threshold: number): boolean => {
  if (polyline.length < 2) return false;
  for (let i = 0; i < polyline.length - 1; i++) {
    const dist = perpendicularDistance(point, polyline[i], polyline[i+1]);
    if (dist <= threshold) {
      return true;
    }
  }
  return false;
};