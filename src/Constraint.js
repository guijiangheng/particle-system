import Vector3 from './Vector3';

export class Constraint {
  applyConstraint() {
    throw new Error('subclass must override this method');
  }
}

export class PinConstraint extends Constraint {
  constructor(particle, position) {
    super();
    this.particle = particle;
    this.position =
      typeof position === 'undefined' ? particle.position.clone() : position;
  }

  applyConstraint() {
    this.particle.position = this.position.clone();
  }
}

export class BoxConstraint extends Constraint {
  constructor(pMin, pMax, bounceFriction = 1) {
    super();
    this.pMin = pMin;
    this.pMax = pMax;
    this.bounceFriction = bounceFriction;
  }

  applyConstraint(particle) {
    const velocity = particle.getVelocity();
    for (const x of ['x', 'y', 'z']) {
      if (particle.position[x] < this.pMin[x]) {
        particle.position[x] = this.pMin[x];
        particle.prevPosition[x] =
          this.pMin[x] + velocity[x] * this.bounceFriction;
      } else if (particle.position[x] > this.pMax[x]) {
        particle.position[x] = this.pMax[x];
        particle.prevPosition[x] =
          this.pMax[x] + velocity[x] * this.bounceFriction;
      }
    }
  }
}

export class DistanceConstraint extends Constraint {
  constructor(particleA, particleB, distance) {
    super();
    this.particleA = particleA;
    this.particleB = particleB;
    this.distance =
      typeof distance === 'undefined'
        ? this.particleA.position.distance(this.particleB.position)
        : distance;
  }

  applyConstraint() {
    let v = this.particleA.position.sub(this.particleB.position);
    let dist = v.length();

    // avoid NAN
    if (dist < 0.0001) {
      v = new Vector3(0.1, 0, 0);
      dist = 0.1;
    }

    const diff = (this.distance - dist) / dist / 2;
    const offset = v.multiply(diff);
    this.particleA.position = this.particleA.position.add(offset);
    this.particleB.position = this.particleB.position.sub(offset);
  }
}
