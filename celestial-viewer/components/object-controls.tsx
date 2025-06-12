"use client"

import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { CelestialObject, Property } from "@/lib/types"

interface ObjectControlsProps {
  selectedObject: CelestialObject | null
  onUpdateProperty: (objectId: string, propertyId: string, value: number | string) => void
}

export function ObjectControls({ selectedObject, onUpdateProperty }: ObjectControlsProps) {
  if (!selectedObject?.properties) {
    return (
      <div className="flex h-full flex-col border-l border-gray-800 bg-gray-950 p-4">
        <h2 className="mb-4 text-lg font-semibold">Object Controls</h2>
        <p className="text-gray-400">Select an object to view its controls.</p>
      </div>
    )
  }

  const groupedProperties: Record<string, Property[]> = {
    "General Properties": [],
    "Terrestrial Properties": [],
    "Atmosphere Properties": [],
    "Gas Giant Properties": [],
    "Ring Properties": [],
    "Special Properties": [],
    "Protostar Properties": [], // New group for protostar
  }

  selectedObject.properties.forEach((prop) => {
    if (!prop?.id) return

    try {
      if (prop.id === "objectScale" || prop.id === "shaderScale") {
        groupedProperties["General Properties"].push(prop)
      } else if (
        selectedObject.type === "terrestrial" &&
        ["landWaterRatio", "temperature", "volcanismLevel", "civilizationPresence"].includes(prop.id)
      ) {
        groupedProperties["Terrestrial Properties"].push(prop)
      } else if (
        selectedObject.type === "terrestrial" &&
        ["atmosphereDensity", "atmosphereComposition"].includes(prop.id)
      ) {
        groupedProperties["Atmosphere Properties"].push(prop)
      } else if (selectedObject.type === "gasGiant" && ["gasComposition", "temperatureClass"].includes(prop.id)) {
        groupedProperties["Gas Giant Properties"].push(prop)
      } else if (
        selectedObject.type === "gasGiant" &&
        ["ringDensity", "ringInnerRadius", "ringOuterRadius"].includes(prop.id)
      ) {
        groupedProperties["Ring Properties"].push(prop)
      } else if (selectedObject.type === "special" && selectedObject.subtype === "blackHole") {
        groupedProperties["Special Properties"].push(prop)
      } else if (selectedObject.type === "special" && selectedObject.subtype === "protostar") {
        groupedProperties["Protostar Properties"].push(prop)
      }
    } catch (error) {
      console.error("Error grouping property:", prop, error)
    }
  })

  const renderPropertyControl = (prop: Property) => {
    if (!prop?.id || prop.value === undefined) {
      return null
    }

    try {
      if (prop.type === "slider") {
        const numValue = typeof prop.value === "number" ? prop.value : Number.parseFloat(prop.value as string) || 0
        return (
          <div key={prop.id} className="space-y-2">
            <Label htmlFor={prop.id} className="text-gray-300">
              {prop.label}: {numValue.toFixed(prop.step && prop.step < 1 ? 3 : 2)}
              {prop.unit || ""}
            </Label>
            <Slider
              id={prop.id}
              min={prop.min || 0}
              max={prop.max || 100}
              step={prop.step || 0.01}
              value={[numValue]}
              onValueChange={(val) => onUpdateProperty(selectedObject.id, prop.id, val[0])}
            />
          </div>
        )
      } else if (prop.type === "select") {
        return (
          <div key={prop.id} className="space-y-2">
            <Label htmlFor={prop.id} className="text-gray-300">
              {prop.label}
            </Label>
            <Select
              value={prop.value as string}
              onValueChange={(val) => onUpdateProperty(selectedObject.id, prop.id, val)}
            >
              <SelectTrigger id={prop.id}>
                <SelectValue placeholder={`Select ${prop.label}`} />
              </SelectTrigger>
              <SelectContent>
                {prop.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                )) || []}
              </SelectContent>
            </Select>
          </div>
        )
      }
    } catch (error) {
      console.error("Error rendering property control:", prop, error)
    }
    return null
  }

  return (
    <div className="flex h-full flex-col border-l border-gray-800 bg-gray-950 p-4">
      <h2 className="mb-4 text-lg font-semibold">Object Controls</h2>
      <ScrollArea className="flex-1">
        <Accordion type="multiple" className="w-full" defaultValue={["General Properties", "Protostar Properties"]}>
          {Object.entries(groupedProperties).map(([groupName, properties]) => {
            if (!properties || properties.length === 0) return null
            return (
              <AccordionItem key={groupName} value={groupName}>
                <AccordionTrigger className="text-md font-medium text-gray-200">{groupName}</AccordionTrigger>
                <AccordionContent className="space-y-4 pl-4">
                  {properties.map(renderPropertyControl).filter(Boolean)}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </ScrollArea>
    </div>
  )
}
