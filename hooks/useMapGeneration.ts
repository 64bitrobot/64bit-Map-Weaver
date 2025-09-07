import { useState, useCallback } from 'react';
import { generateMapFromDrawing, refineGeneratedMap, createAiClient } from '../services/geminiService';
import { generatePromptWithLegend } from '../utils/prompts';
import { hasBlueprintLeaks, generateDiffMap } from '../utils/imageDiff';
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
        setAnalysisHistory([]);
        const localAnalysisHistory: AnalysisRecord[] = [];

        const generationPrompt = generatePromptWithLegend(mapStyle);

        try {
            // --- Initial Generation ---
            setLoadingMessage("Generating initial map...");
            let currentMapUrl = await generateMapFromDrawing(aiClient, blueprintData, generationPrompt);
            let previousMapUrl = currentMapUrl;

            // --- Initial Analysis ---
            setLoadingMessage(`Analyzing initial map...`);
            let analysisResult = await hasBlueprintLeaks(currentMapUrl, mapStyle);
            let passedCheck = !analysisResult.needsRefinement;

            // --- Log Initial Step ---
            const isFinalAfterInitial = passedCheck || maxRefinements === 0;
            localAnalysisHistory.push({
                revision: 1,
                mapImage: currentMapUrl,
                aiChangeMap: null,
                leakMap: analysisResult.leakMapUrl!,
                passed: passedCheck,
                isFinal: isFinalAfterInitial,
                finalReason: isFinalAfterInitial ? (passedCheck ? 'passed' : 'limit_reached') : null,
            });
            setAnalysisHistory([...localAnalysisHistory]);

            // --- Refinement Loop ---
            let refinementCount = 0;
            while (!passedCheck && refinementCount < maxRefinements) {
                refinementCount++;
                
                // --- Refine ---
                setLoadingMessage(`Refining (Attempt ${refinementCount}/${maxRefinements})...`);
                previousMapUrl = currentMapUrl;
                currentMapUrl = await refineGeneratedMap(aiClient, currentMapUrl, mapStyle);

                // --- Generate AI Change Map ---
                setLoadingMessage(`Creating AI change map...`);
                const aiChangeMap = await generateDiffMap(previousMapUrl, currentMapUrl);

                // --- Analyze Refined Map ---
                setLoadingMessage(`Analyzing (Attempt ${refinementCount + 1}/${maxRefinements + 1})...`);
                analysisResult = await hasBlueprintLeaks(currentMapUrl, mapStyle);
                passedCheck = !analysisResult.needsRefinement;
                
                const isFinalAfterRefinement = passedCheck || refinementCount >= maxRefinements;

                // --- Log Refinement Step ---
                localAnalysisHistory.push({
                    revision: refinementCount + 1,
                    mapImage: currentMapUrl,
                    aiChangeMap: aiChangeMap,
                    leakMap: analysisResult.leakMapUrl!,
                    passed: passedCheck,
                    isFinal: isFinalAfterRefinement,
                    finalReason: isFinalAfterRefinement ? (passedCheck ? 'passed' : 'limit_reached') : null,
                });
                setAnalysisHistory([...localAnalysisHistory]);
            }
            
            if (passedCheck) setLoadingMessage('Quality check passed!');
            else setLoadingMessage('Max refinements reached.');
            await new Promise(resolve => setTimeout(resolve, 1500));

            setGeneratedImage(currentMapUrl);

        } catch (err: unknown) {
            setError(parseErrorMessage(err));
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, []);
    
    const manualRefine = useCallback(async (
        apiKey: string,
        mapStyle: MapStyle
    ) => {
        if (!generatedImage || isLoading) {
            return;
        }
        if (!apiKey.trim()) {
            setError("An API key is required for manual refinement.");
            return;
        }
        
        let aiClient;
        try {
            aiClient = createAiClient(apiKey.trim());
        } catch(err) {
            setError(parseErrorMessage(err));
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setLoadingMessage("Performing manual refinement...");

        const localAnalysisHistory = [...analysisHistory];
        const lastRevision = localAnalysisHistory.length > 0 ? localAnalysisHistory[localAnalysisHistory.length - 1] : null;

        if (lastRevision && lastRevision.isFinal) {
            lastRevision.isFinal = false;
            lastRevision.finalReason = null;
        }

        try {
            const previousMapUrl = generatedImage;
            const currentMapUrl = await refineGeneratedMap(aiClient, previousMapUrl, mapStyle);

            setLoadingMessage("Creating AI change map...");
            const aiChangeMap = await generateDiffMap(previousMapUrl, currentMapUrl);

            setLoadingMessage("Analyzing refined map...");
            const analysisResult = await hasBlueprintLeaks(currentMapUrl, mapStyle);
            const passedCheck = !analysisResult.needsRefinement;

            localAnalysisHistory.push({
                revision: (lastRevision?.revision || 0) + 1,
                mapImage: currentMapUrl,
                aiChangeMap: aiChangeMap,
                leakMap: analysisResult.leakMapUrl!,
                passed: passedCheck,
                isFinal: true,
                finalReason: passedCheck ? 'passed' : 'limit_reached',
                isManual: true,
            });
            
            setAnalysisHistory(localAnalysisHistory);
            setGeneratedImage(currentMapUrl);

        } catch (err: unknown) {
            setError(parseErrorMessage(err));
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [generatedImage, isLoading, analysisHistory]);

    const clearGeneration = useCallback(() => {
        setGeneratedImage(null);
        setBlueprintImage(null);
        setError(null);
        setAnalysisHistory([]);
    }, []);

    return {
        isLoading,
        loadingMessage,
        error,
        generatedImage,
        blueprintImage,
        analysisHistory,
        generateMap,
        clearGeneration,
        manualRefine,
    };
};