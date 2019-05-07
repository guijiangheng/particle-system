import Particle from './Particle';
import { PinConstraint } from '.';
import { DistanceConstraint } from './Constraint';

export class Composite {
  constructor() {
    this.particles = [];
    this.constraints = [];
  }

  pin(index) {
    this.constraints.push(new PinConstraint(this.particles[index]));
    return this;
  }

  applyConstraint() {
    for (const constraint of this.constraints) {
      constraint.applyConstraint();
    }
  }

  getIndexBuffer() {
    // defalut return null
    return null;
  }

  getPositionBuffer() {
    this.positionBuffer = new Float32Array(this.particles.length * 3);
    this.updatePositionBuffer();
    return this.positionBuffer;
  }

  updatePositionBuffer() {
    let index = 0;
    for (const particle of this.particles) {
      this.positionBuffer[index] = particle.position.x;
      this.positionBuffer[index + 1] = particle.position.y;
      this.positionBuffer[index + 2] = particle.position.z;
      index += 3;
    }
  }
}

export class Point extends Composite {
  constructor(position) {
    super();
    this.particles.push(new Particle(position));
  }
}

export class Line extends Composite {
  constructor(startPoint, endPoint, numParticles, length) {
    super();

    const v = endPoint.sub(startPoint);
    const segments = numParticles - 1;
    const step = v.divide(segments);

    for (let i = 0; i < numParticles; ++i) {
      this.particles.push(new Particle(startPoint.add(step.multiply(i))));
    }

    for (let i = 0; i < segments; ++i) {
      this.constraints.push(
        new DistanceConstraint(
          this.particles[i],
          this.particles[i + 1],
          length / segments
        )
      );
    }
  }

  pinFirst() {
    return this.pin(0);
  }

  pinLast() {
    return this.pin(this.particles.length - 1);
  }

  getIndexBuffer() {
    const indices = [];
    const segments = this.particles.length - 1;
    for (let i = 0; i < segments; ++i) {
      indices.push(i, i + 1);
    }
    return new Uint32Array(indices);
  }
}
