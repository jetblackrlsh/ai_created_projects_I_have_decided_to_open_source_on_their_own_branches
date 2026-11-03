/**
 * Custom WebGL GLSL Shaders & Uniform Controller for "The Awakening of Mosaic"
 *
 * Implements:
 * - Fullscreen procedural GLSL fragment shader with:
 *   1. Fractal Brownian Motion (FBM) volumetric nebulae & subterranean plasma fields
 *   2. Signed Distance Field (SDF) Ancient Ring megastructure with rotating rune segments,
 *      gear teeth, and inner portal singularity
 *   3. Extradimensional Second Moon with gravitational lensing & concentric aura rings
 *   4. Subterranean hex-lattice neural grid & crimson firewall intrusion shockwaves
 *   5. Modular Voronoi/crystalline rose-gold awakening field for Mosaic & ARCHITECT-S2
 */

export const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER_SOURCE = `
precision highp float;
varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_sceneProgress;
uniform int u_sceneIndex;
uniform float u_ringRotation;
uniform float u_ringSpeed;
uniform float u_energyLevel;
uniform float u_intrusionAlert;
uniform vec3 u_primaryColor;
uniform vec3 u_secondaryColor;
uniform float u_reducedMotion;

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

mat2 rot2D(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

// Signed Distance Field for the Ancient Ring Megastructure
vec3 renderAncientRing(vec2 p, vec2 ringCenter, float radius, float rotAngle, vec3 colA, vec3 colB, float energy, float halted) {
  vec2 q = p - ringCenter;
  float r = length(q);
  float a = atan(q.y, q.x) + rotAngle;

  // Outer gear teeth & concentric rings
  float tooth = sin(a * 36.0) * 0.008 + sin(a * 12.0 - rotAngle * 2.0) * 0.005;
  float outerBand = abs(r - (radius + tooth)) - 0.022;
  float innerBand = abs(r - (radius * 0.80)) - 0.012;
  float coreGlow = smoothstep(radius * 0.82, 0.0, r);

  // Ancient rune spokes between inner and outer band
  float spokeMask = smoothstep(radius * 0.80, radius * 0.82, r) * smoothstep(radius, radius * 0.97, r);
  float runes = step(0.35, sin(a * 24.0) * cos(r * 110.0 - rotAngle * 3.0)) * spokeMask;

  vec3 col = vec3(0.0);
  // Metallic bronze-gold chassis
  vec3 bronze = mix(vec3(0.76, 0.54, 0.26), vec3(0.95, 0.78, 0.45), 0.5 + 0.5 * sin(a * 8.0));
  col += bronze * smoothstep(0.006, -0.002, outerBand) * 1.15;
  col += colA * smoothstep(0.005, -0.001, innerBand) * 1.3;
  col += mix(colA, colB, 0.5 + 0.5 * sin(a * 6.0)) * runes * (0.75 + 0.45 * energy);

  // Inner portal energy vortex
  vec2 vortexUV = rot2D(rotAngle * 0.6) * q * 6.0;
  float swirl = fbm(vortexUV + vec2(rotAngle * 0.4, -rotAngle * 0.3));
  vec3 portalCol = mix(colA, colB, swirl);
  if (halted > 0.5) {
    // When the Ring halts in Scene 11, emit a crystalline cyan-rose standing wave
    float freezeWave = 0.5 + 0.5 * cos(r * 75.0);
    portalCol = mix(vec3(0.25, 0.88, 0.98), vec3(0.98, 0.52, 0.78), freezeWave);
  }
  col += portalCol * coreGlow * (0.42 + 0.25 * swirl + 0.2 * energy);

  // Halo aura around ring
  float halo = exp(-abs(r - radius * 0.90) * 24.0);
  col += mix(colA, colB, 0.5) * halo * (0.55 + 0.35 * energy);
  return col;
}

// Extradimensional Second Moon with dimensional rift rings
vec3 renderSecondMoon(vec2 p, vec2 moonPos, float rad, float t) {
  vec2 d = p - moonPos;
  float r = length(d);
  float body = smoothstep(rad + 0.003, rad - 0.003, r);
  float craters = fbm(d * 28.0 + vec2(t * 0.08, -t * 0.05));
  // Dimensional rift grid inside moon
  float grid = abs(sin((d.x + d.y) * 90.0 + t * 1.5)) * abs(cos((d.x - d.y) * 90.0 - t));
  vec3 moonSurf = mix(vec3(0.45, 0.22, 0.78), vec3(0.88, 0.65, 1.0), craters * 0.7 + grid * 0.35);
  float rim = smoothstep(0.0, rad, r) * body;
  moonSurf += vec3(0.65, 0.85, 1.0) * pow(rim, 2.5) * 0.8;

  // Extradimensional lensing rings
  float ring1 = exp(-abs(r - rad * 1.38 + 0.006 * sin(atan(d.y, d.x) * 5.0 + t * 2.0)) * 55.0);
  float ring2 = exp(-abs(r - rad * 1.72) * 75.0);
  vec3 aura = vec3(0.72, 0.38, 0.98) * exp(-r * 9.5) * 0.55;
  return moonSurf * body + aura + vec3(0.85, 0.62, 1.0) * (ring1 * 0.65 + ring2 * 0.4);
}

// Subterranean Hexagonal AI Lattice & Firewall Glitch Waves
vec3 renderSubterraneanGrid(vec2 p, float t, vec3 colA, vec3 colB, float alert, float energy) {
  vec2 gp = p * 9.0;
  vec2 id = floor(gp);
  vec2 gv = fract(gp) - 0.5;
  float cellDist = max(abs(gv.x), abs(gv.y));
  float border = smoothstep(0.44, 0.49, cellDist);
  float cellRand = hash21(id);
  float pulse = 0.5 + 0.5 * sin(t * 2.4 + cellRand * 6.28);

  vec3 gridCol = mix(colA, colB, cellRand) * border * (0.18 + 0.25 * pulse + 0.2 * energy);

  // Signal wave radiating from bottom center (First Signal beneath the Ring)
  float distFromBottom = length(p - vec2(0.0, -0.55));
  float signalWave = exp(-abs(mod(distFromBottom - t * 0.28, 0.45) - 0.22) * 32.0);
  gridCol += colA * signalWave * 0.32;

  // Intrusion firewall shockwaves when alert > 0
  if (alert > 0.01) {
    float glitch = step(0.86 - alert * 0.22, hash21(vec2(floor(p.y * 28.0), floor(t * 9.0))));
    float redWave = 0.5 + 0.5 * sin(p.y * 35.0 - t * 8.0);
    gridCol += vec3(0.98, 0.15, 0.28) * alert * (0.22 * redWave + 0.38 * glitch);
  }
  return gridCol;
}

void main() {
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 uv = v_uv;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

  float motionScale = mix(1.0, 0.18, u_reducedMotion);
  float t = u_time * motionScale;

  // Base vertical atmospheric gradient
  vec3 topSky = mix(vec3(0.04, 0.08, 0.18), u_primaryColor * 0.28, 0.5);
  vec3 botSky = mix(vec3(0.02, 0.04, 0.09), u_secondaryColor * 0.22, 0.45);
  vec3 col = mix(botSky, topSky, smoothstep(-0.5, 0.55, p.y));

  // Volumetric FBM clouds / subterranean plasma mist
  float mist = fbm(p * 2.4 + vec2(t * 0.09, -t * 0.04));
  float mist2 = fbm(p * 4.8 - vec2(t * 0.12, t * 0.07));
  col += mix(u_primaryColor, u_secondaryColor, mist2) * mist * (0.22 + 0.15 * u_energyLevel);

  // Scene-specific shader layers
  if (u_sceneIndex <= 2) {
    // Scenes 1-3: Surface of Veyra, Daylight Sky + Second Extradimensional Moon + Colossal Ancient Ring
    vec3 dayTint = mix(vec3(0.08, 0.22, 0.42), vec3(0.18, 0.42, 0.68), smoothstep(-0.3, 0.5, p.y));
    col = mix(col, dayTint, 0.55);

    // Primary Sun glow on left horizon + Extradimensional Second Moon upper left
    vec2 moonPos = vec2(-0.52, 0.28);
    if (u_sceneIndex == 1) moonPos = vec2(0.32, 0.26); // Highlighted during Astral Warden warning
    col += renderSecondMoon(p, moonPos, 0.085, t);

    // Ancient Ring megastructure dominating the skyline
    vec2 ringPos = vec2(0.28, 0.08);
    float ringRad = 0.29;
    if (u_sceneIndex == 2) {
      // Scene 3: Watchtower close-up of the Ring
      ringPos = vec2(0.05, 0.10);
      ringRad = 0.34;
    }
    col += renderAncientRing(p, ringPos, ringRad, u_ringRotation, u_primaryColor, u_secondaryColor, u_energyLevel, 0.0);
  } else if (u_sceneIndex >= 3 && u_sceneIndex <= 6) {
    // Scenes 4-7: Underground Laboratory, AI Fabrication & Firewall Intrusion
    col += renderSubterraneanGrid(p, t, u_primaryColor, u_secondaryColor, u_intrusionAlert, u_energyLevel);

    // Holographic schematic rings behind ARCHITECT / Wristband distillation
    vec2 coreCenter = vec2(0.0, 0.12);
    float r = length(p - coreCenter);
    float holoRings = exp(-abs(r - 0.24) * 40.0) + 0.6 * exp(-abs(r - 0.36) * 50.0);
    col += mix(u_primaryColor, u_secondaryColor, 0.5 + 0.5 * sin(t * 3.0)) * holoRings * (0.45 + 0.35 * u_energyLevel);
  } else {
    // Scenes 8-11: Lower Containment Vault, Sparring Arena, Lattice Awakening & Halted Ring
    col += renderSubterraneanGrid(p, t * 0.8, u_primaryColor, u_secondaryColor, u_intrusionAlert, u_energyLevel);

    // Subterranean projection of the Ring overhead
    float isHalted = (u_sceneIndex == 10) ? 1.0 : 0.0;
    col += renderAncientRing(p, vec2(0.0, 0.24), 0.33, u_ringRotation, u_primaryColor, u_secondaryColor, u_energyLevel, isHalted) * 0.85;

    // Rose-gold / violet harmonic awakening ripples in Scenes 10-11
    if (u_sceneIndex >= 9) {
      float d = length(p - vec2(0.12, -0.02));
      float harmonic = exp(-abs(mod(d - t * 0.22, 0.32) - 0.16) * 38.0);
      col += vec3(0.98, 0.56, 0.82) * harmonic * 0.42;
    }
  }

  // Subtle vignette & filmic tone map
  float vig = smoothstep(1.28, 0.32, length(p * vec2(0.75, 1.05)));
  col *= (0.55 + 0.45 * vig);
  col = col / (1.0 + col * 0.35);
  col = pow(clamp(col, 0.0, 1.0), vec3(0.92));

  gl_FragColor = vec4(col, 1.0);
}
`;

export function createWebGLShaderEngine(canvas) {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: true, preserveDrawingBuffer: true });
  if (!gl) return null;

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error("GLSL compile error:", gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, "a_position");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const locs = {
    u_resolution: gl.getUniformLocation(prog, "u_resolution"),
    u_time: gl.getUniformLocation(prog, "u_time"),
    u_sceneProgress: gl.getUniformLocation(prog, "u_sceneProgress"),
    u_sceneIndex: gl.getUniformLocation(prog, "u_sceneIndex"),
    u_ringRotation: gl.getUniformLocation(prog, "u_ringRotation"),
    u_ringSpeed: gl.getUniformLocation(prog, "u_ringSpeed"),
    u_energyLevel: gl.getUniformLocation(prog, "u_energyLevel"),
    u_intrusionAlert: gl.getUniformLocation(prog, "u_intrusionAlert"),
    u_primaryColor: gl.getUniformLocation(prog, "u_primaryColor"),
    u_secondaryColor: gl.getUniformLocation(prog, "u_secondaryColor"),
    u_reducedMotion: gl.getUniformLocation(prog, "u_reducedMotion"),
  };

  return {
    gl,
    render(u) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(prog);
      gl.uniform2f(locs.u_resolution, canvas.width, canvas.height);
      gl.uniform1f(locs.u_time, u.time || 0);
      gl.uniform1f(locs.u_sceneProgress, u.sceneProgress || 0);
      gl.uniform1i(locs.u_sceneIndex, u.sceneIndex || 0);
      gl.uniform1f(locs.u_ringRotation, u.ringRotation || 0);
      gl.uniform1f(locs.u_ringSpeed, u.ringSpeed || 0);
      gl.uniform1f(locs.u_energyLevel, u.energyLevel || 0);
      gl.uniform1f(locs.u_intrusionAlert, u.intrusionAlert || 0);
      gl.uniform3fv(locs.u_primaryColor, u.primaryColor || [0.2, 0.7, 0.95]);
      gl.uniform3fv(locs.u_secondaryColor, u.secondaryColor || [0.75, 0.4, 0.95]);
      gl.uniform1f(locs.u_reducedMotion, u.reducedMotion ? 1.0 : 0.0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
  };
}
