precision highp float;

uniform vec3 psColor;
uniform float opacity;
uniform float area;
uniform sampler2D map;

varying float centerDist;

void main() {
  vec4 diffuseColor = vec4(psColor, opacity);
  float radius = area * 0.5;
  float illumination = max(0.0, (radius - centerDist) / radius);

  vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
  diffuseColor *= texture2D(map, uv);

  gl_FragColor = vec4(diffuseColor.rgb, illumination * illumination * diffuseColor.a);
}
