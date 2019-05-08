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
  constructor(particleA, particleB, minDistance, maxDistance) {
    super();
    this.particleA = particleA;
    this.particleB = particleB;
    this.setDistance(minDistance, maxDistance);
  }

  setDistance(minDistance, maxDistance) {
    this.minDistance =
      typeof minDistance === 'undefined'
        ? this.particleA.position.distance(this.particleB.position)
        : minDistance;
    this.maxDistance =
      typeof maxDistance === 'undefined' ? this.minDistance : maxDistance;
  }

  applyConstraint() {
    const { minDistance, maxDistance, particleA, particleB } = this;
    let v = particleA.position.sub(particleB.position);
    let dist = v.length();

    if (dist < maxDistance && dist > minDistance) return;

    // avoid NAN
    if (dist < 0.0001) {
      v = new Vector3(0.1, 0, 0);
      dist = 0.1;
    }

    const distance = dist < minDistance ? minDistance : maxDistance;
    const diff = (distance - dist) / dist / 2;
    const offset = v.multiply(diff);
    particleA.position = particleA.position.add(offset);
    particleB.position = particleB.position.sub(offset);
  }
}

export class AxisConstraint extends Constraint {
  constructor(startPoint, endPoint, particle) {
    super();
    this.startPoint = startPoint;
    this.endPoint = endPoint;
    this.particle = this.particle;
    this.abNorm = this.endPoint.sub(this.startPoint).normalize();
  }

  applyConstraint() {
    const { abNorm, particle, startPoint } = this;
    const ac = particle.position.sub(startPoint);
    const projectLength = ac.dot(abNorm);
    const projectVector = abNorm.multiply(projectLength);
    particle.position = startPoint + projectVector;
  }
}
