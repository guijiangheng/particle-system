import Vector3 from './Vector3';

export default class Particle {
  constructor(position = new Vector3(), prevPosition = position) {
    this.position = position;
    this.prevPosition = prevPosition;
  }

  distance(particle) {
    return this.position.distance(particle.position);
  }

  getVelocity() {
    return this.position.sub(this.prevPosition);
  }

  setVelocity(velocity) {
    this.prevPosition = this.position.sub(velocity);
  }
}
