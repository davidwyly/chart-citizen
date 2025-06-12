"use client"

import { useRef, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

// Vertex Shader (Standard pass-through)
const vertexShader = `
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vLocalPos; // Pass local position

void main() {
  vUv = uv;
  vLocalPos = position;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}`

// Fragment Shader (Adapted from "Dusty Nebula 4")
const fragmentShader = /* glsl */ `#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D noiseTex; // For iChannel0 equivalent
uniform vec3 cameraPos;
uniform mat4 invModel;
uniform float modelScale; // To adjust internal scale of shader effects

// Protostar specific uniforms
uniform float nebulaDensityFactor; 
uniform float starBrightnessFactor; 
uniform float starHueFactor; 
uniform float nebulaHueFactor;
uniform float rotationSpeedFactor;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vLocalPos;

#define pi 3.14159265
#define R(p, a) p=cos(a)*p+sin(a)*vec2(p.y, -p.x)

// iq's noise (adapted to use our noiseTex)
float noise(in vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f*f*(3.0-2.0*f);
  vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
  vec2 rg = textureLod( noiseTex, (uv + 0.5) / 256.0, 0.0 ).yx;
  return 1. - 0.82*mix( rg.x, rg.y, f.z );
}

float rand(vec2 co) {
  return fract(sin(dot(co*0.123,vec2(12.9898,78.233))) * 43758.5453);
}

// otaviogood's noise
const float nudge = 0.739513;
float normalizer = 1.0 / sqrt(1.0 + nudge*nudge);
float SpiralNoiseC(vec3 p) {
  float n = 0.0;
  float iter = 1.0;
  for (int i = 0; i < 8; i++) {
      n += -abs(sin(p.y*iter) + cos(p.x*iter)) / iter;
      p.xy += vec2(p.y, -p.x) * nudge;
      p.xy *= normalizer;
      p.xz += vec2(p.z, -p.x) * nudge;
      p.xz *= normalizer;
      iter *= 1.733733;
  }
  return n;
}

float SpiralNoise3D(vec3 p) {
  float n = 0.0;
  float iter = 1.0;
  for (int i = 0; i < 5; i++) {
      n += (sin(p.y*iter) + cos(p.x*iter)) / iter;
      p.xz += vec2(p.z, -p.x) * nudge;
      p.xz *= normalizer;
      iter *= 1.33733;
  }
  return n;
}

float NebulaNoise(vec3 p) {
 float finalVal = p.y + 4.5; 
  finalVal -= SpiralNoiseC(p.xyz);
  finalVal += SpiralNoiseC(p.zxy*0.5123+100.0)*4.0;
  finalVal -= SpiralNoise3D(p);
  return finalVal;
}

// This is the map function from the version that was "too ethereal"
float map(vec3 p, float timeVal) {
  R(p.xz, timeVal * rotationSpeedFactor);
  float nebNoise = abs(NebulaNoise(p / 0.5)) * (0.5 * modelScale); 
  return nebNoise + (0.03 * modelScale);
}

vec3 hueToRgb(float h) {
  h = fract(h);
  float r = abs(h * 6.0 - 3.0) - 1.0;
  float g = 2.0 - abs(h * 6.0 - 2.0);
  float b = 2.0 - abs(h * 6.0 - 4.0);
  return clamp(vec3(r,g,b), 0.0, 1.0);
}

vec3 computeColor(float density, float radius) {
  vec3 baseColor = mix(vec3(1.0,0.9,0.8), vec3(0.8,0.4,0.2), density);
  vec3 centerColor = 10.0 * hueToRgb(nebulaHueFactor + 0.05);
  vec3 edgeColor = 3.0 * hueToRgb(nebulaHueFactor - 0.05);
  baseColor *= mix(centerColor, edgeColor, min((radius + (0.05 * modelScale)) / (0.9 * modelScale), 1.15));
  return baseColor;
}

bool RaySphereIntersect(vec3 org, vec3 dir, float sphereRadius, out float near, out float far) {
  float b = dot(dir, org);
  float c = dot(org, org) - sphereRadius * sphereRadius;
  float delta = b*b - c;
  if( delta < 0.0) return false;
  float deltasqrt = sqrt(delta);
  near = -b - deltasqrt;
  far = -b + deltasqrt;
  return far > 0.0;
}

void main() {
  vec3 worldRay = normalize(vWorldPos - cameraPos);
  vec3 localCameraPos = (invModel * vec4(cameraPos, 1.0)).xyz;
  vec3 rd = normalize((invModel * vec4(worldRay, 0.0)).xyz);
  vec3 ro = localCameraPos;

  vec2 dpos = (gl_FragCoord.xy / resolution.xy);
  vec2 seed = dpos + fract(time);

  float ld=0., td=0., w=0.;
  float d_dist=1., t=0.;
  
  float h_step = 0.1 * modelScale; 
 
  vec4 sum = vec4(0.0);
 
  float min_dist=0.0, max_dist=0.0;
  float sphereRadius = 3.0; // Matches geometry

  if (!RaySphereIntersect(ro, rd, sphereRadius, min_dist, max_dist)) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
  }
  
  t = max(0.0, min_dist);

  // Using the loop count and conditions from the "too ethereal" version
  for (int i=0; i < 80; i++) { // Loop count from "too ethereal"
  	vec3 pos = ro + t*rd;
      // Conditions from "too ethereal"
      if(td > 0.95 || d_dist < (0.005 * modelScale * t) || t > max_dist || sum.a > 0.99) break;
      
      d_dist = map(pos, time);
      // d_dist minimum from "too ethereal"
      d_dist = max(d_dist, 0.08); 
      
      vec3 ldst = vec3(0.0) - pos;
      float lDist = max(length(ldst), 0.001 * modelScale);

      vec3 lightColor = hueToRgb(starHueFactor);
      // Star brightness from "too ethereal"
      sum.rgb += (lightColor / (lDist*lDist) * starBrightnessFactor * 0.1); 
    
  	if (d_dist < h_step) {
  		ld = h_step - d_dist;
  		w = (1. - td) * ld;
  		td += w + 1./200.; 
  		vec4 col = vec4(computeColor(td,lDist), td);
        // Density factor application from "too ethereal"
  		col.a *= nebulaDensityFactor * 3.0; 
        col.a = clamp(col.a, 0.0, 1.0); // Clamp alpha before use
  		col.rgb *= col.a;
  		sum = sum + col*(1.0 - sum.a);  
        
  	}
  	td += 1./70.; 
      // d_dist minimum from "too ethereal"
      d_dist = max(d_dist, 0.04); 
      d_dist = abs(d_dist)*(0.8+0.2*rand(seed*vec2(i)));
      
      // Raymarching step from "too ethereal"
  	  t += max(d_dist * 0.1 * max(min(length(ldst),length(ro)),1.0), 0.02);
  }
  
  sum *= 1. / exp(ld * 0.2) * 0.6; 
 	sum = clamp(sum, 0.0, 1.0);
  sum.xyz = sum.xyz*sum.xyz*(3.0-2.0*sum.xyz); 

  gl_FragColor = vec4(sum.xyz, sum.a);
}
`

interface ProtostarProps {
  scale?: number
  shaderScale?: number
  customizations?: {
    shader?: {
      intensity?: number
      speed?: number
      distortion?: number
      diskSpeed?: number
      lensingStrength?: number
      diskBrightness?: number
    }
  }
}

export function Protostar({
  scale = 1.0,
  shaderScale = 1.0,
  customizations = {}
}: ProtostarProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)
  const { camera, size } = useThree()

  // Extract shader parameters with defaults
  const shaderParams = customizations.shader || {}
  const density = shaderParams.intensity || 1.0
  const rotationSpeed = shaderParams.speed || 1.0
  const starBrightness = shaderParams.distortion || 1.0
  const starHue = shaderParams.diskSpeed || 0.1
  const nebulaHue = shaderParams.lensingStrength || 0.8
  const nebulaScale = shaderParams.diskBrightness || 1.0

  const noiseTexture = useMemo(() => {
    const width = 256
    const height = 256
    const data = new Uint8Array(width * height * 4)
    for (let i = 0; i < width * height; i++) {
      const stride = i * 4
      data[stride] = Math.floor(Math.random() * 256)
      data[stride + 1] = Math.floor(Math.random() * 256)
      data[stride + 2] = 0
      data[stride + 3] = 255
    }
    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat)
    texture.needsUpdate = true
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
  }, [])

  // Create uniforms only once
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(size.width, size.height) },
      noiseTex: { value: noiseTexture },
      cameraPos: { value: new THREE.Vector3() },
      invModel: { value: new THREE.Matrix4() },
      modelScale: { value: 1.0 },
      nebulaDensityFactor: { value: density },
      starBrightnessFactor: { value: starBrightness },
      starHueFactor: { value: starHue },
      nebulaHueFactor: { value: nebulaHue },
      rotationSpeedFactor: { value: rotationSpeed },
    }),
    [noiseTexture, size.width, size.height]
  )

  useFrame((state, delta) => {
    if (materialRef.current && meshRef.current) {
      // Update time and camera position every frame
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
      state.camera.getWorldPosition(materialRef.current.uniforms.cameraPos.value)
      materialRef.current.uniforms.invModel.value.copy(meshRef.current.matrixWorld).invert()
      materialRef.current.uniforms.modelScale.value = meshRef.current.scale.x * shaderScale

      // Update the shader parameters from customizations
      materialRef.current.uniforms.nebulaDensityFactor.value = density
      materialRef.current.uniforms.starBrightnessFactor.value = starBrightness
      materialRef.current.uniforms.starHueFactor.value = starHue
      materialRef.current.uniforms.nebulaHueFactor.value = nebulaHue
      materialRef.current.uniforms.rotationSpeedFactor.value = rotationSpeed

      // Update resolution if needed
      materialRef.current.uniforms.resolution.value.set(size.width, size.height)
    }
  })

  return (
    <mesh ref={meshRef} scale={scale}>
      <sphereGeometry args={[3, 32, 16]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
} 