// @ts-check

export const cellVertexShader = /* glsl */ `
  attribute vec4 aCellData0;
  attribute vec4 aCellData1;
  attribute vec4 aCellData2;

  varying vec2 vUv;
  varying float vPhase;
  varying float vMorph;
  varying float vThreat;
  varying float vGaitPhase;
  varying float vFrontReach;
  varying float vDrive;
  varying float vRearCatch;
  varying float vAbsorption;
  varying float vFeeding;
  varying vec3 vColor;

  void main() {
    vUv = position.xy * 0.5 + 0.5;
    vPhase = aCellData0.x;
    vMorph = aCellData0.y;
    vThreat = aCellData0.z;
    vGaitPhase = aCellData0.w;
    vFrontReach = aCellData1.x;
    vDrive = aCellData1.y;
    vRearCatch = aCellData1.z;
    vAbsorption = aCellData1.w;
    vFeeding = aCellData2.x;
    vColor = aCellData2.yzw;
    vec4 transformed = vec4(position, 1.0);
    #ifdef USE_INSTANCING
      transformed = instanceMatrix * transformed;
    #endif
    gl_Position = projectionMatrix * modelViewMatrix * transformed;
  }
`

export const cellFallbackVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = position.xy * 0.5 + 0.5;
    vec4 transformed = vec4(position, 1.0);
    #ifdef USE_INSTANCING
      transformed = instanceMatrix * transformed;
    #endif
    gl_Position = projectionMatrix * modelViewMatrix * transformed;
  }
`

export const cellFallbackFragmentShader = /* glsl */ `
  precision mediump float;

  varying vec2 vUv;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float distanceToBody = length(p * vec2(0.82, 1.18)) - 0.58;
    float body = 1.0 - smoothstep(-0.018, 0.025, distanceToBody);
    float outerMembrane = 1.0 - smoothstep(0.012, 0.052, abs(distanceToBody));
    float innerMembrane = 1.0 - smoothstep(0.012, 0.036, abs(distanceToBody + 0.075));
    vec3 cytoplasm = vec3(0.58, 0.66, 0.61);
    vec3 membrane = vec3(0.11, 0.14, 0.13);
    vec3 color = mix(cytoplasm, membrane, max(outerMembrane, innerMembrane * 0.72));
    float alpha = body * (0.64 + outerMembrane * 0.3);
    if (alpha < 0.015) discard;
    gl_FragColor = vec4(color, alpha);
  }
`

export const cellFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  varying float vPhase;
  varying float vMorph;
  varying float vThreat;
  varying float vGaitPhase;
  varying float vFrontReach;
  varying float vDrive;
  varying float vRearCatch;
  varying float vAbsorption;
  varying float vFeeding;
  varying vec3 vColor;
  uniform float uTime;
  uniform float uOpticalStage;
  uniform float uPlaneOverscan;

  const float PI = 3.14159265359;
  const float TAU = 6.28318530718;

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

  float ellipseDistance(vec2 p, vec2 scale, float radius) {
    return length(p * scale) - radius;
  }

  float segmentDistance(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float projection = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
    return length(pa - ba * projection);
  }

  float micrococcusDistance(vec2 p) {
    return ellipseDistance(p, vec2(0.72, 1.46), 0.68);
  }

  float ciliophoranDistance(vec2 p) {
    float body = ellipseDistance(p + vec2(0.06, 0.0), vec2(0.72, 1.14), 0.67);
    float tailWave = sin(vGaitPhase * TAU + vPhase) * 0.1;
    float tail = segmentDistance(p, vec2(-0.48, 0.0), vec2(-0.96, tailWave)) - 0.035;
    return min(body, tail);
  }

  float larvoidDistance(vec2 p) {
    float body = segmentDistance(p, vec2(-0.55, 0.0), vec2(0.55, 0.0)) - 0.27;
    float legs = 10.0;
    for (int legIndex = 0; legIndex < 4; legIndex++) {
      float index = float(legIndex);
      float x = -0.45 + index * 0.3;
      float legSwing = sin(vGaitPhase * TAU + index * PI) * 0.075;
      float upper = segmentDistance(
        p,
        vec2(x, 0.18),
        vec2(x - 0.1 + legSwing, 0.46)
      ) - 0.027;
      float lower = segmentDistance(
        p,
        vec2(x, -0.18),
        vec2(x + 0.1 - legSwing, -0.46)
      ) - 0.027;
      legs = min(legs, min(upper, lower));
    }
    return min(body, legs);
  }

  float tentacleAmoebaDistance(vec2 p) {
    float angle = atan(p.y, p.x);
    float tendrils = pow(max(0.0, sin(angle * 5.0 + vGaitPhase * PI)), 7.0) * 0.24;
    float secondary = sin(angle * 3.0 - vPhase) * 0.055;
    return length(p) - (0.46 + tendrils + secondary + vFrontReach * 0.045);
  }

  float diplococcusDistance(vec2 p) {
    float leftCell = length(p - vec2(-0.29, 0.0)) - 0.39;
    float rightCell = length(p - vec2(0.29, 0.0)) - 0.39;
    float bridge = segmentDistance(p, vec2(-0.24, 0.0), vec2(0.24, 0.0)) - 0.13;
    return min(min(leftCell, rightCell), bridge);
  }

  float streptococcusDistance(vec2 p) {
    float chain = 10.0;
    for (int beadIndex = 0; beadIndex < 5; beadIndex++) {
      float index = float(beadIndex);
      vec2 center = vec2(-0.58 + index * 0.29, sin(index * 0.9 + vPhase) * 0.1);
      chain = min(chain, length(p - center) - 0.18);
    }
    return chain;
  }

  float spirillumDistance(vec2 p) {
    float spiral = 10.0;
    for (int segmentIndex = 0; segmentIndex < 6; segmentIndex++) {
      float index = float(segmentIndex);
      float nextIndex = index + 1.0;
      vec2 start = vec2(-0.66 + index * 0.22, sin(index * 1.7 + vPhase) * 0.17);
      vec2 end = vec2(-0.66 + nextIndex * 0.22, sin(nextIndex * 1.7 + vPhase) * 0.17);
      spiral = min(spiral, segmentDistance(p, start, end) - 0.095);
    }
    float tailWave = sin(vGaitPhase * TAU + vPhase) * 0.1;
    float frontTail = segmentDistance(p, vec2(0.44, 0.13), vec2(0.98, tailWave)) - 0.025;
    float rearTail = segmentDistance(p, vec2(-0.66, 0.0), vec2(-1.02, -tailWave)) - 0.025;
    return min(spiral, min(frontTail, rearTail));
  }

  float radiolarianDistance(vec2 p) {
    float capsule = length(p) - 0.42;
    float spines = 10.0;
    for (int spineIndex = 0; spineIndex < 8; spineIndex++) {
      float angle = float(spineIndex) * TAU / 8.0 + vPhase * 0.08;
      vec2 direction = vec2(cos(angle), sin(angle));
      float spine = segmentDistance(p, direction * 0.34, direction * 0.76) - 0.028;
      spines = min(spines, spine);
    }
    return min(capsule, spines);
  }

  float shapeDistance(vec2 p) {
    if (vMorph < 0.5) return micrococcusDistance(p);
    if (vMorph < 1.5) return ciliophoranDistance(p);
    if (vMorph < 2.5) return larvoidDistance(p);
    if (vMorph < 3.5) return tentacleAmoebaDistance(p);
    if (vMorph < 4.5) return diplococcusDistance(p);
    if (vMorph < 5.5) return streptococcusDistance(p);
    if (vMorph < 6.5) return spirillumDistance(p);
    if (vMorph < 7.5) return radiolarianDistance(p);
    return ellipseDistance(p, vec2(0.70, 1.28), 0.72);
  }

  float vacuoleRing(vec2 p, vec2 center, float radius) {
    return 1.0 - smoothstep(0.018, 0.05, abs(length(p - center) - radius));
  }

  float vacuoleCore(vec2 p, vec2 center, float radius) {
    return 1.0 - smoothstep(radius * 0.62, radius * 0.92, length(p - center));
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0 * uPlaneOverscan;
    float t = uTime * 0.075 + vPhase;
    float frontMask = smoothstep(-0.38, 0.68, p.x);
    float frontStretch = 1.0 + vFrontReach * 0.07;
    float rearCompression = 1.0 + vRearCatch * 0.035;
    vec2 softP = vec2(
      (p.x - (vFrontReach - vRearCatch) * 0.028) /
        mix(rearCompression, frontStretch, frontMask),
      p.y * (1.0 + vDrive * 0.035)
    );

    float membraneGrain = noise(softP * 9.0 + vec2(t * 0.08, -t * 0.05));
    float membraneAngle = atan(softP.y, softP.x);
    float ciliaStrength = vMorph > 0.5 && vMorph < 1.5 ? 0.018 : 0.007;
    float cilia = sin(membraneAngle * 27.0 + vGaitPhase * TAU) * ciliaStrength +
      (membraneGrain - 0.5) * 0.016;
    float distanceToMembrane = shapeDistance(softP) + cilia;
    float body = 1.0 - smoothstep(-0.018, 0.035, distanceToMembrane);
    float phaseHalo = 1.0 - smoothstep(0.018, 0.07, abs(distanceToMembrane - 0.045));
    float outerMembrane = 1.0 - smoothstep(0.007, 0.044 + vThreat * 0.018, abs(distanceToMembrane));
    float innerMembrane = 1.0 - smoothstep(0.01, 0.035, abs(distanceToMembrane + 0.075));
    float inner = 1.0 - smoothstep(-0.31, -0.045, distanceToMembrane);

    float stage01 = smoothstep(0.18, 0.92, uOpticalStage);
    float stage12 = smoothstep(1.12, 1.9, uOpticalStage);
    vec3 bodyColor = mix(
      mix(vec3(0.57, 0.66, 0.62), vec3(0.42, 0.54, 0.4), stage01),
      vec3(0.48, 0.5, 0.34),
      stage12
    );
    vec3 membraneColor = mix(vec3(0.075, 0.095, 0.09), vColor * 0.62, 0.34);
    float cytoplasm = noise(softP * 5.4 + vec2(t * 0.09, -t * 0.06));
    vec3 color = bodyColor * (0.88 + cytoplasm * 0.14);

    vec2 internalDrift = vec2(-vDrive * 0.035 + vRearCatch * 0.028, sin(t) * 0.008);
    vec2 organelleP = softP + internalDrift;
    float frontAxisX = 0.03 + vFrontReach * 0.25;
    float rearAxisX = -0.03 - vFrontReach * 0.08 + vRearCatch * 0.04;
    float frontAxis = 1.0 - smoothstep(
      0.052,
      0.145,
      length(organelleP - vec2(frontAxisX, 0.018))
    );
    float rearAxis = 1.0 - smoothstep(
      0.05,
      0.135,
      length(organelleP - vec2(rearAxisX, -0.018))
    );
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
    float granuleSeed = hash21(granuleGrid + floor(vPhase * 11.0));
    float granuleShape = (1.0 - smoothstep(0.075, 0.2, length(granuleCell))) *
      step(0.53, granuleSeed) * inner;
    float granuleDepth = 0.36 + granuleSeed * 0.5;

    color = mix(color, bodyColor * 1.08, vacuoleCenters * 0.46);
    color = mix(color, membraneColor * 0.66, vacuoleEdges * 0.76);
    color = mix(color, membraneColor * granuleDepth, granuleShape * 0.86);
    color = mix(color, membraneColor * 0.42, movementAxes * 0.88);
    color = mix(color, membraneColor * 0.82, innerMembrane * 0.72);
    color = mix(color, membraneColor, outerMembrane * (0.9 + vThreat * 0.08));
    color += phaseHalo * vec3(0.065, 0.075, 0.07);
    color = mix(color, membraneColor * 0.62, vAbsorption * 0.2);
    color = mix(color, bodyColor * 1.04, vFeeding * inner * 0.08);

    float alpha = body * (0.64 + outerMembrane * 0.29 + granuleShape * 0.06) + phaseHalo * 0.12;
    alpha *= 1.0 - vAbsorption * 0.18;
    if (alpha < 0.015) discard;
    gl_FragColor = vec4(color, alpha);
  }
`
