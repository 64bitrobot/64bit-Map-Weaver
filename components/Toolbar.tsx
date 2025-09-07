import React from 'react';

export type Tool = 'brush' | 'edit';

const BrushIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
);


interface ToolbarProps {
  currentTool: Tool;
  onSetTool: (tool: Tool) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ currentTool, onSetTool }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 shadow-lg">
      <h3 className="text-lg font-bold text-amber-300 mb-4">Drawing Mode</h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onSetTool('brush')}
          title="Brush Tool"
          className={`flex items-center justify-center space-x-2 p-2 rounded-md transition-all duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${
            currentTool === 'brush'
              ? 'bg-amber-500/30 border-amber-400 border text-white'
              : 'bg-gray-700/50 border-gray-600 border hover:bg-gray-600/50'
          }`}
        >
          <BrushIcon />
          <span>Brush</span>
        </button>
        <button
          onClick={() => onSetTool('edit')}
          title="Edit Tool"
          className={`flex items-center justify-center space-x-2 p-2 rounded-md transition-all duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${
            currentTool === 'edit'
              ? 'bg-amber-500/30 border-amber-400 border text-white'
              : 'bg-gray-700/50 border-gray-600 border hover:bg-gray-600/50'
          }`}
        >
          <EditIcon />
          <span>Edit</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
