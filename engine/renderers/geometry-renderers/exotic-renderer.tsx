"use client"

import React, { useRef, useEffect, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { extend } from "@react-three/fiber"
import type { GeometryRendererProps } from "./types"

// Vertex Shader
const vertexShader = `
varying vec2 vUv;
varying vec3 vWorldPos; // World-space position of the fragment

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}`;

// Fragment Shader
const fragmentShader = `
#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform float intensity;
uniform float speed;
uniform float distortion;
uniform vec2 resolution;
uniform sampler2D nebulaTexture;
uniform vec3 cameraPos;      // World-space camera position
uniform mat4 invModel;       // Inverse of the mesh\'s world matrix

varying vec2 vUv;
varying vec3 vWorldPos;      // World-space position of the fragment

// Shader-specific constants
#define AA 1
#define _Speed 3.0
#define _Steps 12.
#define _Size 0.3 // Size of BH in local units

// Helper functions
float hash(float x) { return fract(sin(x) * 152754.742); }
float hash(vec2 x) { return hash(x.x + hash(x.y)); }

float value(vec2 p, float f) {
  vec2 i = floor(p * f);
  vec2 fr = fract(p * f);
  fr = (3. - 2. * fr) * fr * fr;
  float bl = hash(i + vec2(0., 0.));
  float br = hash(i + vec2(1., 0.));
  float tl = hash(i + vec2(0., 1.));
  float tr = hash(i + vec2(1., 1.));
  float b = mix(bl, br, fr.x);
  float t = mix(tl, tr, fr.x);
  return mix(b, t, fr.y);
}

vec4 background(vec3 worldRay) {
  vec2 uv = worldRay.xy; 
  // Spherical mapping for background
  uv.x = atan(worldRay.x, worldRay.z) / (2.0 * 3.1415926535) + 0.5;
  uv.y = asin(worldRay.y) / 3.1415926535 + 0.5;

  float brightness = pow(value(uv * 3., 100.), 256.) * 100.;
  float color = value(uv * 2., 20.);
  brightness = clamp(brightness, 0., 1.);

  vec3 stars = brightness * mix(vec3(1., .6, .2), vec3(.2, .6, 1.), color);
  vec4 nebulae = texture2D(nebulaTexture, uv * 1.5);
  nebulae.rgb += (nebulae.r + nebulae.g + nebulae.b);
  nebulae.rgb *= 0.25;
  nebulae *= nebulae * nebulae * nebulae * nebulae;
  nebulae.rgb += stars;
  return nebulae;
}

vec4 raymarchDisk(vec3 localRay, vec3 hitPosOnDiskPlane) { 
  vec3 position = hitPosOnDiskPlane; 
  float lengthPos = length(position.xz);
  float dist = min(1., lengthPos * (1. / _Size) * 0.5) * _Size * 0.4 * (1. / _Steps) / (max(abs(localRay.y), 0.0001));

  vec2 deltaPos;
  deltaPos.x = -hitPosOnDiskPlane.z * 0.01 + hitPosOnDiskPlane.x; 
  deltaPos.y = hitPosOnDiskPlane.x * 0.01 + hitPosOnDiskPlane.z;
  if (length(hitPosOnDiskPlane.xz) > 0.001) { 
    deltaPos = normalize(deltaPos - hitPosOnDiskPlane.xz);
  }

  float parallel = dot(localRay.xz, deltaPos);
  if (lengthPos > 0.001) parallel /= sqrt(lengthPos); 
  parallel *= 0.5;
  float redShift = parallel + 0.3;
  redShift *= redShift;
  redShift = clamp(redShift, 0., 1.);

  float disMix = clamp((lengthPos - _Size * 2.) * (1. / _Size) * 0.24, 0., 1.);
  vec3 insideCol = mix(vec3(1.0, 0.8, 0.0), vec3(0.5, 0.13, 0.02) * 0.2, disMix);
  insideCol *= mix(vec3(0.4, 0.2, 0.1), vec3(1.6, 2.4, 4.0), redShift);
  insideCol *= 1.25;
  redShift += 0.12;
  redShift *= redShift;

  vec4 o = vec4(0.);
  for (float i = 0.; i < _Steps; i++) {
      position = hitPosOnDiskPlane - (dist * (i + 0.5 - _Steps * 0.5)) * localRay; 
      
      float currentIntensity = clamp(1. - abs((i - _Steps * 0.5) * (1. / _Steps) * 2. - 1.), 0., 1.);
      float currentLengthPos = length(position.xz); 
      float distMult = 1.;
      distMult *= clamp((currentLengthPos - _Size * 0.75) * (1. / _Size) * 1.5, 0., 1.);
      distMult *= clamp((_Size * 10. - currentLengthPos) * (1. / _Size) * 0.20, 0., 1.);
      distMult *= distMult;

      float u = currentLengthPos + time * _Size * 0.3 + currentIntensity * _Size * 0.2;
      vec2 xy;
      float rot = mod(time * speed * _Speed, 8192.);
      xy.x = -position.z * sin(rot) + position.x * cos(rot);
      xy.y = position.x * sin(rot) + position.z * cos(rot);
      
      float x = 0.0;
      if (abs(xy.y) > 0.0001) x = abs(xy.x / (xy.y)); 
      
      float angle = 0.02 * atan(x);

      const float f = 70.;
      float noise = value(vec2(angle, u * (1. / _Size) * 0.05), f);
      noise = noise * 0.66 + 0.33 * value(vec2(angle, u * (1. / _Size) * 0.05), f * 2.);
      float extraWidth = noise * 1. * (1. - clamp(i * (1. / _Steps) * 2. - 1., 0., 1.));
      float alpha = clamp(noise * (currentIntensity + extraWidth) * ((1. / _Size) * 10. + 0.01) * dist * distMult, 0., 1.);

      vec3 colVal = 2. * mix(vec3(0.3, 0.2, 0.15) * insideCol, insideCol, min(1., currentIntensity * 2.));
      o = clamp(vec4(colVal * alpha + o.rgb * (1. - alpha), o.a * (1. - alpha) + alpha), vec4(0.), vec4(1.));
      currentLengthPos *= (1. / _Size);
      if (currentLengthPos > 0.001) { 
          o.rgb += redShift * (currentIntensity * 1. + 0.5) * (1. / _Steps) * 100. * distMult / (currentLengthPos * currentLengthPos);
      }
  }
  o.rgb = clamp(o.rgb - 0.005, 0., 1.);
  return o;
}

void main() {
  vec3 worldRay = normalize(vWorldPos - cameraPos);
  vec3 localCameraPos = (invModel * vec4(cameraPos, 1.0)).xyz;
  vec3 localRay = normalize((invModel * vec4(worldRay, 0.0)).xyz);
  
  vec3 currentPos = localCameraPos; 

  vec4 col = vec4(0.);
  vec4 glow = vec4(0.);
  vec4 finalColor = vec4(100.); 

  for (int stepCount = 0; stepCount < 20; stepCount++) { 
      for (int h = 0; h < 6; h++) {
          float dotpos = dot(currentPos, currentPos);
          float invDist = inversesqrt(dotpos);
          float centDist = dotpos * invDist;
          float stepDist = 0.92 * abs(currentPos.y / (max(abs(localRay.y), 0.0001)));
          float farLimit = centDist * 0.5;
          float closeLimit = centDist * 0.1 + 0.05 * centDist * centDist * (1. / _Size);
          stepDist = min(stepDist, min(farLimit, closeLimit));

          float invDistSqr = invDist * invDist;
          float bendForce = stepDist * invDistSqr * _Size * 0.625 * distortion;
          // Check for NaN/Inf in bendForce or currentPos
          if (isinf(bendForce) || isnan(bendForce) || any(isnan(currentPos)) || any(isinf(currentPos))) {
             // Skip bending if values are unstable
          } else {
            localRay = normalize(localRay - (bendForce * invDist) * currentPos);
          }
          currentPos += stepDist * localRay;
          glow += vec4(1.2, 1.1, 1, 1.0) * (0.01 * stepDist * invDistSqr * invDistSqr * clamp(centDist * 2. - 1.2, 0., 1.));
      }

      float distToOrigin = length(currentPos); 

      if (distToOrigin < _Size * 0.1) { 
          finalColor = vec4(col.rgb * col.a + glow.rgb * (1. - col.a), 1.);
          break;
      } else if (distToOrigin > _Size * 1000.) { 
          // Make background transparent instead of rendering built-in background
          finalColor = vec4(col.rgb * col.a + glow.rgb * (1. - col.a), col.a + glow.a);
          break;
      } else if (abs(currentPos.y) <= _Size * 0.002) { 
          vec4 diskCol = raymarchDisk(localRay, currentPos); 
          col = vec4(diskCol.rgb * (1. - col.a) + col.rgb, col.a + diskCol.a * (1. - col.a));
          
          float diskPassThroughDist = _Size * 0.003 / max(abs(localRay.y), 0.0001);
          currentPos += localRay * diskPassThroughDist;
      }
  }

  if (finalColor.r == 100.) { 
      finalColor = vec4(col.rgb + glow.rgb * (col.a + glow.a), 1.);
  }

  finalColor.rgb = pow(finalColor.rgb, vec3(0.6));
  finalColor.rgb *= intensity;
  
  gl_FragColor = finalColor;
}`;

class BlackHoleMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        time: { value: 0 },
        intensity: { value: 1.0 },
        speed: { value: 1.0 },
        distortion: { value: 1.0 },
        topColor: { value: new THREE.Color(1.0, 0.3, 0.1) },
        midColor1: { value: new THREE.Color(0.8, 0.2, 0.1) },
        midColor2: { value: new THREE.Color(0.4, 0.1, 0.05) },
        midColor3: { value: new THREE.Color(0.2, 0.05, 0.02) },
        bottomColor: { value: new THREE.Color(0.1, 0.02, 0.01) },
        resolution: { value: new THREE.Vector2(1, 1) },
        nebulaTexture: { value: null },
        cameraPos: { value: new THREE.Vector3() },
        invModel: { value: new THREE.Matrix4() },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  }
}

extend({ BlackHoleMaterial });

/**
 * Exotic renderer for black holes, pulsars, and other phenomena using shader projections.
 * Features: event horizons, gravitational lensing (simulated), accretion disks.
 */
export function ExoticRenderer({
  object,
  scale,
  starPosition = [0, 0, 0],
  position = [0, 0, 0],
  isSelected,
  shaderParams,
  onHover,
  onSelect,
  onFocus,
  registerRef,
}: GeometryRendererProps) {
  const exoticRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)
  const { camera, size } = useThree()

  const { properties } = object
  const radius = scale

  // Create procedural nebula texture
  const nebulaTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext("2d")!
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, 512, 512)
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
    gradient.addColorStop(0, "rgba(255, 100, 50, 0.8)")
    gradient.addColorStop(0.3, "rgba(100, 50, 255, 0.6)")
    gradient.addColorStop(0.6, "rgba(50, 100, 255, 0.4)")
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const s = Math.random() * 2 + 0.5;
      const a = Math.random() * 0.8;
      ctx.fillStyle = `rgba(255, 255, 255, ${a})`
      ctx.beginPath()
      ctx.arc(x, y, s, 0, Math.PI * 2)
      ctx.fill()
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
  }, [])

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.resolution.value.set(size.width, size.height)
      materialRef.current.uniforms.nebulaTexture.value = nebulaTexture
    }
  }, [size, nebulaTexture])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    if (materialRef.current && exoticRef.current) {
      materialRef.current.uniforms.time.value = time
      state.camera.getWorldPosition(materialRef.current.uniforms.cameraPos.value)
      materialRef.current.uniforms.invModel.value.copy(exoticRef.current.matrixWorld).invert()

      if (shaderParams) {
        const { intensity, speed, distortion, diskSpeed, lensingStrength, diskBrightness } = shaderParams

        if (intensity !== undefined) materialRef.current.uniforms.intensity.value = intensity
        if (speed !== undefined) materialRef.current.uniforms.speed.value = speed
        if (distortion !== undefined) materialRef.current.uniforms.distortion.value = distortion

        // Map new parameters to existing uniforms
        if (diskSpeed !== undefined) materialRef.current.uniforms.speed.value = diskSpeed
        if (lensingStrength !== undefined) materialRef.current.uniforms.distortion.value = lensingStrength
        if (diskBrightness !== undefined) materialRef.current.uniforms.intensity.value = diskBrightness
      }
    }
  })

  const handleClick = (event: any) => {
    event.stopPropagation()
    if (exoticRef.current && onSelect) {
      onSelect(object.id, exoticRef.current, object.name)
    }
  }

  // Register ref for external access
  React.useEffect(() => {
    if (exoticRef.current) {
      registerRef(object.id, exoticRef.current)
    }
  }, [object.id, registerRef])

  // For black holes, we can simulate an event horizon and accretion disk
  const isBlackHole = object.id === 'black-hole'

  return (
    <group ref={exoticRef} position={position}>
      {isBlackHole ? (
        // Black hole rendering with advanced shader
        <mesh 
          onClick={handleClick}
          onPointerEnter={() => onHover?.(object.id)}
          onPointerLeave={() => onHover?.(null)}
        >
          <sphereGeometry args={[radius * 3, 64, 32]} /> {/* Larger sphere for shader effects */}
          {/* @ts-ignore */}
          <blackHoleMaterial
            ref={materialRef}
            attach="material"
          />
        </mesh>
      ) : (
        // Generic exotic object placeholder (e.g., for pulsars or other phenomena)
        <mesh 
          onClick={handleClick}
          onPointerEnter={() => onHover?.(object.id)}
          onPointerLeave={() => onHover?.(null)}
        >
          <sphereGeometry args={[radius, 16, 16]} />
          <meshBasicMaterial color={properties.tint || "#8A2BE2"} wireframe={true} />
        </mesh>
      )}
    </group>
  )
}

// Exotic objects don't support rings naturally
;(ExoticRenderer as any).supportsRings = false 