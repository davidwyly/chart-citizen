"use client"

import { useEffect, useRef, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

// Vertex Shader (remains the same)
const vertexShader = `
varying vec2 vUv;
varying vec3 vWorldPos; // World-space position of the fragment

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}`

// Fragment Shader with proper transparency handling
const fragmentShader = `
#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D nebulaTexture;
uniform vec3 cameraPos;      // World-space camera position
uniform mat4 invModel;       // Inverse of the mesh's world matrix

varying vec2 vUv;
varying vec3 vWorldPos;      // World-space position of the fragment

#define _Speed 3.0
#define _Steps 12.
#define _Size 0.3 // Size of BH in local units

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
      
      float currentIntensity = clamp(1. - abs((i - _Steps * 0.5) * (1. / _Steps) * 2.), 0., 1.);
      float currentLengthPos = length(position.xz); 
      float distMult = 1.;
      distMult *= clamp((currentLengthPos - _Size * 0.75) * (1. / _Size) * 1.5, 0., 1.);
      distMult *= clamp((_Size * 10. - currentLengthPos) * (1. / _Size) * 0.20, 0., 1.);
      distMult *= distMult;

      float u = currentLengthPos + time * _Size * 0.3 + currentIntensity * _Size * 0.2;
      vec2 xy;
      float rot = mod(time * _Speed, 8192.);
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
          float bendForce = stepDist * invDistSqr * _Size * 0.625;
          
          // Check for NaN/Inf in bendForce or currentPos
          if (isinf(bendForce) || isnan(bendForce) || any(isnan(currentPos)) || any(isinf(currentPos)) || isinf(invDist) || isnan(centDist)) {
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
          // KEY CHANGE: Use accumulated alpha for transparency instead of forcing alpha = 1
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
  
  gl_FragColor = finalColor;
}`

interface BlackHoleProps {
  scale: number
}

export function BlackHole({ scale }: BlackHoleProps) {
  const blackHoleMeshRef = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)
  const { camera } = useThree()

  // Nebula texture (keeping for potential future use)
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
      const x = Math.random() * 512,
        y = Math.random() * 512,
        s = Math.random() * 2 + 0.5,
        a = Math.random() * 0.8
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

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      nebulaTexture: { value: nebulaTexture },
      cameraPos: { value: new THREE.Vector3() },
      invModel: { value: new THREE.Matrix4() },
    }),
    [nebulaTexture],
  )

  const { size } = useThree()
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.resolution.value.set(size.width, size.height)
    }
  }, [size])

  useFrame((state) => {
    if (materialRef.current && blackHoleMeshRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
      state.camera.getWorldPosition(materialRef.current.uniforms.cameraPos.value)
      materialRef.current.uniforms.invModel.value.copy(blackHoleMeshRef.current.matrixWorld).invert()
    }
  })

  return (
    <mesh ref={blackHoleMeshRef} scale={scale} depthWrite={false}>
      <sphereGeometry args={[3.25, 64, 32]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.DoubleSide}
        transparent={true}
      />
    </mesh>
  )
}
