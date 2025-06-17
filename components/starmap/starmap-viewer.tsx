import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';

interface StarmapViewerProps {
  mode: "realistic" | "star-citizen";
  onSystemSelect: (systemId: string) => void;
}

/**
 * StarmapViewer component - displays an interactive star map
 * Memoized to prevent unnecessary re-renders when props haven't changed
 */
export const StarmapViewer = React.memo<StarmapViewerProps>(function StarmapViewer({ mode, onSystemSelect }) {
  return (
    <div className="w-full h-full">
      <Canvas>
        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <OrbitControls />
        {/* Star systems will be rendered here based on the selected mode */}
        {/* This is a placeholder implementation - full starmap rendering would be implemented */}
        {/* as a separate feature when the starmap system data structure is finalized */}
      </Canvas>
    </div>
  );
}); 