// @ts-check

export const cellVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const cellFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform float uPhase;
  uniform float uMorph;
  uniform float uThreat;
  uniform vec3 uColor;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
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

  float ellipse(vec2 p, vec2 scale) {
    return length(p * scale);
  }

  float capsule(vec2 p) {
    vec2 q = vec2(max(abs(p.x) - 0.34, 0.0), p.y * 1.28);
    return length(q) * 1.18;
  }

  float metaballs(vec2 p, float spread) {
    float a = 0.20 / (dot(p - vec2(spread, 0.0), p - vec2(spread, 0.0)) + 0.035);
    float b = 0.20 / (dot(p + vec2(spread, 0.0), p + vec2(spread, 0.0)) + 0.035);
    return a + b;
  }

  float shapeDistance(vec2 p) {
    if (uMorph < 0.5) return length(p);
    if (uMorph < 1.5) return ellipse(p, vec2(0.78, 1.16));
    if (uMorph < 2.5) return capsule(p);
    if (uMorph < 3.5) return 1.0 / max(metaballs(p, 0.28), 0.001) * 2.38;
    if (uMorph < 4.5) {
      vec2 curved = vec2(p.x, p.y + 0.42 * (p.x * p.x - 0.18));
      return ellipse(curved, vec2(0.76, 1.22));
    }
    float angle = atan(p.y, p.x);
    float lobes = sin(angle * 3.0 + uPhase) * 0.055 + sin(angle * 5.0 - uPhase) * 0.025;
    return length(p) - lobes;
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float t = uTime * 0.52 + uPhase;
    float fieldNoise = noise(p * 3.1 + vec2(t * 0.17, -t * 0.13));
    float membraneWave =
      sin(atan(p.y, p.x) * 5.0 + t * 2.2) * 0.024 +
      sin(atan(p.y, p.x) * 8.0 - t * 1.45) * 0.012 +
      (fieldNoise - 0.5) * 0.035;
    float distanceToMembrane = shapeDistance(p) + membraneWave - 0.72;
    float body = 1.0 - smoothstep(-0.015, 0.025, distanceToMembrane);
    float rim = 1.0 - smoothstep(0.018, 0.105, abs(distanceToMembrane));
    float inner = 1.0 - smoothstep(-0.36, -0.04, distanceToMembrane);

    vec2 drift = vec2(sin(t * 0.7), cos(t * 0.58)) * 0.055;
    vec2 organelleP = p + drift;
    float nucleoidLine = abs(organelleP.y - sin(organelleP.x * 7.0 + t) * 0.12);
    float nucleoid = (1.0 - smoothstep(0.018, 0.075, nucleoidLine)) *
      (1.0 - smoothstep(0.15, 0.58, abs(organelleP.x))) * inner;

    vec2 granuleGrid = floor((p + 0.8) * 8.0);
    vec2 granuleCell = fract((p + 0.8) * 8.0) - 0.5;
    float granuleSeed = hash21(granuleGrid + floor(uPhase * 11.0));
    float granules = (1.0 - smoothstep(0.09, 0.23, length(granuleCell))) *
      step(0.73, granuleSeed) * inner;

    float caustic = noise(p * 5.5 - vec2(t * 0.14, t * 0.09));
    float specular = pow(max(0.0, 1.0 - length(p - vec2(-0.2, 0.23)) * 1.35), 8.0);
    vec3 deepColor = mix(uColor * 0.055, uColor * 0.34, caustic);
    vec3 color = deepColor * body;
    color += uColor * rim * (1.38 + uThreat * 0.52);
    color += mix(uColor, vec3(0.88, 1.0, 1.0), 0.68) * nucleoid * 1.22;
    color += vec3(0.84, 1.0, 0.97) * granules * 0.92;
    color += vec3(0.84, 1.0, 1.0) * specular * body * 0.76;
    color += uColor * (1.0 - smoothstep(0.0, 0.82, length(p))) * 0.15;

    float alpha = body * (0.64 + rim * 0.34);
    if (alpha < 0.015) discard;
    gl_FragColor = vec4(color, alpha);
  }
`
