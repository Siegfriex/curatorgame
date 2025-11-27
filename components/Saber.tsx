/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HandType, COLORS } from '../types';

interface SaberProps {
  type: HandType;
  positionRef: React.MutableRefObject<THREE.Vector3 | null>;
  velocityRef: React.MutableRefObject<THREE.Vector3 | null>;
}

const Saber: React.FC<SaberProps> = ({ type, positionRef, velocityRef }) => {
  const meshRef = useRef<THREE.Group>(null);
  const saberLength = 1.3; 

  const targetRotation = useRef(new THREE.Euler());

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const targetPos = positionRef.current;
    const velocity = velocityRef.current;

    if (targetPos) {
      meshRef.current.visible = true;
      meshRef.current.position.lerp(targetPos, 0.5); // Snappier movement
      
      const restingX = -Math.PI / 3;
      const restingY = 0;
      const restingZ = type === 'left' ? 0.2 : -0.2; 

      let swayX = 0;
      let swayZ = 0;

      if (velocity) {
          swayX = velocity.y * 0.08; 
          swayZ = -velocity.x * 0.08;
      }

      targetRotation.current.set(restingX + swayX, restingY, restingZ + swayZ);

      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotation.current.x, 0.2);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotation.current.y, 0.2);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRotation.current.z, 0.2);

    } else {
      meshRef.current.visible = false;
    }
  });

  const color = type === 'left' ? COLORS.left : COLORS.right;

  return (
    <group ref={meshRef}>
      {/* Handle - Minimalist Cylinder */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.2, 32]} />
        <meshStandardMaterial color="#333" roughness={0.4} metalness={0.8} />
      </mesh>
      
      {/* Handle Ring Accent */}
      <mesh position={[0, 0.04, 0]}>
        <torusGeometry args={[0.012, 0.002, 16, 32]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Beam - Extremely Thin High Intensity */}
      <mesh position={[0, 0.05 + saberLength / 2, 0]}>
        <cylinderGeometry args={[0.002, 0.002, saberLength, 8]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      {/* Outer Glow - Soft Gradient */}
      <mesh position={[0, 0.05 + saberLength / 2, 0]}>
        <capsuleGeometry args={[0.02, saberLength, 4, 16]} />
        <meshBasicMaterial 
          color={color} 
          transparent
          opacity={0.4} 
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Tip Flare */}
      <mesh position={[0, 0.05 + saberLength, 0]}>
          <sphereGeometry args={[0.03]} />
          <meshBasicMaterial color="white" toneMapped={false} transparent opacity={0.8} />
      </mesh>
      
      {/* Emitter Point Light */}
      <pointLight color={color} intensity={8} distance={3} decay={2} position={[0, 0.2, 0]} />
    </group>
  );
};

export default Saber;