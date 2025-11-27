
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Environment, Stars, useTexture, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { GameStatus, NoteData, HandPositions, COLORS, CutDirection, GateData } from '../types';
import { PLAYER_Z, SPAWN_Z, MISS_Z, NOTE_SPEED, DIRECTION_VECTORS, LANE_X_POSITIONS, LAYER_Y_POSITIONS, SONG_BPM, GATES } from '../constants';
import Note from './Note';
import Saber from './Saber';

// URL for the sunken map texture - using a reliable Unsplash source for the vintage map aesthetic
const MAP_TEXTURE_URL = "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop";

interface GameSceneProps {
  gameStatus: GameStatus;
  audioRef: React.RefObject<HTMLAudioElement>;
  handPositionsRef: React.MutableRefObject<any>; 
  chart: NoteData[];
  onNoteHit: (note: NoteData, goodCut: boolean) => void;
  onNoteMiss: (note: NoteData) => void;
  onSongEnd: () => void;
}

const BEAT_TIME = 60 / SONG_BPM;

// Gate Component
const Gate: React.FC<{ data: GateData, zPos: number }> = ({ data, zPos }) => {
    const opacity = Math.min(1, Math.max(0, (zPos + 20) / 20)); // Fade in
    
    // Position gates horizontally. 
    // Usually 3 gates per phase. We can't stack them at same Z and X.
    // Logic: In Phase 1 (10s), there are Gates 1,2,3. 
    // They should appear side-by-side? The prompt says "Select one".
    // Let's place them: Gate 1 (Left), Gate 2 (Center), Gate 3 (Right).
    // Mapping ID to position.
    
    let xPos = 0;
    if (data.id.includes('1') || data.id.includes('4') || data.id.includes('7')) xPos = -4; // Left
    if (data.id.includes('2') || data.id.includes('5') || data.id.includes('8')) xPos = 0;  // Center
    if (data.id.includes('3') || data.id.includes('6') || data.id.includes('9')) xPos = 4;  // Right

    // Color based on Type
    const color = data.type === 'NEGATIVE' ? '#ef4444' : data.type === 'POSITIVE' ? '#22c55e' : '#e5e5e5';
    
    return (
        <group position={[xPos, 2, zPos]}>
            {/* The Arch */}
            <mesh position={[0, 2, 0]}>
                <torusGeometry args={[1.5, 0.05, 16, 40, Math.PI]} />
                <meshBasicMaterial color={color} transparent opacity={opacity} />
            </mesh>
            <mesh position={[-1.5, 1, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 2]} />
                <meshBasicMaterial color={color} transparent opacity={opacity} />
            </mesh>
            <mesh position={[1.5, 1, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 2]} />
                <meshBasicMaterial color={color} transparent opacity={opacity} />
            </mesh>

            {/* Typography */}
            <Text
                position={[0, 4, 0]}
                fontSize={0.5}
                font="https://fonts.gstatic.com/s/playfairdisplay/v30/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYgA.woff"
                color="white"
                anchorX="center"
                anchorY="middle"
                fillOpacity={opacity}
            >
                {data.label}
            </Text>
            <Text
                position={[0, 3.5, 0]}
                fontSize={0.2}
                color={color}
                anchorX="center"
                anchorY="middle"
                fillOpacity={opacity}
            >
                {data.subLabel}
            </Text>
            
            {/* Floor Glow */}
            <mesh position={[0, -2, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <circleGeometry args={[1.5, 32]} />
                <meshBasicMaterial color={color} transparent opacity={opacity * 0.2} />
            </mesh>
        </group>
    );
}

// Dynamic Ocean Component
const Ocean = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const geometryRef = useRef<THREE.PlaneGeometry>(null);

    useFrame((state) => {
        if (!geometryRef.current) return;
        
        const time = state.clock.getElapsedTime();
        const positions = geometryRef.current.attributes.position;
        
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i); 
            const z = 0.2 * Math.sin(x * 0.5 + time * 0.5) + 0.1 * Math.sin(y * 0.5 + time * 0.8);
            positions.setZ(i, z);
        }
        positions.needsUpdate = true;
    });

    return (
        <group position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh ref={meshRef}>
                <planeGeometry ref={geometryRef} args={[60, 120, 32, 64]} />
                <meshPhysicalMaterial 
                    color="#28317C" 
                    transmission={0.8}
                    opacity={0.7}
                    transparent
                    roughness={0.1}
                    metalness={0.2}
                    reflectivity={0.8}
                    ior={1.33}
                    thickness={2.0}
                    envMapIntensity={2.0}
                />
            </mesh>
        </group>
    );
};

const SunkenMap = () => {
    const texture = useTexture(MAP_TEXTURE_URL);
    return (
        <mesh position={[0, -5, -10]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[50, 80]} />
            <meshBasicMaterial 
                map={texture} 
                color="#888" 
                toneMapped={false} 
                opacity={0.4} 
                transparent 
            />
        </mesh>
    );
};

const SkyParticles = () => {
    const count = 1000;
    const meshRef = useRef<THREE.Points>(null);
    
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 100; // x
            pos[i * 3 + 1] = Math.random() * 40 + 5; // y
            pos[i * 3 + 2] = (Math.random() - 0.5) * 100 - 20; // z
        }
        return pos;
    }, []);

    useFrame((state) => {
        if(meshRef.current) {
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
        }
    });

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.15}
                color="#3B82F6"
                transparent
                opacity={0.6}
                sizeAttenuation={true}
            />
        </points>
    );
};


const GameScene: React.FC<GameSceneProps> = ({ 
    gameStatus, 
    audioRef, 
    handPositionsRef, 
    chart,
    onNoteHit,
    onNoteMiss,
    onSongEnd
}) => {
  const [notesState, setNotesState] = useState<NoteData[]>(chart);
  const [currentTime, setCurrentTime] = useState(0);

  const activeNotesRef = useRef<NoteData[]>([]);
  const nextNoteIndexRef = useRef(0);
  const shakeIntensity = useRef(0);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const vecA = useMemo(() => new THREE.Vector3(), []);
  const vecB = useMemo(() => new THREE.Vector3(), []);

  const handleHit = (note: NoteData, goodCut: boolean) => {
      // Impact depends on Tier
      shakeIntensity.current = note.tier === 1 ? 0.4 : note.tier === 2 ? 0.2 : 0.1;
      onNoteHit(note, goodCut);
  }

  useFrame((state, delta) => {
    if (audioRef.current && gameStatus === GameStatus.PLAYING) {
        const time = audioRef.current.currentTime;
        const beatPhase = (time % BEAT_TIME) / BEAT_TIME;
        const pulse = Math.pow(1 - beatPhase, 3); 
        
        if (spotLightRef.current) {
            spotLightRef.current.intensity = 50 + (pulse * 50);
            spotLightRef.current.angle = 0.6 + (pulse * 0.05);
        }
    }

    if (shakeIntensity.current > 0 && cameraRef.current) {
        const shake = shakeIntensity.current;
        cameraRef.current.position.x = (Math.random() - 0.5) * shake;
        cameraRef.current.position.y = 1.8 + (Math.random() - 0.5) * shake;
        
        shakeIntensity.current = THREE.MathUtils.lerp(shakeIntensity.current, 0, 8 * delta);
        if (shakeIntensity.current < 0.001) shakeIntensity.current = 0;
    } else if (cameraRef.current) {
        cameraRef.current.position.lerp(new THREE.Vector3(0, 1.8, 4), 0.1);
    }

    if (gameStatus !== GameStatus.PLAYING || !audioRef.current) return;

    const time = audioRef.current.currentTime;
    setCurrentTime(time);

    if (audioRef.current.ended) {
        onSongEnd();
        return;
    }

    const spawnAheadTime = Math.abs(SPAWN_Z - PLAYER_Z) / NOTE_SPEED;
    
    while (nextNoteIndexRef.current < notesState.length) {
      const nextNote = notesState[nextNoteIndexRef.current];
      if (nextNote.time - spawnAheadTime <= time) {
        activeNotesRef.current.push(nextNote);
        nextNoteIndexRef.current++;
      } else {
        break;
      }
    }

    const hands = handPositionsRef.current as HandPositions;

    for (let i = activeNotesRef.current.length - 1; i >= 0; i--) {
        const note = activeNotesRef.current[i];
        if (note.hit || note.missed) continue;

        const timeDiff = note.time - time; 
        const currentZ = PLAYER_Z - (timeDiff * NOTE_SPEED);

        if (currentZ > MISS_Z) {
            note.missed = true;
            onNoteMiss(note);
            activeNotesRef.current.splice(i, 1);
            continue;
        }

        if (currentZ > PLAYER_Z - 1.5 && currentZ < PLAYER_Z + 1.0) {
            const handPos = note.type === 'left' ? hands.left : hands.right;
            const handVel = note.type === 'left' ? hands.leftVelocity : hands.rightVelocity;

            if (handPos) {
                 const notePos = vecA.set(
                     LANE_X_POSITIONS[note.lineIndex],
                     LAYER_Y_POSITIONS[note.lineLayer],
                     currentZ
                 );

                 // Hit box size depends on Tier? No, standard for gameplay
                 if (handPos.distanceTo(notePos) < 0.8) {
                     let goodCut = true;
                     const speed = handVel.length();

                     if (note.cutDirection !== CutDirection.ANY) {
                         const requiredDir = DIRECTION_VECTORS[note.cutDirection];
                         vecB.copy(handVel).normalize();
                         const dot = vecB.dot(requiredDir);
                         if (dot < 0.3 || speed < 1.5) goodCut = false;
                     } else {
                         if (speed < 1.5) goodCut = false; 
                     }

                     note.hit = true;
                     note.hitTime = time;
                     handleHit(note, goodCut);
                     activeNotesRef.current.splice(i, 1);
                 }
            }
        }
    }
  });

  const visibleNotes = useMemo(() => {
     return notesState.filter(n => 
         !n.missed && 
         (!n.hit || (currentTime - (n.hitTime || 0) < 0.5)) && 
         (n.time - currentTime) < 5 && 
         (n.time - currentTime) > -2 
     );
  }, [notesState, currentTime]);

  // Gate Visibility Logic
  // Gates are static in time, but moving in Z relative to player (simulated by note movement logic)
  const visibleGates = useMemo(() => {
     return GATES.filter(g => (g.time - currentTime) < 10 && (g.time - currentTime) > -5);
  }, [currentTime]);

  const leftHandPosRef = useRef<THREE.Vector3 | null>(null);
  const rightHandPosRef = useRef<THREE.Vector3 | null>(null);
  const leftHandVelRef = useRef<THREE.Vector3 | null>(null);
  const rightHandVelRef = useRef<THREE.Vector3 | null>(null);

  useFrame(() => {
     leftHandPosRef.current = handPositionsRef.current.left;
     rightHandPosRef.current = handPositionsRef.current.right;
     leftHandVelRef.current = handPositionsRef.current.leftVelocity;
     rightHandVelRef.current = handPositionsRef.current.rightVelocity;
  });

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 1.8, 4]} fov={50} />
      <color attach="background" args={['#0a0a0a']} />
      <fog attach="fog" args={['#0a0a0a', 10, 50]} />
      
      <ambientLight intensity={0.2} color="#28317C" />
      <spotLight 
        ref={spotLightRef} 
        position={[0, 10, -5]} 
        angle={0.8} 
        penumbra={1} 
        intensity={50} 
        castShadow 
        color="#ffffff"
        distance={40}
      />
      
      <Environment preset="night" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <SkyParticles />

      <React.Suspense fallback={null}>
         <SunkenMap />
      </React.Suspense>
      <Ocean />

      {[-4, 4].map((x, i) => (
         <mesh key={i} position={[x, 2, -20]} rotation={[Math.PI/2, 0, 0]}>
             <cylinderGeometry args={[0.02, 0.02, 100]} />
             <meshBasicMaterial color="#3B82F6" opacity={0.3} transparent />
         </mesh>
      ))}

      <Saber type="left" positionRef={leftHandPosRef} velocityRef={leftHandVelRef} />
      <Saber type="right" positionRef={rightHandPosRef} velocityRef={rightHandVelRef} />

      {visibleNotes.map(note => (
          <Note 
            key={note.id} 
            data={note} 
            zPos={PLAYER_Z - ((note.time - currentTime) * NOTE_SPEED)} 
            currentTime={currentTime}
          />
      ))}
      
      {/* Render Gates */}
      {visibleGates.map(gate => (
          <Gate 
            key={gate.id}
            data={gate}
            zPos={PLAYER_Z - ((gate.time - currentTime) * NOTE_SPEED)}
          />
      ))}
    </>
  );
};

export default GameScene;
