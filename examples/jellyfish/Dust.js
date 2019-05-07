import * as THREE from 'three';
import vertexShader from './shaders/dust-vert.glsl';
import fragmentShader from './shaders/dust-frag.glsl';

export default class Dust {
  constructor() {
    this.area = 300;
    this.particleSize = 32;
    this.particleCount = 8000;
    this.createPointMesh();
  }

  createParticles() {
    const { particleCount, area } = this;
    const areaHalf = area / 2;
    const vertices = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; ++i) {
      const index = i * 3;
      vertices[index] = Math.random() * area - areaHalf;
      vertices[index + 1] = Math.random() * area - areaHalf;
      vertices[index + 2] = Math.random() * area - areaHalf;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));

    return geometry;
  }

  createTexture() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const texture = new THREE.Texture(canvas);

    const size = Math.pow(2, 6);
    const sizeHalf = size / 2;
    const rings = 2;

    canvas.width = canvas.height = size;

    for (let i = 0; i < rings; ++i) {
      let radius = THREE.Math.mapLinear(i * i, 0, 1, 4, sizeHalf);
      let alpha = THREE.Math.mapLinear(i, 0, 1, 1, 0.05);
      context.beginPath();
      context.fillStyle = '#fff';
      context.arc(sizeHalf, sizeHalf, radius, 0, Math.PI * 2);
      context.globalAlpha = alpha;
      context.fill();
    }

    texture.needsUpdate = true;

    return texture;
  }

  createMaterial() {
    return new THREE.RawShaderMaterial({
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        time: { value: 0 },
        size: { value: this.particleSize },
        area: { value: this.area },
        scale: { value: 150 },
        opacity: { value: 0.95 },
        psColor: { value: new THREE.Color(0xffffff) },
        map: { value: this.createTexture() }
      },
      vertexShader,
      fragmentShader
    });
  }

  createPointMesh() {
    this.points = new THREE.Points(
      this.createParticles(),
      this.createMaterial()
    );
  }

  addTo(scene) {
    scene.add(this.points);
  }

  update() {
    this.points.material.uniforms.time.value += 0.1;
  }
}
