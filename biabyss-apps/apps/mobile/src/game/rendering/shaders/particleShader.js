// @ts-check

export const particleVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  varying float vAlpha;
  varying vec3 vColor;
  uniform float uPixelRatio;

  void main() {
    vAlpha = aAlpha;
    vColor = aColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = max(1.0, aSize * uPixelRatio);
  }
`

export const particleFragmentShader = /* glsl */ `
  precision mediump float;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float radius = length(p);
    if (radius > 0.5) discard;
    float body = 1.0 - smoothstep(0.28, 0.5, radius);
    float center = 1.0 - smoothstep(0.0, 0.42, radius);
    gl_FragColor = vec4(vColor * (0.72 + center * 0.28), body * vAlpha);
  }
`
