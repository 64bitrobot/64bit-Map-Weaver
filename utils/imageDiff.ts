
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

/**
 * Checks if a generated map image contains significant "blueprint leaks" using a Web Worker.
 * @param mapImageSrc The data URL of the generated map.
 * @returns A Promise that resolves to an object containing a boolean and the leak map URL.
 */
export const hasBlueprintLeaks = (mapImageSrc: string): Promise<LeakDetectionResult> => {
  return new Promise((resolve, reject) => {
    // Vite/ESM-compatible way to create a worker.
    // Explicitly convert the URL object to a string to avoid potential environment-specific bugs.
    const workerUrl = new URL('../workers/leakDetector.worker.ts', import.meta.url).href;
    const worker = new Worker(workerUrl, {
      type: 'module',
    });

    worker.onmessage = (event) => {
      if (event.data.error) {
        console.error(event.data.error);
        reject(new Error(event.data.error));
      } else {
        const { result, leakMapUrl } = event.data;
        resolve({ needsRefinement: result, leakMapUrl: leakMapUrl || null });
      }
      worker.terminate();
    };

    worker.onerror = (error) => {
      console.error("Error in leak detection worker:", error);
      // Fail safe: assume no leaks if the worker fails to prevent getting stuck in a refinement loop.
      resolve({ needsRefinement: false, leakMapUrl: null });
      worker.terminate();
    };

    const PIXEL_COUNT_THRESHOLD = 1500;
    const COLOR_MATCH_THRESHOLD_SQ = 9;
    
    const message = {
      mapImageSrc,
      blueprintColorsRGB: getBlueprintColorsRGB(),
      pixelCountThreshold: PIXEL_COUNT_THRESHOLD,
      colorMatchThresholdSq: COLOR_MATCH_THRESHOLD_SQ,
    };

    worker.postMessage(message);
  });
};
