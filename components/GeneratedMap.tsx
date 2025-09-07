import React from 'react';

interface GeneratedMapProps {
  imageSrc: string | null;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  isOverlayVisible: boolean;
  blueprintImage: string | null;
  onImageClick: (image: string) => void;
}

const GeneratedMap: React.FC<GeneratedMapProps> = ({ imageSrc, isLoading, loadingMessage, error, isOverlayVisible, blueprintImage, onImageClick }) => {
  return (
    <div className="w-full aspect-video bg-gray-900/50 border border-gray-700 rounded-lg flex items-center justify-center overflow-hidden shadow-inner relative">
      {isLoading && (
        <div className="text-center p-4">
          <div className="animate-pulse text-2xl font-semibold text-amber-300">{loadingMessage || 'Weaving your map...'}</div>
          <p className="text-gray-400 mt-2">This can take a moment. The AI is crafting your world!</p>
        </div>
      )}
      {!isLoading && error && (
        <div className="text-center p-4 text-red-400">
          <p className="font-bold">An error occurred</p>
          <p>{error}</p>
        </div>
      )}
      {!isLoading && !error && imageSrc && (
        <>
          <button
            onClick={() => onImageClick(imageSrc)}
            className="w-full h-full block cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-lg"
            aria-label="View larger map"
          >
            <img src={imageSrc} alt="Generated D&D Map" className="w-full h-full object-contain" />
          </button>
          {isOverlayVisible && blueprintImage && (
            <img 
              src={blueprintImage} 
              alt="Blueprint Overlay" 
              className="absolute top-0 left-0 w-full h-full object-contain opacity-50 pointer-events-none" 
            />
          )}
        </>
      )}
      {!isLoading && !error && !imageSrc && (
        <div className="text-center p-4 text-gray-500">
          <p className="text-xl font-medium">Your generated map will appear here</p>
          <p className="mt-1">Draw your layout on the canvas and click 'Generate Map'!</p>
        </div>
      )}
    </div>
  );
};

export default GeneratedMap;
