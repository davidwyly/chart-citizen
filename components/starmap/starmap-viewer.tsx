import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';

interface StarmapViewerProps {
  mode: "realistic" | "star-citizen";
  onSystemSelect: (systemId: string) => void;
}

export function StarmapViewer({ mode, onSystemSelect }: StarmapViewerProps) {
  return (
    <div className="w-full h-full">
      <Canvas>
        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <OrbitControls />
        {/* TODO: Add star systems based on mode */}
      </Canvas>
    </div>
  );
} 