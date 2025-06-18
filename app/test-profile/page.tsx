"use client"

import React from 'react'
import { SystemViewer } from '@/engine/components/system-viewer'
import Link from 'next/link'

export default function TestProfilePage() {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex space-x-4 p-4 bg-gray-800 text-white">
        <h1 className="text-xl font-bold">Profile Mode Test</h1>
        <div className="ml-4 text-white">
          Testing profile view mode behavior
        </div>
      </div>
      
      <div className="flex-1 relative">
        <SystemViewer 
          mode="star-citizen" 
          systemId="sol"
          onFocus={(obj, name) => console.log(`Focused on: ${name}`)}
        />
        
        {/* Back to Home Link */}
        <div className="absolute bottom-4 right-4 z-10">
          <Link 
            href="/" 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors flex items-center space-x-2"
          >
            <span>Back to Home</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
} 