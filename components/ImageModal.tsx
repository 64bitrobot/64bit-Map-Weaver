
import React, { useState } from 'react';

interface ImageModalProps {
  imageSrc: string;
  heatmapSrc: string | null;
  blueprintSrc: string | null;
  leakMapSrc: string | null;
  alt: string;
  onClose: () => void;
}

const HeatmapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 6a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm1 4a1 1 0 100 2h2a1 1 0 100-2H8z" clipRule="evenodd" />
  </svg>
);

const BlueprintIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm2 2v10h10V5H5z" clipRule="evenodd" />
    </svg>
);

const LeakIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
);

type Overlay = 'heatmap' | 'blueprint' | 'leakMap';

const ImageModal: React.FC<ImageModalProps> = ({ imageSrc, heatmapSrc, blueprintSrc, leakMapSrc, alt, onClose }) => {
  const [overlays, setOverlays] = useState({
    heatmap: false,
    blueprint: false,
    leakMap: !!leakMapSrc, // Default to on if available
  });

  const toggleOverlay = (overlay: Overlay) => {
    setOverlays(prev => ({ ...prev, [overlay]: !prev[overlay] }));
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <div 
        className="relative max-w-5xl max-h-full flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        <div className="relative flex-grow">
            <img src={imageSrc} alt={alt} className="block w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-lg" />
            {overlays.blueprint && blueprintSrc && (
                <img src={blueprintSrc} alt="Blueprint overlay" className="absolute inset-0 w-full h-full object-contain pointer-events-none rounded-lg opacity-60" />
            )}
            {overlays.heatmap && heatmapSrc && (
                <img src={heatmapSrc} alt="Heatmap overlay" className="absolute inset-0 w-full h-full object-contain pointer-events-none rounded-lg" />
            )}
             {overlays.leakMap && leakMapSrc && (
                <img src={leakMapSrc} alt="Leak map overlay" className="absolute inset-0 w-full h-full object-contain pointer-events-none rounded-lg" />
            )}
        </div>

        <div className="flex-shrink-0 flex items-center justify-center gap-4">
            {blueprintSrc && (
                <button
                    onClick={() => toggleOverlay('blueprint')}
                    className={`flex items-center px-4 py-2 rounded-md text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-sky-400
                        ${overlays.blueprint ? 'bg-sky-600 hover:bg-sky-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    <BlueprintIcon />
                    {overlays.blueprint ? 'Hide Blueprint' : 'Show Blueprint'}
                </button>
            )}
            {heatmapSrc && (
                <button
                    onClick={() => toggleOverlay('heatmap')}
                    className={`flex items-center px-4 py-2 rounded-md text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-amber-400
                        ${overlays.heatmap ? 'bg-amber-600 hover:bg-amber-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    <HeatmapIcon />
                    {overlays.heatmap ? 'Hide Heatmap' : 'Show Heatmap'}
                </button>
            )}
            {leakMapSrc && (
                 <button
                    onClick={() => toggleOverlay('leakMap')}
                    className={`flex items-center px-4 py-2 rounded-md text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-red-400
                        ${overlays.leakMap ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    <LeakIcon />
                    {overlays.leakMap ? 'Hide Leak Map' : 'Show Leak Map'}
                </button>
            )}
        </div>
        
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 text-white bg-black/50 rounded-full h-10 w-10 flex items-center justify-center text-3xl hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close image viewer"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default ImageModal;