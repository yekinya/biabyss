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
  uniform float uLocomotion;
  uniform float uStride;
  uniform float uRearFollow;
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
    float frontMask = smoothstep(-0.32, 0.62, p.x);
    float frontStretch = 1.0 + uLocomotion * uStride * 0.16;
    float rearStretch = 1.0 + uLocomotion * uRearFollow * 0.09;
    float localStretch = mix(rearStretch, frontStretch, frontMask);
    vec2 softP = vec2(
      (p.x - uLocomotion * (uStride - uRearFollow) * 0.035) / localStretch,
      p.y * (1.0 + uLocomotion * 0.025)
    );
    float fieldNoise = noise(softP * 3.1 + vec2(t * 0.17, -t * 0.13));
    float membraneWave =
      sin(atan(softP.y, softP.x) * 5.0 + t * 2.2) * 0.021 +
      sin(atan(softP.y, softP.x) * 8.0 - t * 1.45) * 0.01 +
      (fieldNoise - 0.5) * 0.03;
    float distanceToMembrane = shapeDistance(softP) + membraneWave - 0.72;
    float body = 1.0 - smoothstep(-0.025, 0.035, distanceToMembrane);
    float rim = 1.0 - smoothstep(0.012, 0.058, abs(distanceToMembrane));
    float inner = 1.0 - smoothstep(-0.36, -0.04, distanceToMembrane);

    vec2 drift = vec2(sin(t * 0.7), cos(t * 0.58)) * 0.055;
    drift.x -= uLocomotion * (0.035 + uStride * 0.045);
    vec2 organelleP = softP + drift;
    float nucleoidLine = abs(organelleP.y - sin(organelleP.x * 7.0 + t) * 0.12);
    float nucleoid = (1.0 - smoothstep(0.018, 0.075, nucleoidLine)) *
      (1.0 - smoothstep(0.15, 0.58, abs(organelleP.x))) * inner;

    float gather = 0.84 + sin(t * 1.18 + uPhase) * 0.1;
    vec2 galaxyP = organelleP / gather;
    float galaxyRadius = length(galaxyP);
    float galaxyAngle = atan(galaxyP.y, galaxyP.x);
    galaxyAngle += galaxyRadius * 2.6 - t * 0.34;
    galaxyP = mat2(cos(galaxyAngle), -sin(galaxyAngle), sin(galaxyAngle), cos(galaxyAngle)) * galaxyP;
    vec2 granuleGrid = floor((galaxyP + 0.8) * 9.0);
    vec2 granuleCell = fract((galaxyP + 0.8) * 9.0) - 0.5;
    float granuleSeed = hash21(granuleGrid + floor(uPhase * 11.0));
    float twinkle = 0.28 + 0.72 * (0.5 + 0.5 * sin(t * 6.4 + granuleSeed * 18.0));
    float granules = (1.0 - smoothstep(0.09, 0.23, length(granuleCell))) *
      step(0.68, granuleSeed) * inner * twinkle;

    float caustic = noise(softP * 5.5 - vec2(t * 0.14, t * 0.09));
    float specular = pow(max(0.0, 1.0 - length(softP - vec2(-0.2, 0.23)) * 1.35), 8.0);
    vec3 deepColor = mix(uColor * 0.055, uColor * 0.34, caustic);
    vec3 color = deepColor * body;
    color += uColor * rim * (0.56 + uThreat * 0.26);
    color += mix(uColor, vec3(0.88, 1.0, 1.0), 0.68) * nucleoid * 1.48;
    color += vec3(0.84, 1.0, 0.97) * granules * 1.85;
    color += vec3(0.84, 1.0, 1.0) * specular * body * 0.48;
    color += uColor * (1.0 - smoothstep(0.0, 0.82, length(softP))) * 0.18;

    float alpha = body * (0.67 + rim * 0.2);
    if (alpha < 0.015) discard;
    gl_FragColor = vec4(color, alpha);
  }
`
