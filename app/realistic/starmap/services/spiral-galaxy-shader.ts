/**
 * Spiral Galaxy Shader
 * Adapted from Shadertoy: https://www.shadertoy.com/view/MdSSzW
 * "Spiral Galaxy 2021 Ubiquitous"
 * 
 * Three.js/WebGL adaptation notes:
 * - Replaced iTime with uniform time
 * - Replaced iResolution with uniform resolution
 * - Removed iMouse dependency (using time-based animation instead)
 * - Removed texture dependencies (using procedural noise)
 * - Adapted for WebGL 1.0 compatibility
 */

export const spiralGalaxyVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const spiralGalaxyFragmentShader = `
precision mediump float;

#define PI 3.14159265
#define TWO_PI 6.2831853
#define USE_PROCEDURAL

uniform float time;
uniform float intensity;
uniform vec2 resolution;
uniform vec3 cameraPosition;

varying vec2 vUv;
varying vec3 vPosition;

float zoom = 1.0;
float inv_zoom = 1.0;

vec2 rotate( const in vec2 vPos, const in float fAngle )
{
    float s = sin(fAngle);
    float c = cos(fAngle);
    vec2 vResult = vec2( c * vPos.x + s * vPos.y, -s * vPos.x + c * vPos.y);
    return vResult;
}

vec2 rotate_around( const in vec2 vPos, const in vec2 vCentre, const in float fAngle )
{
    return rotate(vPos - vCentre, fAngle) + vCentre;
}

vec2 RadialDistort(vec2 uv ,vec2 centre, float radius, float amount, float r)
{
    vec2 lpos = uv - centre;
    float dist = length(lpos);
    float dx = dist / radius;
    vec2 ret = rotate(lpos, r + (dx * amount));
    return ret + centre;
}

float CircularGradient(vec2 pos, vec2 centre, float radius)
{
    float dist = length(pos - centre);
    float dx = dist / radius;
    return dx;
}

float SelectSegment(const in vec2 vPos, const in float segcount)
{
    vec2 vNorm = normalize(vPos);
    float atn = (atan(vNorm.y, vNorm.x) + PI) / TWO_PI;
    float segment = floor(atn * segcount);
    float half_segment = 0.5 / segcount;
    float seg_norm = mod((segment / segcount) + 0.25 + half_segment, 1.2);
    return seg_norm * TWO_PI;
}

float easeInOutQuart(float t) 
{
    if ((t/=0.5) < 1.0) return 0.5*t*t*t*t;
    return -2.5 * ((t-=2.0)*t*t*t - 2.0);
}

float fade2(float t)
{
    return t*t*(3.0-2.0*t);
}

float fade3(float f)
{
    return f*f*(3.0-2.0*f);
}

vec3 fade3(vec3 f)
{
    return f*f*(3.0-2.0*f);
}

// Procedural noise function (no texture dependency)
float hash( float n ) { 
    return fract(sin(n)*63758.5453123); 
}

float noise( in vec3 x )
{
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = fade3(f);
    
    float n = p.x + p.y*157.0 + 213.0*p.z;
    return mix(mix(mix( hash(n+ 10.0), hash(n+041.0),f.x),
                   mix( hash(n+157.0), hash(n+158.0),f.x),f.y),
               mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                   mix( hash(n+270.0), hash(n+271.0),f.x),f.y),f.z);
}

float multiNoise( in vec3 pos )
{
    vec3 q = 8.0*pos;
    mat3 m = mat3( 0.20,  0.80,  0.60,
                  -0.80,  0.36, -0.48,
                  -0.60, -0.48,  0.64 );
    float amplitude = 0.5;
    float f  = amplitude*noise( q ); q = m*q*2.11;
    float scale = 2.02;
    
    // Reduced iterations for better performance
    for (int i = 0; i < 6; i++)
    {    
        f += amplitude * noise( q ); q = m*q*scale;        
        amplitude *= 0.65;
    }
    f /= 1.7;
    return f;
}

vec3 bluegrad(float d)
{
    return mix(mix(vec3(0.0, 0.0, 0.0), vec3(0.1, 0.3, 0.8), d), vec3(0.3, 0.7, 1.2), d * 0.3);
}

vec3 orangegrad(float d)
{
    vec3 col1 = mix(vec3(0.0, 0.01, 0.01), vec3(1.5, 0.5, 0.1), d);
    return mix(col1, vec3(2.4, 1.4, 1.1), d * 0.15);
}

vec3 blackbody_grad(float x)
{    
    float ca = 1.0 - (pow(x, 1.2) * 0.5);
    float cb = pow(min(1.0, x +0.6), 2.0) * 0.9;
    float cd = x * 0.4;
    float g = cb - cd;    	
    return vec3(ca * 0.7, g*1.0, (1.9- ca) * 0.5) * 1.1;
}

// Simple hash for stars without texture dependency
vec2 hash2( vec2 p )
{
    p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) );
    return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

vec4 hash4( vec2 p)
{
    vec4 result;
    result.xy = hash2(p);
    result.zw = hash2(p + vec2(1.0, 1.0));
    return result * 0.5 + 0.5;
}

float star_falloff(float dist, float radius)
{
    float idist = max(0.1, radius - dist);
    return pow(idist, 80.0) * 6.5 + pow(idist, 120.0) * 0.8;
}

vec3 voronoi_stars( in vec2 pos)
{
    vec2 n = floor(pos);
    vec2 f = fract(pos);

    vec3 col = vec3(0,0,0);
    int xdir = f.x > 0.5 ? 1 : -1;
    int ydir = f.y > 0.5 ? 1 : -1;
    
    for( int j=0; j<=1; j++ )
    {
        for( int i=0; i<=1; i++ )    
        {
            vec2 cell = vec2(float(i * xdir),float(j * ydir));
            vec2 o = hash2( n + cell ) * 0.5 + 0.5;
            vec2 r = cell + o - f;        
            vec4 stardata = hash4(n + cell);
            
            float d = length(r);                
            float starfo = star_falloff(d, 1.0) * 1.2;
      
            vec3 star_colour = blackbody_grad(stardata.x * 1.2 ) * stardata.w * starfo;
            col += star_colour;
        }
    }
    return col;
}

float SphereShape(vec2 pos, vec2 centre, float radius, float curvep, float brightness)
{
    vec2 vec = (pos - centre);
    float dist = length(vec);
    if (dist > radius) return 0.0;
    return min(1.7,max(0.0, pow(1.0 - (dist / radius), curvep))) * brightness;   
}

vec4 Galaxy(vec2 pos, vec2 centre, float centrerad, float radius, float twist_amount, float rotation, float segments)
{
    vec2 rpos = RadialDistort(pos, centre, radius, twist_amount, rotation);
    vec2 rposless = RadialDistort(pos, centre, radius, twist_amount * 0.1, rotation);
    
    vec2 vec = rotate((rpos - centre), rotation);
    vec2 vecless = (rposless - centre);
    float dist = length(vec);
    float angle = atan(-vec.y, vec.x);
    float seg_angle_size = TWO_PI / segments;
    float seg_arc_length = seg_angle_size * centrerad;
    float seg_arc_end_length = seg_arc_length * 0.2;
   
    float ns = multiNoise(vec3(pos.x * 1.0, pos.y * 1.0, time*0.005));
    float nst = multiNoise(vec3(rposless.x * 3.0, rposless.y * 3.0, time*0.0016));
    ns = mix(ns, nst, 0.5);
        
    if (dist > radius)
        return vec4(0.1, 0.2, 0.3, 0.9);
    else
    {
        float r = SelectSegment(vec, segments);		
        vec2 dpos = rotate(vec, r );        
        float yd = 1.0 - (dist - centrerad) / (radius - centrerad);
        
        float fadeout = pow(yd, 4.2) * 0.4;
        float w = mod(angle, seg_angle_size);
      
        float centre_fo = 1.0;
        vec2 dposless = rotate(vecless, r );        
     
        float thread = 1.0 - max(0.0, abs(dpos.x + ((ns - 0.5)* 0.4 * centre_fo)));
        float d = abs(dpos.x);
             
        float width_at = seg_arc_end_length+(seg_arc_length - seg_arc_end_length * yd);
        
        float xd = clamp((width_at-d) / seg_arc_length, 0.6, 1.0);
        
        float fadexd = (pow(fade2(xd), 1.2) * 1.2) * ns;
        return vec4( fadexd, xd, thread, fadeout);
    }
}

void main()
{
    float timemod = time * 0.2;
    
    // Use UV coordinates instead of fragCoord for better compatibility
    vec2 fragCoord = vUv * resolution;
    vec2 iResolution = resolution;
    
    float minzoom = 1.2;
    float maxzoom = 0.5;
    float zoom_delta = (sin(timemod * 0.05) + 2.0) / 3.3;
    zoom_delta = pow(zoom_delta, 0.9);
    
    zoom = mix(minzoom, maxzoom, zoom_delta);
    inv_zoom = 1.4 / zoom;
    
    vec2 uv = vUv;
    vec2 original_uv = uv;
    
    float ar = iResolution.x / iResolution.y;
    
    uv.x = (uv.x * ar);
    uv -= 0.3;
    uv *= zoom;
    uv += 0.1;
    uv.x -= 0.3;
    
    vec2 centre = vec2(0.25, 0.25);
    float centre_radius = 0.18;
    float radius = 1.3;
    
    float r = -PI * zoom_delta - 8.4;
 
    vec2 ruv = rotate_around(uv, centre, r);
    
    float twist_amount = 10.0;
  
    vec4 galaxy_params = Galaxy(ruv, centre, centre_radius, radius, twist_amount, 0.3, 0.8);
    
    float galactic_centre = SphereShape(uv, centre, 0.5, 3.4, 0.7);
    vec3 col = bluegrad(galaxy_params.x * galaxy_params.w * 0.7);
    
    float pulse_nebula = 0.5;
    col += bluegrad(pow(galaxy_params.x, 6.0) * pulse_nebula * clamp(0.8-galaxy_params.w, 0.2, 1.0) * clamp(pow(galaxy_params.w * 2000.0, 2.0), 0.2, 1.0));
    
    float thread = clamp(galaxy_params.z - galactic_centre * 1.0, 0.4, 1.0);
    float ribbon_fadeout = (0.04 + pow(galaxy_params.w * 2.0, 2.4)) * 0.3;
    col += orangegrad(pow(thread,10.0) ) * ribbon_fadeout * 2.0;
    col -= bluegrad(pow(thread,70.0)) * ribbon_fadeout * 1.3;
    col += orangegrad(galactic_centre * 0.70);
    
    // Add stars
    vec2 ruv2 = rotate_around(uv, centre, r);
    float starscale = 8.5;
    float starbrightness = 0.6 * (1.0 / pow(zoom, 0.3)) * intensity;
    
    // Reduced star layers for better performance
    for (int i = 0; i < 6; i++)
    {        
        float fadeout = pow(galaxy_params.y, 5.0) * 0.9 * (galaxy_params.w * 0.8 + 0.1) + 0.1;
        col += voronoi_stars(ruv * starscale) * fadeout * starbrightness;
        starbrightness *= 0.9;
        starscale *= 2.5;
    }
    
    // Apply intensity and alpha
    col *= intensity;
    
    gl_FragColor = vec4(col, 0.8);
}
`;