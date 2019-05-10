import * as THREE from 'three';
import * as Links from './Links';
import * as Faces from './Faces';
import * as Geometry from './Geometry';
import { Composite, DistanceConstraint, ParticleSystem, DirectionalForce, Vector3 } from '../../src';
import { AxisConstraint } from '../../src/Constraint';

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

function innerRibIndices(offset, start, segments, buffer) {
  const step = Math.floor(segments / 3);
  for (let i = 0 ; i < 3; ++i) {
    const a = offset + step * i;
    const b = offset + step * (i + 1);
    buffer.push(start + a % segments, start + b % segments);
  }
  return buffer;
}

export default class Jellyfish extends Composite {
  constructor() {
    super();

    this.size = 40;
    this.yOffset = 20;

    this.segments = 4;
    this.totalSegments = this.segments * 9;

    this.tailArmSegments = 100;
    this.tailArmSegmentLength = 1;
    this.tentacleSegments = 120;
    this.tentacleSegmentLength = 1.5;

    this.uvs = [];
    this.links = [];
    this.tentacleLinks = [];
    this.innerLinks = [];
    this.ribs = [];
    this.tailRibs = [];
    this.tentacles = [];
    this.bulbFaces = [];
    this.tailFaces = [];
    this.mouthFaces = [];
    this.constraints = [];

    this.createGeometry();
    this.createSystem();
    this.createSceneItems();
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
        new AxisConstraint(
          this.particles[startPoint].position,
          this.particles[endPoint].position,
          this.particles[index]
        )
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

  createGeometry() {
    this.createCore();
    this.createBulb();
    this.createTail();
    this.createMouth();
    this.createTentacles();
  }

  createCore() {
    const { size, yOffset, totalSegments, uvs, particles, bulbFaces } = this;

    const pinTop = (this.pinTop = 0);
    const pinMid = (this.pinMid = 1);
    const pintBottom = (this.pinBottom = 2);
    this.pinTail = 3;
    this.pinTentacle = 4;

    const indexTop = (this.indexTop = 5);
    const indexMid = (this.indexMid = 6);
    const indexBottom = (this.indexBottom = 7);
    const topStart = (this.topStart = 8);

    const {
      tailArmSegments,
      tailArmSegmentLength,
      tentacleSegments,
      tentacleSegmentLength
    } = this;
    
    const posTop = (this.posTop = yOffset + size);
    const posMid = (this.posMid = yOffset);
    const posBottom = (this.posBottom = yOffset - size);
    const posTail = (this.posTail = yOffset - tailArmSegments * tailArmSegmentLength);
    const posTentacle = (this.posTentacle = yOffset - tentacleSegments * tentacleSegmentLength * 1.5);

    const offsets = [
      posTop, posMid, posBottom, posTail, posTentacle,
      size * 1.5, -size * 0.5, -size
    ];

    for (const offset of offsets) {
      Geometry.point(0, offset, 0, particles);
      uvs.push(0, 0);
    }

    const rangeTop = [0, size * 0.5];
    const rangeMid = [size * 0.5, size * 0.7];
    const rangeTopBottom = [size, size * 2];
    const rangeBottom = [0, size * 0.5];

    const spineA = this.distanceConstraints([pinTop, indexTop], ...rangeTop);
    const spineB = this.distanceConstraints([indexTop, indexMid], ...rangeMid);
    const spineC = this.distanceConstraints([pintBottom, indexBottom], ...rangeBottom);
    const spineD = this.distanceConstraints([indexTop, indexBottom], ...rangeTopBottom);
    const axis = this.axisConstraints([indexTop, indexMid, indexBottom], pinTop, pinMid);

    this.queneConstraints(spineA, spineB, spineC, spineD, axis);
    Faces.radial(indexTop, topStart, totalSegments, bulbFaces);
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

    const ribIndices = Links.loop(start, totalSegments, []);
    const outerLen = Math.PI * 2 * radius / totalSegments;
    const outerRib = this.distanceConstraints(ribIndices, outerLen * 0.9, outerLen);

    const innerLen = Math.PI * 2 * radius / 3;
    const innerRib = this.createInnerRib(start, innerLen);

    const isTop = index === 0;
    const isBottom = index === total - 1;

    if (isTop || isBottom) {
      const spineCenter = isTop ? this.indexTop : this.indexBottom;
      const radiusSpine = isTop ? radius * 1.25 : radius;
      const spineIndices = Links.radial(spineCenter, start, totalSegments, []);
      const spine = this.distanceConstraints(
        spineIndices,
        radius * 0.5, radiusSpine
      );
      this.queneConstraints(spine);

      if (isTop) {
        this.addLinks(spineIndices);
      }
    }

    this.queneConstraints(outerRib, innerRib);

    this.ribs.push({
      start,
      radius,
      yPos: y
    });
  }

  createInnerRib(start, length) {
    const { segments, totalSegments } = this;
    const indices = [];
    for (let i = 0; i < segments; ++i) {
      innerRibIndices(i * 3, start, totalSegments, indices);
    }
    return this.distanceConstraints(indices, length * 0.8, length);
  }

  createSkin(r0, r1) {
    const { totalSegments, bulbFaces, particles } = this;
    const rib0 = this.ribs[r0];
    const rib1 = this.ribs[r1];

    const dist = particles[rib0.start].distance(particles[rib1.start]);
    const skinIndices = Links.ring(rib0.start, rib1.start, totalSegments, []);
    const skin = this.distanceConstraints(skinIndices, dist * 0.5, dist);
    this.queneConstraints(skin);
    this.addLinks(skinIndices);

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
    const { size, totalSegments, ribs, uvs, particles } = this;
    const lastRib = ribs[ribs.length - 1];
    const k = index / total;
    const y = lastRib.yPos - k * size * 0.8;
    const start = particles.length;
    const radius = tailRibRadius(k) * lastRib.radius;
    const radiusOuter = radius + k * 20;

    Geometry.circle(totalSegments, radius, y, particles);
    ribUvs(k, totalSegments, uvs);

    const outerIndices = Links.loop(start, totalSegments, []);
    const outerLen = Math.PI * 2 * radiusOuter / totalSegments;
    const outerRib = this.distanceConstraints(
      outerIndices, outerLen * 0.9, outerLen * 1.5
    );

    const innerLen = Math.PI * 2 * radius / 3;
    const innerRib = this.createInnerRib(start, innerLen);

    if (index === total - 1) {
      const spineCenter = this.indexMid;
      const spine = this.distanceConstraints(
        Links.radial(spineCenter, start, totalSegments, []),
        radius * 0.8, radius
      );
      this.queneConstraints(spine);
    }

    this.queneConstraints(outerRib, innerRib);

    if (index > 2) {
      this.addLinks(outerIndices);
    }

    this.tailRibs.push({
      start,
      radius
    });
  }

  createTailSkin(r0, r1) {
    const { totalSegments, ribs, tailRibs, tailFaces, particles } = this;
    const rib0 = r0 < 0 ? ribs[ribs.length - 1] : tailRibs[r0];
    const rib1 = tailRibs[r1];

    const dist = particles[rib0.start].position.distance(particles[rib1.start].position);
    const skin = this.distanceConstraints(
      Links.ring(rib0.start, rib1.start, totalSegments, []),
      dist * 0.5, dist
    );

    this.queneConstraints(skin);
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

  createMouthArm(vScale, r0, r1, index, total, offset = 0) {
    const {
      yOffset,
      totalSegments,
      tailArmSegments,
      uvs,
      particles,
      mouthFaces
    } = this;

    const k = index / total;
    const ribInner = this.ribAt(r0);
    const ribOuter = this.ribAt(r1);
    const ribIndex = (Math.round(totalSegments * k) + offset) % totalSegments;
    const segments = Math.round(vScale * tailArmSegments);
    const innerSize = 1;
    const outerSize = innerSize * 2.4;

    const innerPin = ribInner.start + ribIndex;
    const outerPin = ribOuter.start + ribIndex;
    const scale = particles[innerPin].position.distance(
      particles[outerPin].position
    );

    const innerStart = particles.length;
    const innerEnd = innerStart + segments - 1;
    const outerStart = innerEnd + 1;
    const innerIndices = Links.line(innerStart, segments, []);
    const outerIndices = Links.line(outerStart, segments, []);

    for (let i = 0; i < segments; ++i) {
      Geometry.point(0, yOffset - i * innerSize, 0, particles);
      uvs.push(i / (segments - 1), 0);
    }

    const angle = Math.PI * 2 * k;
    const baseX = Math.cos(angle);
    const baseZ = Math.sin(angle);

    for (let i = 0; i < segments; ++i) {
      const t = i / (segments - 1);
      const linkSize =
        scale *
        (Math.sin(Math.PI * 0.5 + 10 * t) * 0.25 + 0.75) *
        (Math.sin(Math.PI * 0.5 + 20 * t) * 0.25 + 0.75) *
        (Math.sin(Math.PI * 0.5 + 26 * t) * 0.15 + 0.85) *
         Math.sin(Math.PI * 0.5 + Math.PI * 0.45 * t);
      const outerX = baseX * linkSize;
      const outerZ = baseZ * linkSize;
      const outerY = yOffset - i * innerSize;

      Geometry.point(outerX, outerY, outerZ, particles);
      uvs.push(t, 1);

      const innerIndex = innerStart + i;
      const outerIndex = outerStart + i;
      // links.push(innerIndex, outerIndex);

      if (i > 1) {
        // links.push(innerIndex - 1, outerIndex);
        Faces.quad(
          innerIndex - 1,
          outerIndex - 1,
          outerIndex,
          innerIndex,
          mouthFaces
        );
      }

      if (i > 10) {
        // links.push(innerIndex - 10, outerIndex);
      }
    }

    this.addLinks(innerIndices);
    this.addLinks(outerIndices);
  }

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

    this.attachTentaclesSpine(index);
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
    const { totalSegments, tentacleSegmentLength, tentacles, tentacleLinks } = this;
    const tent0 = tentacles[groupIndex][rib0];
    const tent1 = tentacles[groupIndex][rib1];
    const indices = Links.ring(tent0.start, tent1.start, totalSegments, []);
    const links = this.distanceConstraints(indices, 0.5 * tentacleSegmentLength, tentacleSegmentLength);
    this.queneConstraints(links);
    this.addLinks(indices, tentacleLinks);
  }

  attachTentacles(groupIndex, rib) {
    const { tentacles, totalSegments, tentacleSegmentLength } = this;
    const tent = tentacles[groupIndex][0];
    const indices = Links.ring(rib.start, tent.start, totalSegments, []);
    this.queneConstraints(this.distanceConstraints(
      indices, tentacleSegmentLength * 0.5, tentacleSegmentLength
    ));
    this.addLinks(indices, this.tentacleLinks);
  }

  attachTentaclesSpine(groupIndex) {
    const { tentacles, pinTentacle, totalSegments } = this;
    const group = tentacles[groupIndex];
    const tent = group[group.length - 1];
    const start = tent.start;
    const center = pinTentacle;
    const dist = this.tentacleSegments * this.tentacleSegmentLength;
    const spine = this.distanceConstraints(
      Links.radial(center, start, totalSegments, []),
      dist * 0.5, dist
    );
    this.queneConstraints(spine);
  }

  createSystem() {
    this.system = new ParticleSystem(10);
    this.system.addComposite(this);
    this.system.addForce(new DirectionalForce(new Vector3(0, -0.01, 0)));
    this.pin(this.pinTop);
    this.pin(this.pinMid);
    this.pin(this.pinBottom);
    this.pin(this.pinTail);
    this.pin(this.pinTentacle);
  }

  createSceneItems() {
    this.item = new THREE.Group();
    this.uv = new THREE.BufferAttribute(new Float32Array(this.uvs), 2);
    this.position = new THREE.BufferAttribute(this.getPositionBuffer(), 3);

    this.createLines();
    this.createInnerLines();
    this.createBulbMesh();
    this.createTailMesh();
    this.createTentacleMesh();
    this.createMouthMesh();

    this.item.position.y = 20;
  }

  createLines() {
    const geom = new THREE.BufferGeometry();
    geom.addAttribute('position', this.position);
    geom.setIndex(new THREE.BufferAttribute(new Uint16Array(this.links), 1));

    this.lines = new THREE.LineSegments(
      geom,
      new THREE.RawShaderMaterial({
        vertexShader: require('./shaders/tentacle-vert.glsl').default,
        fragmentShader: require('./shaders/tentacle-frag.glsl').default,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          diffuse: { value: new THREE.Color(0xffdde9) },
          area: { value: 1200 },
          opacity: { value: 0.35 }
        }
      })
    );

    this.item.add(this.lines);
  }

  createInnerLines() {
    const geom = new THREE.BufferGeometry();
    geom.addAttribute('position', this.position);
    geom.setIndex(
      new THREE.BufferAttribute(new Uint16Array(this.innerLinks), 1)
    );

    this.linesInner = new THREE.LineSegments(
      geom,
      new THREE.LineBasicMaterial({
        color: 0xf99ebd,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false
      })
    );

    this.item.add(this.linesInner);
  }

  createBulbMesh() {
    const geom = new THREE.BufferGeometry();
    geom.addAttribute('position', this.position);
    geom.addAttribute('uv', this.uv);
    geom.setIndex(
      new THREE.BufferAttribute(new Uint16Array(this.bulbFaces), 1)
    );

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

  createMouthMesh() {
    const geom = new THREE.BufferGeometry();
    geom.addAttribute('position', this.position);
    geom.addAttribute('uv', this.uv);
    geom.setIndex(
      new THREE.BufferAttribute(new Uint16Array(this.mouthFaces), 1)
    );

    this.mouth = new THREE.Mesh(
      geom,
      new THREE.RawShaderMaterial({
        side: THREE.DoubleSide,
        vertexShader: require('./shaders/normal-vert.glsl').default,
        fragmentShader: require('./shaders/tail-frag.glsl').default,
        transparent: true,
        uniforms: {
          diffuse: { value: new THREE.Color(0xefa6f0) },
          diffuseB: { value: new THREE.Color(0x4a67ce) },
          scale: { value: 3 },
          opacity: { value: 0.65 }
        }
      })
    );

    this.item.add(this.mouth);
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
    this.linesInner.material.linewidth = thin;
    this.tentacleMesh.material.linewidth = thick;
  }

  update() {
    this.system.update();
    this.updatePositionBuffer();
    this.position.needsUpdate = true;
  }
}
