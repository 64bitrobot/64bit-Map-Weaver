import React, { useState } from 'react';

interface ImageModalProps {
  imageSrc: string;
  blueprintSrc: string | null;
  leakMapSrc: string | null;
  aiChangeMapSrc: string | null;
  alt: string;
  onClose: () => void;
}

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

const AiChangesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);


type Overlay = 'blueprint' | 'leakMap' | 'aiChangeMap';

const ImageModal: React.FC<ImageModalProps> = ({ imageSrc, blueprintSrc, leakMapSrc, aiChangeMapSrc, alt, onClose }) => {
  const [overlays, setOverlays] = useState({
    blueprint: false,
    leakMap: !!leakMapSrc, // Default to on if available
    aiChangeMap: !!aiChangeMapSrc, // Default to on if available
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
             {overlays.leakMap && leakMapSrc && (
                <img src={leakMapSrc} alt="Leak map overlay" className="absolute inset-0 w-full h-full object-contain pointer-events-none rounded-lg" />
            )}
            {overlays.aiChangeMap && aiChangeMapSrc && (
                <img src={aiChangeMapSrc} alt="AI change map overlay" className="absolute inset-0 w-full h-full object-contain pointer-events-none rounded-lg" />
            )}
        </div>

        <div className="flex-shrink-0 flex items-center justify-center flex-wrap gap-4">
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
            {aiChangeMapSrc && (
                 <button
                    onClick={() => toggleOverlay('aiChangeMap')}
                    className={`flex items-center px-4 py-2 rounded-md text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-fuchsia-400
                        ${overlays.aiChangeMap ? 'bg-fuchsia-600 hover:bg-fuchsia-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    <AiChangesIcon />
                    {overlays.aiChangeMap ? 'Hide AI Changes' : 'Show AI Changes'}
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
