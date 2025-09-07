import React, { useState } from 'react';
import type { ModalImageData } from '../types';

interface RevisionHistoryProps {
  rejectedMaps: { revision: number; image: string; heatmap: string }[];
  onImageClick: (data: ModalImageData) => void;
}

const HeatmapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 6a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm1 4a1 1 0 100 2h2a1 1 0 100-2H8z" clipRule="evenodd" />
    </svg>
);

const RevisionHistory: React.FC<RevisionHistoryProps> = ({ rejectedMaps, onImageClick }) => {
  const [visibleHeatmaps, setVisibleHeatmaps] = useState<Record<number, boolean>>({});

  const toggleHeatmap = (revision: number) => {
      setVisibleHeatmaps(prev => ({ ...prev, [revision]: !prev[revision] }));
  };

  if (rejectedMaps.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 shadow-lg">
      <h3 className="text-lg font-bold text-amber-300 mb-4">Refinement History (Rejected Versions)</h3>
      <div className="flex overflow-x-auto space-x-4 p-2 -m-2">
        {rejectedMaps.map(({ revision, image, heatmap }) => (
          <div key={revision} className="flex-shrink-0 w-48 text-center group">
            <div className="relative">
              <button
                onClick={() => onImageClick({ image, heatmap, blueprint: null, leakMap: null })}
                className="bg-gray-900 rounded-md overflow-hidden border border-gray-600 block w-full hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              >
                <img src={image} alt={`Revision ${revision}`} className="w-full h-32 object-cover" />
                {visibleHeatmaps[revision] && heatmap && (
                    <img src={heatmap} alt={`Heatmap for revision ${revision}`} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                )}
              </button>
              <button
                onClick={() => toggleHeatmap(revision)}
                title="Toggle refinement heatmap"
                className={`absolute bottom-2 right-2 h-7 w-7 rounded-full flex items-center justify-center transition-all opacity-50 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-amber-400
                    ${visibleHeatmaps[revision] ? 'bg-amber-500 text-white' : 'bg-gray-900/70 text-amber-300'}`}
              >
                <HeatmapIcon />
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-2">Revision {revision}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevisionHistory;