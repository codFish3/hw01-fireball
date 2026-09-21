import {vec3} from 'gl-matrix';
import Stats from 'stats-js';
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

import lambertVertSource from './shaders/lambert-vert.glsl?raw';
import lambertFragSource from './shaders/lambert-frag.glsl?raw';

import backgroundVertSource from './shaders/background-vert.glsl?raw';
import backgroundFragSource from './shaders/background-frag.glsl?raw';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
// const controls = {
//   tesselations: 5,
//   'Load Scene': loadScene, // A function pointer, essentially
// };

const defaults = {
  tesselations: 5,
  largeAmplitude: 0.18,
  detailAmplitude: 0.21,
  noiseScale: 7.3,
  animationSpeed: 1.0,
};

const controls = {
  ...defaults,
  'Load Scene': loadScene,
  'Reset Defaults': () => {
    Object.assign(controls, defaults);
  },
};

let icosphere: Icosphere;
let square: Square;
let prevTesselations: number = 5;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();

  gui.add(controls, 'tesselations', 0, 8)
    .step(1)
    .listen();

  gui.add(controls, 'Load Scene');

  gui.add(controls, 'largeAmplitude', 0.0, 0.6)
    .step(0.01)
    .name('Large amplitude')
    .listen();

  gui.add(controls, 'detailAmplitude', 0.0, 0.25)
    .step(0.01)
    .name('Detail amplitude')
    .listen();

  gui.add(controls, 'noiseScale', 2.0, 10.0)
    .step(0.1)
    .name('Noise scale')
    .listen();

  gui.add(controls, 'animationSpeed', 0.0, 3.0)
    .step(0.1)
    .name('Animation speed')
    .listen();

  gui.add(controls, 'Reset Defaults');

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, lambertVertSource),
    new Shader(gl.FRAGMENT_SHADER, lambertFragSource),
  ]);

  const background = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, backgroundVertSource),
    new Shader(gl.FRAGMENT_SHADER, backgroundFragSource),
  ]);

  let previousTime = performance.now();
  let animationTime = 0;

  // This function will be called every frame
  function tick() {
    const now = performance.now();
    const deltaSeconds = Math.min((now - previousTime) / 1000, 0.1);
    previousTime = now;

    animationTime += deltaSeconds * controls.animationSpeed;

    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    // draw bg first
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);

    background.setResolution(canvas.width, canvas.height);

    background.setTime(animationTime);

    renderer.render(camera, background, [square]);

    // draw ball after
    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);

    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }

    lambert.setTime(animationTime);

    lambert.setFireballParameters(
      controls.largeAmplitude,
      controls.detailAmplitude,
      controls.noiseScale
    );

    renderer.render(camera, lambert, [
      icosphere,
      // square,
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
