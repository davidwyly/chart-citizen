import { shaderMaterial } from "@react-three/drei"

export const GasGiantMaterial = shaderMaterial(
  {
    time: 0.0,
    map: null,
    normalMap: null,
    stormIntensity: 0.5,
    bandCount: 6.0,
    atmosphereThickness: 0.1,
    lightDirection: [1.0, 1.0, 0.8],
    atmosphereColor: [1.0, 0.7, 0.4],
    rotationSpeed: 0.02,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      vViewPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    precision highp float;

    uniform float time;
    uniform sampler2D map;
    uniform sampler2D normalMap;
    uniform float stormIntensity;
    uniform float bandCount;
    uniform float atmosphereThickness;
    uniform vec3 lightDirection;
    uniform vec3 atmosphereColor;
    uniform float rotationSpeed;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    float hash(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }

    float noise(vec3 x) {
      vec3 i = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x),
                     mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
                 mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
                     mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
    }

    float fbm(vec3 p) {
      float f = 0.0;
      float a = 0.5;
      for (int i = 0; i < 6; i++) {
        f += a * noise(p);
        p *= 2.0;
        a *= 0.5;
      }
      return f;
    }

    vec2 generateSphericalUV(vec3 position, float spin) {
      float width = sqrt(1.0 - position.y * position.y);
      float generatrixX = position.x / width;
      vec2 generatrix = vec2(generatrixX, position.y);
      vec2 uv = asin(generatrix) / 3.14159 + vec2(0.5 + spin, 0.5);  
      return vec2(uv);
    }

    mat3 createRotationMatrix(float pitch, float roll) {
      float cosPitch = cos(pitch);
      float sinPitch = sin(pitch);
      float cosRoll = cos(roll);
      float sinRoll = sin(roll);
      return mat3(
        cosRoll, -sinRoll * cosPitch, sinRoll * sinPitch,
        sinRoll, cosRoll * cosPitch, -cosRoll * sinPitch,
        0.0, sinPitch, cosPitch
      );
    }

    vec4 atmosphere(vec3 normal, vec3 lightDir, vec3 atmColor, float falloff) {
      vec3 absorption = vec3(2.0, 3.0, 4.0);
      
      float fresnel = pow(1.0 - dot(normal, vec3(0.0, 0.0, 1.0)), falloff);
      float light = max((dot(normal, lightDir) + 0.3) / 1.3, 0.0);

      vec3 absorbed = vec3(
        pow(light, absorption.x),
        pow(light, absorption.y),
        pow(light, absorption.z)
      );

      vec3 scattered = absorbed * atmColor;
      return vec4(scattered, fresnel);
    }

    vec3 generateSwirlingClouds(vec2 uv, float time) {
      vec2 flow1 = vec2(cos(uv.y * 8.0 + time * 0.3), sin(uv.y * 6.0 + time * 0.2)) * 0.02;
      vec2 flow2 = vec2(cos(uv.y * 12.0 - time * 0.4), sin(uv.y * 10.0 - time * 0.3)) * 0.015;
      vec2 flow3 = vec2(cos(uv.y * 16.0 + time * 0.5), sin(uv.y * 14.0 + time * 0.4)) * 0.01;

      vec2 swirledUV = uv + flow1 + flow2 + flow3;

      float clouds1 = fbm(vec3(swirledUV * 4.0, time * 0.1));
      float clouds2 = fbm(vec3(swirledUV * 8.0, time * 0.15));
      float clouds3 = fbm(vec3(swirledUV * 16.0, time * 0.2));

      float cloudDensity = clouds1 * 0.5 + clouds2 * 0.3 + clouds3 * 0.2;

      vec3 cloudColor1 = vec3(0.9, 0.8, 0.6);
      vec3 cloudColor2 = vec3(0.7, 0.5, 0.3);
      vec3 cloudColor3 = vec3(0.8, 0.4, 0.2);

      float bandMix = sin(uv.y * bandCount * 3.14159) * 0.5 + 0.5;
      vec3 baseColor = mix(cloudColor2, cloudColor1, bandMix);

      float stormMask = smoothstep(0.6, 0.8, cloudDensity) * stormIntensity;
      baseColor = mix(baseColor, cloudColor3, stormMask);

      return baseColor * (0.7 + cloudDensity * 0.6);
    }

    vec3 sampleJupiterPalette(vec2 uv) {
      vec3 colors[4];
      colors[0] = vec3(0.906, 0.780, 0.678);
      colors[1] = vec3(0.655, 0.510, 0.451);
      colors[2] = vec3(0.796, 0.643, 0.557);
      colors[3] = vec3(1.000, 0.906, 0.808);

      float t = fract(uv.y * bandCount);
      float index = floor(t * 4.0);
      float nextIndex = ceil(t * 4.0);
      float blend = smoothstep(0.3, 0.7, fract(t * 4.0));

      return mix(colors[int(mod(index, 4.0))], colors[int(mod(nextIndex, 4.0))], blend);
    }

    void main() {
      vec2 uv = vUv;
      vec3 normal = normalize(vNormal);

      mat3 rotationMatrix = createRotationMatrix(-0.2, 0.3);
      vec3 rotatedPosition = rotationMatrix * vPosition;
      vec2 sphericalUV = generateSphericalUV(normalize(rotatedPosition), time * rotationSpeed);

      vec3 swirlingClouds = generateSwirlingClouds(sphericalUV, time);

      // Add banded velocity flow for jet streams
      float latitude = sphericalUV.y * 2.0 - 1.0;
      float bandFlow = sin(latitude * 3.14159 * bandCount) * 0.002;
      vec2 flowOffset = vec2(bandFlow * time * 20.0, 0.0);

      // Add swirling turbulence
      float turbulence = fbm(vec3(sphericalUV * 3.0, time * 0.1)) * 0.02;
      vec2 turbulenceOffset = vec2(turbulence, turbulence * 0.5);

      // Final UV offset
      vec2 distortedUV = sphericalUV + flowOffset + turbulenceOffset;

      vec3 baseColor = sampleJupiterPalette(distortedUV);

      vec3 finalClouds = mix(baseColor, swirlingClouds, 0.6);

      float bandPattern = sin(sphericalUV.y * bandCount * 3.14159) * 0.5 + 0.5;
      bandPattern = smoothstep(0.3, 0.7, bandPattern);
      finalClouds = mix(finalClouds, finalClouds * 1.3, bandPattern * 0.4);

// Primary storm system (Great Red Spot-style)
vec2 stormCenter = vec2(0.3, 0.6);
float stormDist = distance(sphericalUV, stormCenter);
float stormMask = exp(-stormDist * 12.0) * stormIntensity;
vec3 stormColor = vec3(0.8, 0.3, 0.1);
finalClouds = mix(finalClouds, stormColor, stormMask * 0.7);

// Procedural storm clusters
float stormNoise = fbm(vec3(sphericalUV * 10.0, time * 0.1));
float bandMix = sin(sphericalUV.y * bandCount * 3.14159) * 0.5 + 0.5;
float miniStorms = smoothstep(0.7, 0.85, stormNoise) * bandMix * stormIntensity * 0.5;
vec3 miniStormColor = vec3(0.9, 0.4, 0.2);
finalClouds = mix(finalClouds, miniStormColor, miniStorms);


      vec4 atmosphericEffect = atmosphere(normal, normalize(lightDirection), atmosphereColor, 2.0);

      float lightIntensity = max(dot(normal, normalize(lightDirection)), 0.0);
      lightIntensity = pow(lightIntensity, 0.8);

      vec3 litClouds = finalClouds * (0.3 + lightIntensity * 0.7);
      vec3 finalColor = mix(litClouds, atmosphericEffect.rgb * 1.5, atmosphericEffect.a * atmosphereThickness);

      float fresnel = 1.0 - abs(dot(normal, normalize(-vViewPosition)));
      finalColor += atmosphereColor * fresnel * fresnel * 0.2;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
)
