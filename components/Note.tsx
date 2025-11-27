
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useMemo, useRef } from 'react';
import { Dodecahedron, Box, Cone, Edges } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NoteData, COLORS, NoteTier, NoteAxis } from '../types';
import { LANE_X_POSITIONS, LAYER_Y_POSITIONS, NOTE_SIZE } from '../constants';

interface NoteProps {
  data: NoteData;
  zPos: number;
  currentTime: number;
}

// Visual mapping based on Axis
const getAxisMaterialProps = (axis: NoteAxis, color: string) => {
    switch (axis) {
        case NoteAxis.ACADEMIC: // Metallic
            return {
                color: '#E5E5E5',
                emissive: '#333333',
                roughness: 0.2,
                metalness: 1.0,
                clearcoat: 1.0
            };
        case NoteAxis.DISCOURSE: // Void Black
            return {
                color: '#000000',
                emissive: '#000000',
                roughness: 0.9,
                metalness: 0.1,
            };
        case NoteAxis.INSTITUTION: // Deep Blue
        case NoteAxis.NETWORK: // Azure
        default:
            return {
                color: color,
                emissive: color,
                emissiveIntensity: 1.2,
                roughness: 0.1,
                metalness: 0.6,
            };
    }
};

interface ShardProps {
    dir: number[];
    flySpeed: number;
    tier: NoteTier;
    axis: NoteAxis;
    color: string;
}

const Shard: React.FC<ShardProps> = ({ dir, flySpeed, tier, axis, color }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const isGlitch = useMemo(() => tier === NoteTier.TIER_1 && Math.random() > 0.8, [tier]);

    useFrame(() => {
         if (meshRef.current) {
             meshRef.current.position.x += dir[0] * flySpeed * 0.01;
             meshRef.current.position.y += dir[1] * flySpeed * 0.01;
             meshRef.current.position.z += dir[2] * flySpeed * 0.01;
             meshRef.current.rotation.x += 0.2;
         }
    });
    
    return (
        <Box ref={meshRef} args={tier === NoteTier.TIER_1 ? [0.2, 0.2, 0.2] : [0.1, 0.1, 0.1]} position={[0,0,0]}>
             <meshBasicMaterial color={isGlitch ? 'white' : color} wireframe={axis === NoteAxis.DISCOURSE} />
        </Box>
    )
};

const Debris: React.FC<{ data: NoteData, timeSinceHit: number, color: string }> = ({ data, timeSinceHit, color }) => {
    const groupRef = useRef<THREE.Group>(null);
    const flySpeed = data.tier === NoteTier.TIER_1 ? 12.0 : 8.0;

    useFrame(() => {
        if (groupRef.current) {
             groupRef.current.scale.setScalar(Math.max(0.01, 1 - timeSinceHit * (data.tier === NoteTier.TIER_1 ? 1.5 : 3.0)));
             groupRef.current.position.z -= 0.1; 
        }
    });

    const count = data.tier === NoteTier.TIER_1 ? 12 : 6;
    const shardsDirections = useMemo(() => {
        const dirs = [];
        for(let i=0; i<count; i++) {
            dirs.push([(Math.random()-0.5)*2, (Math.random()-0.5)*2, (Math.random()-0.5)*2]);
        }
        return dirs;
    }, [count]);

    return (
        <group ref={groupRef}>
            {shardsDirections.map((dir, i) => (
                <Shard 
                    key={i} 
                    dir={dir} 
                    flySpeed={flySpeed}
                    tier={data.tier}
                    axis={data.axis}
                    color={color}
                />
            ))}
        </group>
    );
};

const Note: React.FC<NoteProps> = ({ data, zPos, currentTime }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Group>(null);
  
  // Determine Color based on Axis primarily, but keeping Left/Right hint for gameplay?
  // The spec emphasizes Axis colors. Let's use Axis colors for the body, but maybe a glow or indicator for Left/Right?
  // Actually, rhythm games need Left/Right distinction. 
  // Let's stick to the Spec: Axis Color defines the object. 
  // We can use the Saber color (Left/Right) for the "Core" or an indicator ring, 
  // OR we can assume the Tier/Axis IS the visual, and the player must know which side? 
  // Typically in this app, Left=Blue(Primary), Right=LightBlue(Secondary).
  // The Deep Blue system has Primary(#28317C) and Secondary(#3B82F6).
  // Institution is Primary, Network is Secondary.
  // We will prioritize the Axis color. If Axis is Discourse(Black) or Academic(Gray), it might be hard to tell which hand.
  // COMPROMISE: We will use the Axis visuals, but maybe the object emits the Hand Color slightly or has a specific position.
  // Since `data.type` determines position (Line Index 1/2), user knows usually Left is Left Lane.
  // But let's add a subtle rim or wireframe color matching the HandType if the Axis color is neutral.

  let baseColor = COLORS.primary;
  if (data.axis === NoteAxis.INSTITUTION) baseColor = COLORS.institution;
  if (data.axis === NoteAxis.ACADEMIC) baseColor = COLORS.academic;
  if (data.axis === NoteAxis.DISCOURSE) baseColor = COLORS.discourse;
  if (data.axis === NoteAxis.NETWORK) baseColor = COLORS.network;

  // Hand Indicator Color
  const handColor = data.type === 'left' ? COLORS.left : COLORS.right;

  const position: [number, number, number] = useMemo(() => {
     return [
         LANE_X_POSITIONS[data.lineIndex],
         LAYER_Y_POSITIONS[data.lineLayer],
         zPos
     ];
  }, [data.lineIndex, data.lineLayer, zPos]);

  useFrame((state) => {
      if (meshRef.current) {
          // Tier 1 rotates majestically slow, Tier 3 spins fast
          const speed = data.tier === NoteTier.TIER_1 ? 0.5 : data.tier === NoteTier.TIER_3 ? 4.0 : 2.0;
          meshRef.current.rotation.x = state.clock.getElapsedTime() * speed * 0.5;
          meshRef.current.rotation.y = state.clock.getElapsedTime() * speed * 0.3;
      }
      if (outerRef.current) {
          outerRef.current.rotation.z = -state.clock.getElapsedTime() * 0.5;
      }
  });

  if (data.missed) return null;

  if (data.hit && data.hitTime) {
      return (
          <group position={position}>
              <Debris data={data} timeSinceHit={currentTime - data.hitTime} color={handColor} />
          </group>
      );
  }

  const matProps = getAxisMaterialProps(data.axis, baseColor);

  return (
    <group position={position}>
      
      {/* Tier 1: The Masterpiece (Dodecahedron) */}
      {data.tier === NoteTier.TIER_1 && (
          <Dodecahedron ref={meshRef} args={[NOTE_SIZE * 0.8, 0]}>
              <meshPhysicalMaterial {...matProps} />
              {data.axis === NoteAxis.DISCOURSE && <Edges color="white" threshold={15} />}
          </Dodecahedron>
      )}

      {/* Tier 2: The Exhibition (Box) */}
      {data.tier === NoteTier.TIER_2 && (
          <Box ref={meshRef} args={[NOTE_SIZE, NOTE_SIZE, NOTE_SIZE]}>
              <meshStandardMaterial {...matProps} />
              {/* Box needs a bit of bevel or edges to look good */}
              <Edges color={handColor} threshold={15} scale={1.05} />
          </Box>
      )}

      {/* Tier 3: The Sketch (Cone/Pyramid) */}
      {data.tier === NoteTier.TIER_3 && (
          <Cone ref={meshRef} args={[NOTE_SIZE * 0.6, NOTE_SIZE * 1.2, 4]}>
              <meshStandardMaterial {...matProps} />
              <Edges color={baseColor} threshold={15} />
          </Cone>
      )}

      {/* Hand Indicator Ring (for playability) */}
      <mesh rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[NOTE_SIZE * 1.2, 0.02, 16, 32]} />
          <meshBasicMaterial color={handColor} transparent opacity={0.6} />
      </mesh>

    </group>
  );
};

export default React.memo(Note, (prev, next) => {
    if (next.data.hit) return false;
    return prev.zPos === next.zPos && prev.data.hit === next.data.hit && prev.data.missed === next.data.missed;
});
