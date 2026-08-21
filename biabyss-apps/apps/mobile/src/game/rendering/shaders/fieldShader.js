// @ts-check

export const fieldVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export const fieldFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform float uMotionScale;
  uniform float uSeed;
  uniform vec2 uWorldSize;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.52;
    mat2 turn = mat2(0.80, 0.60, -0.60, 0.80);
    for (int octave = 0; octave < 4; octave++) {
      value += noise(p) * amplitude;
      p = turn * p * 2.03 + vec2(12.71, 4.23);
      amplitude *= 0.48;
    }
    return value;
  }

  void main() {
    float time = uTime * 0.032 * uMotionScale + uSeed * 0.013;
    vec2 world = (vUv - 0.5) * uWorldSize / 620.0;
    vec2 base = world * 0.24;

    vec2 warp = vec2(
      fbm(base + vec2(time * 0.72, -time * 0.29)),
      fbm(base + vec2(6.7 - time * 0.24, 2.9 + time * 0.61))
    ) - 0.5;
    float cloud = fbm(base + warp * 1.38 + vec2(-time * 0.18, time * 0.12));
    float veil = noise(world * 0.53 + warp * 0.86 + vec2(time * 0.44, -time * 0.21));
    float ridgeNoise = noise(base * 3.25 + warp * 2.1 - vec2(time * 0.36, time * 0.17));
    float filament = pow(1.0 - abs(ridgeNoise * 2.0 - 1.0), 3.2);
    float breath = 0.5 + 0.5 * sin(time * 0.74 + cloud * 5.4 + veil * 2.2);

    vec3 abyss = vec3(0.0015, 0.004, 0.014);
    vec3 cyan = vec3(0.012, 0.155, 0.185);
    vec3 violet = vec3(0.086, 0.022, 0.165);
    vec3 magenta = vec3(0.19, 0.012, 0.098);
    float paletteCycle = 0.5 + 0.5 * sin(time * 0.31 + cloud * 3.7);
    vec3 luminousField = mix(cyan, violet, smoothstep(0.22, 0.82, cloud));
    luminousField = mix(luminousField, magenta, paletteCycle * smoothstep(0.48, 0.92, veil));

    float density = smoothstep(0.24, 0.88, cloud) * (0.42 + veil * 0.58);
    vec3 color = mix(abyss, luminousField, density * 0.72);
    color += mix(cyan, violet, breath) * filament * (0.055 + density * 0.095);

    vec2 sporeGrid = floor(world * 3.8);
    vec2 sporeCell = fract(world * 3.8) - 0.5;
    float sporeSeed = hash21(sporeGrid + vec2(floor(uSeed)));
    float sporeShape = (1.0 - smoothstep(0.018, 0.075, length(sporeCell))) *
      step(0.955, sporeSeed);
    float twinkle = 0.5 + 0.5 * sin(time * 3.8 + sporeSeed * 24.0);
    color += vec3(0.54, 0.92, 1.0) * sporeShape * (0.18 + twinkle * 0.34);

    float vignette = 1.0 - smoothstep(0.22, 0.79, length(vUv - 0.5));
    color *= 0.78 + vignette * 0.22;
    gl_FragColor = vec4(color, 1.0);
  }
`
