precision highp float;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform float time;
uniform float area;
uniform float size;
uniform float scale;

attribute vec3 position;

varying float centerDist;

void main() {
  float y = mod(position.y - time, area) - area * 0.5;
  vec3 p = vec3(
      position.x + sin(cos(y * 0.1) + sin(y * 0.1 + position.x * 0.1) * 2.0),
      y,
      position.z + sin(cos(y * 0.1) + sin(y * 0.1 + position.z * 0.1) * 2.0)
  );

  centerDist = length(p);

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);

  gl_PointSize = size * (scale / length(mvPosition.xyz));
  gl_Position = projectionMatrix * mvPosition;
}
