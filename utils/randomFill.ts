
import { TERRAIN_MAP } from '../constants';
import type { VectorObject, VectorPoint } from '../types';
import { getConvexHull } from './convexHull';
import { pointInPolygon } from './vectorUtils';

/**
 * Generates a random set of vector objects to fill the canvas with less overlap.
 * @param width The width of the drawing area.
 * @param height The height of the drawing area.
 * @returns An array of new VectorObjects.
 */
export const generateRandomObjects = (width: number, height: number): VectorObject[] => {
  const newObjects: VectorObject[] = [];
  const numShapes = Math.floor(Math.random() * 10) + 8;
  const MAX_PLACEMENT_ATTEMPTS = 50; // Increased attempts for better placement
  
  // Exclude 'road' from being a fillable terrain type
  const fillableTerrains = Object.values(TERRAIN_MAP).filter(t => t.id !== 'road');
  
  for (let i = 0; i < numShapes; i++) {
    const randomTerrain = fillableTerrains[Math.floor(Math.random() * fillableTerrains.length)];
    let shapePoints: VectorPoint[] = [];
    let foundValidPosition = false;

    // Attempt to place a shape, checking for polygon overlap.
    for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
      const centerPoint: VectorPoint = { x: Math.random() * width, y: Math.random() * height };
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
      
      const candidateHull = getConvexHull(points);
      if (candidateHull.length < 3) {
        continue; // Not a valid shape, try again.
      }

      const isOverlapping = newObjects.some(existingObj => {
        if (existingObj.type !== 'shape') return false;
        
        // Check if any vertex of the new hull is inside an existing object.
        for (const point of candidateHull) {
            if (pointInPolygon(point, existingObj.points)) {
                return true;
            }
        }
        
        // Check if any vertex of an existing object is inside the new hull.
        for (const point of existingObj.points) {
            if (pointInPolygon(point, candidateHull)) {
                return true;
            }
        }
        
        return false;
      });
      
      if (!isOverlapping) {
        shapePoints = candidateHull;
        foundValidPosition = true;
        break;
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
