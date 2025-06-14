import * as THREE from 'three';

// GLSL equivalent of `fract`
function fract(v: THREE.Vector3): THREE.Vector3 {
    return new THREE.Vector3(
        v.x - Math.floor(v.x),
        v.y - Math.floor(v.y),
        v.z - Math.floor(v.z)
    );
}

// GLSL equivalent of `yxz` swizzle
function yxz(v: THREE.Vector3): THREE.Vector3 {
    return new THREE.Vector3(v.y, v.x, v.z);
}

// --- Utility functions (GLSL re-implementations) ---

// GLSL equivalent of `mod3_` and `hash3_3` for Perlin noise
const MOD3_VEC = new THREE.Vector3(0.1031, 0.22369, 0.13787);

function hash3_3(p: THREE.Vector3): THREE.Vector3 {
    // p = fract(p * mod3_);
    let p_local = fract(p.clone().multiply(MOD3_VEC));

    // p += dot(p, p.yxz + 120.0);
    const dotProductValue = p_local.dot(yxz(p_local).addScalar(120.0));
    p_local = p_local.addScalar(dotProductValue);

    // vec3 r = fract(vec3((p.x+p.y)*p.z, (p.x+p.z)*p.y, (p.y+p.z)*p.x));
    const r_vec = new THREE.Vector3(
        (p_local.x + p_local.y) * p_local.z,
        (p_local.x + p_local.z) * p_local.y,
        (p_local.y + p_local.z) * p_local.x
    );
    const r = fract(r_vec);

    return r.multiplyScalar(2).subScalar(1).normalize();
}

// GLSL equivalent of `perlin_noise3`
export function perlin_noise3(P: THREE.Vector3): number {
    const Pi = P.clone().floor();
    const Pf = P.clone().sub(Pi);
    const Pf3 = Pf.clone().multiply(Pf).multiply(Pf);
    const Pf4 = Pf3.clone().multiply(Pf);
    const Pf5 = Pf4.clone().multiply(Pf);
    const w = Pf5.clone().multiplyScalar(6).sub(Pf4.clone().multiplyScalar(15)).add(Pf3.clone().multiplyScalar(10));

    const n000 = Pf.clone().sub(new THREE.Vector3(0, 0, 0)).dot(hash3_3(Pi.clone().add(new THREE.Vector3(0, 0, 0))));
    const n100 = Pf.clone().sub(new THREE.Vector3(1, 0, 0)).dot(hash3_3(Pi.clone().add(new THREE.Vector3(1, 0, 0))));
    const n010 = Pf.clone().sub(new THREE.Vector3(0, 1, 0)).dot(hash3_3(Pi.clone().add(new THREE.Vector3(0, 1, 0))));
    const n110 = Pf.clone().sub(new THREE.Vector3(1, 1, 0)).dot(hash3_3(Pi.clone().add(new THREE.Vector3(1, 1, 0))));
    const n001 = Pf.clone().sub(new THREE.Vector3(0, 0, 1)).dot(hash3_3(Pi.clone().add(new THREE.Vector3(0, 0, 1))));
    const n101 = Pf.clone().sub(new THREE.Vector3(1, 0, 1)).dot(hash3_3(Pi.clone().add(new THREE.Vector3(1, 0, 1))));
    const n011 = Pf.clone().sub(new THREE.Vector3(0, 1, 1)).dot(hash3_3(Pi.clone().add(new THREE.Vector3(0, 1, 1))));
    const n111 = Pf.clone().sub(new THREE.Vector3(1, 1, 1)).dot(hash3_3(Pi.clone().add(new THREE.Vector3(1, 1, 1))));

    const nx00 = mix(n000, n100, w.x);
    const nx01 = mix(n001, n101, w.x);
    const nx10 = mix(n010, n110, w.x);
    const nx11 = mix(n011, n111, w.x);

    const nxy0 = mix(nx00, nx10, w.y);
    const nxy1 = mix(nx01, nx11, w.y);

    return mix(nxy0, nxy1, w.z);
}

// GLSL equivalent of `mix`
function mix(x: number, y: number, a: number): number {
    return x * (1 - a) + y * a;
}

// GLSL equivalent of `sdSphere`
function sdSphere(p: THREE.Vector3, r: number): number {
    return p.length() - r;
}

// GLSL equivalent of `sdWeirdSphere`
function sdWeirdSphere(p: THREE.Vector3, f: number): number {
    return mix(sdSphere(p, 1.0), perlin_noise3(p.clone().multiplyScalar(f)) / (f * 0.8), 0.95);
}

// GLSL equivalent of `mountainRanges`
function mountainRanges(p: THREE.Vector3, volcanism: number): number {
    const vf = volcanism / 100.0;

    const baseVariation = 0.3;

    const plateNoiseX = perlin_noise3(p.clone().multiplyScalar(0.5));
    const plateNoiseY = perlin_noise3(p.clone().multiplyScalar(0.3));
    const plateNoiseZ = perlin_noise3(p.clone().multiplyScalar(0.7));
    let tectonicFactor = Math.max(Math.max(plateNoiseX, plateNoiseY), plateNoiseZ);
    tectonicFactor = Math.pow(Math.max(0.0, tectonicFactor), 2.0);

    const ds = 2.0 + vf * 10.0;
    const bs = 0.25 + vf * 0.75;
    const ms = 1.0 + vf * 6.0;
    const dm = Math.min(perlin_noise3(p.clone().multiplyScalar(ds)), 0.35) * 4.0;
    let l = Math.pow(Math.max(0.0, perlin_noise3(p.clone().multiplyScalar(bs)) - 0.15), 0.4) * 1.5;
    let l2 = l * perlin_noise3(p.clone().multiplyScalar(0.0078125)) * 8.0;
    l *= dm;
    l2 = Math.max(0.0, l2);
    l -= perlin_noise3(p.clone().multiplyScalar(ms)) * 0.4;
    l = Math.max(0.0, l);
    let mh = (l + l2) * 0.7;
    mh *= (dm + 2.0) * 0.333;

    mh *= (baseVariation + vf * (1.0 - baseVariation));

    if (vf > 0.5) {
        mh = mix(mh * 0.5, mh * (1.0 + vf * 8.0), tectonicFactor);
    }

    mh *= (1.0 + vf * 5.0);
    return mh;
}

// GLSL equivalent of `height`
export function height(p: THREE.Vector3, terrainScale: number, volcanism: number): number {
    const sc = terrainScale; // No humidity dependency
    let h = sdWeirdSphere(p, 128.0 * sc);
    h += sdWeirdSphere(p, 64.0 * sc);
    h += sdWeirdSphere(p, 16.0 * sc);
    h += sdWeirdSphere(p, 8.0 * sc);
    h += sdWeirdSphere(p, 5.0 * sc);
    h += sdWeirdSphere(p, 3.0 * sc);
    h += sdWeirdSphere(p, 1.5 * sc);
    const mr = mountainRanges(p, volcanism);
    h += mr * 1.2;
    return h;
}

// Utility function to generate a random point on a unit sphere
export function randomPointOnUnitSphere(): THREE.Vector3 {
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.acos(Math.random() * 2 - 1);
    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);
    return new THREE.Vector3(x, y, z);
} 