import * as THREE from 'three';
import * as Faces from './Faces';
import * as Geometry from './Geometry';
import { Composite, Particle, Vector3 } from '../../src';
import vertexShader from './shaders/basic-vert.glsl';
import fragmentShader from './shaders/bulb-frag.glsl';

function ribRadius(k) {
  return (
    Math.sin(Math.PI - Math.PI * 0.55 * k * 1.8) + Math.log(k * 100 + 2) / 3
  );
}

function ribUvs(v, segments, buffer) {
  var st, su;
  for (let i = 1, il = segments; i < il; i++) {
    st = (i + 1) / (segments - 1);
    su = (st <= 0.5 ? st : 1 - st) * 2;
    buffer.push(su, v);
  }
  buffer.push(0, v);
}

export default class Jellyfish extends Composite {
  constructor() {
    super();

    this.size = 20;
    this.segments = 27;
    this.uvs = [];
    this.bulbFaces = [];
    this.ribs = [];

    this.createGeometry();
    this.createMeshs();
  }

  createGeometry() {
    const ribsCount = 20;
    this.createSpine();
    for (let i = 0; i < ribsCount; ++i) {
      this.createRib(i, ribsCount);
      if (i > 0) {
        this.createSkin(i - 1, i);
      }
    }
  }

  // 制作脊骨
  createSpine() {
    const { size, segments, uvs, particles, bulbFaces } = this;
    particles.push(new Particle(new Vector3(0, size, 0)));
    uvs.push(0, 0);
    Faces.radial(0, 1, segments, bulbFaces);
  }

  createRib(index, ribsCount) {
    const { size, segments, uvs } = this;
    const k = index / ribsCount;
    const y = size - k * size;
    const radius = ribRadius(k) * 10 + 0.5;
    Geometry.circle(segments, radius, y, this.particles);
    ribUvs(k, segments, uvs);
    this.ribs.push({
      radius,
      start: 1 + index * segments
    });
  }

  createSkin(indexA, indexB) {
    const { segments } = this;
    const ribA = this.ribs[indexA];
    const ribB = this.ribs[indexB];
    Faces.ring(ribA.start, ribB.start, segments, this.bulbFaces);
  }

  createMeshs() {
    const uvs = new THREE.BufferAttribute(new Float32Array(this.uvs), 2);
    const vertices = new THREE.BufferAttribute(this.getPositionBuffer(), 3);
    const indices = new THREE.BufferAttribute(
      new Uint16Array(this.bulbFaces),
      1
    );

    const geometry = new THREE.BufferGeometry();

    geometry.addAttribute('position', vertices);
    geometry.addAttribute('uv', uvs);
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    this.mesh = new THREE.Mesh(
      geometry,
      //   new THREE.MeshBasicMaterial()
      new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          opacity: { value: 1 }
        }
      })
    );
  }

  addTo(scene) {
    scene.add(this.mesh);
  }
}
