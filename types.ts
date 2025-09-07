export interface Terrain {
  id: string;
  name: string;
  color: string; // Tailwind CSS class
  hexColor: string; // Actual hex color for canvas drawing
  icon: JSX.Element;
}

// New types for vector drawing
export interface VectorPoint {
  x: number;
  y: number;
}

export interface VectorShape {
  id: string;
  type: 'shape';
  terrainId: string;
  points: VectorPoint[];
}

export interface VectorLine {
  id: string;
  type: 'line';
  terrainId: string;
  points: VectorPoint[];
  width: number;
}

export type VectorObject = VectorShape | VectorLine;

export interface ModalImageData {
  image: string;
  heatmap: string | null;
  blueprint: string | null;
  leakMap: string | null;
}

export type MapStyle = 'photorealistic' | 'pixel' | 'sketch';

export interface AnalysisRecord {
  revision: number;
  analyzedMap: string;
  leakMap: string;
  passed: boolean;
}
