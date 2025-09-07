
import { TERRAIN_MAP } from '../constants';
import type { VectorObject, VectorPoint } from '../types';
import { getConvexHull } from './convexHull';
import { pointInPolygon } from './vectorUtils';

/**
 * Generates a random set of vector objects to fill the canvas.
 * @param width The width of the drawing area.
 * @param height The height of the drawing area.
 * @returns An array of new VectorObjects.
 */
export const generateRandomObjects = (width: number, height: number): VectorObject[] => {
  const newObjects: VectorObject[] = [];
  const numShapes = Math.floor(Math.random() * 10) + 8;
  const MAX_PLACEMENT_ATTEMPTS = 30;
  
  // Exclude 'road' from being a fillable terrain type
  const fillableTerrains = Object.values(TERRAIN_MAP).filter(t => t.id !== 'road');
  
  for (let i = 0; i < numShapes; i++) {
    const randomTerrain = fillableTerrains[Math.floor(Math.random() * fillableTerrains.length)];
    let shapePoints: VectorPoint[] = [];
    let foundValidPosition = false;

    // Attempt to place a shape without overlapping existing ones
    for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
      const centerPoint: VectorPoint = { x: Math.random() * width, y: Math.random() * height };
      
      const isOverlapping = newObjects.some(obj => obj.type === 'shape' && pointInPolygon(centerPoint, obj.points));
      
      if (!isOverlapping) {
        const radius = (Math.random() * 0.2 + 0.1) * Math.min(width, height);
        const points: VectorPoint[] = [];
        const pointCount = 15; // Number of random points to generate for the hull

        for (let j = 0; j < pointCount; j++) {
          const angle = Math.random() * 2 * Math.PI;
          const r = (0.5 + Math.random() * 0.5) * radius;
          points.push({ 
            x: Math.max(0, Math.min(width, centerPoint.x + r * Math.cos(angle))), 
            y: Math.max(0, Math.min(height, centerPoint.y + r * Math.sin(angle))) 
          });
        }
        
        const hull = getConvexHull(points);
        if (hull.length > 2) {
          shapePoints = hull;
          foundValidPosition = true;
          break;
        }
      }
    }

    if (foundValidPosition) {
      newObjects.push({ 
        id: `${Date.now()}-${i}`, 
        type: 'shape', 
        terrainId: randomTerrain.id, 
        points: shapePoints 
      });
    }
  }
  
  return newObjects;
};