"use client"

import { useRef, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

// ───────────────────── VERTEX SHADER ─────────────────────────
const vertexShader = /* glsl */ `
 varying vec2 vUv;
 varying vec3 vWorldPos;

 void main() {
   vUv       = uv;
   vec4 wp   = modelMatrix * vec4(position, 1.0);
   vWorldPos = wp.xyz;
   gl_Position = projectionMatrix * viewMatrix * wp;
 }`

// ────────────────────── FRAGMENT SHADER ─────────────────────────
// Adds a new uniform `effectScale` so the nebula volume can be
// scaled smaller/larger than the sphere geometry.
const fragmentShader = /* glsl */ `
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vUv;

uniform float      time;
uniform vec2       resolution;
uniform sampler2D  noiseTex;
uniform vec3       cameraPos;
uniform mat4       invModel;
uniform float      modelScale;   // actual mesh scale (geometry)
uniform float      effectScale;  // user-controlled nebula size multiplier

varying vec3       vWorldPos;

#define PI 3.14159265

// iq noise -------------------------------------------------------
float noise( in vec3 x ){
  vec3 p=floor(x), f=fract(x); f*=f*(3.-2.*f);
  vec2 uv=(p.xy+vec2(37.,17.)*p.z)+f.xy;
  vec2 rg=textureLod(noiseTex,(uv+0.5)/256.,0.).yx;
  return 1.-.82*mix(rg.x,rg.y,f.z);
}
float rand(vec2 c){return fract(sin(dot(c,vec2(12.9898,78.233)))*43758.5453);} 
const float nudge=.739513, norm=1./sqrt(1.+nudge*nudge);
float SpiralNoiseC(vec3 p){float n=0.,it=1.;for(int i=0;i<8;i++){n+=-abs(sin(p.y*it)+cos(p.x*it))/it; p.xy+=vec2(p.y,-p.x)*nudge; p.xy*=norm; p.xz+=vec2(p.z,-p.x)*nudge; p.xz*=norm; it*=1.733733;}return n;}
float SpiralNoise3D(vec3 p){float n=0.,it=1.;for(int i=0;i<5;i++){n+=(sin(p.y*it)+cos(p.x*it))/it; p.xz+=vec2(p.z,-p.x)*nudge; p.xz*=norm; it*=1.33733;}return n;}
float NebNoise(vec3 p){float v=p.y+4.5; v-=SpiralNoiseC(p); v+=SpiralNoiseC(p.zxy*.5123+100.)*4.; v-=SpiralNoise3D(p); return v;}

float map(vec3 p){return abs(NebNoise(p/0.5))*0.5+0.03;}  // unchanged

vec3 computeColor(float d,float r){vec3 b=mix(vec3(1.,.9,.8),vec3(.4,.15,.1),d); b*=mix(7.*vec3(.8,1.,1.),1.5*vec3(.48,.53,.5),min((r+.05)/.9,1.15)); return b;}

bool raySphere(vec3 o,vec3 d,float R,out float t0,out float t1){float b=dot(d,o),c=dot(o,o)-R*R,det=b*b-c;if(det<0.)return false;float s=sqrt(det);t0=-b-s;t1=-b+s;return t1>0.;}

void main(){
  vec3 localCam=(invModel*vec4(cameraPos,1.)).xyz;
  vec3 worldRay=normalize(vWorldPos-cameraPos);
  vec3 rd=normalize((invModel*vec4(worldRay,0.)).xyz);
  vec3 ro=localCam;

  float tN,tF;
  float radius = 3.0*modelScale*effectScale; // geometry radius×user scale
  if(!raySphere(ro,rd,radius,tN,tF)){gl_FragColor=vec4(0.0);return;}
  float t=(tN>0.)?tN:0.;

  const float h=0.1;
  float td=0.,ld=0.; vec4 sum=vec4(0.0);
  for(int i=0;i<56;i++){
    vec3 pos=ro+t*rd;
    if(td>0.9||t>tF||sum.a>0.99)break;
    float d=map(pos); d=max(d,.08);
    float l=length(pos); sum.rgb+=vec3(1.,.8,.6)/(l*l)/30.;
    if(d<h){ld=h-d; float w=(1.-td)*ld; td+=w+.005; vec4 c=vec4(computeColor(td,l),td);
      float fade=smoothstep(.15,.6,td); c.a*=.185*fade; c.rgb*=c.a; sum=sum+c*(1.-sum.a);} td+=.014;
    d=max(d,.04); t+=max(d*.1,0.02);
  }
  sum*=1./exp(ld*.2)*.6; 
  sum=clamp(sum,0.,1.); 
  sum.rgb=sum.rgb*sum.rgb*(3.-2.*sum.rgb);

  // Radial fade in screen space
  vec2 center = vec2(0.5, 0.5);
  float fadeRadius = 0.48;
  float fadeWidth = 0.08;
  float dist = distance(vUv, center);
  float radialFade = smoothstep(fadeRadius, fadeRadius - fadeWidth, dist);

  gl_FragColor = vec4(sum.rgb, radialFade);
}`

// ─────────────────── REACT / FIBER COMPONENT ────────────────────
interface ProtostarProps {
  scale: number
  effectScale: number
  density: number
  starBrightness: number
  starHue: number
  nebulaHue: number
  rotationSpeed: number
  spin?: number
}

export function Protostar({
  scale,
  effectScale,
  density,
  starBrightness,
  starHue,
  nebulaHue,
  rotationSpeed,
  spin = 0,
}: ProtostarProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const matRef = useRef<THREE.ShaderMaterial>(null!)
  const { size } = useThree()

  // 256×256 RG noise texture
  const noiseTex = useMemo(() => {
    const w = 256,
      h = 256
    const data = new Uint8Array(w * h * 4)
    for (let i = 0; i < w * h; i++) {
      const o = i * 4
      data[o] = Math.random() * 256
      data[o + 1] = Math.random() * 256
      data[o + 2] = 0
      data[o + 3] = 255
    }
    const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.needsUpdate = true
    return t
  }, [])

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(size.width, size.height) },
      noiseTex: { value: noiseTex },
      cameraPos: { value: new THREE.Vector3() },
      invModel: { value: new THREE.Matrix4() },
      modelScale: { value: 1.0 },
      effectScale: { value: effectScale },
      // The following uniforms are kept for future tunability
      nebulaDensityFactor: { value: density },
      starBrightnessFactor: { value: starBrightness },
      starHueFactor: { value: starHue },
      nebulaHueFactor: { value: nebulaHue },
      rotationSpeedFactor: { value: rotationSpeed },
    }),
    [noiseTex, size.width, size.height, effectScale, density, starBrightness, starHue, nebulaHue, rotationSpeed]
  )

  useFrame((state, delta) => {
    if (matRef.current && meshRef.current) {
      const m = matRef.current
      m.uniforms.time.value = state.clock.elapsedTime
      state.camera.getWorldPosition(m.uniforms.cameraPos.value)
      m.uniforms.invModel.value.copy(meshRef.current.matrixWorld).invert()
      m.uniforms.modelScale.value = meshRef.current.scale.x
      m.uniforms.effectScale.value = effectScale
      // Update other uniforms in case props change dynamically
      m.uniforms.nebulaDensityFactor.value = density
      m.uniforms.starBrightnessFactor.value = starBrightness
      m.uniforms.starHueFactor.value = starHue
      m.uniforms.nebulaHueFactor.value = nebulaHue
      m.uniforms.rotationSpeedFactor.value = rotationSpeed

      if (spin !== 0) {
        meshRef.current.rotation.y += THREE.MathUtils.degToRad(spin * delta)
      }
    }
  })

  return (
    <mesh ref={meshRef} scale={scale}>
      <sphereGeometry args={[3, 32, 16]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  )
} 