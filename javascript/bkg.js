import * as THREE from 'three';

import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';

class BackgroundCanvas {
  constructor(count) {
    this.count = count;
    this.rowCount = Math.sqrt(this.count);

    this.setupCanvasElement = this.setupCanvasElement.bind(this);
    this.setupCamera = this.setupCamera.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.updateInstanceMatrices = this.updateInstanceMatrices.bind(this);
    this.animate = this.animate.bind(this);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(0xFFFFFF, 1);
    this.elt = this.setupCanvasElement();
    this.handleResize();

    this.scene = new THREE.Scene();

    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.1, 0.4, 0.85);
    this.composer.addPass(this.bloomPass);

    this.boxGeometry = new THREE.CapsuleGeometry(0.1, 1, 10, 20);
    this.boxMaterial = new THREE.MeshPhysicalMaterial({color: 0xffffff});

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
    this.scene.add(this.directionalLight);
    this.directionalTarget = new THREE.Object3D();
    this.directionalTarget.position.x = 0;
    this.directionalTarget.position.y = 1;
    this.directionalTarget.position.z = 1;
    this.scene.add(this.directionalTarget);
    this.directionalLight.target = this.directionalTarget;

    this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xcccccc, .99);
    this.scene.add(this.hemisphereLight);

    this.instanceMatrix = new THREE.Matrix4();
    this.mesh = new THREE.InstancedMesh(this.boxGeometry, this.boxMaterial, this.count);
    this.updateInstanceMatrices();
    this.scene.add(this.mesh);
  }

  setupCanvasElement() {
    const elt = this.renderer.domElement;
    elt.style.position = 'fixed';
    elt.style.zIndex = -1;
    elt.style.top = '0px';
    elt.style.right = '0px';
    elt.style.bottom = '0px';
    elt.style.left = '0px';
    document.body.appendChild(elt);
    return elt;
  }

  setupCamera() {
    return new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  }

  handleResize() {
    console.log('Window Size (', window.innerWidth, 'x', window.innerHeight, ')');
    this.camera = this.setupCamera();
    if (this.renderPass) {
      this.renderPass.camera = this.camera;

      this.composer.removePass(this.bloomPass);
      this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.1, 0.4, 0.85);
      this.composer.addPass(this.bloomPass);
    }
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateInstanceMatrices() {
    const rot = new THREE.Matrix4();
    rot.makeRotationX(Math.PI * 0.5);
    for (let i = 0; i < this.count; ++i) {
      const px = i % this.rowCount;
      const py = Math.floor(i / this.rowCount);
      const x = 5.5 - (px * 0.3);
      const y = 3 - (py * 0.3);
      this.instanceMatrix.makeTranslation(x, y, -2).multiply(rot);
      this.mesh.setMatrixAt(i, this.instanceMatrix);
    }
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.updateInstanceMatrices();
    this.camera.position.y = window.scrollY * -0.001;
    this.composer.render();
  }
}

const bkg = new BackgroundCanvas(1000);

window.addEventListener('resize', bkg.handleResize);

bkg.animate();