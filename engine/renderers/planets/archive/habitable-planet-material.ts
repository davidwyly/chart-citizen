import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import type { EffectsLevel } from '@lib/types/effects-level'
import { height, randomPointOnUnitSphere } from './habitable-planet-utils'

export const HabitablePlanetMaterial = shaderMaterial(
  {
    time: 0.0,
    planetRadius: 1.0,
    landColor: new THREE.Color(0.05, 0.4, 0.05),
    seaColor: new THREE.Color(0.0, 0.18, 0.45),
    sandColor: new THREE.Color(0.9, 0.66, 0.3),
    snowColor: new THREE.Color(1.0, 1.0, 1.0),
    atmosphereColor: new THREE.Color(0.05, 0.8, 1.0),
    cloudColor: new THREE.Color(0.9, 0.95, 1.0),
    cityLightColor: new THREE.Color(1.0, 0.8, 0.3),
    lavaColor: new THREE.Color(1.0, 0.2, 0.0),
    lavaGlowColor: new THREE.Color(1.0, 0.6, 0.0),
    lavaHotColor: new THREE.Color(1.0, 0.9, 0.7),
    lightDirection: new THREE.Vector3(1.0, 0.0, 1.0),
    rotationSpeed: 0.2,
    terrainScale: 4.0,
    cloudScale: 1.5,
    humidity: 50.0,
    temperature: 50.0,
    population: 30.0,
    qualityLevel: 8,
    showClouds: true,
    showNightLights: true,
    volcanism: 0.0,
    showTopographicLines: false,
    waterLevel: 0.0
  },
  // Vertex Shader
  `
    // Uniforms: Variables passed from JavaScript to the shader, constant for all vertices in a draw call.
    uniform vec3 lightDirection; // Direction vector from the planet surface towards the light source (sun).

    // Varyings: Variables passed from the vertex shader to the fragment shader, interpolated across the triangle.
    varying vec3 vNormal;        // Normalized normal vector of the vertex, transformed to view space.
    varying vec3 vPosition;      // Position of the vertex in object space.
    varying vec2 vUv;            // UV coordinates for texture mapping (though not explicitly used for textures here, useful for surface parametrization).
    varying vec3 vWorldPosition; // Position of the vertex in world space.
    varying float vDiffuse;      // Diffuse lighting intensity calculated per-vertex.

    // Main function of the vertex shader. Executes for each vertex.
    void main() {
      // Transform the normal vector from object space to view space (used for lighting calculations).
      vNormal = normalize(normalMatrix * normal);
      
      // Pass the vertex position in object space to the fragment shader.
      vPosition = position;
      
      // Pass the UV coordinates to the fragment shader.
      vUv = uv;
      
      // Calculate and pass the world position of the vertex to the fragment shader.
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

      // Calculate diffuse lighting per-vertex:
      // 1. Transform the normal from object space to world space.
      // 2. Calculate the dot product between the world normal and the light direction.
      //    This gives a value between -1 (light opposite to normal) and 1 (light aligned with normal).
      // 3. Clamp the value to [0, 1] to ensure it's never negative (no light contribution from back side).
      vec3 worldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vDiffuse = clamp(dot(worldNormal, normalize(lightDirection)), 0.0, 1.0);

      // Final vertex position on the screen.
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    // Uniforms: Variables passed from JavaScript to the shader, constant for all fragments in a draw call.
    uniform float time;               // Current time, used for animations (e.g., cloud movement, planet rotation).
    uniform float planetRadius;       // The actual radius of the planet in world units.
    uniform vec3 landColor;           // Base color for land areas.
    uniform vec3 seaColor;            // Base color for ocean areas.
    uniform vec3 sandColor;           // Color for sandy regions.
    uniform vec3 snowColor;           // Color for snow/ice caps.
    uniform vec3 atmosphereColor;     // Base color of the atmosphere/sky glow.
    uniform vec3 cloudColor;          // Base color of the clouds.
    uniform vec3 cityLightColor;      // Color for city lights.
    uniform vec3 lavaColor;           // Color for lava.
    uniform vec3 lavaGlowColor;       // Color for lava glow.
    uniform vec3 lavaHotColor;        // Color for hottest lava.
    uniform vec3 lightDirection;      // Normalized direction vector from surface to light source.
    uniform float rotationSpeed;      // Speed of planet rotation (e.g., day/night cycle).
    uniform float terrainScale;       // Overall scale/frequency of terrain noise.
    uniform float cloudScale;         // Scale/frequency of cloud noise.
    uniform int qualityLevel;         // Integer representing rendering quality (e.g., affects noise iterations).
    uniform bool showClouds;          // Flag to enable/disable clouds.
    uniform bool showNightLights;     // Flag to enable/disable night lights.
    uniform float humidity;           // Habitability parameter (0-100), influences water coverage and biomes.
    uniform float temperature;        // Habitability parameter (0-100), influences ice caps and biomes.
    uniform float population;         // Habitability parameter (0-100), influences density of city lights.
    uniform float volcanism;          // Habitability parameter (0-100), influences mountain ranges and barren areas.
    uniform bool showTopographicLines; // Flag to enable/disable topographic debug lines.
    uniform float waterLevel;         // Pre-calculated water level, passed from CPU.

    // Varyings: Interpolated values from the vertex shader.
    varying vec3 vNormal;             // Interpolated normal vector.
    varying vec3 vPosition;           // Interpolated position in object space.
    varying vec2 vUv;                 // Interpolated UV coordinates.
    varying vec3 vWorldPosition;      // Interpolated world position.
    varying float vDiffuse;           // Interpolated diffuse lighting intensity.

    // Constants
    #define mod3_ vec3(.1031, .22369, .13787) // Constant for hash function (Perlin noise).
    #define PI 3.14159265359                  // Pi constant.

    // Helper function for Perlin noise: Pseudo-random hash function for 3D input.
    // Generates a reproducible pseudo-random 3D vector based on input position.
    vec3 hash3_3(vec3 p) {
      p = fract(p * mod3_);
      p += dot(p, p.yxz + 120.0); // Mix components and add a large constant for better distribution.
      vec3 r = fract(vec3((p.x+p.y)*p.z, (p.x+p.z)*p.y, (p.y+p.z)*p.x)); // Further scramble components.
      return normalize(-1. + 2. * r); // Scale to -1 to 1 and normalize.
    }

    // Perlin noise function (classic Perlin noise, 3D input).
    // Generates smooth, continuous noise values based on input coordinates.
    float perlin_noise3(vec3 P) {
      vec3 Pi = floor(P); // Integer part of the input.
      vec3 Pf = P - Pi;   // Fractional part of the input.
      vec3 Pf3 = Pf*Pf*Pf; // Pf cubed, used for smoothing interpolation curves.
      vec3 Pf4 = Pf3*Pf;   // Pf to the power of 4.
      vec3 Pf5 = Pf4*Pf;   // Pf to the power of 5.
      // 6*Pf5 - 15*Pf4 + 10*Pf3 is a 5th-degree polynomial that interpolates from 0 to 1 with 0 derivatives at 0 and 1.
      vec3 w = 6.*Pf5 - 15.*Pf4 + 10.*Pf3; 

      // Calculate dot products between gradient vectors (from hash3_3) and vectors from corners to Pf.
      float n000 = dot(Pf-vec3(0,0,0), hash3_3(Pi+vec3(0,0,0)));
      float n100 = dot(Pf-vec3(1,0,0), hash3_3(Pi+vec3(1,0,0)));
      float n010 = dot(Pf-vec3(0,1,0), hash3_3(Pi+vec3(0,1,0)));
      float n110 = dot(Pf-vec3(1,1,0), hash3_3(Pi+vec3(1,1,0)));
      float n001 = dot(Pf-vec3(0,0,1), hash3_3(Pi+vec3(0,0,1)));
      float n101 = dot(Pf-vec3(1,0,1), hash3_3(Pi+vec3(1,0,1)));
      float n011 = dot(Pf-vec3(0,1,1), hash3_3(Pi+vec3(0,1,1)));
      float n111 = dot(Pf-vec3(1,1,1), hash3_3(Pi+vec3(1,1,1)));
      
      // Interpolate along X, then Y, then Z.
      float nx00 = mix(n000, n100, w.x);
      float nx01 = mix(n001, n101, w.x);
      float nx10 = mix(n010, n110, w.x);
      float nx11 = mix(n011, n111, w.x);
      float nxy0 = mix(nx00, nx10, w.y);
      float nxy1 = mix(nx01, nx11, w.y);
      return mix(nxy0, nxy1, w.z); // Final interpolated noise value.
    }

    // Converts a 3D Cartesian point (on a sphere) to 2D spherical UV coordinates.
    // X and Y are mapped to longitude and latitude respectively.
    vec2 pos3t2(vec3 p) {
      float r = length(p); // Distance from origin (sphere radius).
      float Y = acos(p.y/r)/PI; // Latitude (0 at north pole, 1 at south pole).
      float X = atan(-p.z/r, p.x/r)/(PI*2.0); // Longitude (normalized to 0-1 range).
      return vec2(X,Y);
    }

    // Converts 2D spherical UV coordinates back to a 3D Cartesian point on a unit sphere.
    vec3 pos2t3(vec2 uv) {
      float x = sin(uv.y*PI)*cos(uv.x*PI*2.0); // X coordinate on sphere.
      float y = cos(uv.y*PI);                 // Y coordinate on sphere.
      float z = -sin(uv.y*PI)*sin(uv.x*PI*2.0); // Z coordinate on sphere.
      return vec3(x,y,z);
    }

    // Generates a spiral distortion for UV coordinates, used to create storm patterns.
    vec2 Spiral(vec2 uv) {
      float reps = 2.0;
      vec2 uv2 = fract(uv * reps); // Repeat UVs to create tiling.
      vec2 center = floor(fract(uv * reps)) + 0.5; // Center of each tile.
      vec2 delta = uv2 - center; // Vector from center to current UV.
      float dist = length(delta); // Distance from center.
      float blend = max(abs(delta.x), abs(delta.y)) * 2.0; // Blend factor based on distance from center.
      blend = clamp((0.5 - dist) * 2.0, 0.0, 1.0); // Invert and clamp blend.
      blend = pow(blend, 1.5); // Power for softer falloff.
      vec2 offset = vec2(delta.y, -delta.x); // Perpendicular offset for spiral.
      offset *= clamp(blend, 0.0, 1.0); // Apply blend to offset.
      return uv + offset * vec2(1.0, 1.0) * 1.1 + vec2(time * -0.03, 0.0); // Add offset and time-based movement.
    }

    // Generates cloud patterns based on Perlin noise, humidity, and temperature.
    float cloud(vec3 p) {
      // If clouds are disabled or habitability parameters are too low, return no clouds.
      if (!showClouds || humidity < 1.0 || temperature < 1.0) return 0.0; 
      
      float humidityFactor = humidity / 100.0;     // Normalize humidity to 0-1.
      float temperatureFactor = temperature / 100.0; // Normalize temperature to 0-1.
      
      // Rotate clouds for dynamic movement over time.
      vec3 t = p;
      p.x = t.x * cos(time * 0.01) - t.z * sin(time * 0.01);
      p.z = t.x * sin(time * 0.01) + t.z * cos(time * 0.01);
      
      vec2 uv = pos3t2(p); // Convert 3D point to 2D UV for spiral distortion.
      
      // Apply spiral logic for storm patterns, combining multiple spiral layers.
      vec2 spiralUV = Spiral(uv * 2.0) + Spiral(uv * 3.0);
      vec3 cp = pos2t3(spiralUV + vec2(time * -0.03, 0.0)); // Convert back to 3D point with time offset.
      
      // Multi-scale cloud noise: Combine several octaves of Perlin noise for detail.
      float c = perlin_noise3(cp * vec3(8.0, 16.0, 8.0));
      c += perlin_noise3(cp * vec3(4.0, 8.0, 4.0)) * 2.0;
      c += perlin_noise3(cp * vec3(1.0, 2.0, 1.0)) * 3.0;
      c += perlin_noise3(cp * vec3(32.0, 64.0, 32.0));
      c += perlin_noise3(cp * vec3(64.0, 128.0, 64.0)) * 0.5;  // Existing from previous, ensure it's applied
      c -= perlin_noise3(cp * vec3(64.0, 128.0, 64.0)) * 0.3;  // Adjust subtraction for sharper contrast
      c -= perlin_noise3(p * 1.5); // Subtract lower frequency noise for "holes"
      c -= perlin_noise3(p * 5.0); // Subtract higher frequency noise for smaller holes
      
      // If humidity is very high, create global storm coverage.
      if (humidityFactor > 0.8) {
        // Enhanced storm patterns with spiral distortion.
        float stormIntensity = (humidityFactor - 0.8) * 5.0; // Increase intensity with humidity.
        
        // Add more spiral-based storm cells for varied storm shapes.
        vec2 stormUV1 = Spiral(uv * 4.0 + time * 0.02);
        vec2 stormUV2 = Spiral(uv * 6.0 - time * 0.015);
        float storm1 = perlin_noise3(pos2t3(stormUV1) * 16.0) * 2.0;
        float storm2 = perlin_noise3(pos2t3(stormUV2) * 12.0) * 1.5;
        
        c += (storm1 + storm2) * stormIntensity; // Add storm noise to main cloud noise.
        
        // Global coverage - reduce latitude variation for more uniform storms.
        float s = abs((abs(p.y) - 0.5) * 0.5); // Latitude-based thinning towards poles.
        c += s + stormIntensity * 0.5; // Add to overall cloud cover.
      } else {
        // Normal latitude-based cloud distribution (thinner at poles).
        float s = abs((abs(p.y) - 0.5) * 2.0);
        c += s;
      }
      
      // Scale cloud coverage by combined humidity and temperature factors.
      // Max coverage when both are high, approaches zero if either is very low.
      c *= pow(humidityFactor, 1.2) * pow(temperatureFactor, 1.5);
      
      return max(c, 0.0); // Ensure cloud value is non-negative.
    }

    // Signed distance function for a sphere.
    // Returns distance from point p to surface of sphere with radius r.
    float sdSphere(vec3 p,float r){return length(p)-r;}

    // Generates a "weird" sphere, mixing a standard sphere with Perlin noise.
    // Used as a base for procedural terrain.
    float sdWeirdSphere(vec3 p,float f){return mix(sdSphere(p,1.0),perlin_noise3(p*f)/(f*0.8),0.95);}

    // Generates mountain ranges with varying complexity and distribution based on volcanism.
    float mountainRanges(vec3 p){
      float vf=volcanism/100.0; // Normalize volcanism to 0-1.
      
      // Base natural variation - ensures some terrain features even at 0% volcanism.
      float baseVariation = 0.3; 
      
      // Tectonic plate-based distribution for high volcanism, creating realistic mountain chains.
      vec3 plateNoise = vec3(
        perlin_noise3(p * 0.5),  // Large-scale tectonic boundaries.
        perlin_noise3(p * 0.3),  // Continental separation.
        perlin_noise3(p * 0.7)   // Local plate boundaries.
      );
      float tectonicFactor = max(max(plateNoise.x, plateNoise.y), plateNoise.z); // Max of noises defines plate boundaries.
      tectonicFactor = pow(max(0.0, tectonicFactor), 2.0); // Sharpen boundaries for more distinct ranges.
      
      float ds=2.0+vf*10.0; // Density scale for detail noise, increases with volcanism.
      float bs=0.25+vf*0.75; // Base scale for mountain shape, increases with volcanism.
      float ms=1.0+vf*6.0;   // Micro scale for fine details, increases with volcanism.
      float dm=min(perlin_noise3(p*ds),0.35)*4.0; // Detail mask, limits distribution of small features.
      float l=pow(max(0.0,perlin_noise3(p*bs)-0.15),0.4)*1.5; // Base mountain shape.
      float l2=l*perlin_noise3(p*0.0078125)*8.0; // Large-scale mountain groups/super-ranges.
      l*=dm;l2=max(0.0,l2); // Apply detail mask and ensure non-negative.
      l-=perlin_noise3(p*ms)*0.4; l=max(0.0,l); // Subtract micro-noise for valleys and crevices.
      float mh=(l+l2)*0.7; // Combine mountain layers.
      mh*=(dm+2.0)*0.333; // Scale by detail mask for varied intensity.
      
      // Macro detail: Large-scale, subtle undulations across the terrain.
      float macro = perlin_noise3(p * 0.05) * 0.2; 
      
      // Micro detail: Fine-grained surface roughness and small rocks.
      float micro = perlin_noise3(p * 64.0) * 0.02; 
      micro += perlin_noise3(p * 128.0) * 0.01; 
      
      // Combine macro and micro with existing mountain ranges.
      mh += macro;
      mh += micro;

      // Scale by volcanism, but maintain base variation.
      mh *= (baseVariation + vf * (1.0 - baseVariation));
      
      // At high volcanism, concentrate extreme features along tectonic boundaries.
      if(vf > 0.5) {
        mh = mix(mh * 0.5, mh * (1.0 + vf * 8.0), tectonicFactor);
      }
      
      mh *= (1.0 + vf * 5.0); // Overall intensity boost with volcanism.
      return mh;
    }

    // Calculates the height of the terrain at a given 3D point.
    // Combines multiple octaves of weird sphere noise and mountain ranges for complex terrain.
    float height(vec3 p){
      float sc=terrainScale; // Scale for terrain noise frequencies.
      float h=sdWeirdSphere(p,128.0*sc); // Lowest frequency, largest features.
      h+=sdWeirdSphere(p,64.0*sc);
      h+=sdWeirdSphere(p,16.0*sc);
      h+=sdWeirdSphere(p,8.0*sc);
      h+=sdWeirdSphere(p,5.0*sc);
      h+=sdWeirdSphere(p,3.0*sc);
      h+=sdWeirdSphere(p,1.5*sc); // Highest frequency, smallest features.
      h += sdWeirdSphere(p, 0.75 * sc) * 0.7;  // Increase multiplier for finer details
      h += perlin_noise3(p * 2.0 * sc) * 2.0;  // Existing, slightly amplify

      // Add general topographic variation (broad hills and valleys, finer undulations, small roughness).
      h += perlin_noise3(p * 2.0 * sc) * 2.0; 
      h += perlin_noise3(p * 8.0 * sc) * 0.5; 
      h += perlin_noise3(p * 32.0 * sc) * 0.1; 

      float mr=mountainRanges(p); // Add mountain range features.
      h+=mr*1.2; // Intensify mountain contribution.
      return h;
    }

    // Adjusts temperature and humidity based on elevation and latitude for more realistic biomes.
    vec2 getElevationAdjustedClimate(vec3 p, float elevation) {
      float baseTemperature = temperature + perlin_noise3(p * 15.0) * 25.0;  // Increased noise scale and amplitude for more variation
      float adjustedTemp = baseTemperature - (elevation * 0.1 * 6.5) - pow(abs(p.y), 1.5) * 50.0;
      
      float latitude = abs(p.y);  // 0 at equator, 1 at poles
      float latitudinalTempReduction = pow(latitude, 1.5) * 50.0;  // Non-linear amplification for colder poles and warmer equator
      adjustedTemp -= latitudinalTempReduction;  // Apply the enhanced reduction
      
      float baseHumidity = humidity + perlin_noise3(p * 12.0) * 20.0;  // Added another noise layer for humidity variation
      float humidityAdjustment = 0.0;
      
      // Check for proximity to water
      vec3 eastPoint = p + vec3(0.1, 0.0, 0.0);
      float eastHeight = height(eastPoint);
      if (eastHeight < waterLevel) {
        humidityAdjustment += 10.0;
      }
      
      // Check for high areas
      float localHeight = height(p);
      vec3 westPoint = p - vec3(0.1, 0.0, 0.0);
      vec3 eastPointHigh = p + vec3(0.1, 0.0, 0.0);
      float westHeight = height(westPoint);
      float eastHeightHigh = height(eastPointHigh);
      
      if (westHeight > localHeight + 5.0) {
        humidityAdjustment += 15.0;
      }
      if (eastHeightHigh > localHeight + 5.0) {
        humidityAdjustment -= 15.0;
      }
      
      float adjustedHumidity = clamp(baseHumidity + humidityAdjustment + (elevation * 0.1 * 3.0 * 0.5), 0.0, 100.0);
      adjustedTemp = clamp(adjustedTemp, 0.0, 100.0);
      adjustedHumidity = clamp(adjustedHumidity, 0.0, 100.0);
      return vec2(adjustedTemp, adjustedHumidity);
    }

    // Placeholder for terrain properties (not fully utilized in this shader).
    vec2 terrain(vec3 p,float h){
      float t=max(0.0,h*1.0); // Simple terrain "thickness" based on height.
      float d=max(0.0,h*1.5); // Simple terrain "density" based on height.
      return vec2(t,d);
    }

    // Determines a discrete biome color based on adjusted temperature and humidity.
    // This is a simplified biome lookup table.
    vec3 getDiscreteBiomeColor(float T,float H){
      // Quantize temperature and humidity into 5 levels (0-4).
      int t=T<20.0?0:T<40.0?1:T<60.0?2:T<80.0?3:4;
      int h=H<20.0?0:H<40.0?1:H<60.0?2:H<80.0?3:4;
      // Each if-statement represents a specific biome with its corresponding color.
      if(t==4&&h==4)return vec3(0.5,0.2,0.1);//Barren Swamp
      if(t==4&&h==3)return vec3(0.2,0.05,0.05);//Volcanic Plains
      if(t==4&&h==2)return vec3(0.8,0.7,0.3);//Eroded Plateau
      if(t==4&&h==1)return vec3(0.8,0.3,0.1);//Red Rock Desert
      if(t==4&&h==0)return vec3(0.5,0.5,0.5);//Desolate Wasteland
      if(t==3&&h==4)return vec3(0.0,0.3,0.0);//Tropical Swamp
      if(t==3&&h==3)return vec3(0.0,0.4,0.0);//Dense Jungle
      if(t==3&&h==2)return vec3(0.1,0.6,0.1);//Temperate Forest
      if(t==3&&h==1)return vec3(0.6,0.4,0.2);//Desert
      if(t==3&&h==0)return vec3(0.9,0.8,0.5);//Dry Savannah
      if(t==2&&h==4)return vec3(0.0,0.5,0.0);//Rainforest
      if(t==2&&h==3)return vec3(0.2,0.6,0.2);//Mixed Forest
      if(t==2&&h==2)return vec3(0.6,0.8,0.2);//Grassland
      if(t==2&&h==1)return vec3(0.7,0.6,0.4);//Steppe
      if(t==2&&h==0)return vec3(0.85,0.8,0.65);//Dry Plains
      if(t==1&&h==4)return vec3(0.9,0.95,1.0);//Glacial Ice
      if(t==1&&h==3)return vec3(1.0,1.0,1.0);//Snowfields
      if(t==1&&h==2)return vec3(0.8,0.8,0.8);//Tundra
      if(t==1&&h==1)return	vec3(0.8,0.6,0.5);//Cold Desert
      return vec3(0.9,0.9,0.9);//Polar Wastes (default/fallback)
    }

    // Generates topographic contour lines for debugging or visual effect.
    float getTopographicLines(float h) {
      if (!showTopographicLines) return 0.0; // If disabled, return no lines.
      
      // Create regular contour lines at fixed height intervals.
      float contourInterval = 3.0; // Height units between contour lines.
      // Offset to center around typical terrain range for better visibility.
      float contourPosition = mod(h + 25.0, contourInterval); 
      
      // Create sharper contour lines using smoothstep for anti-aliasing.
      float lineWidth = 0.3; // Thickness of the lines.
      // 1.0 when at the center of the line, smoothly falls to 0.0 at edges.
      float contourLine = 1.0 - smoothstep(0.0, lineWidth, abs(contourPosition - contourInterval * 0.5));
      
      // Add major contour lines (thicker/darker) at larger intervals.
      float majorInterval = 15.0;
      float majorPosition = mod(h + 25.0, majorInterval);
      float majorLineWidth = 0.6;
      float majorLine = 1.0 - smoothstep(0.0, majorLineWidth, abs(majorPosition - majorInterval * 0.5));
      
      // Combine regular and major contour lines, with major lines being stronger.
      return max(contourLine * 0.7, majorLine * 1.0);
    }

    // Determines the final land color including biomes, mountains, and snow.
    vec3 color(vec3 p, vec2 th, float h) {
      vec2 climate = getElevationAdjustedClimate(p, h);
      float adjustedTemp = climate.x;
      float adjustedHumidity = climate.y;
      
      float biomeNoise = perlin_noise3(p * 15.0) * 0.5 + perlin_noise3(p * 30.0) * 0.25;  // Added extra octave for noisier blending
      float perturbedTemp = adjustedTemp + biomeNoise;
      float perturbedHumidity = adjustedHumidity + biomeNoise * 0.5;
      perturbedTemp = clamp(perturbedTemp, 0.0, 100.0);
      perturbedHumidity = clamp(perturbedHumidity, 0.0, 100.0);
      
      int tLow = int(floor(perturbedTemp / 20.0));
      int tHigh = min(tLow + 1, 4);
      int hLow = int(floor(perturbedHumidity / 20.0));
      int hHigh = min(hLow + 1, 4);
      
      vec3 colorLow = getDiscreteBiomeColor(float(tLow) * 20.0 + 10.0, float(hLow) * 20.0 + 10.0);
      vec3 colorHighT = getDiscreteBiomeColor(float(tHigh) * 20.0 + 10.0, float(hLow) * 20.0 + 10.0);
      vec3 colorHighH = getDiscreteBiomeColor(float(tLow) * 20.0 + 10.0, float(hHigh) * 20.0 + 10.0);
      
      float tFrac = fract(perturbedTemp / 20.0);
      float hFrac = fract(perturbedHumidity / 20.0);
      
      vec3 interpolatedColor = mix(colorLow, mix(colorHighT, colorHighH, hFrac), tFrac);
      
      vec3 base = (h >= waterLevel) ? interpolatedColor : getDiscreteBiomeColor(adjustedTemp, adjustedHumidity);
      float mh=mountainRanges(p); // Get mountain height/intensity.
      float sl=0.3+(adjustedTemp/100.0*0.5); // Snow line threshold, varies with temperature.
      float ms=smoothstep(sl,sl+0.2,mh); // Smooth transition for snow based on mountain height and snow line.
      vec3 rock=vec3(0.4,0.35,0.3); // Color for exposed rock.
      vec3 mid= mix(base,rock,0.5); // Mid-tone color between base biome and rock.
      vec3 peak=rock*1.2; // Brighter color for mountain peaks.
      
      // Mix base color with mid and peak colors based on mountain height.
      vec3 lc=mix(base,mid,smoothstep(0.0,0.4,mh));
      lc=mix(lc,peak,smoothstep(0.4,0.9,mh));
      lc=mix(lc,snowColor,ms);  // Removed * 1.1 to stop snow glowing
      
      // Add topographic lines for debug visualization if enabled.
      float topoLines = getTopographicLines(h);
      lc = mix(lc, vec3(0.0, 0.0, 0.0), topoLines); // Blend black contour lines.
      
      return lc;
    }

    // Calculates the intensity of night lights based on population, habitability, and network patterns.
    float nightLight(vec3 p, float h, vec2 th){
      // If night lights are disabled or population is zero, return no lights.
      if(!showNightLights||population<1.0) return 0.0;
      if(h < waterLevel + 0.05) return 0.0; // No lights underwater (slight buffer above water).
      
      // Get climate conditions for this location to influence population distribution.
      vec2 climate = getElevationAdjustedClimate(p, h);
      float localTemp = climate.x;
      float localHumidity = climate.y;
      
      // Population suitability factors:
      // Best at moderate temperatures (around 50).
      float tempSuitability = 1.0 - abs(localTemp - 50.0) / 50.0; 
      tempSuitability = clamp(tempSuitability, 0.0, 1.0);
      
      // Prefer lower elevations.
      float elevationSuitability = 1.0 - clamp(max(0.0, h) / 10.0, 0.0, 1.0); 
      
      // Proximity to water (but not in water itself).
      float distanceToWater = abs(h - waterLevel);
      float waterProximity = 1.0 - clamp(distanceToWater / 2.0, 0.0, 1.0); 
      if(h < waterLevel) waterProximity = 0.0; // Explicitly no lights in water.
      
      // Combine all suitability factors.
      float habitability = tempSuitability * elevationSuitability * waterProximity;
      habitability = clamp(habitability, 0.0, 1.0);
      
      float popFactor = population / 100.0; // Normalize population (0-1).
      
      // Create city-like network patterns using multiple scales of noise and smoothstep for linear features.
      float cityNetwork = 0.0;
      
      // Major highways/transport networks (low frequency, high amplitude, distinct lines).
      float highways = perlin_noise3(p * 1.5) * 0.8;
      highways = smoothstep(0.3, 0.7, abs(highways)); 
      
      // Secondary roads (medium frequency, slightly less distinct).
      float roads = perlin_noise3(p * 4.0) * 0.6;
      roads = smoothstep(0.2, 0.6, abs(roads));
      
      // Local streets and neighborhoods (high frequency, subtle patterns).
      float streets = perlin_noise3(p * 12.0) * 0.4;
      streets = smoothstep(0.1, 0.4, abs(streets));
      
      // Urban centers (concentrated bright spots, lower frequency).
      float centers = perlin_noise3(p * 0.8) * 0.9;
      centers = smoothstep(0.6, 0.9, abs(centers));
      centers *= 2.0; // Make centers brighter.
      
      // Combine all network elements, taking the maximum to ensure all features are visible.
      cityNetwork = max(highways, max(roads, max(streets, centers)));
      
      // Add some randomness to break up perfect patterns and make it more organic.
      float randomness = perlin_noise3(p * 20.0) * 0.3;
      cityNetwork = mix(cityNetwork, randomness, 0.2);
      
      // After calculating cityNetwork
      cityNetwork = step(0.95, cityNetwork);  // Threshold to create pinpricks of light
      cityNetwork *= popFactor * habitability;  // Keep other factors but ensure binary output
      return clamp(cityNetwork, 0.0, 1.0);  // Ensure final value is binary-like
    }

    vec3 getLavaColor(vec3 p, float temp, float volc) {
      if (volc < 1.0 || temp < 70.0) return vec3(0.0);
      float volcFactor = volc / 100.0;
      float tempFactor = clamp((temp - 70.0) / 30.0, 0.0, 1.0);
      float lavaNoise = perlin_noise3(p * 5.0) * 0.5 + perlin_noise3(p * 15.0) * 0.3 + perlin_noise3(p * 30.0) * 0.2;
      float flowDistortion = perlin_noise3(p * 2.0) * 0.1;
      float flowNoise = perlin_noise3((p + flowDistortion) * 8.0) * 0.4;
      float lavaMask = clamp(lavaNoise + flowNoise + volcFactor * 0.8 + tempFactor * 0.5 - 0.5, 0.0, 1.0);
      float cracks = smoothstep(0.4, 0.5, perlin_noise3(p * 50.0));
      lavaMask = max(lavaMask, cracks * volcFactor * 0.5);
      float elevation = height(p);  // Ensure this is called correctly as a GLSL function
      float elevationFactor = 1.0 - smoothstep(-0.5, 5.0, elevation);
      lavaMask *= elevationFactor;
      float flowIntensity = perlin_noise3(p * 10.0 + time * 0.5) * 0.5 + 0.5;
      lavaMask *= flowIntensity;
      // Borrowed mixing idea: Emulate dynamic blending similar to the reference shader
      vec3 baseLava = mix(lavaColor, mix(lavaGlowColor, lavaHotColor, smoothstep(0.7, 1.0, lavaMask)), clamp(lavaMask, 0.0, 1.0));
      baseLava *= clamp(lavaMask * 2.0, 0.0, 1.0);  // Intensify based on mask
      return baseLava;
    }

    // Main function to combine all planet features (terrain, water, clouds, lights, atmosphere).
    vec3 earth(vec2 uv){
      // Normalize world position to get a point on the unit sphere for calculations.
      vec3 sp=normalize(vWorldPosition);
      // Calculate distance from sphere surface (positive inside, negative outside).
      // Crucial for atmospheric effects.
      // distFromSphere=length(vWorldPosition)-planetRadius; // REMOVED: This was causing transparency issues.
      
      // Rotate the point based on time and planet rotation speed to simulate planet rotation.
      vec3 rp=sp;
      rp.x=sp.x*cos(time*-rotationSpeed)-sp.z*sin(time*-rotationSpeed);
      rp.z=sp.x*sin(time*-rotationSpeed)+sp.z*cos(time*-rotationSpeed);
      
      float lt = vDiffuse; // Diffuse lighting from vertex shader.
      float ht=height(rp); // Calculate terrain height at this point.
      bool isUnderwater = ht < waterLevel; // Check if the point is underwater.
      
      vec2 th=vec2(0.0); // Placeholder for terrain properties.
      vec3 col=color(rp,terrain(rp,ht),ht); // Get base land color.
      
      // Combine directional lighting with a small amount of ambient skylight.
      const float AMBIENT = 0.07; // 7% ambient skylight.
      col *= lt;  // Remove ambient addition, use only diffuse lighting
      
      // Add lava
      vec2 climate = getElevationAdjustedClimate(rp, ht);  // Ensure this is called before getLavaColor
      float adjustedTemp = climate.x;  // Extract adjustedTemp here if not already
      float adjustedHumidity = climate.y;
      vec3 lava = getLavaColor(rp, adjustedTemp, volcanism);  // Now use the defined adjustedTemp
      // Blend the existing color with lava, but only where lava is present.
      // Use the overall intensity of the lava color to determine the blending factor.
      col = mix(col, lava, clamp(length(lava), 0.0, 1.0));
      
      // Add specular highlights and proper water shading for water bodies.
      if(isUnderwater){
        vec2 climate = getElevationAdjustedClimate(rp, ht);
        float adjustedTemp = climate.x;
        float freezeThreshold = 20.0;
        
        vec3 litSeaColor = seaColor * (lt + AMBIENT);
        vec3 iceColor = snowColor;  // Use snow color for ice
        
        // Add darkening near shorelines
        float shorelineDarkening = 1.0 - 0.5 * smoothstep(waterLevel - 0.05, waterLevel, ht);  // Darker as ht approaches waterLevel from below
        vec3 adjustedSeaColor = litSeaColor * shorelineDarkening;  // Apply darkening factor
        
        vec3 finalWaterColor = (adjustedTemp < freezeThreshold) ? iceColor : adjustedSeaColor;
        float waterDepth = 1.0 - smoothstep(waterLevel - 0.1, waterLevel + 0.05, ht);
        col = mix(col, finalWaterColor, waterDepth);
        
        // Add topographic lines for underwater terrain (in blue) if enabled.
        if(showTopographicLines) {
          float topoLines = getTopographicLines(ht);
          col = mix(col, vec3(0.0, 0.0, 0.8), topoLines * 0.6); // Blue contour lines underwater.
        }
      }
      
      float nl=0.0;
      nl=nightLight(rp,ht,terrain(rp,ht)); // Calculate night light intensity.
      // Night lights should be visible only on the night side, fading out during the day.
      col+=cityLightColor*clamp(nl*(1.0-lt),0.0,1.0); // Add city lights, clamped and inversely proportional to diffuse light.
      
      // Apply clouds if not in debug mode (showTopographicLines implies debug mode).
      if(!showTopographicLines) {
        float c=cloud(rp)/2.0; // Get cloud density.
        // Clouds should be affected by day/night cycle.
        // Apply lighting to clouds with some ambient light to keep them visible even in shadow.
        const float CLOUD_AMBIENT = 0.0;  // Set to 0 to remove ambient light from clouds
        vec3 cc = cloudColor * lt;  // Updated to use only diffuse lighting, removing CLOUD_AMBIENT
        col=mix(col,cc,c); // Mix base color with lit cloud color based on cloud density.
      }
      
      return col;
    }

    // Main function of the fragment shader. Executes for each pixel.
    void main(){
      // Call the earth function to get the final color of the pixel.
      vec3 c=earth(vUv);
      // Set the final fragment color with full opacity.
      gl_FragColor=vec4(c,1.0);
    }
  `)

extend({ HabitablePlanetMaterial })

export function createHabitablePlanetMaterial(
  qualityLevel: EffectsLevel = 'high',
  humidity: number = 50,
  temperature: number = 50,
  population: number = 20,
  volcanism: number = 50,
  showTopographicLines: boolean = false
) {
  const iterations = qualityLevel === 'high' ? 8 : qualityLevel === 'medium' ? 4 : 2
  const showClouds = qualityLevel === 'medium' || qualityLevel === 'high'
  const showNightLights = qualityLevel === 'high' && population > 0

  return new HabitablePlanetMaterial({
    qualityLevel: iterations,
    showClouds,
    showNightLights,
    humidity,
    temperature,
    population,
    volcanism,
    showTopographicLines,
    lavaColor: new THREE.Color(1.0, 0.2, 0.0),
    lavaGlowColor: new THREE.Color(1.0, 0.6, 0.0),
    lavaHotColor: new THREE.Color(1.0, 0.9, 0.7),
  })
}

