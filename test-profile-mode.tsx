"use client"

import React, { useState, useEffect } from 'react'
import { SystemViewer } from './engine/components/system-viewer'
import type { ViewType } from '@lib/types/effects-level'

export default function TestProfileMode() {
  const [viewType, setViewType] = useState<ViewType>('realistic')
  
  // We need to set the viewType through context, so this component just shows buttons for demonstration
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
      
      <div className="flex-1">
        <SystemViewer 
          mode="realistic" 
          systemId="sol"
        />
      </div>
    </div>
  )
} 