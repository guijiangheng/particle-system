import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import Dust from './Dust';
import Jellyfish from './Jellyfish';

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

  update() {
    this.dust.update();
    this.jellyfish.update();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
