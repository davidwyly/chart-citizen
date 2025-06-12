"use client"

interface ObjectControlsProps {
  selectedObjectId: string
  objectScale: number
  shaderScale: number
  shaderParams: {
    intensity: number
    speed: number
    distortion: number
    diskSpeed: number
    lensingStrength: number
    diskBrightness: number
  }
  onObjectScaleChange: (scale: number) => void
  onShaderScaleChange: (scale: number) => void
  onShaderParamChange: (param: string, value: number) => void
}

export function ObjectControls({
  selectedObjectId,
  objectScale,
  shaderScale,
  shaderParams,
  onObjectScaleChange,
  onShaderScaleChange,
  onShaderParamChange
}: ObjectControlsProps) {
  const renderSlider = (
    id: string,
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (value: number) => void,
    unit?: string
  ) => (
    <div key={id} className="space-y-2 mb-4">
      <label htmlFor={id} className="block text-sm text-gray-300">
        {label}: {value.toFixed(step < 1 ? 3 : 2)}{unit || ""}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  )

  const isProtostar = selectedObjectId === 'protostar'
  const isBlackHole = selectedObjectId === 'black-hole'

  return (
    <div className="flex h-full flex-col p-4 overflow-y-auto">
      <h2 className="mb-4 text-lg font-semibold">Object Controls</h2>
      
      {/* General Properties */}
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-200 mb-3 border-b border-gray-700 pb-1">
          General Properties
        </h3>
        {renderSlider(
          "objectScale",
          "Object Scale",
          objectScale,
          0.1,
          10,
          0.1,
          onObjectScaleChange
        )}
        {renderSlider(
          "shaderScale",
          "Shader Scale",
          shaderScale,
          0.1,
          5,
          0.1,
          onShaderScaleChange
        )}
      </div>

      {/* Protostar-specific Properties */}
      {isProtostar && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-200 mb-3 border-b border-gray-700 pb-1">
            Protostar Properties
          </h3>
          {renderSlider(
            "intensity",
            "Nebula Density",
            shaderParams.intensity,
            0.01,
            2.0,
            0.01,
            (value) => onShaderParamChange("intensity", value)
          )}
          {renderSlider(
            "speed",
            "Rotation Speed",
            shaderParams.speed,
            0.0,
            2.0,
            0.01,
            (value) => onShaderParamChange("speed", value)
          )}
          {renderSlider(
            "distortion",
            "Star Brightness",
            shaderParams.distortion,
            0.1,
            5.0,
            0.1,
            (value) => onShaderParamChange("distortion", value)
          )}
          {renderSlider(
            "diskSpeed",
            "Star Hue",
            shaderParams.diskSpeed,
            0.0,
            1.0,
            0.01,
            (value) => onShaderParamChange("diskSpeed", value),
            " (0=red, 0.16=yellow, 0.66=blue)"
          )}
          {renderSlider(
            "lensingStrength",
            "Nebula Hue",
            shaderParams.lensingStrength,
            0.0,
            1.0,
            0.01,
            (value) => onShaderParamChange("lensingStrength", value),
            " (0=red, 0.16=yellow, 0.66=blue)"
          )}
        </div>
      )}

      {/* Black Hole-specific Properties */}
      {isBlackHole && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-200 mb-3 border-b border-gray-700 pb-1">
            Black Hole Properties
          </h3>
          {renderSlider(
            "intensity",
            "Accretion Disk Intensity",
            shaderParams.intensity,
            0.1,
            3,
            0.1,
            (value) => onShaderParamChange("intensity", value)
          )}
          {renderSlider(
            "speed",
            "Disk Rotation Speed",
            shaderParams.speed,
            0.1,
            5,
            0.1,
            (value) => onShaderParamChange("speed", value)
          )}
          {renderSlider(
            "distortion",
            "Gravitational Lensing",
            shaderParams.distortion,
            0.1,
            3,
            0.1,
            (value) => onShaderParamChange("distortion", value)
          )}
          {renderSlider(
            "diskSpeed",
            "Disk Speed",
            shaderParams.diskSpeed,
            0.1,
            5,
            0.1,
            (value) => onShaderParamChange("diskSpeed", value)
          )}
          {renderSlider(
            "lensingStrength",
            "Lensing Strength",
            shaderParams.lensingStrength,
            0.1,
            3,
            0.1,
            (value) => onShaderParamChange("lensingStrength", value)
          )}
          {renderSlider(
            "diskBrightness",
            "Disk Brightness",
            shaderParams.diskBrightness,
            0.1,
            3,
            0.1,
            (value) => onShaderParamChange("diskBrightness", value)
          )}
        </div>
      )}

      {/* Generic Shader Properties for other objects */}
      {!isProtostar && !isBlackHole && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-200 mb-3 border-b border-gray-700 pb-1">
            Shader Properties
          </h3>
          {renderSlider(
            "intensity",
            "Intensity",
            shaderParams.intensity,
            0.1,
            3,
            0.1,
            (value) => onShaderParamChange("intensity", value)
          )}
          {renderSlider(
            "speed",
            "Speed",
            shaderParams.speed,
            0.1,
            5,
            0.1,
            (value) => onShaderParamChange("speed", value)
          )}
          {renderSlider(
            "distortion",
            "Distortion",
            shaderParams.distortion,
            0.1,
            3,
            0.1,
            (value) => onShaderParamChange("distortion", value)
          )}
          {renderSlider(
            "diskSpeed",
            "Disk Speed",
            shaderParams.diskSpeed,
            0.1,
            5,
            0.1,
            (value) => onShaderParamChange("diskSpeed", value)
          )}
          {renderSlider(
            "lensingStrength",
            "Lensing Strength",
            shaderParams.lensingStrength,
            0.1,
            3,
            0.1,
            (value) => onShaderParamChange("lensingStrength", value)
          )}
          {renderSlider(
            "diskBrightness",
            "Disk Brightness",
            shaderParams.diskBrightness,
            0.1,
            3,
            0.1,
            (value) => onShaderParamChange("diskBrightness", value)
          )}
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
} 