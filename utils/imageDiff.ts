
import { TERRAIN_MAP } from '../constants';
import type { Terrain } from '../types';

export interface LeakDetectionResult {
  needsRefinement: boolean;
  leakMapUrl: string | null;
}

// Helper function to load an image from a data URL
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
};

/**
 * Compares two images and generates a "heatmap" data URL showing the differences.
 * @param baseImageSrc The original image data URL.
 * @param changedImageSrc The new image data URL.
 * @returns A Promise that resolves with the data URL of the heatmap image.
 */
export const generateDiffMap = async (baseImageSrc: string, changedImageSrc: string): Promise<string> => {
  try {
    const [baseImg, changedImg] = await Promise.all([
      loadImage(baseImageSrc),
      loadImage(changedImageSrc),
    ]);

    const width = baseImg.width;
    const height = baseImg.height;

    // Create canvases to draw images and get pixel data
    const baseCanvas = document.createElement('canvas');
    baseCanvas.width = width;
    baseCanvas.height = height;
    const baseCtx = baseCanvas.getContext('2d');
    if (!baseCtx) throw new Error('Could not get base canvas context');
    baseCtx.drawImage(baseImg, 0, 0);

    const changedCanvas = document.createElement('canvas');
    changedCanvas.width = width;
    changedCanvas.height = height;
    const changedCtx = changedCanvas.getContext('2d');
    if (!changedCtx) throw new Error('Could not get changed canvas context');
    changedCtx.drawImage(changedImg, 0, 0);
    
    // Create heatmap canvas
    const heatmapCanvas = document.createElement('canvas');
    heatmapCanvas.width = width;
    heatmapCanvas.height = height;
    const heatmapCtx = heatmapCanvas.getContext('2d');
    if (!heatmapCtx) throw new Error('Could not get heatmap canvas context');

    const baseData = baseCtx.getImageData(0, 0, width, height).data;
    const changedData = changedCtx.getImageData(0, 0, width, height).data;
    const heatmapImageData = heatmapCtx.createImageData(width, height);
    const heatmapData = heatmapImageData.data;

    const COLOR_DIFF_THRESHOLD = 35 * 35; // Squared distance threshold
    const HEATMAP_COLOR = [255, 0, 0, 150]; // Red with alpha

    for (let i = 0; i < baseData.length; i += 4) {
      const r1 = baseData[i];
      const g1 = baseData[i + 1];
      const b1 = baseData[i + 2];

      const r2 = changedData[i];
      const g2 = changedData[i + 1];
      const b2 = changedData[i + 2];

      const diff = Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2);

      if (diff > COLOR_DIFF_THRESHOLD) {
        heatmapData[i] = HEATMAP_COLOR[0];
        heatmapData[i + 1] = HEATMAP_COLOR[1];
        heatmapData[i + 2] = HEATMAP_COLOR[2];
        heatmapData[i + 3] = HEATMAP_COLOR[3];
      }
    }

    heatmapCtx.putImageData(heatmapImageData, 0, 0);
    return heatmapCanvas.toDataURL();
  } catch (error) {
    console.error("Failed to generate diff map:", error);
    return Promise.reject("Could not generate difference map for revision.");
  }
};


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

/**
 * The main analysis function that runs inside the worker.
 * This version identifies clusters of leaked pixels to avoid false positives from scattered noise.
 */
const performLeakDetection = async (
    mapImageSrc, 
    blueprintColorsRGB,
    clusterSizeThreshold,
    colorMatchThresholdSq
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

        const heatmapCanvas = new OffscreenCanvas(width, height);
        const heatmapCtx = heatmapCanvas.getContext('2d');
        if (!heatmapCtx) throw new Error('WORKER: Could not get heatmap OffscreenCanvas context.');
        const heatmapImageData = heatmapCtx.createImageData(width, height);
        const heatmapData = heatmapImageData.data;
        
        // 1. First pass: Identify all leak pixels and draw the full heatmap for visualization.
        const leaks = new Uint8Array(width * height);
        let totalLeakedPixels = 0;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            let isLeak = false;
            for (const blueprintColor of blueprintColorsRGB) {
                if (colorDistanceSq(r, g, b, blueprintColor.r, blueprintColor.g, blueprintColor.b) < colorMatchThresholdSq) {
                    isLeak = true;
                    break;
                }
            }

            if (isLeak) {
                const pixelIndex = i / 4;
                leaks[pixelIndex] = 1;
                totalLeakedPixels++;

                heatmapData[i] = 255;     // R
                heatmapData[i + 1] = 0;   // G (Red)
                heatmapData[i + 2] = 0;   // B
                heatmapData[i + 3] = 180; // Alpha
            }
        }
        
        // Optimization: If the total number of leaked pixels is less than the cluster threshold,
        // it's impossible to form a failing cluster. We can pass the check immediately.
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
        
        // 2. Second pass: Cluster analysis using Breadth-First Search (BFS).
        const visited = new Uint8Array(width * height);
        let needsRefinement = false;
        
        for (let i = 0; i < leaks.length; i++) {
            if (leaks[i] && !visited[i]) {
                // Start of a new, unvisited cluster
                let clusterSize = 0;
                const queue = [i]; // Store index directly
                visited[i] = 1;

                while (queue.length > 0) {
                    const currentIdx = queue.shift();
                    clusterSize++;
                    
                    const x = currentIdx % width;
                    const y = Math.floor(currentIdx / width);
                    
                    // Check neighbors in a square radius to catch 'clumped' or 'dithered' patterns
                    const searchRadius = 2; // Check a 5x5 area (2 pixels in each direction)
                    for (let ny = -searchRadius; ny <= searchRadius; ny++) {
                        for (let nx = -searchRadius; nx <= searchRadius; nx++) {
                            if (nx === 0 && ny === 0) continue; // Skip the current pixel itself

                            const checkX = x + nx;
                            const checkY = y + ny;

                            // Boundary check
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
                
                if (clusterSize > clusterSizeThreshold) {
                    needsRefinement = true;
                    break;
                }
            }
        }
        
        // 3. Finalize and return results.
        heatmapCtx.putImageData(heatmapImageData, 0, 0);
        const blob = await heatmapCanvas.convertToBlob({ type: 'image/png' });

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve({
                    needsRefinement: needsRefinement,
                    leakMapUrl: reader.result,
                });
            };
            reader.onerror = () => resolve({ needsRefinement: needsRefinement, leakMapUrl: null });
            reader.readAsDataURL(blob);
        });

    } catch (error) {
        console.error("WORKER: Error during blueprint leak detection:", error);
        return { needsRefinement: false, leakMapUrl: null }; // Fail safe
    }
};


// --- WORKER MESSAGE HANDLER ---

self.onmessage = async (event) => {
    const { mapImageSrc, blueprintColorsRGB, clusterSizeThreshold, colorMatchThresholdSq } = event.data;
    
    if (!mapImageSrc || !blueprintColorsRGB) {
        self.postMessage({ error: 'WORKER: Invalid arguments received.' });
        return;
    }

    const { needsRefinement, leakMapUrl } = await performLeakDetection(mapImageSrc, blueprintColorsRGB, clusterSizeThreshold, colorMatchThresholdSq);
    
    self.postMessage({ result: needsRefinement, leakMapUrl });
};
`;

/**
 * Checks if a generated map image contains significant "blueprint leaks" using a Web Worker.
 * @param mapImageSrc The data URL of the generated map.
 * @returns A Promise that resolves to an object containing a boolean and the leak map URL.
 */
export const hasBlueprintLeaks = (mapImageSrc: string): Promise<LeakDetectionResult> => {
  return new Promise((resolve, reject) => {
    // Create a worker from an in-memory script to avoid pathing issues.
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    worker.onmessage = (event) => {
      if (event.data.error) {
        console.error(event.data.error);
        reject(new Error(event.data.error));
      } else {
        const { result, leakMapUrl } = event.data;
        resolve({ needsRefinement: result, leakMapUrl: leakMapUrl || null });
      }
      URL.revokeObjectURL(workerUrl); // Clean up the object URL
      worker.terminate();
    };

    worker.onerror = (error) => {
      console.error("Error in leak detection worker:", error);
      // Fail safe: assume no leaks if the worker fails to prevent getting stuck in a refinement loop.
      resolve({ needsRefinement: false, leakMapUrl: null });
      URL.revokeObjectURL(workerUrl); // Clean up the object URL
      worker.terminate();
    };

    const CLUSTER_SIZE_THRESHOLD = 250; // A contiguous area of this many pixels is considered a leak.
    const COLOR_MATCH_THRESHOLD_SQ = 100; // Increased from 9 for more tolerance
    
    const message = {
      mapImageSrc,
      blueprintColorsRGB: getBlueprintColorsRGB(),
      clusterSizeThreshold: CLUSTER_SIZE_THRESHOLD,
      colorMatchThresholdSq: COLOR_MATCH_THRESHOLD_SQ,
    };

    worker.postMessage(message);
  });
};
