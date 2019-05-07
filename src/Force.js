export class Force {
  applyForce() {
    throw new Error('subclass must override this method');
  }
}

export class DirectionalForce extends Force {
  constructor(force) {
    super();
    this.force = force;
  }

  applyForce(particle) {
    particle.position = particle.position.add(this.force);
  }
}
