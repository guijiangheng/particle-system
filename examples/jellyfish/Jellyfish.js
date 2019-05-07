import * as THREE from 'three';
import * as Links from './Links';
import * as Faces from './Faces';
import * as Geometry from './Geometry';
import { Composite, Particle, Vector3 } from '../../src';
import basicVertShader from './shaders/basic-vert.glsl';
import bulbFragShader from './shaders/bulb-frag.glsl';
import tailFragShader from './shaders/tail-frag.glsl';

function ribRadius(k) {
  return (
    Math.sin(Math.PI - Math.PI * 0.55 * k * 1.8) + Math.log(k * 100 + 2) / 3
  );
}

function tentacleUvs(segments, uvs) {
  for (let i = 0; i < segments; ++i) {
    uvs.push(0, 0);
  }
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
    this.tailFaces = [];
    this.ribs = [];
    this.tentacles = [];
    this.links = [];

    this.createGeometry();
    this.createMeshs();
  }

  createGeometry() {
    const ribsCount = 20;
    const tentacleSegments = 100;
    const tailCount = 3;

    this.createSpine();

    for (let i = 0; i < ribsCount; ++i) {
      this.createRib(i, ribsCount);
      if (i > 0) {
        this.createSkin(i - 1, i);
      }
    }

    for (let i = 0; i < tentacleSegments; ++i) {
      this.createTentacleSegment(i);
      if (i > 0) {
        this.linkTentacle(i - 1, i);
      }
    }

    for (let i = 0; i < tailCount; ++i) {
      this.createTail(i, tailCount);
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
    const { size, segments, uvs, links } = this;
    const k = index / ribsCount;
    const y = size - k * size;
    const radius = ribRadius(k) * 10 + 0.5;

    Geometry.circle(segments, radius, y, this.particles);
    ribUvs(k, segments, uvs);

    if (index === 0) {
      Links.radial(0, 1, segments, links);
    }

    this.ribs.push({
      radius,
      start: 1 + index * segments
    });
  }

  createSkin(indexA, indexB) {
    const { segments, links, ribs, bulbFaces } = this;
    const ribA = ribs[indexA];
    const ribB = ribs[indexB];
    Faces.ring(ribA.start, ribB.start, segments, bulbFaces);
    Links.ring(ribA.start, ribB.start, segments, links);
  }

  createTentacleSegment(index) {
    const { segments, particles, uvs } = this;
    const radius = 10;
    const tentacleSegmentLength = 1;
    const y = -index * tentacleSegmentLength;
    const start = particles.length;

    Geometry.circle(segments, radius, y, particles);
    tentacleUvs(segments, uvs);

    this.tentacles.push({ start });
  }

  linkTentacle(a, b) {
    const { segments, tentacles, links } = this;
    const tentA = tentacles[a];
    const tentB = tentacles[b];
    Links.ring(tentA.start, tentB.start, segments, links);
  }

  createTail(index, tailCount) {
    const { size, particles, uvs, tailFaces } = this;
    const tailSegments = 50;
    const innerSize = 1;
    const outterSize = innerSize * 1.8;
    const linkSizeScale = tailSegments * 0.25;
    const startOffset = size;
    const outerAngle = (Math.PI * 2 * index) / tailCount;

    const innerStart = particles.length;
    const innerEnd = innerStart + tailSegments - 1;
    const outerStart = innerEnd + 1;
    const innerIndices = [0, innerStart];
    const outerIndices = [];
    Links.line(innerStart, tailSegments, innerIndices);
    Links.line(outerStart, tailSegments, outerIndices);

    for (let i = 0; i < tailSegments; ++i) {
      particles.push(
        new Particle(new Vector3(0, startOffset - i * innerSize, 0))
      );
      uvs.push(0, i / (tailSegments - 1));
    }

    const linkIndices = [];
    const braceIndices = [];

    for (let i = 0; i < tailSegments; ++i) {
      const innerIndex = innerStart + i;
      const outerIndex = outerStart + i;
      const linkSize =
        Math.sin((i / (tailSegments - 1)) * Math.PI * 0.8) * linkSizeScale;
      const outerX = Math.cos(outerAngle) * linkSize;
      const outerZ = Math.sin(outerAngle) * linkSize;
      const outerY = startOffset - i * outterSize;

      particles.push(new Particle(new Vector3(outerX, outerY, outerZ)));
      uvs.push(1, i / (tailSegments - 1));

      linkIndices.push(innerIndex, outerIndex);

      if (i > 10) {
        braceIndices.push(innerIndex - 10, outerIndex);
      }

      if (i > 1) {
        Faces.quad(
          innerIndex - 1,
          outerIndex - 1,
          innerIndex,
          outerIndex,
          tailFaces
        );
      }
    }

    // this.addLinks(innerIndices);
    this.addLinks(outerIndices);
    // this.addLinks(linkIndices);
    // this.addLinks(braceIndices);
  }

  addLinks(links) {
    this.links.push(...links);
  }

  createMeshs() {
    const uvs = new THREE.BufferAttribute(new Float32Array(this.uvs), 2);
    const vertices = new THREE.BufferAttribute(this.getPositionBuffer(), 3);

    const linesGeom = new THREE.BufferGeometry();
    linesGeom.addAttribute('position', vertices);
    linesGeom.setIndex(
      new THREE.BufferAttribute(new Uint16Array(this.links), 1)
    );

    this.lines = new THREE.LineSegments(
      linesGeom,
      new THREE.LineBasicMaterial({
        opacity: 0.3,
        transparent: true
      })
    );
    this.lines.scale.multiplyScalar(1.1);

    const bulbGeom = new THREE.BufferGeometry();
    bulbGeom.addAttribute('position', vertices);
    bulbGeom.addAttribute('uv', uvs);
    bulbGeom.setIndex(
      new THREE.BufferAttribute(new Uint16Array(this.bulbFaces), 1)
    );
    bulbGeom.computeVertexNormals();

    this.bulb = new THREE.Mesh(
      bulbGeom,
      new THREE.RawShaderMaterial({
        vertexShader: basicVertShader,
        fragmentShader: bulbFragShader,
        side: THREE.DoubleSide,
        uniforms: {
          opacity: { value: 1 }
        }
      })
    );

    const tailGeom = new THREE.BufferGeometry();
    tailGeom.addAttribute('position', vertices);
    tailGeom.addAttribute('uv', uvs);
    tailGeom.setIndex(
      new THREE.BufferAttribute(new Uint16Array(this.tailFaces), 1)
    );

    this.tail = new THREE.Mesh(
      tailGeom,
      new THREE.RawShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        vertexShader: basicVertShader,
        fragmentShader: tailFragShader,
        uniforms: {
          opacity: { value: 0.5 }
        }
      })
    );
  }

  addTo(scene) {
    scene.add(this.bulb);
    scene.add(this.lines);
    scene.add(this.tail);
  }
}
