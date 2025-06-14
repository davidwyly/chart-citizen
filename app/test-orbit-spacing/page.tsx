"use client"

import React, { useState, useEffect } from 'react'
import { SystemViewer } from '@/engine/components/system-viewer'
// import type { ViewType } from '@/lib/types/effects-level'
type ViewType = 'realistic' | 'navigational' | 'profile';
import Link from 'next/link'

export default function TestOrbitSpacingPage() {
  const [viewType, setViewType] = useState<ViewType>('realistic')
  const [orbitalData, setOrbitalData] = useState<{[key: string]: number[]}>({
    realistic: [],
    navigational: [],
    profile: []
  })
  
  // This function would be used in a real app to collect actual orbital spacing data
  // For this demo, we'll just set some representative values
  useEffect(() => {
    // Simulate the orbital spacing that would be calculated in each mode
    setOrbitalData({
      realistic: [10, 150, 400], // Realistic astronomical values
      navigational: [50, 100, 150], // Equidistant navigational values
      profile: [50, 100, 150], // Same equidistant pattern in profile view
    })
  }, [])

  return (
    <div className="flex flex-col h-screen">
      <div className="flex space-x-4 p-4 bg-gray-800 text-white">
        <button 
          className={`px-3 py-1 rounded ${viewType === 'realistic' ? 'bg-blue-600' : 'bg-gray-600'}`}
          onClick={() => setViewType('realistic')}
        >
          Realistic Mode
        </button>
        <button 
          className={`px-3 py-1 rounded ${viewType === 'navigational' ? 'bg-blue-600' : 'bg-gray-600'}`}
          onClick={() => setViewType('navigational')}
        >
          Navigational Mode
        </button>
        <button 
          className={`px-3 py-1 rounded ${viewType === 'profile' ? 'bg-blue-600' : 'bg-gray-600'}`}
          onClick={() => setViewType('profile')}
        >
          Profile Mode
        </button>
        <div className="ml-4 text-white">
          Current mode: <span className="font-bold">{viewType}</span>
        </div>
      </div>
      
      {/* Orbital spacing visualization */}
      <div className="p-4 bg-gray-100 dark:bg-gray-800">
        <h2 className="text-xl font-bold mb-3">Orbital Spacing Visualization</h2>
        <div className="flex items-center mb-2">
          <div className="w-20">Realistic:</div>
          <div className="h-8 bg-gray-200 flex-1 relative">
            {orbitalData.realistic.map((position, i) => (
              <div 
                key={i}
                className="absolute h-8 w-2 bg-blue-500"
                style={{
                  left: `${(position / 400) * 100}%`,
                  transform: 'translateX(-50%)'
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center mb-2">
          <div className="w-20">Navigation:</div>
          <div className="h-8 bg-gray-200 flex-1 relative">
            {orbitalData.navigational.map((position, i) => (
              <div 
                key={i}
                className="absolute h-8 w-2 bg-green-500"
                style={{
                  left: `${(position / 150) * 100}%`,
                  transform: 'translateX(-50%)'
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center mb-6">
          <div className="w-20">Profile:</div>
          <div className="h-8 bg-gray-200 flex-1 relative">
            {orbitalData.profile.map((position, i) => (
              <div 
                key={i}
                className="absolute h-8 w-2 bg-purple-500"
                style={{
                  left: `${(position / 150) * 100}%`,
                  transform: 'translateX(-50%)'
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="p-3 bg-gray-300 dark:bg-gray-700 rounded">
          <p className="mb-2"><strong>Note:</strong> In this visualization:</p>
          <ul className="list-disc pl-5">
            <li>Realistic mode: Uses actual astronomical distances (uneven spacing)</li>
            <li>Navigational mode: Uses equidistant spacing to show orbital relationships clearly</li>
            <li>Profile mode: Also uses equidistant spacing but with top-down view</li>
          </ul>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <SystemViewer 
          mode="star-citizen" 
          systemId="sol"
          onFocus={(obj, name) => console.log(`Focused on: ${name}`)}
          // Note: We pass the initial viewType through Sidebar props, but we need
          // to use a key to force re-render when viewType changes
          key={viewType}
        />
        
        {/* Celestial Viewer Link */}
        <div className="absolute bottom-4 right-4 z-10">
          <Link 
            href="/viewer/protostar" 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors flex items-center space-x-2"
          >
            <span>Celestial Viewer</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
} 