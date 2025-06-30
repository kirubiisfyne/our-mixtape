import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.141.0/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 2 / 1  , 0.1, 1000);
const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
const canvas = document.getElementById('obj-container');
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
camera.aspect = canvas.clientWidth / canvas.clientHeight;
camera.updateProjectionMatrix();
renderer.setPixelRatio(window.devicePixelRatio);

let mouseX = 0;
let mouseY = 0;

let isCursorOut = false;

let object;
let objToRender = 'mixtape';

const loader = new GLTFLoader();

loader.load(
    `models/${objToRender}/scene.gltf`,
    function (gltf) {
        object = gltf.scene;
        scene.add(object);
        object.position.set(0, 0, 0);
        object.scale.set(1, 1, 1);
    },
    function ( xhr ) {
        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    function ( error ) {
        console.error( 'An error happened while loading the model:', error );
    }
)

document.getElementById('obj-container').appendChild(renderer.domElement);
camera.position.z = objToRender === 'mixtape' ? 25 : 500;

const topLight = new THREE.DirectionalLight(0xffffff, 1);
topLight.position.set(500, 500, 0);
topLight.castShadow = true;
scene.add(topLight);

const ambientLight = new THREE.AmbientLight(0x333333, objToRender === 'mixtape' ? 5 : 1);
scene.add(ambientLight);

window.addEventListener('resize', () => {
    console.log(`New dimensions: ${canvas.clientWidth}x${canvas.clientHeight}`);
});

document.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget && !e.toElement) {
        isCursorOut = true;
    }
    else {
        isCursorOut = false;
    }
});

document.onmousemove = (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
};

let targetRotX = 0;
let targetRotY = 0;
let currentRotX = 0;
let currentRotY = 0;
const easing = 0.08;

function updateObjectRotation() {
    // Calculate target rotation based on mouse position
    targetRotY = mouseX * Math.PI / 16;
    targetRotX = mouseY * -Math.PI / 20;

    currentRotY += (targetRotY - currentRotY) * easing;
    currentRotX += (targetRotX - currentRotX) * easing;

    if (object) {
        object.rotation.y = currentRotY;
        object.rotation.x = currentRotX;
    }

    if (isCursorOut) {
        // Reset rotation when cursor is out of the window
        mouseX = 0;
        mouseY = 0;
    }
}

function animate() {
    updateObjectRotation();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}


animate();