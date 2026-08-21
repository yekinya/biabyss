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
  uniform float uFrontReach;
  uniform float uDrive;
  uniform float uRearCatch;
  uniform float uOpticalStage;
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
    if (uMorph < 1.5) return ellipse(p, vec2(0.70, 1.28));
    if (uMorph < 2.5) return capsule(p);
    if (uMorph < 3.5) return 1.0 / max(metaballs(p, 0.28), 0.001) * 2.38;
    if (uMorph < 4.5) {
      vec2 curved = vec2(p.x, p.y + 0.42 * (p.x * p.x - 0.18));
      return ellipse(curved, vec2(0.76, 1.22));
    }
    float shapeAngle = atan(p.y, p.x);
    float lobes = sin(shapeAngle * 3.0 + uPhase) * 0.055 + sin(shapeAngle * 5.0 - uPhase) * 0.025;
    return length(p) - lobes;
  }

  float vacuoleRing(vec2 p, vec2 center, float radius) {
    return 1.0 - smoothstep(0.018, 0.05, abs(length(p - center) - radius));
  }

  float vacuoleCore(vec2 p, vec2 center, float radius) {
    return 1.0 - smoothstep(radius * 0.62, radius * 0.92, length(p - center));
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float t = uTime * 0.075 + uPhase;
    float frontMask = smoothstep(-0.38, 0.68, p.x);
    float frontStretch = 1.0 + uFrontReach * 0.07;
    float rearCompression = 1.0 + uRearCatch * 0.035;
    vec2 softP = vec2(
      (p.x - (uFrontReach - uRearCatch) * 0.028) / mix(rearCompression, frontStretch, frontMask),
      p.y * (1.0 + uDrive * 0.035)
    );

    float membraneGrain = noise(softP * 9.0 + vec2(t * 0.08, -t * 0.05));
    float membraneAngle = atan(softP.y, softP.x);
    float cilia = sin(membraneAngle * 23.0 + uPhase * 2.0) * 0.006 +
      (membraneGrain - 0.5) * 0.016;
    float distanceToMembrane = shapeDistance(softP) + cilia - 0.72;
    float body = 1.0 - smoothstep(-0.018, 0.035, distanceToMembrane);
    float outerHalo = 1.0 - smoothstep(0.03, 0.085, abs(distanceToMembrane - 0.035));
    float rim = 1.0 - smoothstep(0.008, 0.052 + uThreat * 0.018, abs(distanceToMembrane));
    float inner = 1.0 - smoothstep(-0.31, -0.045, distanceToMembrane);

    float stage01 = smoothstep(0.18, 0.92, uOpticalStage);
    float stage12 = smoothstep(1.12, 1.9, uOpticalStage);
    vec3 bodyColor = mix(
      mix(vec3(0.63, 0.66, 0.64), vec3(0.46, 0.54, 0.42), stage01),
      vec3(0.51, 0.51, 0.37),
      stage12
    );
    vec3 membraneColor = mix(vec3(0.14, 0.16, 0.16), uColor, 0.42);
    float cytoplasm = noise(softP * 5.4 + vec2(t * 0.09, -t * 0.06));
    vec3 color = bodyColor * (0.88 + cytoplasm * 0.14);

    vec2 internalDrift = vec2(-uDrive * 0.035 + uRearCatch * 0.028, sin(t) * 0.008);
    vec2 organelleP = softP + internalDrift;
    float frontAxisX = 0.03 + uFrontReach * 0.25;
    float rearAxisX = -0.03 - uFrontReach * 0.08 + uRearCatch * 0.04;
    float frontAxis = 1.0 - smoothstep(0.052, 0.145, length(organelleP - vec2(frontAxisX, 0.018)));
    float rearAxis = 1.0 - smoothstep(0.05, 0.135, length(organelleP - vec2(rearAxisX, -0.018)));
    float movementAxes = (frontAxis + rearAxis) * inner;

    float vacuoleA = vacuoleRing(organelleP, vec2(-0.2, 0.19), 0.12);
    float vacuoleB = vacuoleRing(organelleP, vec2(0.18, -0.18), 0.095);
    float vacuoleC = vacuoleRing(organelleP, vec2(0.34, 0.16), 0.065);
    float vacuoleEdges = (vacuoleA + vacuoleB + vacuoleC) * inner;
    float vacuoleCenters = (
      vacuoleCore(organelleP, vec2(-0.2, 0.19), 0.12) +
      vacuoleCore(organelleP, vec2(0.18, -0.18), 0.095) +
      vacuoleCore(organelleP, vec2(0.34, 0.16), 0.065)
    ) * inner;

    vec2 granuleGrid = floor((organelleP + 0.8) * 13.0);
    vec2 granuleCell = fract((organelleP + 0.8) * 13.0) - 0.5;
    float granuleSeed = hash21(granuleGrid + floor(uPhase * 11.0));
    float granuleShape = (1.0 - smoothstep(0.075, 0.2, length(granuleCell))) *
      step(0.53, granuleSeed) * inner;
    float granuleDepth = 0.36 + granuleSeed * 0.5;

    color = mix(color, bodyColor * 1.08, vacuoleCenters * 0.46);
    color = mix(color, membraneColor * 0.72, vacuoleEdges * 0.62);
    color = mix(color, membraneColor * granuleDepth, granuleShape * 0.72);
    color = mix(color, membraneColor * 0.42, movementAxes * 0.88);
    color = mix(color, membraneColor, rim * (0.82 + uThreat * 0.12));
    color += outerHalo * vec3(0.08, 0.085, 0.08);

    float alpha = body * (0.48 + rim * 0.38 + granuleShape * 0.08) + outerHalo * 0.07;
    if (alpha < 0.015) discard;
    gl_FragColor = vec4(color, alpha);
  }
`
