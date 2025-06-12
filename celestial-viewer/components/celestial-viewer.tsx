"use client"

import { useState, useEffect } from "react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { ObjectSidebar } from "./object-sidebar"
import { ObjectControls } from "./object-controls"
import { ObjectInfo } from "./object-info"
import { CelestialScene } from "./celestial-scene"
import { celestialObjects } from "@/lib/data"
import type { CelestialObject } from "@/lib/types"

export default function CelestialViewer() {
  const [selectedObject, setSelectedObject] = useState<CelestialObject | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      // Select the first terrestrial planet by default
      const defaultObject = celestialObjects.find((obj) => obj.id === "terrestrial-rocky-planet")
      if (defaultObject) {
        setSelectedObject(JSON.parse(JSON.stringify(defaultObject))) // Deep copy to allow independent property changes
      }
    } catch (error) {
      console.error("Error setting default object:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSelectObject = (object: CelestialObject) => {
    try {
      // When selecting a new object, deep copy its properties to allow modification
      setSelectedObject(JSON.parse(JSON.stringify(object)))
    } catch (error) {
      console.error("Error selecting object:", error)
    }
  }

  const handleUpdateProperty = (objectId: string, propertyId: string, value: number | string) => {
    setSelectedObject((prevObject) => {
      if (!prevObject || prevObject.id !== objectId) return prevObject

      try {
        const updatedProperties = prevObject.properties.map((prop) =>
          prop?.id === propertyId ? { ...prop, value: value } : prop,
        )
        return { ...prevObject, properties: updatedProperties }
      } catch (error) {
        console.error("Error updating property:", error)
        return prevObject
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full bg-black text-white items-center justify-center">
        <p className="text-gray-400">Loading celestial objects...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full bg-black text-white dark">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={15}>
          <ObjectSidebar
            celestialObjects={celestialObjects}
            onSelectObject={handleSelectObject}
            selectedObjectId={selectedObject?.id || null}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={60} minSize={40}>
          <CelestialScene selectedObject={selectedObject} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={20} minSize={15}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70} minSize={50}>
              <ObjectControls selectedObject={selectedObject} onUpdateProperty={handleUpdateProperty} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={20}>
              <ObjectInfo selectedObject={selectedObject} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
