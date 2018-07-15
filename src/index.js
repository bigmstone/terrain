
import {
  WebGLRenderer,
  PerspectiveCamera,
  StereoCamera,
  Scene,
  Mesh,
  MeshLambertMaterial,
  PlaneGeometry,
  PointLight,
  TextureLoader,
} from 'three';

import { Noise } from 'noisejs';

import Rock from './rock.jpg';

const noise = new Noise(Math.random());

class MainScene {
  constructor() {
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.rotation.x = 60 * Math.PI / 180;
    this.stereo = new StereoCamera();
    this.stereo.aspect = 0.5;
    this.renderer = new WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    this.camera.position.z = 15;
    this.noise = [];
    this.offset = 0.0;
    this.vrMode = false;

    this.bindFuncs = this.bindFuncs.bind(this);
    this.bindFuncs();
  }

  bindFuncs() {
    this.animate = this.animate.bind(this);
    this.buildGeom = this.buildGeom.bind(this);
    this.buildTerrain = this.buildTerrain.bind(this);
    this.buildLight = this.buildLight.bind(this);
    this.addButton = this.addButton.bind(this);
  }

  buildGeom() {
    this.buildTerrain();
    this.buildLight();
  }

  buildLight() {
    const light = new PointLight(0xffffff, 5, 100);
    light.position.set(0, 0, 10);
    this.scene.add(light);
  }

  buildTerrain() {
    const texture = new TextureLoader().load(Rock);
    const material = new MeshLambertMaterial({
      wireframe: true,
      map: texture,
    });
    const plane = new PlaneGeometry(150, 300, 100, 100);
    for (let i = 0, l = plane.vertices.length; i < l; i += 1) {
      const { x, y } = plane.vertices[i];
      const noiseVal = noise.perlin2(x / 15, y / 15) * 5;
      this.noise.push(noiseVal);
      plane.vertices[i].z = noiseVal;
    }
    this.terrain = new Mesh(plane, material);
    this.terrain.castShadow = true;
    this.terrain.receiveShadow = true;
    this.terrain.rotateZ(270 * Math.PI / 180);
    this.scene.add(this.terrain);
  }

  animate() {
    this.noise.forEach((noiseVal, index) => {
      const planeIndex = Math.floor((index + this.offset) % this.terrain.geometry.vertices.length);
      this.terrain.geometry.vertices[planeIndex].z = noiseVal;
    });

    this.offset += 0.5;

    this.terrain.geometry.verticesNeedUpdate = true;
    requestAnimationFrame(this.animate);

    if (!this.vrMode) {
      const size = this.renderer.getSize();
      this.renderer.setScissorTest(true);
      this.renderer.setScissor(0, 0, size.width, size.height);
      this.renderer.setViewport(0, 0, size.width, size.height);
      this.renderer.render(this.scene, this.camera);
      this.renderer.setScissorTest(false);
    } else {
      this.scene.updateMatrixWorld();
      if (this.camera.parent === null) this.camera.updateMatrixWorld();
      this.stereo.update(this.camera);
      const size = this.renderer.getSize();

      if (this.renderer.autoClear) this.renderer.clear();
      this.renderer.setScissorTest(true);

      this.renderer.setScissor(0, 0, size.width / 2, size.height);
      this.renderer.setViewport(0, 0, size.width / 2, size.height);
      this.renderer.render(this.scene, this.stereo.cameraL);

      this.renderer.setScissor(size.width / 2, 0, size.width / 2, size.height);
      this.renderer.setViewport(size.width / 2, 0, size.width / 2, size.height);
      this.renderer.render(this.scene, this.stereo.cameraR);

      this.renderer.setScissorTest(false);
    }
  }

  addButton() {
    const button = document.createElement('button');
    button.innerHTML = 'Toggle VR';

    const body = document.getElementsByTagName('body')[0];
    body.appendChild(button);

    button.style = 'z-index: 1; position: absolute; bottom: 0; right: 0;';

    button.addEventListener('click', () => {
      this.vrMode = !this.vrMode;
    });
  }
}

const msObj = new MainScene();
msObj.addButton();
msObj.buildGeom();
msObj.animate();
