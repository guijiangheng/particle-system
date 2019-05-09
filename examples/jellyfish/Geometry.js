import { Particle, Vector3 } from '../../src';

export function point(x, y, z, particles) {
  particles.push(new Particle(new Vector3(x, y, z)));
}

export function circle(segments, radius, y, particles) {
  for (let i = 0; i < segments; ++i) {
    const angle = (i / segments) * Math.PI * 2;
    particles.push(
      new Particle(
        new Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
      )
    );
  }
}
