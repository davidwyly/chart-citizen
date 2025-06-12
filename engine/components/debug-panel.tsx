"use client"

import { useState } from "react"
import { engineSystemLoader } from "@/engine/system-loader"

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])

  const testDataFiles = async () => {
    const results: string[] = []
    const modes = ["realistic", "star-citizen"]

    // Test shared catalog first
    results.push(`\n=== Testing Shared Object Catalog ===`)
    const catalogFiles = ["stars", "planets", "moons", "belts", "space-stations"]
    for (const catalog of catalogFiles) {
      try {
        const catalogResponse = await fetch(`/data/shared/object-catalog/${catalog}.json`)
        const status = catalogResponse.ok ? "✅ OK" : "❌ FAIL"
        results.push(`Catalog ${catalog}: ${catalogResponse.status} - ${status}`)

        if (!catalogResponse.ok) {
          const text = await catalogResponse.text()
          if (text.includes("<!DOCTYPE html>")) {
            results.push(`  → File doesn't exist, got HTML instead`)
          }
        }
      } catch (error) {
        results.push(`Catalog ${catalog}: ❌ ERROR - ${error}`)
      }
    }

    // Test each mode
    for (const mode of modes) {
      results.push(`\n=== Testing ${mode} mode ===`)

      // Test starmap
      try {
        const starmapResponse = await fetch(`/data/${mode}/starmap-systems.json`)
        const status = starmapResponse.ok ? "✅ OK" : "❌ FAIL"
        results.push(`Starmap (${mode}): ${starmapResponse.status} - ${status}`)

        if (!starmapResponse.ok) {
          const text = await starmapResponse.text()
          if (text.includes("<!DOCTYPE html>")) {
            results.push(`  → File doesn't exist, got HTML instead`)
          }
        } else {
          const starmap = await starmapResponse.json()
          const systemIds = Object.keys(starmap.systems || {})
          results.push(`  Systems found: ${systemIds.join(", ")}`)

          // Test first system
          if (systemIds.length > 0) {
            const firstSystem = systemIds[0]
            const systemResponse = await fetch(`/data/${mode}/systems/${firstSystem}.json`)
            const systemStatus = systemResponse.ok ? "✅ OK" : "❌ FAIL"
            results.push(`  System ${firstSystem}: ${systemResponse.status} - ${systemStatus}`)

            if (!systemResponse.ok) {
              const text = await systemResponse.text()
              if (text.includes("<!DOCTYPE html>")) {
                results.push(`    → File doesn't exist, got HTML instead`)
              }
            }
          }
        }
      } catch (error) {
        results.push(`Starmap (${mode}): ❌ ERROR - ${error}`)
      }
    }

    // Test current mode specifically
    results.push(`\n=== Current Mode: ${engineSystemLoader.getMode()} ===`)
    try {
      const systems = await engineSystemLoader.getStarmapSystems()
      results.push(`Systems loaded: ${Object.keys(systems).length}`)

      if (Object.keys(systems).length > 0) {
        const firstSystemId = Object.keys(systems)[0]
        const systemData = await engineSystemLoader.loadSystem(firstSystemId)
        results.push(`Test system load: ${systemData ? "✅ SUCCESS" : "❌ FAILED"}`)
      }
    } catch (error) {
      results.push(`Current mode test: ❌ ERROR - ${error}`)
    }

    setTestResults(results)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-red-600 text-white px-3 py-2 rounded text-sm z-50"
      >
        Debug
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg max-w-md max-h-96 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Debug Panel</h3>
        <button onClick={() => setIsOpen(false)} className="text-red-400">
          ✕
        </button>
      </div>

      <button onClick={testDataFiles} className="bg-blue-600 text-white px-3 py-1 rounded text-sm mb-2">
        Test Data Files
      </button>

      <div className="text-xs space-y-1">
        <div>Mode: {engineSystemLoader.getMode()}</div>
        <div>Expected structure:</div>
        <div className="ml-2 text-gray-400">
          <div>• /data/shared/object-catalog/*.json</div>
          <div>• /data/realistic/starmap-systems.json</div>
          <div>• /data/star-citizen/starmap-systems.json</div>
          <div>• /data/[mode]/systems/*.json</div>
        </div>
      </div>

      {testResults.length > 0 && (
        <div className="mt-2 text-xs">
          <div className="font-bold mb-1">Test Results:</div>
          <pre className="whitespace-pre-wrap text-xs">{testResults.join("\n")}</pre>
        </div>
      )}
    </div>
  )
}
