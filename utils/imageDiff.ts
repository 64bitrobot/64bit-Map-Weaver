import { TERRAIN_MAP } from '../constants';
import type { Terrain, MapStyle } from '../types';

export interface LeakDetectionResult {
  needsRefinement: boolean;
  leakMapUrl: string | null;
}

// --- Blueprint Leak Detection ---

// Pre-parses hex colors into RGB components to send to the worker.
const getBlueprintColorsRGB = () => Object.values(TERRAIN_MAP as Record<string, Terrain>).map((terrain: Terrain) => {
    const hex = terrain.hexColor.substring(1); // remove #
    return {
        id: terrain.id,
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
    };
});

const workerCode = `
// This script runs in a separate, background thread and communicates with the main thread via messages.

// Helper to load an image from a data URL. In a worker, this doesn't touch the DOM.
const loadImage = (src) => {
  return fetch(src)
    .then(response => response.blob())
    .then(blob => createImageBitmap(blob));
};

// Helper to calculate squared color distance for efficiency.
const colorDistanceSq = (r1, g1, b1, r2, g2, b2) => {
    return Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2);
};

// --- Shape Analysis Helpers (self-contained for the worker) ---

// Calculates the cross product of three points to determine turn direction.
const crossProduct = (p1, p2, p3) => {
  return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
};

// Computes the convex hull of a set of points using the Monotone Chain algorithm.
const getConvexHull = (points) => {
  if (points.length <= 2) return [...points];
  
  const sortedPoints = [...points].sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y);

  const buildHull = (points) => {
    const hull = [];
    for (const point of points) {
      while (hull.length >= 2 && crossProduct(hull[hull.length - 2], hull[hull.length - 1], point) <= 0) {
        hull.pop();
      }
      hull.push(point);
    }
    return hull;
  };

  const lowerHull = buildHull(sortedPoints);
  const upperHull = buildHull([...sortedPoints].reverse());
  return lowerHull.slice(0, -1).concat(upperHull.slice(0, -1));
};

// Calculates the area of a polygon using the shoelace formula.
const polygonArea = (points) => {
    let area = 0;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        area += (points[j].x + points[i].x) * (points[j].y - points[i].y);
    }
    return Math.abs(area / 2.0);
};


/**
 * The main analysis function that runs inside the worker.
 * This version identifies clusters of leaked pixels and analyzes their shape to avoid false positives.
 */
const performLeakDetection = async (
    mapImageSrc, 
    blueprintColorsRGB,
    clusterSizeThreshold,
    colorMatchThresholdSq,
    flatnessThresholdSq // New: for detecting any flat color patch
) => {
    try {
        const img = await loadImage(mapImageSrc);
        const { width, height } = img;
        
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('WORKER: Could not get OffscreenCanvas context.');

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // This array will store a '1' for any pixel that is part of a leak.
        const leaks = new Uint8Array(width * height);
        
        // --- Pass 1: Flat Patch Detection ---
        // This pass looks for large areas of ANY nearly-identical color.
        if (flatnessThresholdSq && flatnessThresholdSq > 0) {
            const visitedForFlatness = new Uint8Array(width * height);
            for (let i = 0; i < data.length; i += 4) {
                const pixelIndex = i / 4;
                if (visitedForFlatness[pixelIndex]) continue;

                const startR = data[i];
                const startG = data[i + 1];
                const startB = data[i + 2];

                const flatClusterIndices = [];
                const queue = [pixelIndex];
                visitedForFlatness[pixelIndex] = 1;

                while (queue.length > 0) {
                    const currentIdx = queue.shift();
                    flatClusterIndices.push(currentIdx);

                    const x = currentIdx % width;
                    const y = Math.floor(currentIdx / width);
                    
                    const neighbors = [];
                    if (y > 0) neighbors.push(currentIdx - width); // Top
                    if (y < height - 1) neighbors.push(currentIdx + width); // Bottom
                    if (x > 0) neighbors.push(currentIdx - 1); // Left
                    if (x < width - 1) neighbors.push(currentIdx + 1); // Right
                    
                    for (const neighborIdx of neighbors) {
                        if (!visitedForFlatness[neighborIdx]) {
                             const nIdx = neighborIdx * 4;
                             const nR = data[nIdx], nG = data[nIdx + 1], nB = data[nIdx + 2];
                             if (colorDistanceSq(startR, startG, startB, nR, nG, nB) < flatnessThresholdSq) {
                                visitedForFlatness[neighborIdx] = 1;
                                queue.push(neighborIdx);
                             }
                        }
                    }
                }

                if (flatClusterIndices.length > clusterSizeThreshold) {
                    for (const idx of flatClusterIndices) {
                        leaks[idx] = 1;
                    }
                }
            }
        }
        
        // --- Pass 2: Blueprint Color Leak Detection ---
        // This pass looks specifically for colors that match the blueprint palette.
        for (let i = 0; i < data.length; i += 4) {
            const pixelIndex = i / 4;
            if (leaks[pixelIndex]) continue; // Already flagged by flatness check.

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            for (const blueprintColor of blueprintColorsRGB) {
                if (colorDistanceSq(r, g, b, blueprintColor.r, blueprintColor.g, blueprintColor.b) < colorMatchThresholdSq) {
                    leaks[pixelIndex] = 1;
                    break; // Found a match, move to next pixel
                }
            }
        }
        
        // --- Pass 3: Analyze combined leaks and build heatmap ---
        const heatmapCanvas = new OffscreenCanvas(width, height);
        const heatmapCtx = heatmapCanvas.getContext('2d');
        if (!heatmapCtx) throw new Error('WORKER: Could not get heatmap OffscreenCanvas context.');
        const heatmapImageData = heatmapCtx.createImageData(width, height);
        const heatmapData = heatmapImageData.data;
        
        let totalLeakedPixels = 0;
        for (let i = 0; i < leaks.length; i++) {
             if (leaks[i]) {
                totalLeakedPixels++;
                const dataIdx = i * 4;
                heatmapData[dataIdx] = 255;     // R
                heatmapData[dataIdx + 1] = 0;   // G (Red)
                heatmapData[dataIdx + 2] = 0;   // B
                heatmapData[dataIdx + 3] = 180; // Alpha
            }
        }
        
        // Optimization: If total leaked pixels is low, no need for expensive clustering.
        if (totalLeakedPixels < clusterSizeThreshold) {
            heatmapCtx.putImageData(heatmapImageData, 0, 0);
            const blob = await heatmapCanvas.convertToBlob({ type: 'image/png' });
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve({ needsRefinement: false, leakMapUrl: reader.result });
                reader.onerror = () => resolve({ needsRefinement: false, leakMapUrl: null });
                reader.readAsDataURL(blob);
            });
        }
        
        // --- Pass 4: Cluster and shape analysis (on combined leaks) ---
        const visited = new Uint8Array(width * height);
        let needsRefinement = false;
        
        const SOLIDITY_THRESHOLD = 0.75; // Clusters must be >75% solid to be considered "blobs".

        for (let i = 0; i < leaks.length; i++) {
            if (needsRefinement) break;
            if (leaks[i] && !visited[i]) {
                const clusterPoints = [];
                const queue = [i];
                visited[i] = 1;

                while (queue.length > 0) {
                    const currentIdx = queue.shift();
                    const x = currentIdx % width;
                    const y = Math.floor(currentIdx / width);
                    clusterPoints.push({ x, y });
                    
                    const searchRadius = 3;
                    for (let ny = -searchRadius; ny <= searchRadius; ny++) {
                        for (let nx = -searchRadius; nx <= searchRadius; nx++) {
                            if (nx === 0 && ny === 0) continue;
                            const checkX = x + nx;
                            const checkY = y + ny;

                            if (checkX >= 0 && checkX < width && checkY >= 0 && checkY < height) {
                                const neighborIdx = checkY * width + checkX;
                                if (leaks[neighborIdx] && !visited[neighborIdx]) {
                                    visited[neighborIdx] = 1;
                                    queue.push(neighborIdx);
                                }
                            }
                        }
                    }
                }
                
                const clusterSize = clusterPoints.length;
                if (clusterSize > clusterSizeThreshold) {
                    const hull = getConvexHull(clusterPoints);
                    if (hull.length > 2) {
                        const hullArea = polygonArea(hull);
                        if (hullArea > 0) {
                            const solidity = clusterSize / hullArea;
                            // A high solidity means the shape is convex and dense (a blob).
                            // A low solidity means it's concave, has holes, or is "snakey".
                            if (solidity > SOLIDITY_THRESHOLD) {
                                needsRefinement = true;
                            }
                        }
                    }
                }
            }
        }
        
        // Finalize and return results.
        heatmapCtx.putImageData(heatmapImageData, 0, 0);
        const blob = await heatmapCanvas.convertToBlob({ type: 'image/png' });

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve({ needsRefinement, leakMapUrl: reader.result });
            reader.onerror = () => resolve({ needsRefinement, leakMapUrl: null });
            reader.readAsDataURL(blob);
        });

    } catch (error) {
        console.error("WORKER: Error during blueprint leak detection:", error);
        return { needsRefinement: false, leakMapUrl: null }; // Fail safe
    }
};

/**
 * Compares two images pixel by pixel and generates a heatmap of the differences.
 */
const performDiffing = async (imageBase64, imageNewBase64, diffThresholdSq) => {
    try {
        const [imgBase, imgNew] = await Promise.all([
            loadImage(imageBase64),
            loadImage(imageNewBase64)
        ]);

        if (imgBase.width !== imgNew.width || imgBase.height !== imgNew.height) {
            throw new Error('WORKER: Image dimensions do not match for diffing.');
        }

        const { width, height } = imgBase;
        
        const canvasBase = new OffscreenCanvas(width, height);
        const ctxBase = canvasBase.getContext('2d', { willReadFrequently: true });
        ctxBase.drawImage(imgBase, 0, 0);
        const dataBase = ctxBase.getImageData(0, 0, width, height).data;

        const canvasNew = new OffscreenCanvas(width, height);
        const ctxNew = canvasNew.getContext('2d', { willReadFrequently: true });
        ctxNew.drawImage(imgNew, 0, 0);
        const dataNew = ctxNew.getImageData(0, 0, width, height).data;
        
        const diffCanvas = new OffscreenCanvas(width, height);
        const diffCtx = diffCanvas.getContext('2d');
        const diffImageData = diffCtx.createImageData(width, height);
        const diffData = diffImageData.data;

        let hasDifference = false;
        for (let i = 0; i < dataBase.length; i += 4) {
            const r1 = dataBase[i], g1 = dataBase[i+1], b1 = dataBase[i+2];
            const r2 = dataNew[i], g2 = dataNew[i+1], b2 = dataNew[i+2];

            if (colorDistanceSq(r1, g1, b1, r2, g2, b2) > diffThresholdSq) {
                diffData[i] = 255;   // Magenta R
                diffData[i+1] = 0;   // Magenta G
                diffData[i+2] = 255; // Magenta B
                diffData[i+3] = 180; // Alpha
                hasDifference = true;
            }
        }
        
        if (!hasDifference) {
            return null; // No changes detected, no need for a map.
        }

        diffCtx.putImageData(diffImageData, 0, 0);
        const blob = await diffCanvas.convertToBlob({ type: 'image/png' });
        
        return new Promise((resolve) => {
             const reader = new FileReader();
             reader.onloadend = () => resolve(reader.result);
             reader.onerror = () => resolve(null);
             reader.readAsDataURL(blob);
        });

    } catch (error) {
        console.error("WORKER: Error during diff generation:", error);
        return null;
    }
};


// --- WORKER MESSAGE HANDLER ---

self.onmessage = async (event) => {
    const { command } = event.data;

    if (command === 'detectLeaks') {
        const { mapImageSrc, blueprintColorsRGB, clusterSizeThreshold, colorMatchThresholdSq, flatnessThresholdSq } = event.data;
        const { needsRefinement, leakMapUrl } = await performLeakDetection(mapImageSrc, blueprintColorsRGB, clusterSizeThreshold, colorMatchThresholdSq, flatnessThresholdSq);
        self.postMessage({ result: needsRefinement, leakMapUrl });
    } else if (command === 'generateDiff') {
        const { imageBase64, imageNewBase64, diffThresholdSq } = event.data;
        const diffMapUrl = await performDiffing(imageBase64, imageNewBase64, diffThresholdSq);
        self.postMessage({ diffMapUrl });
    } else {
        self.postMessage({ error: 'WORKER: Unknown command received.' });
    }
};
`;

const createWorker = () => {
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  const worker = new Worker(workerUrl);

  // Return a function to clean up the worker and its URL
  const cleanup = () => {
    URL.revokeObjectURL(workerUrl);
    worker.terminate();
  };

  return { worker, cleanup };
};


/**
 * Checks if a generated map image contains significant "blueprint leaks" using a Web Worker.
 * @param mapImageSrc The data URL of the generated map.
 * @param mapStyle The visual style of the map being analyzed.
 * @returns A Promise that resolves to an object containing a boolean and the leak map URL.
 */
export const hasBlueprintLeaks = (mapImageSrc: string, mapStyle: MapStyle): Promise<LeakDetectionResult> => {
  return new Promise((resolve, reject) => {
    const { worker, cleanup } = createWorker();

    worker.onmessage = (event) => {
      if (event.data.error) {
        console.error(event.data.error);
        reject(new Error(event.data.error));
      } else {
        const { result, leakMapUrl } = event.data;
        resolve({ needsRefinement: result, leakMapUrl: leakMapUrl || null });
      }
      cleanup();
    };

    worker.onerror = (error) => {
      console.error("Error in leak detection worker:", error);
      resolve({ needsRefinement: false, leakMapUrl: null });
      cleanup();
    };

    let clusterSizeThreshold: number;
    let colorMatchThresholdSq: number;
    let flatnessThresholdSq: number | undefined;
    
    switch (mapStyle) {
      case 'pixel':
        clusterSizeThreshold = 1000;
        colorMatchThresholdSq = 400;
        flatnessThresholdSq = undefined; // Don't run flatness check on pixel art
        break;
      case 'photorealistic':
      default:
        clusterSizeThreshold = 400;
        colorMatchThresholdSq = 100; // Stricter: Was 250. Prevents flagging textured areas like beaches.
        flatnessThresholdSq = 50; // Stricter: Was 100. Requires areas to be more uniform to be "flat".
        break;
    }
    
    const message = {
      command: 'detectLeaks',
      mapImageSrc,
      blueprintColorsRGB: getBlueprintColorsRGB(),
      clusterSizeThreshold,
      colorMatchThresholdSq,
      flatnessThresholdSq,
    };

    worker.postMessage(message);
  });
};

/**
 * Generates a visual diff map between two images using a Web Worker.
 * @param imageBase The original image data URL.
 * @param imageNew The new image data URL to compare against the original.
 * @returns A Promise that resolves to a data URL for the diff map, or null if no differences are found.
 */
export const generateDiffMap = (imageBase: string, imageNew: string): Promise<string | null> => {
    return new Promise((resolve) => {
        const { worker, cleanup } = createWorker();

        worker.onmessage = (event) => {
            if (event.data.error) {
                console.error(event.data.error);
                resolve(null);
            } else {
                resolve(event.data.diffMapUrl || null);
            }
            cleanup();
        };

        worker.onerror = (error) => {
            console.error("Error in diff generation worker:", error);
            resolve(null);
            cleanup();
        };

        const message = {
            command: 'generateDiff',
            imageBase64: imageBase,
            imageNewBase64: imageNew,
            diffThresholdSq: 100, // Squared distance; 10*10 in one channel
        };

        worker.postMessage(message);
    });
};
