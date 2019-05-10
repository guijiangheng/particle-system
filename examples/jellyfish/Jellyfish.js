import * as THREE from 'three';
import * as Links from './Links';
import * as Faces from './Faces';
import * as Geometry from './Geometry';
import { Composite } from '../../src';

function ribRadius(t) {
  return (
    Math.sin(Math.PI - Math.PI * 0.55 * t * 1.8) + Math.log(t * 100 + 2) / 3
  );
}

function tailRibRadius(t) {
  return Math.sin(0.25 * t * Math.PI + 0.5 * Math.PI) * (1 - 0.9 * t);
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

function tentacleUvs(segments, uvs) {
  for (let i = 0; i < segments; ++i) {
    uvs.push(0, 0);
  }
}

export default class Jellyfish extends Composite {
  constructor() {
    super();

    this.size = 40;
    this.yOffset = 20;
    this.segments = 4;
    this.totalSegments = 4 * 9;
    this.tentacleSegments = 120;
    this.tentacleSegmentLength = 1.5;

    this.topStart = 3;
    this.uvs = [];
    this.links = [];
    this.tentacleLinks = [];
    this.innerLinks = [];
    this.ribs = [];
    this.tailRibs = [];
    this.bulbFaces = [];
    this.tailFaces = [];
    this.tentacles = [];

    this.createGeometry();
    this.createSceneItems();
  }

  createGeometry() {
    this.createCore();
    this.createBulb();
    this.createTail();
    this.createMouth();
    this.createTentacles();
  }

  createCore() {
    const { size, totalSegments, uvs, particles, bulbFaces, topStart } = this;
    const offsets = [size * 1.5, -size * 0.5, -size];

    for (const offset of offsets) {
      Geometry.point(0, offset, 0, particles);
      uvs.push(0, 0);
    }

    Faces.radial(0, topStart, totalSegments, bulbFaces);
  }

  createBulb() {
    const ribCount = 20;
    this.ribs = [];

    for (let i = 0; i < ribCount; ++i) {
      this.createRib(i, ribCount);
      if (i > 0) {
        this.createSkin(i - 1, i);
      }
    }
  }

  createRib(index, total) {
    const { topStart, totalSegments, size, yOffset, uvs, particles } = this;
    const k = index / total;
    const y = size + yOffset - k * size;
    const start = topStart + index * totalSegments;
    const radius = ribRadius(k) * 15;

    Geometry.circle(totalSegments, radius, y, particles);
    ribUvs(k, totalSegments, uvs);

    if (index === 0) {
      this.addLinks(Links.radial(0, start, totalSegments, []));
    }

    this.ribs.push({
      start,
      radius,
      yPos: y
    });
  }

  createSkin(r0, r1) {
    const { totalSegments, bulbFaces } = this;
    const rib0 = this.ribs[r0];
    const rib1 = this.ribs[r1];
    this.addLinks(Links.ring(rib0.start, rib1.start, totalSegments, []));
    Faces.ring(rib0.start, rib1.start, totalSegments, bulbFaces);
  }

  createTail() {
    const tailRibsCount = 15;
    this.tailRibs = [];
    for (let i = 0; i < tailRibsCount; ++i) {
      this.createTailRib(i, tailRibsCount);
      this.createTailSkin(i - 1, i);
    }
  }

  createTailRib(index, total) {
    const { size, totalSegments, ribs, verts, uvs, particles } = this;
    const lastRib = ribs[ribs.length - 1];
    const k = index / total;
    const y = lastRib.yPos - k * size * 0.8;
    const start = particles.length;
    const radius = tailRibRadius(k) * lastRib.radius;

    Geometry.circle(totalSegments, radius, y, particles);
    ribUvs(k, totalSegments, uvs);

    this.tailRibs.push({
      start,
      radius
    });
  }

  createTailSkin(r0, r1) {
    const { totalSegments, ribs, tailRibs, tailFaces, innerLinks } = this;
    const rib0 = r0 < 0 ? ribs[ribs.length - 1] : tailRibs[r0];
    const rib1 = tailRibs[r1];
    this.addLinks(
      Links.ring(rib0.start, rib1.start, totalSegments, []),
      innerLinks
    );
    Faces.ring(rib0.start, rib1.start, totalSegments, tailFaces);
  }

  createMouth() {
    this.createMouthArmGroup(1.0, 0, 4, 3);
    this.createMouthArmGroup(0.8, 1, 8, 3, 3);
    this.createMouthArmGroup(0.5, 7, 9, 6);
  }

  createMouthArmGroup(vScale, r0, r1, count, offset) {
    for (let i = 0; i < count; ++i) {
      this.createMouthArm(vScale, r0, r1, i, count, offset);
    }
  }

  createMouthArm(vScale, r0, r1, index, total, offset) {}

  createTentacles() {
    const groupCount = 3;
    for (let i = 0; i < groupCount; ++i) {
      this.createTentacleGroup(i, groupCount);
    }
  }

  ribAt(index) {
    const { ribs, tailRibs } = this;
    return (
      tailRibs[tailRibs.length - 1 - index] ||
      ribs[ribs.length - 1 - index + tailRibs.length]
    );
  }

  createTentacleGroup(index, total) {
    const { tentacleSegments } = this;
    const tentacleGroupStart = 6;
    const tentacleGroupOffset = 4;
    const ribIndex = tentacleGroupStart + tentacleGroupOffset * index;
    const rib = this.ribAt(ribIndex);
    const ratio = 1 - index / total;
    const segments = tentacleSegments * ratio * 0.25 + tentacleSegments * 0.75;

    for (let i = 0; i < segments; ++i) {
      this.createTentacleSegment(index, i, rib);
      if (i > 0) {
        this.linkTentacle(index, i - 1, i);
      } else {
        this.attachTentacles(index, rib);
      }
    }
  }

  createTentacleSegment(groupIndex, index, rib) {
    const { yOffset, totalSegments, tentacleSegmentLength, uvs } = this;
    const radius = rib.radius * (0.25 * Math.sin(index * 0.25) + 0.5);
    const y = yOffset - index * tentacleSegmentLength;
    const start = this.particles.length;

    Geometry.circle(totalSegments, radius, y, this.particles);
    tentacleUvs(totalSegments, uvs);

    if (index === 0) {
      this.tentacles.push([]);
    }

    this.tentacles[groupIndex].push({
      start
    });
  }

  linkTentacle(groupIndex, rib0, rib1) {
    const { totalSegments, tentacles, tentacleLinks } = this;
    const tent0 = tentacles[groupIndex][rib0];
    const tent1 = tentacles[groupIndex][rib1];
    const links = Links.ring(tent0.start, tent1.start, totalSegments, []);
    this.addLinks(links, tentacleLinks);
  }

  attachTentacles() {}

  createSceneItems() {
    this.item = new THREE.Group();
    this.uv = new THREE.BufferAttribute(new Float32Array(this.uvs), 2);
    this.position = new THREE.BufferAttribute(this.getPositionBuffer(), 3);

    // this.createDots();
    this.createLines();
    this.createBulbMesh();
    this.createTailMesh();
    this.createTentacleMesh();
  }

  createDots() {
    const geom = new THREE.BufferGeometry();
    geom.addAttribute('position', this.position);
    this.dots = new THREE.Points(geom, new THREE.PointsMaterial());
    this.item.add(this.dots);
  }

  createLines() {
    const geom = new THREE.BufferGeometry();
    const indices = new THREE.BufferAttribute(new Uint16Array(this.links), 1);
    geom.addAttribute('position', this.position);
    geom.setIndex(indices);

    this.lines = new THREE.LineSegments(
      geom,
      new THREE.RawShaderMaterial({
        vertexShader: require('./shaders/tentacle-vert.glsl').default,
        fragmentShader: require('./shaders/tentacle-frag.glsl').default,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          diffuse: { value: new THREE.Color(0xffdde9) },
          area: { value: 1200 },
          opacity: { value: 0.35 }
        }
      })
    );

    this.item.add(this.lines);
  }

  createBulbMesh() {
    const geom = new THREE.BufferGeometry();
    geom.addAttribute('position', this.position);
    geom.addAttribute('uv', this.uv);
    geom.setIndex(
      new THREE.BufferAttribute(new Uint16Array(this.bulbFaces), 1)
    );

    geom.computeVertexNormals();

    this.bulb = new THREE.Mesh(
      geom,
      new THREE.RawShaderMaterial({
        vertexShader: require('./shaders/normal-vert.glsl').default,
        fragmentShader: require('./shaders/bulb-frag.glsl').default,
        transparent: true,
        uniforms: {
          diffuse: { value: new THREE.Color(0xffa9d2) },
          diffuseB: { value: new THREE.Color(0x70256c) },
          time: { value: 0 },
          opacity: { value: 0.75 }
        }
      })
    );

    this.bulb.scale.multiplyScalar(0.95);
    this.item.add(this.bulb);

    this.bulbFaint = new THREE.Mesh(
      geom,
      new THREE.RawShaderMaterial({
        vertexShader: require('./shaders/normal-vert.glsl').default,
        fragmentShader: require('./shaders/gel-frag.glsl').default,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          diffuse: { value: new THREE.Color(0x415ab5) },
          opacity: { value: 0.25 }
        }
      })
    );

    this.bulbFaint.scale.multiplyScalar(1.05);
    this.item.add(this.bulbFaint);
  }

  createTailMesh() {
    const geom = new THREE.BufferGeometry();
    geom.addAttribute('position', this.position);
    geom.addAttribute('uv', this.uv);
    geom.setIndex(
      new THREE.BufferAttribute(new Uint16Array(this.tailFaces), 1)
    );

    geom.computeVertexNormals();

    this.tail = new THREE.Mesh(
      geom,
      new THREE.RawShaderMaterial({
        vertexShader: require('./shaders/normal-vert.glsl').default,
        fragmentShader: require('./shaders/tail-frag.glsl').default,
        transparent: true,
        uniforms: {
          diffuse: { value: new THREE.Color(0xe4bbee) },
          diffuseB: { value: new THREE.Color(0x241138) },
          scale: { value: 20 },
          opacity: { value: 0.75 }
        }
      })
    );

    this.tail.scale.multiplyScalar(0.95);
    this.item.add(this.tail);
  }

  createTentacleMesh() {
    const { position, tentacleLinks } = this;

    const geom = new THREE.BufferGeometry();
    geom.addAttribute('position', position);
    geom.setIndex(new THREE.BufferAttribute(new Uint16Array(tentacleLinks), 1));

    this.tentacleMesh = new THREE.LineSegments(
      geom,
      new THREE.RawShaderMaterial({
        vertexShader: require('./shaders/tentacle-vert.glsl').default,
        fragmentShader: require('./shaders/tentacle-frag.glsl').default,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          diffuse: { value: new THREE.Color(0x997299) },
          area: { value: 2000 },
          opacity: { value: 0.25 }
        }
      })
    );

    this.item.add(this.tentacleMesh);
  }

  addLinks(links, buffer) {
    buffer = buffer || this.links;
    buffer.push(...links);
  }

  addTo(scene) {
    scene.add(this.item);
  }

  updateLineWidth(lineWidth) {
    const thin = Math.round(lineWidth);
    const thick = Math.round(lineWidth * 2);
    this.lines.material.linewidth = thin;
    this.tentacleMesh.material.linewidth = thick;
  }

  update() {}
}
