"use client"

import { useEffect, useRef, useMemo } from "react"
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
const fragmentShader = `
#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D noiseTex; // For iChannel0 equivalent
uniform vec3 cameraPos;
uniform mat4 invModel;
uniform float modelScale; // To adjust internal scale of shader effects

// Protostar specific uniforms
uniform float nebulaDensityFactor; // Controls overall density (replaces col.a *= 0.185)
uniform float starBrightnessFactor; // Controls central star brightness (replaces /30.)
uniform float starHueFactor; // 0.0 (red) .. 0.16 (yellow) .. 0.66 (blue)
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
    // Sample from our noiseTex instead of iChannel0
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
   float finalVal = p.y + 4.5; // Renamed to avoid conflict with GLSL 'final'
    finalVal -= SpiralNoiseC(p.xyz);
    finalVal += SpiralNoiseC(p.zxy*0.5123+100.0)*4.0;
    finalVal -= SpiralNoise3D(p);
    return finalVal;
}

float map(vec3 p, float timeVal) {
	R(p.xz, timeVal * rotationSpeedFactor); // Use timeVal for rotation
	float nebNoise = abs(NebulaNoise(p / (0.5 * modelScale))) * (0.5 * modelScale); // Adjust noise scale with modelScale
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
    vec3 baseColor = mix(vec3(1.0,0.9,0.8), vec3(0.4,0.15,0.1), density);
    
    vec3 centerColor = 7.0 * hueToRgb(nebulaHueFactor + 0.05); // Slightly offset from star
    vec3 edgeColor = 1.5 * hueToRgb(nebulaHueFactor - 0.05);

    baseColor *= mix(centerColor, edgeColor, min((radius + (0.05 * modelScale)) / (0.9 * modelScale), 1.15));
	return baseColor;
}

// Simplified RaySphereIntersect - assuming mesh is a sphere centered at origin in local space
bool RaySphereIntersect(vec3 org, vec3 dir, float sphereRadius, out float near, out float far) {
	float b = dot(dir, org);
	float c = dot(org, org) - sphereRadius * sphereRadius; // Use dynamic sphereRadius
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
    vec3 rd = normalize((invModel * vec4(worldRay, 0.0)).xyz); // Ray direction in local space
    vec3 ro = localCameraPos; // Ray origin in local space

    // Dithering (optional, can be controlled by a uniform if needed)
    vec2 dpos = (gl_FragCoord.xy / resolution.xy);
	vec2 seed = dpos + fract(time);

	float ld=0., td=0., w=0.;
	float d_dist=1., t=0.; // d_dist for distance field, t for ray length
    
    float h_step = 0.1 * modelScale; // Step size scaled
   
	vec4 sum = vec4(0.0);
   
    float min_dist=0.0, max_dist=0.0;
    float sphereRadius = 2.9 * modelScale; // Match geometry, slightly smaller than black hole's 3.0 for visual difference

    // Use the vLocalPos to determine if we are inside the sphere geometry
    // This helps ensure we only raymarch if the camera ray hits the sphere.
    if (!RaySphereIntersect(ro, rd, sphereRadius, min_dist, max_dist)) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); // Outside sphere, fully transparent
        return;
    }
    
    t = max(0.0, min_dist); // Start raymarching from the intersection point or camera if inside

	for (int i=0; i<56; i++) {
		vec3 pos = ro + t*rd;
        if(td > 0.9 || d_dist < (0.01 * modelScale * t) || t > max_dist || sum.a > 0.99) break; // Adjusted break conditions
	    
        d_dist = map(pos, time);
		d_dist = max(d_dist, (0.08 * modelScale)); // Density control scaled
        
        vec3 ldst = vec3(0.0) - pos; // Light source at origin of local space
        float lDist = max(length(ldst), 0.001 * modelScale);

        vec3 lightColor = hueToRgb(starHueFactor); // Use hue for star color
        sum.rgb += (lightColor / (lDist*lDist) / starBrightnessFactor);
      
		if (d_dist < h_step) {
			ld = h_step - d_dist;
			w = (1. - td) * ld;
			td += w + 1./200.;
			vec4 col = vec4(computeColor(td,lDist), td);
			col.a *= nebulaDensityFactor; // Use uniform for density factor
			col.rgb *= col.a;
			sum = sum + col*(1.0 - sum.a);  
		}
		td += 1./70.;
        d_dist = max(d_dist, (0.04 * modelScale)); 
        d_dist = abs(d_dist)*(0.8+0.2*rand(seed*vec2(i))); // Dithering
		t += max(d_dist * 0.1 * max(min(length(ldst),length(ro)),1.0 * modelScale), (0.02*modelScale));
	}
    
	sum *= 1. / exp(ld * 0.2) * 0.6;
   	sum = clamp(sum, 0.0, 1.0);
    sum.xyz = sum.xyz*sum.xyz*(3.0-2.0*sum.xyz); // Filmic-like curve

    // Ensure final alpha is based on accumulated sum.a for transparency
    gl_FragColor = vec4(sum.xyz, sum.a);
}
`

interface ProtostarProps {
  scale: number
  density: number
  starBrightness: number
  starHue: number
  nebulaHue: number
  rotationSpeed: number
}

export function Protostar({ scale, density, starBrightness, starHue, nebulaHue, rotationSpeed }: ProtostarProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)
  const { camera, size } = useThree()

  const noiseTexture = useMemo(() => {
    const width = 256
    const height = 256
    const data = new Uint8Array(width * height * 4)
    for (let i = 0; i < width * height; i++) {
      const stride = i * 4
      data[stride] = Math.floor(Math.random() * 256) // R (used for noise.y)
      data[stride + 1] = Math.floor(Math.random() * 256) // G (used for noise.x)
      data[stride + 2] = 0 // B
      data[stride + 3] = 255 // A
    }
    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat)
    texture.needsUpdate = true
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
  }, [])

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(size.width, size.height) },
      noiseTex: { value: noiseTexture },
      cameraPos: { value: new THREE.Vector3() },
      invModel: { value: new THREE.Matrix4() },
      modelScale: { value: 1.0 }, // Will be updated based on mesh scale
      nebulaDensityFactor: { value: density },
      starBrightnessFactor: { value: starBrightness },
      starHueFactor: { value: starHue },
      nebulaHueFactor: { value: nebulaHue },
      rotationSpeedFactor: { value: rotationSpeed },
    }),
    [noiseTexture, size.width, size.height, density, starBrightness, starHue, nebulaHue, rotationSpeed],
  )

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.resolution.value.set(size.width, size.height)
    }
  }, [size])

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.nebulaDensityFactor.value = density
      materialRef.current.uniforms.starBrightnessFactor.value = starBrightness
      materialRef.current.uniforms.starHueFactor.value = starHue
      materialRef.current.uniforms.nebulaHueFactor.value = nebulaHue
      materialRef.current.uniforms.rotationSpeedFactor.value = rotationSpeed
    }
  }, [density, starBrightness, starHue, nebulaHue, rotationSpeed])

  useFrame((state) => {
    if (materialRef.current && meshRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
      state.camera.getWorldPosition(materialRef.current.uniforms.cameraPos.value)
      materialRef.current.uniforms.invModel.value.copy(meshRef.current.matrixWorld).invert()
      // Pass the object's scale to the shader to allow internal effects to scale appropriately
      materialRef.current.uniforms.modelScale.value = meshRef.current.scale.x
    }
  })

  return (
    <mesh ref={meshRef} scale={scale} depthWrite={false}>
      {/* Using a sphere geometry. The shader handles the volume. */}
      <sphereGeometry args={[3, 32, 16]} /> {/* Radius, widthSegments, heightSegments */}
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        side={THREE.DoubleSide} // Render both sides to catch rays entering from behind
      />
    </mesh>
  )
}
