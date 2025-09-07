
import React from 'react';
import type { Terrain } from '../types';
import { TERRAINS } from '../constants';

interface TerrainPaletteProps {
  selectedTerrainId: string | null;
  onSelectTerrain: (id: string) => void;
}

const TerrainPalette: React.FC<TerrainPaletteProps> = ({ selectedTerrainId, onSelectTerrain }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 shadow-lg">
      <h3 className="text-lg font-bold text-amber-300 mb-4">Terrain Palette</h3>
      <div className="grid grid-cols-2 gap-3">
        {TERRAINS.map((terrain) => (
          <button
            key={terrain.id}
            onClick={() => onSelectTerrain(terrain.id)}
            className={`flex items-center space-x-2 p-2 rounded-md transition-all duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${
              selectedTerrainId === terrain.id
                ? 'bg-amber-500/30 border-amber-400 border text-white'
                : 'bg-gray-700/50 border-gray-600 border hover:bg-gray-600/50'
            }`}
          >
            <span className="text-amber-300">{terrain.icon}</span>
            <span>{terrain.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TerrainPalette;
