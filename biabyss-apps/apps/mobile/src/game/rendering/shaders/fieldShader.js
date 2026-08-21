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
  uniform float uOpticalStage;
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
    float time = uTime * 0.018 * uMotionScale + uSeed * 0.013;
    vec2 world = (vUv - 0.5) * uWorldSize / 620.0;
    vec2 base = world * 0.38;
    float stage01 = smoothstep(0.18, 0.92, uOpticalStage);
    float stage12 = smoothstep(1.12, 1.9, uOpticalStage);

    vec2 warp = vec2(
      fbm(base + vec2(time * 0.44, -time * 0.17)),
      fbm(base + vec2(6.7 - time * 0.14, 2.9 + time * 0.37))
    ) - 0.5;
    float cloud = fbm(base + warp * 1.22 + vec2(-time * 0.12, time * 0.08));
    float opticalBlue = fbm(base * 0.72 - warp * 0.64 + vec2(4.1, -2.7));
    float fineGrain = noise(world * 7.6 + warp * 0.8);
    float culture = fbm(base * 2.55 + warp * 1.72 - vec2(time * 0.2, time * 0.11));
    float cultureCluster = smoothstep(0.18, 0.38, cloud) * smoothstep(0.18, 0.58, culture);
    float colonyBody = smoothstep(0.08, 0.62, cultureCluster);
    float colonyEdge = smoothstep(0.03, 0.24, cultureCluster) - smoothstep(0.48, 0.74, cultureCluster);
    float detritusCluster = smoothstep(0.34, 0.65, fbm(base * 3.65 - warp * 1.4 + 7.3));

    vec3 brightBath = vec3(0.48, 0.59, 0.62);
    vec3 algaeBath = vec3(0.34, 0.49, 0.52);
    vec3 detritusBath = vec3(0.46, 0.51, 0.43);
    vec3 bath = mix(mix(brightBath, algaeBath, stage01), detritusBath, stage12);

    vec3 opticalBath = mix(bath * 0.86, bath * vec3(1.02, 1.09, 1.12), opticalBlue);
    vec3 greenColony = mix(vec3(0.43, 0.46, 0.16), vec3(0.27, 0.39, 0.17), stage01);
    vec3 ochreColony = mix(vec3(0.51, 0.36, 0.1), vec3(0.35, 0.25, 0.075), stage12);
    vec3 colonyColor = mix(greenColony, ochreColony, detritusCluster * 0.72 + stage12 * 0.18);
    vec3 color = mix(opticalBath, colonyColor, colonyBody * mix(0.34, 0.52, stage12));
    color = mix(color, ochreColony * 0.72, colonyEdge * (0.12 + detritusCluster * 0.24));

    vec3 algaeVeil = vec3(0.19, 0.39, 0.31);
    color = mix(color, algaeVeil, stage01 * (1.0 - stage12) * smoothstep(0.28, 0.52, cloud) * 0.18);
    color += (fineGrain - 0.5) * mix(0.038, 0.065, stage01);

    vec2 bubbleGrid = floor(world * 1.55);
    vec2 bubbleCell = fract(world * 1.55) - 0.5;
    float bubbleSeed = hash21(bubbleGrid + vec2(floor(uSeed)));
    vec2 bubbleOffset = vec2(hash21(bubbleGrid + 4.2), hash21(bubbleGrid + 9.7)) - 0.5;
    float bubbleDistance = length(bubbleCell - bubbleOffset * 0.48);
    float bubbleRing = (1.0 - smoothstep(0.055, 0.085, abs(bubbleDistance - 0.12))) *
      step(0.86, bubbleSeed);
    float bubbleCore = (1.0 - smoothstep(0.0, 0.105, bubbleDistance)) * step(0.86, bubbleSeed);
    color = mix(color, color * 0.46, bubbleRing * 0.42);
    color += bubbleCore * vec3(0.045, 0.055, 0.05) * (1.0 - stage12 * 0.55);

    vec2 debrisGrid = floor(world * 4.6);
    vec2 debrisCell = fract(world * 4.6) - 0.5;
    float debrisSeed = hash21(debrisGrid + vec2(31.0 + floor(uSeed)));
    float debris = (1.0 - smoothstep(0.018, 0.065, length(debrisCell))) *
      step(mix(0.985, 0.94, max(stage01, stage12)), debrisSeed);
    vec3 debrisColor = mix(vec3(0.18, 0.22, 0.18), vec3(0.2, 0.15, 0.055), stage12);
    color = mix(color, debrisColor, debris * mix(0.56, 0.78, stage12));

    vec2 defocusGrid = floor(world * 1.16);
    vec2 defocusCell = fract(world * 1.16) - 0.5;
    float defocusSeed = hash21(defocusGrid + vec2(73.0 + floor(uSeed)));
    vec2 defocusOffset = vec2(hash21(defocusGrid + 12.7), hash21(defocusGrid + 21.1)) - 0.5;
    float defocusDistance = length(defocusCell - defocusOffset * 0.58);
    float defocusDebris = (1.0 - smoothstep(0.055, 0.16, defocusDistance)) * step(0.79, defocusSeed);
    color = mix(color, vec3(0.24, 0.29, 0.25), defocusDebris * 0.16);

    float vignette = 1.0 - smoothstep(0.34, 0.82, length(vUv - 0.5));
    color *= 0.94 + vignette * 0.06;
    gl_FragColor = vec4(color, 1.0);
  }
`
