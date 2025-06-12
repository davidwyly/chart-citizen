"use client"

import type React from "react"

import { Star, Circle } from "lucide-react"
import { toRomanNumeral } from "@/lib/roman-numerals"
import type { SystemData } from "@/engine/system-loader"
import type * as THREE from "three"

interface SystemBreadcrumbProps {
  systemName: string
  selectedObjectName: string | null
  onSystemNameClick?: () => void
}

export function SystemBreadcrumb({ systemName, selectedObjectName, onSystemNameClick }: SystemBreadcrumbProps) {
  return (
    <div className="absolute top-4 left-20 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
      <div className="text-sm">
        <button
          onClick={onSystemNameClick}
          className="hover:text-blue-300 transition-colors duration-200"
        >
          {systemName}
        </button>
        {selectedObjectName && (
          <>
            <span className="mx-2">/</span>
            <span>{selectedObjectName}</span>
          </>
        )}
      </div>
    </div>
  )
}
