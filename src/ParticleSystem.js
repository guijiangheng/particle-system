export default class ParticleSystem {
  constructor(iterations) {
    this.friction = 1;
    this.iterations = iterations;
    this.forces = [];
    this.constraints = [];
    this.composites = [];
  }

  addComposite(composite) {
    this.composites.push(composite);
  }

  addForce(force) {
    this.forces.push(force);
  }

  addConstraint(constraint) {
    this.constraints.push(constraint);
  }

  updatePositions() {
    for (const composite of this.composites) {
      for (const particle of composite.particles) {
        const velocity = particle.getVelocity().multiply(this.friction);
        particle.prevPosition = particle.position;
        particle.position = particle.position.add(velocity);
        for (const force of this.forces) {
          force.applyForce(particle);
        }
      }
    }
  }

  applyConstraints() {
    for (const composite of this.composites) {
      composite.applyConstraint();
    }

    for (const composite of this.composites) {
      for (const particle of composite.particles) {
        for (const constraint of this.constraints) {
          constraint.applyConstraint(particle);
        }
      }
    }
  }

  updatePositionBuffer() {
    for (const composite of this.composites) {
      composite.updatePositionBuffer();
    }
  }

  update() {
    this.updatePositions();
    for (let i = 0; i < this.iterations; ++i) {
      this.applyConstraints();
    }
    this.updatePositionBuffer();
  }
}
