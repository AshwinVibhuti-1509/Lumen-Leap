import * as THREE from 'three';

export default class Renderer extends THREE.WebGLRenderer {
  constructor() {
    const canvas = document.querySelector('canvas.game');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('The game canvas element was not found.');
    }

    super({ canvas, alpha: true, antialias: true });
    this.shadowMap.enabled = true;
    this.setSize(window.innerWidth, window.innerHeight);
  }

  resize() {
    this.setSize(window.innerWidth, window.innerHeight);
  }
}
