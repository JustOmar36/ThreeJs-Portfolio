import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; // Correct import for GLTFLoader
import './style.css';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const canvas = document.querySelector('.webgl');
const renderer = new THREE.WebGLRenderer({ canvas });
const loader = new GLTFLoader();
const playerSpeed = 0.02;
camera.position.x = 20;

let mixer; // Animation mixer
let idleAction, walkAction;
let currentAction; // To track the current action (animation)

const keys = {
    'a': false,
    'd': false
};

const raycaster = new THREE.Raycaster();
const downVector = new THREE.Vector3(0, -1, 0);
const buffer = 0.1;
let collisionObjects = [];
let island; // To keep reference to the island mesh


// Load Island Model
loader.load('./Models/Portfolio-Island GLB.glb', function (gltf) {
    island = gltf.scene;
    island.traverse((child) => {
        if (child.name === 'Invisible') {
            child.visible = false;
        }
        if (child.name === 'Sunlight') {
            child.intensity = 5;
        }
        if (child.name === 'Fire_Light') {
            child.intensity = 3;
        }
    });
    scene.add(island);

    scene.traverse(function (object) {
        if (object.isMesh) {  // Only add meshes to avoid adding unnecessary objects
            collisionObjects.push(object);
        }
    });

    island.position.set(0, 0, 0); // Adjust model position if needed
    island.scale.set(5, 5, 5);
});

//Player
let player;
loader.load('./Models/Character - Animation GLB.glb', function (gltf) {
    player = gltf.scene;
    scene.add(player);

    //animation mixer
    mixer = new THREE.AnimationMixer(player);

    gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        if (clip.name === 'Idle') {
            idleAction = action; // Assign idle animation
            idleAction.play(); // Start with idle animation
            currentAction = idleAction; // Set initial action to idle
        } else if (clip.name === 'Walk') {
            walkAction = action; // Assign walking animation
            action.clampWhenFinished = true; // Optional: clamp to the end
        }
    });

    if (!idleAction) {
        console.error("Idle animation not found! Check the animation names.");
    }

    //Player Pos
    player.position.set(40, 40, 0); // Center the player on the island
    player.scale.set(0.2, 0.2, 0.2);
});

function checkCollision() {
    if (collisionObjects.length === 0) return; // No objects to check

    // Cast the ray from above the player's position downwards
    raycaster.set(player.position.clone().add(new THREE.Vector3(0, 1, 0)), downVector);

    // Check intersections with all objects in the collisionObjects array
    const intersects = raycaster.intersectObjects(collisionObjects, true); // 'true' to check all children as well

    if (intersects.length > 0) {
        const closestObject = intersects[0];
        const terrainHeight = closestObject.point.y;

        // Adjust player's Y position based on the detected collision
        if (player.position.y !== terrainHeight + buffer) {
            player.position.y = terrainHeight + buffer;
        }
    }
}

// Set renderer size and pixel ratio
renderer.setSize(window.innerWidth, window.innerHeight);

// Inputs
document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
});
document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    camera.position.y = player.position.y + 10; // Fixed height
    camera.position.z = player.position.z + 10; // Set camera behind the player
    camera.lookAt(player.position); // Ensure the camera looks at the player

    if (mixer) {
        mixer.update(0.005); // Update the mixer with the delta time (adjust if needed)
    }

    if (player) {
        let isMoving = false;

        // Move left/right with boundary checks
        if (keys['d']) { // Right boundary
            player.position.z += playerSpeed; // Move right
            isMoving = true;
            player.rotation.y = 0;
            if(camera.position.x > 10){
                camera.position.x -= playerSpeed
            }
        }
        if (keys['a']) { // Left boundary
            player.position.z -= playerSpeed; // Move left
            isMoving = true;
            player.rotation.y = Math.PI;
            if(camera.position.x < 70){
                camera.position.x += playerSpeed
            }
        }
        

        // Change animations based on movement
        if (isMoving) {
            if (currentAction !== walkAction) { // Switch to walk if not already walking
                if (currentAction) currentAction.fadeOut(0.1); 
                currentAction = walkAction;
                currentAction.reset().fadeIn(0.1).play();
            }
        } else {
            if (currentAction !== idleAction) { // Switch to idle if not moving
                if (currentAction) currentAction.fadeOut(0.1);
                currentAction = idleAction;
                currentAction.reset().fadeIn(0.1).play();
            }
        }
        checkCollision();
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

animate();
