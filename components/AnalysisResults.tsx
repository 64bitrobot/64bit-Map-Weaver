import React from 'react';
import type { AnalysisRecord } from '../types';

interface AnalysisResultsProps {
  analysisHistory: AnalysisRecord[];
  onImageClick: (image: string, leakMap: string) => void;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysisHistory, onImageClick }) => {
  if (analysisHistory.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 shadow-lg">
      <h3 className="text-lg font-bold text-amber-300 mb-4">Quality Analysis History</h3>
      <div className="flex overflow-x-auto space-x-4 p-2 -m-2">
        {analysisHistory.map(({ revision, analyzedMap, leakMap, passed }) => (
          <div key={revision} className="flex-shrink-0 w-48 text-center group">
            <div className="relative">
                <button
                    onClick={() => onImageClick(analyzedMap, leakMap)}
                    className="bg-gray-900 rounded-md overflow-hidden border-2 block w-full hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                    style={{ borderColor: passed ? '#34d399' /* green-400 */ : '#f87171' /* red-400 */ }}
                >
                    <img src={analyzedMap} alt={`Analyzed Map Revision ${revision}`} className="w-full h-32 object-cover" />
                </button>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Analysis {revision} - <span style={{ color: passed ? '#34d399' : '#f87171' }} className="font-semibold">{passed ? 'Passed' : 'Failed'}</span>
            </p>
          </div>
        ))}
      </div>
       <p className="text-xs text-gray-500 mt-3 text-center">A "Failed" analysis triggers a refinement step. Click an image to view the leak detection map.</p>
    </div>
  );
};

export default AnalysisResults;
