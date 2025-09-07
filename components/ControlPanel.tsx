import React from 'react';
import { Tool } from './Toolbar';
import type { MapStyle } from '../types';

interface ControlPanelProps {
  onGenerate: () => void;
  onClear: () => void;
  onUndo: () => void;
  onRandomFill: () => void;
  isLoading: boolean;
  loadingMessage: string;
  isApiKeyEntered: boolean;
  canUndo: boolean;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  currentTool: Tool;
  isOverlayVisible: boolean;
  onToggleOverlay: () => void;
  isMapGenerated: boolean;
  mapStyle: MapStyle;
  onMapStyleChange: (style: MapStyle) => void;
  maxRefinements: number;
  onMaxRefinementsChange: (refinements: number) => void;
  onManualRefine: () => void;
}

const WandIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  onGenerate, 
  onClear,
  onUndo,
  onRandomFill,
  isLoading, 
  loadingMessage,
  isApiKeyEntered,
  canUndo,
  brushSize, 
  onBrushSizeChange, 
  currentTool,
  isOverlayVisible,
  onToggleOverlay,
  isMapGenerated,
  mapStyle,
  onMapStyleChange,
  maxRefinements,
  onMaxRefinementsChange,
  onManualRefine,
}) => {
  const isBrushToolActive = currentTool === 'brush';

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 shadow-lg space-y-6">
      <div>
        <h3 className="text-lg font-bold text-amber-300 mb-4">Tools &amp; Edit</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="brushSize" className="block text-sm font-medium text-amber-300 mb-2">
                Brush Size: {brushSize}
            </label>
            <input
                id="brushSize"
                type="range"
                min="5"
                max="100"
                value={brushSize}
                onChange={(e) => onBrushSizeChange(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !isBrushToolActive}
                title={!isBrushToolActive ? "Switch to Brush tool to change brush size" : "Change brush size"}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onClear}
              disabled={isLoading}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50"
            >
              Clear
            </button>
            <button
              onClick={onUndo}
              disabled={isLoading || !canUndo}
              title={!canUndo ? "Nothing to undo" : "Undo last shape/line"}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Undo
            </button>
          </div>
          <button
            onClick={onRandomFill}
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Random Fill
          </button>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-bold text-amber-300 mb-4">Generation</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-amber-300 mb-2">Map Style</label>
          <div className="grid grid-cols-2 gap-2">
            <button
                onClick={() => onMapStyleChange('photorealistic')}
                className={`py-2 px-2 text-sm rounded-md transition-colors disabled:opacity-50 ${mapStyle === 'photorealistic' ? 'bg-amber-600 text-white font-bold' : 'bg-gray-600 hover:bg-gray-500'}`}
                disabled={isLoading}
            >
                Realistic
            </button>
            <button
                onClick={() => onMapStyleChange('pixel')}
                className={`py-2 px-2 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${mapStyle === 'pixel' ? 'bg-amber-600 text-white font-bold' : 'bg-gray-600 hover:bg-gray-500'}`}
                disabled={true}
                title="Pixel art style is temporarily disabled."
            >
                Pixel Art
            </button>
          </div>
        </div>
        <div className="mb-4">
            <label htmlFor="maxRefinements" className="block text-sm font-medium text-amber-300 mb-2">
                Max Refinements: {maxRefinements}
            </label>
            <input
                id="maxRefinements"
                type="range"
                min="0"
                max="5"
                step="1"
                value={maxRefinements}
                onChange={(e) => onMaxRefinementsChange(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
                title="Set the maximum number of refinement steps"
            />
        </div>
        {/* Warning Text Area - Conditionally rendered to only take up space when visible */}
        {!isLoading && (maxRefinements === 0 || maxRefinements === 5) && (
            <div className="mb-4 flex items-center justify-center text-center px-2">
                {maxRefinements === 0 && (
                    <p className="text-xs text-yellow-400/80">
                        Warning: With 0 refinements, the final map may have unfixed errors.
                    </p>
                )}
                {maxRefinements === 5 && (
                    <p className="text-xs text-amber-400">
                        Note: High refinement may result in increased API usage and cost.
                    </p>
                )}
            </div>
        )}
        <div className="flex flex-col gap-2">
           <button
            onClick={onGenerate}
            disabled={isLoading || !isApiKeyEntered}
            title={!isApiKeyEntered ? "An API key must be entered to generate a map." : ""}
            className="bg-amber-600 text-white font-bold py-2 px-4 rounded-md hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[40px]"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="truncate">{loadingMessage || 'Generating...'}</span>
              </>
            ) : 'Generate Map'}
          </button>
           <button
            onClick={onToggleOverlay}
            disabled={isLoading || !isMapGenerated}
            title={!isMapGenerated ? "Generate a map first" : "Toggle blueprint overlay"}
            className="bg-sky-600 text-white py-2 px-4 rounded-md hover:bg-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOverlayVisible ? 'Hide Blueprint' : 'Show Blueprint'}
          </button>
          <button
            onClick={onManualRefine}
            disabled={isLoading || !isMapGenerated}
            title={!isMapGenerated ? "Generate a map first" : "Send the current map for one more refinement step"}
            className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <WandIcon />
            Manual Refinement
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;