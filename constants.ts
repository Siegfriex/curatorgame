
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { CutDirection, NoteData, NoteTier, NoteAxis, GateData } from "./types";
import * as THREE from 'three';

// Game World Config
export const TRACK_LENGTH = 50;
export const SPAWN_Z = -40; // Increased spawn distance for larger gates
export const PLAYER_Z = 0;
export const MISS_Z = 5;
export const NOTE_SPEED = 12; // Slightly adjusted for pacing

export const LANE_WIDTH = 0.8;
export const LAYER_HEIGHT = 0.8;
export const NOTE_SIZE = 0.5;

// Positions for the 4 lanes (centered around 0)
export const LANE_X_POSITIONS = [-1.5 * LANE_WIDTH, -0.5 * LANE_WIDTH, 0.5 * LANE_WIDTH, 1.5 * LANE_WIDTH];
export const LAYER_Y_POSITIONS = [0.8, 1.6, 2.4]; // Low, Mid, High

// Audio
export const SONG_URL = 'https://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/race2.ogg';
export const SONG_BPM = 140; 
const BEAT_TIME = 60 / SONG_BPM;

const AXES = [NoteAxis.INSTITUTION, NoteAxis.ACADEMIC, NoteAxis.DISCOURSE, NoteAxis.NETWORK];

// Generate a simple rhythmic chart with Tiers and Axes
export const generateDemoChart = (): NoteData[] => {
  const notes: NoteData[] = [];
  let idCount = 0;

  // Simple pattern generator
  for (let i = 4; i < 300; i += 2) { // Longer chart
    const time = i * BEAT_TIME;
    
    // Assign Tier based on beat importance
    let tier = NoteTier.TIER_3; // Sketch (Default)
    if (i % 8 === 0) tier = NoteTier.TIER_2; // Exhibition
    if (i % 16 === 0) tier = NoteTier.TIER_1; // Masterpiece

    // Assign Axis randomly but consistent per phrase
    const axis = AXES[Math.floor((i / 16)) % 4];

    const pattern = Math.floor(i / 16) % 3;

    if (pattern === 0) {
      // Simple alternation
      if (i % 4 === 0) {
         notes.push({
          id: `note-${idCount++}`,
          time: time,
          lineIndex: 1,
          lineLayer: 0,
          type: 'left',
          cutDirection: CutDirection.ANY,
          tier,
          axis
        });
      } else {
        notes.push({
          id: `note-${idCount++}`,
          time: time,
          lineIndex: 2,
          lineLayer: 0,
          type: 'right',
          cutDirection: CutDirection.ANY,
          tier,
          axis
        });
      }
    } else if (pattern === 1) {
      // Double hits (Tier 2 usually)
      if (i % 8 === 0) {
         notes.push(
           { id: `note-${idCount++}`, time, lineIndex: 0, lineLayer: 1, type: 'left', cutDirection: CutDirection.ANY, tier: NoteTier.TIER_2, axis },
           { id: `note-${idCount++}`, time, lineIndex: 3, lineLayer: 1, type: 'right', cutDirection: CutDirection.ANY, tier: NoteTier.TIER_2, axis }
         );
      }
    } else {
      // Streams (faster, usually Tier 3)
      notes.push({
        id: `note-${idCount++}`,
        time: time,
        lineIndex: 1,
        lineLayer: 0,
        type: 'left',
        cutDirection: CutDirection.ANY,
        tier: NoteTier.TIER_3,
        axis
      });
       notes.push({
        id: `note-${idCount++}`,
        time: time + BEAT_TIME,
        lineIndex: 2,
        lineLayer: 0,
        type: 'right',
        cutDirection: CutDirection.ANY,
        tier: NoteTier.TIER_3,
        axis
      });
    }
  }

  return notes.sort((a, b) => a.time - b.time);
};

export const DEMO_CHART = generateDemoChart();

// Chronos Gates Definition
// Spawning at 10s (Phase 1), 30s (Phase 2), 50s (Phase 3) approx
export const GATES: GateData[] = [
  // Phase 1: 10s
  { id: 'gate-1', time: 12, label: 'SCANDAL', subLabel: 'The Awakening', type: 'NEGATIVE' },
  { id: 'gate-2', time: 12, label: 'ELITE COURSE', subLabel: 'The Awakening', type: 'POSITIVE' },
  { id: 'gate-3', time: 12, label: 'DISCOVERY', subLabel: 'The Awakening', type: 'POSITIVE' },
  
  // Phase 2: 30s
  { id: 'gate-4', time: 34, label: 'EXPULSION', subLabel: 'The Conflict', type: 'NEGATIVE' },
  { id: 'gate-5', time: 34, label: 'ACCLAIM', subLabel: 'The Conflict', type: 'POSITIVE' },
  { id: 'gate-6', time: 34, label: 'TERMINATION', subLabel: 'The Conflict', type: 'NEGATIVE' },

  // Phase 3: 50s
  { id: 'gate-7', time: 56, label: 'HIATUS', subLabel: 'The Establishment', type: 'NEUTRAL' },
  { id: 'gate-8', time: 56, label: 'MUSEUM', subLabel: 'The Establishment', type: 'POSITIVE' },
  { id: 'gate-9', time: 56, label: 'BIENNALE', subLabel: 'The Establishment', type: 'POSITIVE' },
];


export const DIRECTION_VECTORS: Record<CutDirection, THREE.Vector3> = {
  [CutDirection.UP]: new THREE.Vector3(0, 1, 0),
  [CutDirection.DOWN]: new THREE.Vector3(0, -1, 0),
  [CutDirection.LEFT]: new THREE.Vector3(-1, 0, 0),
  [CutDirection.RIGHT]: new THREE.Vector3(1, 0, 0),
  [CutDirection.ANY]: new THREE.Vector3(0, 0, 0)
};
