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
  uniform sampler2D uTexture;
  uniform float uTime;

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

  void main() {
    float time = uTime * 0.018;
    vec2 warp = vec2(
      noise(vUv * 5.0 + vec2(time, 0.0)),
      noise(vUv * 5.0 + vec2(0.0, -time))
    ) - 0.5;
    vec2 sampleUv = fract(vUv * 6.0 + warp * 0.055);
    vec3 textureColor = texture2D(uTexture, sampleUv).rgb;
    float fog = noise(vUv * 14.0 + warp * 2.0 + time);
    vec3 liquid = mix(vec3(0.002, 0.014, 0.021), vec3(0.012, 0.055, 0.063), fog * 0.52);
    gl_FragColor = vec4(mix(liquid, textureColor, 0.48), 1.0);
  }
`
