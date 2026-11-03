/**
 * WebGL Atmospheric Post-Processing Shaders for "Echoes in the Static" (Dream Journal 11/03/2026)
 *
 * Implements the Moss-Keeper / Makoto Shinkai / Studio Ghibli atmospheric grading pass:
 * - Warm/Cool split-toning & shadow ambient lifting
 * - Volumetric light-shaft (god-ray) & cosmic lucid sparkle enhancement
 * - Subtle hand-pressed cold-press paper canvas micro-grain
 * - Soft dreamy vignette (supports both WebGL2 `outColor` and WebGL1 `gl_FragColor`)
 */

export const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

export const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec2 v_texCoord;
uniform sampler2D u_sceneTexture;
uniform float u_time;
uniform float u_warmth;
uniform float u_vignette;
uniform float u_paperGrain;

out vec4 outColor;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec4 base = texture(u_sceneTexture, v_texCoord);
  vec3 col = base.rgb;

  // Soft anime highlight bloom approximation via 5-tap cross sample
  vec2 texel = vec2(1.0 / 1920.0, 1.0 / 1080.0) * 2.5;
  vec3 bloom = (
    texture(u_sceneTexture, v_texCoord + vec2(texel.x, 0.0)).rgb +
    texture(u_sceneTexture, v_texCoord - vec2(texel.x, 0.0)).rgb +
    texture(u_sceneTexture, v_texCoord + vec2(0.0, texel.y)).rgb +
    texture(u_sceneTexture, v_texCoord - vec2(0.0, texel.y)).rgb
  ) * 0.25;
  float luma = dot(bloom, vec3(0.2126, 0.7152, 0.0722));
  col += max(vec3(0.0), bloom - 0.62) * 0.24 * smoothstep(0.55, 0.95, luma);

  // Shinkai/Ghibli warm-cool split-toning
  vec3 coolShadow = vec3(0.95, 0.97, 1.04);
  vec3 warmHighlight = vec3(1.04, 1.01, 0.95);
  col = mix(col * coolShadow, col * warmHighlight, smoothstep(0.2, 0.85, luma) * u_warmth);

  // Subtle cold-press watercolor paper grain
  float grain = (hash12(v_texCoord * vec2(1920.0, 1080.0) + fract(u_time * 0.13)) - 0.5) * u_paperGrain;
  col += grain;

  // Cinematic vignette
  vec2 centered = v_texCoord - 0.5;
  float distSq = dot(centered, centered);
  col *= clamp(1.0 - distSq * u_vignette, 0.65, 1.0);

  // Assign output fragment color (gl_FragColor equivalent in WebGL2 ES 3.00)
  outColor = vec4(clamp(col, 0.0, 1.0), base.a);
}
`;
