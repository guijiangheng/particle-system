import * as THREE from 'three';
import * as Links from './Links';
import * as Faces from './Faces';
import * as Geometry from './Geometry';
import {
  Composite,
  Particle,
  Vector3,
  DistanceConstraint,
  ParticleSystem,
  PinConstraint,
  DirectionalForce
} from '../../src';
import basicVertShader from './shaders/basic-vert.glsl';
import bulbFragShader from './shaders/bulb-frag.glsl';
import tailFragShader from './shaders/tail-frag.glsl';
import { AxisConstraint } from '../../src/Constraint';

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

function innerRibIndices(offset, start, segments, buffer) {
  const step = Math.floor(segments / 3);
  for (let i = 0; i < 3; ++i) {
    const a = offset + step * i;
    const b = offset + step * (i + 1);
    buffer.push(start + (a % segments), start + (b % segments));
  }
  return buffer;
}

export default class Jellyfish extends Composite {
  constructor() {
    super();

    this.gravity = -0.001;
    this.size = 20;
    this.segments = 27;
    this.tentacleSegmentLength = 1;

    this.uvs = [];
    this.bulbFaces = [];
    this.tailFaces = [];
    this.ribs = [];
    this.tentacles = [];
    this.links = [];

    this.createGeometry();
    this.createSystem();
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
      } else {
        this.attachTentacles();
      }
    }

    for (let i = 0; i < tailCount; ++i) {
      this.createTail(i, tailCount);
    }
  }

  // 制作脊骨
  createSpine() {
    const { size, segments, uvs, particles, bulbFaces } = this;
    Geometry.point(new Vector3(0, size, 0), particles);
    uvs.push(0, 0);
    Faces.radial(0, 1, segments, bulbFaces);
  }

  createRib(index, ribsCount) {
    const { size, segments, uvs, links } = this;
    const k = index / ribsCount;
    const y = size - k * size;
    const radius = ribRadius(k) * 10 + 0.5;
    const start = index * segments + 1;

    Geometry.circle(segments, radius, y, this.particles);
    ribUvs(k, segments, uvs);

    const ribIndices = Links.loop(start, segments, []);
    const ribLen = (2 * Math.PI * radius) / segments;
    const rib = this.distanceConstraints(ribIndices, ribLen * 0.9, ribLen);

    const innerIndices = [];
    innerRibIndices(0, start, segments, innerIndices);
    innerRibIndices(3, start, segments, innerIndices);
    innerRibIndices(6, start, segments, innerIndices);

    const innerRibLen = (Math.PI * 2 * radius) / 3;
    const innerRib = this.distanceConstraints(
      innerIndices,
      innerRibLen * 0.8,
      innerRibLen
    );

    if (index === 0) {
      const spineIndices = Links.radial(0, 1, segments, []);
      const spine = this.distanceConstraints(
        spineIndices,
        radius * 0.8,
        radius
      );
      this.addLinks(spineIndices);
      this.queneConstraints(spine);
    }

    this.queneConstraints(rib, innerRib);

    this.ribs.push({
      radius,
      start: 1 + index * segments
    });
  }

  createSkin(indexA, indexB) {
    const { segments, links, ribs, bulbFaces, particles } = this;
    const ribA = ribs[indexA];
    const ribB = ribs[indexB];
    const dist = particles[ribA.start].distance(particles[ribB.start]);

    const skinIndices = Links.ring(ribA.start, ribB.start, segments, []);
    const skin = this.distanceConstraints(skinIndices, dist * 0.5, dist);
    this.addLinks(skinIndices);
    this.queneConstraints(skin);

    Faces.ring(ribA.start, ribB.start, segments, bulbFaces);
  }

  createTentacleSegment(index) {
    const { segments, particles, uvs, tentacleSegmentLength } = this;
    const radius = 10;
    const y = -index * tentacleSegmentLength;
    const start = particles.length;

    Geometry.circle(segments, radius, y, particles);
    tentacleUvs(segments, uvs);

    this.tentacles.push({ start });
  }

  linkTentacle(a, b) {
    const { segments, tentacles, tentacleSegmentLength } = this;
    const tentA = tentacles[a];
    const tentB = tentacles[b];
    const indices = Links.ring(tentA.start, tentB.start, segments, []);
    const constraints = this.distanceConstraints(
      indices,
      tentacleSegmentLength * 0.5,
      tentacleSegmentLength
    );
    this.queneConstraints(constraints);
    this.addLinks(indices);
  }

  attachTentacles() {
    const { segments, ribs, tentacles, tentacleSegmentLength } = this;
    const rib = ribs[ribs.length - 1];
    const tentacle = tentacles[0];
    const indices = Links.ring(rib.start, tentacle.start, segments, []);
    const constraints = this.distanceConstraints(
      indices,
      tentacleSegmentLength * 0.5,
      tentacleSegmentLength
    );
    this.queneConstraints(constraints);
    this.addLinks(indices);
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
    const innerIndices = Links.line(innerStart, tailSegments, [0, innerStart]);
    const outerIndices = Links.line(outerStart, tailSegments, []);

    for (let i = 0; i < tailSegments; ++i) {
      Geometry.point(new Vector3(0, startOffset - i * innerSize, 0), particles);
      uvs.push(0, i / (tailSegments - 1));
    }

    const linkConstraints = [];
    const linkIndices = [];

    for (let i = 0; i < tailSegments; ++i) {
      const innerIndex = innerStart + i;
      const outerIndex = outerStart + i;
      const linkSize =
        Math.sin((i / (tailSegments - 1)) * Math.PI * 0.8) * linkSizeScale;
      const outerX = Math.cos(outerAngle) * linkSize;
      const outerZ = Math.sin(outerAngle) * linkSize;
      const outerY = startOffset - i * outterSize;

      Geometry.point(new Vector3(outerX, outerY, outerZ), particles);
      uvs.push(1, i / (tailSegments - 1));

      linkIndices.push(innerIndex, outerIndex);
      linkConstraints.push(
        new DistanceConstraint(
          particles[innerIndex],
          particles[outerIndex],
          linkSize
        )
      );

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

    const inner = this.distanceConstraints(
      innerIndices,
      innerSize * 0.25,
      innerSize
    );

    const outer = this.distanceConstraints(
      outerIndices,
      outterSize * 0.25,
      outterSize
    );

    const axis = this.axisConstraints(
      innerIndices,
      new Vector3(0, 20, 0),
      new Vector3(0, 0, 0)
    );

    this.queneConstraints(inner, outer, axis, linkConstraints);
    this.addLinks(outerIndices);
  }

  addLinks(links) {
    this.links.push(...links);
  }

  distanceConstraints(indices, minDistance, maxDistance) {
    const constraints = [];
    for (let i = 0; i < indices.length; i += 2) {
      constraints.push(
        new DistanceConstraint(
          this.particles[indices[i]],
          this.particles[indices[i + 1]],
          minDistance,
          maxDistance
        )
      );
    }
    return constraints;
  }

  axisConstraints(indices, startPoint, endPoint) {
    const constraints = [];
    for (let index of indices) {
      constraints.push(
        new AxisConstraint(startPoint, endPoint, this.particles[index])
      );
    }
    return constraints;
  }

  queneConstraints(...constraints) {
    for (const constraint of constraints) {
      if (constraint instanceof Array) {
        for (const c of constraint) {
          this.constraints.push(c);
        }
      } else {
        this.constraints.push(constraint);
      }
    }
  }

  createSystem() {
    const { gravity, particles, constraints } = this;
    constraints.push(new PinConstraint(particles[0]));
    this.system = new ParticleSystem(2);
    this.system.addComposite(this);
    this.system.addForce(new DirectionalForce(new Vector3(0, gravity, 0)));
  }

  createMeshs() {
    const uvs = new THREE.BufferAttribute(new Float32Array(this.uvs), 2);
    const vertices = new THREE.BufferAttribute(this.getPositionBuffer(), 3);

    this.vertices = vertices;

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

  update() {
    this.system.update();
    this.updatePositionBuffer();
    this.vertices.needsUpdate = true;
  }
}
