import * as THREE from 'three';
import {
  Composite,
  Particle,
  Vector3,
  ParticleSystem,
  DirectionalForce,
  BoxConstraint
} from '../src/index';

import './styles.css';

const renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  0.1,
  3500
);

camera.position.set(0, 200, 500);
camera.lookAt(new THREE.Vector3());

const box = new THREE.Mesh(
  new THREE.BoxGeometry(100, 100, 100, 1, 1, 1),
  new THREE.MeshBasicMaterial({
    wireframe: true
  })
);
scene.add(box);

const system = new ParticleSystem(5);
system.friction = 0.99;

const gravity = new DirectionalForce(new Vector3(0, -0.1, 0));
system.addForce(gravity);

const boxConstraint = new BoxConstraint(
  new Vector3(-50, -50, -50),
  new Vector3(50, 50, 50)
);
system.addConstraint(boxConstraint);

const points = new Composite();
for (let x = -40; x < 40; x += 4)
  for (let z = -40; z < 40; z += 4) {
    const particle = new Particle(new Vector3(x, 40, z));
    particle.setVelocity(
      new Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      )
    );
    points.particles.push(particle);
  }

system.addComposite(points);

const pointsBufferGeometry = new THREE.BufferGeometry();
pointsBufferGeometry.addAttribute(
  'position',
  new THREE.BufferAttribute(points.getPositionBuffer(), 3)
);

scene.add(
  new THREE.Points(
    pointsBufferGeometry,
    new THREE.PointsMaterial({
      size: 3
    })
  )
);

(function animate() {
  requestAnimationFrame(animate);
  system.update();
  pointsBufferGeometry.attributes.position.needsUpdate = true;
  renderer.render(scene, camera);
})();

window.onresize = () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
};
