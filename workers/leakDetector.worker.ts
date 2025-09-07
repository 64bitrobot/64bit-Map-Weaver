
// This script runs in a separate, background thread and communicates with the main thread via messages.

// --- SELF-CONTAINED HELPERS & TYPES ---

// Because workers run in a separate context, we cannot import types from the main app directly.
// We define the necessary types here for clarity.
interface BlueprintColorRGB {
  id: string;
  r: number;
  g: number;
  b: number;
}

// Helper to load an image from a data URL. In a worker, this doesn't touch the DOM.
const loadImage = (src: string): Promise<ImageBitmap> => {
  return fetch(src)
    .then(response => response.blob())
    .then(blob => createImageBitmap(blob));
};

// Helper to calculate squared color distance for efficiency.
const colorDistanceSq = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number => {
    return Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2);
};

interface DetectionResult {
    needsRefinement: boolean;
    leakMapUrl: string | null;
}

// --- CORE DETECTION LOGIC ---

/**
 * The main analysis function that runs inside the worker.
 * It draws an image to a non-DOM canvas, iterates through its pixels, and checks for color matches.
 * It also generates a heatmap of detected leaks.
 */
const performLeakDetection = async (
    mapImageSrc: string, 
    blueprintColorsRGB: BlueprintColorRGB[],
    pixelCountThreshold: number,
    colorMatchThresholdSq: number
): Promise<DetectionResult> => {
    try {
        const img = await loadImage(mapImageSrc);
        
        const canvas = new OffscreenCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('WORKER: Could not get OffscreenCanvas context.');

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;

        const heatmapCanvas = new OffscreenCanvas(img.width, img.height);
        const heatmapCtx = heatmapCanvas.getContext('2d');
        if (!heatmapCtx) throw new Error('WORKER: Could not get heatmap OffscreenCanvas context.');
        const heatmapImageData = heatmapCtx.createImageData(img.width, img.height);
        const heatmapData = heatmapImageData.data;

        let leakedPixelCount = 0;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            let isLeak = false;
            for (const blueprintColor of blueprintColorsRGB) {
                if (colorDistanceSq(r, g, b, blueprintColor.r, blueprintColor.g, blueprintColor.b) < colorMatchThresholdSq) {
                    leakedPixelCount++;
                    isLeak = true;
                    break;
                }
            }

            if (isLeak) {
                heatmapData[i] = 255;     // R
                heatmapData[i + 1] = 0;   // G (Red)
                heatmapData[i + 2] = 0;   // B
                heatmapData[i + 3] = 180; // Alpha
            }
        }
        
        const needsRefinement = leakedPixelCount > pixelCountThreshold;
        if (!needsRefinement) {
            return { needsRefinement: false, leakMapUrl: null };
        }

        heatmapCtx.putImageData(heatmapImageData, 0, 0);
        const blob = await heatmapCanvas.convertToBlob({ type: 'image/png' });

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve({
                    needsRefinement: true,
                    leakMapUrl: reader.result as string,
                });
            };
            reader.onerror = () => resolve({ needsRefinement: true, leakMapUrl: null }); // Fail safe for reader
            reader.readAsDataURL(blob);
        });

    } catch (error) {
        console.error("WORKER: Error during blueprint leak detection:", error);
        return { needsRefinement: false, leakMapUrl: null }; // Fail safe
    }
};


// --- WORKER MESSAGE HANDLER ---

self.onmessage = async (event) => {
    const { mapImageSrc, blueprintColorsRGB, pixelCountThreshold, colorMatchThresholdSq } = event.data;
    
    if (!mapImageSrc || !blueprintColorsRGB) {
        self.postMessage({ error: 'WORKER: Invalid arguments received.' });
        return;
    }

    const { needsRefinement, leakMapUrl } = await performLeakDetection(mapImageSrc, blueprintColorsRGB, pixelCountThreshold, colorMatchThresholdSq);
    
    self.postMessage({ result: needsRefinement, leakMapUrl });
};
