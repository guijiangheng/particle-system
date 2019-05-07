precision highp float;

uniform float opacity;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float color = (sin(uv.y * 1000.0) - sin((1.0 - uv.x) * 3.0 + 1.2)) * uv.y;
  gl_FragColor = vec4(vec3(color), color * opacity);
}
