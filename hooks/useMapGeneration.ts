
import { useState, useCallback } from 'react';
import { generateMapFromDrawing, refineGeneratedMap, createAiClient } from '../services/geminiService';
import { generatePromptWithLegend } from '../utils/prompts';
import { generateDiffMap, hasBlueprintLeaks } from '../utils/imageDiff';
import type { MapStyle, VectorObject, AnalysisRecord } from '../types';

/**
 * Parses a caught error object and returns a user-friendly string.
 * @param error The unknown error object from a catch block.
 * @returns A string formatted for the end user.
 */
const parseErrorMessage = (error: unknown): string => {
    let message = "An unknown error occurred. Please check the browser console for more details.";
    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === 'string') {
        message = error;
    }

    if (message.toLowerCase().includes('api key')) {
        return "Failed to generate map. Your API key might be invalid or missing permissions. Please verify your key and try again.";
    }
    if (message.toLowerCase().includes('quota')) {
        return "You have exceeded your API quota. Please check your Google AI Studio dashboard for usage limits.";
    }
    if (message.toLowerCase().includes('network')) {
        return "A network error occurred. Please check your internet connection and try again.";
    }
    if (message.toLowerCase().includes('refusal') || message.toLowerCase().includes('text response instead of an image')) {
        return "The AI was unable to generate an image for this request, which can sometimes happen with complex prompts or safety policies. Try a different design or style.";
    }
    
    return message;
};

export const useMapGeneration = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [blueprintImage, setBlueprintImage] = useState<string | null>(null);
    const [rejectedMaps, setRejectedMaps] = useState<{ revision: number; image: string; heatmap: string; }[]>([]);
    const [analysisHistory, setAnalysisHistory] = useState<AnalysisRecord[]>([]);

    const generateMap = useCallback(async (
        vectorObjects: VectorObject[],
        rasterizeVectorsToImage: () => string,
        apiKey: string,
        mapStyle: MapStyle,
        maxRefinements: number
    ) => {
        if (vectorObjects.length === 0) {
            setError("Please draw something on the blueprint before generating a map.");
            return;
        }
        if (!apiKey.trim()) {
            setError("An API key is required. Please enter one at the top or ensure the environment key is available.");
            return;
        }
        
        let aiClient;
        try {
            aiClient = createAiClient(apiKey.trim());
        } catch(err) {
            setError(parseErrorMessage(err));
            return;
        }

        const blueprintData = rasterizeVectorsToImage();
        if (!blueprintData) {
            setError("Could not create blueprint image.");
            return;
        }

        setBlueprintImage(blueprintData);
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setRejectedMaps([]);
        setAnalysisHistory([]);

        const generationPrompt = generatePromptWithLegend(mapStyle);

        try {
            setLoadingMessage("Generating initial map...");
            let currentMapUrl = await generateMapFromDrawing(aiClient, blueprintData, generationPrompt);
            
            let revisionCount = 0;
            while (revisionCount < maxRefinements) {
                setLoadingMessage(`Analyzing ${revisionCount + 1}/${maxRefinements}...`);
                
                const analysisResult = await hasBlueprintLeaks(currentMapUrl);
                
                if (analysisResult.leakMapUrl) {
                    setAnalysisHistory(prev => [...prev, {
                        revision: revisionCount + 1,
                        analyzedMap: currentMapUrl,
                        leakMap: analysisResult.leakMapUrl,
                        passed: !analysisResult.needsRefinement,
                    }]);
                }

                if (!analysisResult.needsRefinement) {
                    setLoadingMessage(`Refinement complete.`);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    break;
                }

                revisionCount++;
                setLoadingMessage(`Refining ${revisionCount}/${maxRefinements}...`);
                
                const previousMapUrl = currentMapUrl;
                currentMapUrl = await refineGeneratedMap(aiClient, previousMapUrl, blueprintData, mapStyle);
                
                const heatmapUrl = await generateDiffMap(previousMapUrl, currentMapUrl);
                const rejectedVersion = { revision: revisionCount, image: previousMapUrl, heatmap: heatmapUrl };
                setRejectedMaps(prev => [...prev, rejectedVersion]);
                
                if (revisionCount === maxRefinements) {
                    setLoadingMessage(`Max refinements reached.`);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            }
            setGeneratedImage(currentMapUrl);
        } catch (err: unknown) {
            setError(parseErrorMessage(err));
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, []);

    const clearGeneration = useCallback(() => {
        setGeneratedImage(null);
        setBlueprintImage(null);
        setError(null);
        setRejectedMaps([]);
        setAnalysisHistory([]);
    }, []);

    return {
        isLoading,
        loadingMessage,
        error,
        generatedImage,
        blueprintImage,
        rejectedMaps,
        analysisHistory,
        generateMap,
        clearGeneration,
    };
};
