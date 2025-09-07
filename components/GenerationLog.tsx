import React, { useState } from 'react';
import type { AnalysisRecord } from '../types';

interface GenerationLogProps {
  analysisHistory: AnalysisRecord[];
  onImageClick: (logEntry: AnalysisRecord) => void;
}

const LeakIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
);

const AiChangesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);


const GenerationLog: React.FC<GenerationLogProps> = ({ analysisHistory, onImageClick }) => {
  const [visibleOverlays, setVisibleOverlays] = useState<Record<number, { leak: boolean, changes: boolean }>>({});

  const toggleOverlay = (revision: number, type: 'leak' | 'changes') => {
      setVisibleOverlays(prev => ({ 
          ...prev, 
          [revision]: {
              ...prev[revision],
              [type]: !prev[revision]?.[type]
          }
      }));
  };

  if (analysisHistory.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 shadow-lg">
      <h3 className="text-lg font-bold text-amber-300 mb-4">Generation &amp; Refinement Log</h3>
      <div className="flex overflow-x-auto space-x-4 p-2 -m-2">
        {analysisHistory.map((logEntry) => {
          const { revision, mapImage, leakMap, aiChangeMap, passed, isFinal, finalReason, isManual } = logEntry;
          
          let title: string;
          if (isManual) {
            title = 'Manual Refine';
          } else if (revision === 1) {
            title = 'Initial Generation';
          } else {
            title = `Refinement ${revision - 1}`;
          }
          
          let statusText: string;
          let statusColor: string;
          let borderColor: string;

          if (isFinal) {
              if (finalReason === 'passed') {
                  statusText = 'Accepted: Passed Check';
                  statusColor = '#34d399'; // green-400
                  borderColor = '#34d399';
              } else { // limit_reached
                  statusText = 'Accepted: Limit Reached';
                  statusColor = '#facc15'; // yellow-400
                  borderColor = '#facc15';
              }
          } else {
              statusText = 'Failed Check, Refining...';
              statusColor = '#f87171'; // red-400
              borderColor = '#f87171';
          }
          
          const isLeakVisible = visibleOverlays[revision]?.leak;
          const isChangesVisible = visibleOverlays[revision]?.changes;

          return (
            <div key={revision} className="flex-shrink-0 w-48 text-center group">
              <div className="relative">
                  <button
                      onClick={() => onImageClick(logEntry)}
                      className="bg-gray-900 rounded-md overflow-hidden border-2 block w-full hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                      style={{ borderColor: borderColor }}
                      aria-label={`${title} - ${statusText}. Click to view details.`}
                  >
                      <img src={mapImage} alt={`${title} - ${statusText}`} className="w-full h-32 object-cover" />
                      {isLeakVisible && leakMap && (
                          <img src={leakMap} alt={`Leak map for revision ${revision}`} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                      )}
                      {isChangesVisible && aiChangeMap && (
                          <img src={aiChangeMap} alt={`AI change map for revision ${revision}`} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                      )}
                  </button>
                  <div className="absolute bottom-2 right-2 flex flex-col gap-1.5">
                    {leakMap && (
                      <button
                          onClick={(e) => { e.stopPropagation(); toggleOverlay(revision, 'leak'); }}
                          title="Toggle leak map"
                          className={`h-6 w-6 rounded-full flex items-center justify-center transition-all opacity-60 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-red-400
                              ${isLeakVisible ? 'bg-red-500 text-white' : 'bg-gray-900/70 text-red-300'}`}
                      >
                          <LeakIcon />
                      </button>
                    )}
                     {aiChangeMap && (
                      <button
                          onClick={(e) => { e.stopPropagation(); toggleOverlay(revision, 'changes'); }}
                          title="Toggle AI change map"
                          className={`h-6 w-6 rounded-full flex items-center justify-center transition-all opacity-60 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-fuchsia-400
                              ${isChangesVisible ? 'bg-fuchsia-500 text-white' : 'bg-gray-900/70 text-fuchsia-300'}`}
                      >
                          <AiChangesIcon />
                      </button>
                    )}
                  </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Step {revision}: <span className="text-xs text-gray-500">({title})</span>
              </p>
               <p className="text-xs font-semibold" style={{ color: statusColor }}>
                  {statusText}
              </p>
            </div>
          );
        })}
      </div>
       <p className="text-xs text-gray-500 mt-3 text-center">The log shows the result of each step. A "Failed Check" triggers a refinement. Click an image to inspect it.</p>
    </div>
  );
};

export default GenerationLog;