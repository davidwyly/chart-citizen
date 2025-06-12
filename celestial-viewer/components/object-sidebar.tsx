"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { CelestialObject, CelestialObjectType } from "@/lib/types"

interface ObjectSidebarProps {
  celestialObjects: CelestialObject[]
  onSelectObject: (object: CelestialObject) => void
  selectedObjectId: string | null
}

export function ObjectSidebar({ celestialObjects, onSelectObject, selectedObjectId }: ObjectSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")

  if (!celestialObjects || celestialObjects.length === 0) {
    return (
      <div className="flex h-full flex-col border-r border-gray-800 bg-gray-950 p-4">
        <h2 className="mb-4 text-lg font-semibold">Celestial Objects</h2>
        <p className="text-gray-400">No objects available</p>
      </div>
    )
  }

  const filteredObjects = celestialObjects.filter(
    (obj) =>
      obj?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obj?.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const groupedObjects = filteredObjects.reduce(
    (acc, obj) => {
      if (!obj?.type) return acc
      const type = obj.type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(obj)
      return acc
    },
    {} as Record<CelestialObjectType, CelestialObject[]>,
  )

  const typeLabels: Record<CelestialObjectType, string> = {
    star: "Stars",
    terrestrial: "Terrestrial Planets & Moons",
    gasGiant: "Gas Giants",
    special: "Special Objects",
  }

  return (
    <div className="flex h-full flex-col border-r border-gray-800 bg-gray-950 p-4">
      <h2 className="mb-4 text-lg font-semibold">Celestial Objects</h2>
      <Input
        placeholder="Search objects..."
        className="mb-4"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <ScrollArea className="flex-1">
        <Accordion type="multiple" className="w-full">
          {Object.entries(groupedObjects).map(([type, objects]) => (
            <AccordionItem key={type} value={type}>
              <AccordionTrigger className="text-md font-medium text-gray-200">
                {typeLabels[type as CelestialObjectType]}
              </AccordionTrigger>
              <AccordionContent className="pl-4">
                {objects.map((obj) => (
                  <div
                    key={obj.id}
                    className={`cursor-pointer rounded-md p-2 transition-colors hover:bg-gray-800 ${
                      selectedObjectId === obj.id ? "bg-gray-800 text-gray-100" : "text-gray-300"
                    }`}
                    onClick={() => onSelectObject(obj)}
                  >
                    <h3 className="font-medium">{obj.name || "Unknown Object"}</h3>
                    <p className="text-sm text-gray-400">{obj.description || "No description available"}</p>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  )
}
