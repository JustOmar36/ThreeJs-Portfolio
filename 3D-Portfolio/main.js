import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; // Correct import for GLTFLoader
import './style.css';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const canvas = document.querySelector('.webgl')
const renderer = new THREE.WebGLRenderer({ canvas });
const loader = new GLTFLoader();

// Set camera position
camera.position.set(10, 2, 5);
camera.lookAt(0, 0, 0);


//Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true;
controls.enablePan = false;

// Load Island Model
loader.load('./Models/Portfolio-Island GLB.glb', function (gltf) {
    const island = gltf.scene;
    island.traverse((child) => {
        if (child.name === 'Invisible') {
            child.visible = false;
        }
    });
    scene.add(island);
    if (gltf.lights) {
        console.log('Lights included in model:', gltf.lights);
    }
    island.position.set(0, 0, 0); // Adjust model position if needed
    island.scale.set(0.5, 0.5, 0.5); // Scale model down if it's too large
});

// Set renderer size and pixel ratio
renderer.setSize(window.innerWidth, window.innerHeight);
// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

animate();
