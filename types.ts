
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as THREE from 'three';

export enum GameStatus {
  LOADING = 'LOADING',
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export type HandType = 'left' | 'right';

// 0: Up, 1: Down, 2: Left, 3: Right, 4: Any (Dot)
export enum CutDirection {
  UP = 0,
  DOWN = 1,
  LEFT = 2,
  RIGHT = 3,
  ANY = 4
}

// New Spec v2.0
export enum NoteTier {
  TIER_1 = 1, // Masterpiece (Dodecahedron) - 10pts
  TIER_2 = 2, // Exhibition (Box) - 5pts
  TIER_3 = 3  // Sketch (Cone) - 2pts
}

export enum NoteAxis {
  INSTITUTION = 'INSTITUTION', // Deep Royal Blue
  ACADEMIC = 'ACADEMIC',       // Mist Gray (Metallic)
  DISCOURSE = 'DISCOURSE',     // Void Black (Wireframe)
  NETWORK = 'NETWORK'          // Azure Blue
}

export interface NoteData {
  id: string;
  time: number;     // Time in seconds when it should reach the player
  lineIndex: number; // 0-3 (horizontal position)
  lineLayer: number; // 0-2 (vertical position)
  type: HandType;    // which hand should cut it
  cutDirection: CutDirection;
  
  // New Properties
  tier: NoteTier;
  axis: NoteAxis;
  
  hit?: boolean;
  missed?: boolean;
  hitTime?: number; // Time when hit occurred
}

export interface GateData {
  id: string;
  time: number;
  label: string;
  subLabel: string;
  type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface HandPositions {
  left: THREE.Vector3 | null;
  right: THREE.Vector3 | null;
  leftVelocity: THREE.Vector3;
  rightVelocity: THREE.Vector3;
}

// Deep Blue Color System & Axis Mapping
export const COLORS = {
  primary: '#28317C',  // Deep Royal Blue
  secondary: '#3B82F6', // Azure Blue
  
  // Axis Colors
  institution: '#28317C',
  academic: '#E5E5E5',
  discourse: '#0A0A0A',
  network: '#3B82F6',
  
  left: '#28317C',
  right: '#3B82F6',
  
  track: '#1a1a1a', 
  hittable: '#ffffff',
  grid: '#e5e5e5', // Mist Gray
  background: '#0a0a0a', // Void Black
  surface: '#ffffff'
};
