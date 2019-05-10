import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import Dust from './Dust';
import Jellyfish from './Jellyfish';

function mapRange(a0, b0, a1, b1, x) {
  const rangAInv = 1 / (b0 - a0);
  const rangB = b1 - a1;
  const t = (x - a0) * rangAInv;
  return a1 + t * rangB;
}

export default class App {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 5, 3500);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.debug.checkShaderErrors = true;
    this.renderer.setClearColor(0x0a060e, 1);

    this.initControls();
    this.setSize(400, 300);
    this.initScene();

    const scale = this.height / 1000;
    this.camera.position.set(scale * 400, scale * 300, 0);
    this.camera.lookAt(this.scene.position);
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;

    this.renderer.setSize(width, height);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    const scale = height / 1000;
    this.controls.minDistance = scale * 200;
    this.controls.maxDistance = scale * 1200;
    this.controls.handleResize();
  }

  initScene() {
    this.dust = new Dust();
    this.dust.addTo(this.scene);

    this.jellyfish = new Jellyfish();
    this.jellyfish.addTo(this.scene);
  }

  initControls() {
    const controls = new TrackballControls(this.camera);
    controls.rotateSpeed = 0.75;
    controls.zoomSpeed = 0.75;
    controls.panSpeed = 0.6;
    controls.noPan = true;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.2;
    this.controls = controls;
  }

  mapDistance(x) {
    const { minDistance, maxDistance } = this.controls;
    return mapRange(minDistance, maxDistance, 0, 1, x);
  }

  update() {
    const { dust, jellyfish, controls, renderer, camera, scene } = this;

    const distance = camera.position.length();
    const distNorm = this.mapDistance(distance);
    const lineWidth = Math.max(0.5, Math.round((1 - distNorm) * 2 * 1.5) / 2);
    jellyfish.updateLineWidth(lineWidth);

    dust.update();
    jellyfish.update();
    controls.update();
    renderer.render(this.scene, this.camera);
  }
}
