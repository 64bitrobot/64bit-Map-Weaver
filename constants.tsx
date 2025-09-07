
import React from 'react';
import type { Terrain } from './types';

const TreeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.015 5.243a.75.75 0 011.065.23l2.25 3.5a.75.75 0 01-1.31.838L10 7.39l-1.02 1.591a.75.75 0 11-1.31-.838l2.25-3.5a.25.25 0 01.095-.095zM10 12a1 1 0 110-2 1 1 0 010 2zm0 1a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" /></svg>;
const WaterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 01.854 2.806c-.433.242-1.272.71-1.272 1.444v.25h1.838a.75.75 0 010 1.5H9.25v.75a.75.75 0 01-1.5 0v-.75H6a.75.75 0 010-1.5h1.838v-.25c0-.734-.84-1.202-1.272-1.444A1.5 1.5 0 0110 3.5zM8.5 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM10 18a8 8 0 100-16 8 8 0 000 16z" /></svg>;
const WallIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.25 3h15.5a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75H2.25a.75.75 0 01-.75-.75V3.75a.75.75 0 01.75-.75zm1.5 1.5v3.5h3.5v-3.5H3.75zm5 0v3.5h3.5v-3.5h-3.5zM14.75 4.5v3.5h-3.5v-3.5h3.5zm-5 5v3.5H3.75v-3.5h5.5zm1.5 0v3.5h3.5v-3.5h-3.5zM3.75 14v-3.5h3.5v3.5H3.75zm5.5 0v-3.5h5.5v3.5h-5.5z" clipRule="evenodd" /></svg>;
const RoadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.25 2.75a.75.75 0 00-1.5 0V7h-3a.75.75 0 000 1.5h3v3h-3a.75.75 0 000 1.5h3v4.25a.75.75 0 001.5 0V13h3a.75.75 0 000-1.5h-3v-3h3a.75.75 0 000-1.5h-3V2.75z" /></svg>;
const GrassIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 4a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 4zM10 12a1 1 0 100-2 1 1 0 000 2zM5.44 14.28a.75.75 0 10-1.06-1.06l-1.42 1.42a.75.75 0 001.06 1.06l1.42-1.42zm11.18 0a.75.75 0 10-1.06 1.06l1.42 1.42a.75.75 0 001.06-1.06l-1.42-1.42z" /></svg>;
const MountainIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v1.25l1.625.813a.75.75 0 01.375 1.04l-1.5 2.5a.75.75 0 01-1.25-.75V7l-.5-.25-.5.25v.854a.75.75 0 01-1.25.75l-1.5-2.5a.75.75 0 01.375-1.04L8.5 4v-1.25A.75.75 0 0110 2zM4.433 13.067l-2.015-1.511a.75.75 0 01.664-1.332l2.367.296a.75.75 0 01.669.742l-.12 2.399a.75.75 0 01-1.442.27l-.123-.626zM15.567 13.067l2.015-1.511a.75.75 0 00-.664-1.332l-2.367.296a.75.75 0 00-.669.742l.12 2.399a.75.75 0 001.442.27l.123-.626zM10 18a.75.75 0 01-.75-.75V16h-1.5a.75.75 0 010-1.5h1.5v-1.25a.75.75 0 011.5 0V14.5h1.5a.75.75 0 010 1.5H10.75v1.25A.75.75 0 0110 18z" clipRule="evenodd" /></svg>;

export const TERRAINS: Terrain[] = [
  { id: 'grass', name: 'Grass', color: 'bg-green-800/50', hexColor: '#00FF00', icon: <GrassIcon /> },       // Lime Green
  { id: 'forest', name: 'Forest', color: 'bg-emerald-900/50', hexColor: '#FF00FF', icon: <TreeIcon /> },     // Magenta
  { id: 'water', name: 'Water', color: 'bg-blue-800/50', hexColor: '#00FFFF', icon: <WaterIcon /> },         // Cyan
  { id: 'road', name: 'Road', color: 'bg-yellow-900/50', hexColor: '#FFFF00', icon: <RoadIcon /> },         // Yellow
  { id: 'ruined_walls', name: 'Ruins', color: 'bg-gray-600/50', hexColor: '#FFA500', icon: <WallIcon /> },     // Orange
  { id: 'mountains', name: 'Mountains', color: 'bg-stone-700/50', hexColor: '#FF0000', icon: <MountainIcon /> }, // Red
];

export const TERRAIN_MAP = TERRAINS.reduce((acc, terrain) => {
  acc[terrain.id] = terrain;
  return acc;
}, {} as Record<string, Terrain>);
