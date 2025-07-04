import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.141.0/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
renderer.setPixelRatio(window.devicePixelRatio);

//#region Global Variables
let mouseX = 0;
let mouseY = 0;

let isCursorOut = false;

let objects = [];
let objToRender = ['mixtape', 'walkman'];
let mixer;
//#endregion
//#region Functions
let targetRotX = 0;
let targetRotY = 0;
let currentRotX = 0;
let currentRotY = 0;
const easing = 0.08;
function updateObjectRotation() {
    targetRotY = mouseX * Math.PI / 16;
    targetRotX = mouseY * -Math.PI / 20;

    currentRotY += (targetRotY - currentRotY) * easing;
    currentRotX += (targetRotX - currentRotX) * easing;

    if (objects[0]) {
        objects[0].rotation.y = currentRotY;
        objects[0].rotation.x = currentRotX;
    }

    if (isCursorOut) {
        mouseX = 0;
        mouseY = 0;
    }
}

function adjustZ() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const baseDistance = 20;
    const currentAspect = window.innerWidth > window.innerHeight ? window.innerWidth / window.innerHeight : window.innerHeight / window.innerWidth;
    
    const aspectRatioClamped = Math.max(1, Math.min(currentAspect, 2));
    let newZ = baseDistance * aspectRatioClamped;

    camera.position.z = newZ;
}

let willMoveWalkman = false;
function moveWalkman() {
    const targetPos = 14;
    let currentYPos = objects[1].position.y;

    currentYPos += (targetPos - currentYPos) * 0.05;

    objects[1].position.set(0, currentYPos, 0);
}

let startBob = false;
const clock = new THREE.Clock();
function bobWalkman() {
    const time = clock.getElapsedTime();
    
    let bob = Math.sin(time * 2) * 0.02;

    objects[1].position.y += bob;
    
}
//#endregion

//#region Model Loader
const loader = new GLTFLoader();

//Mixtape
loader.load(
    `models/${objToRender[0]}/scene.gltf`,
    function (gltf) {
        let object = gltf.scene;
        scene.add(object);
        object.position.set(0, 0, 0);
        object.scale.set(1, 1, 1);

        objects.push(object);
        adjustZ();
    },
    function ( xhr ) {
        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    function ( error ) {
        console.error( 'An error happened while loading the model:', error );
    }
)
//Walkman
loader.load(
    `models/${objToRender[1]}/scene.gltf`,
    function (gltf) {
        let object = gltf.scene;
        scene.add(object);
        object.position.set(0, 40, 0);
        object.rotation.set(0, 0, -6);
        object.scale.set(1.2, 1.2, 1.2);

        objects.push(object);
        adjustZ();

        mixer = new THREE.AnimationMixer(object);
        gltf.animations.forEach((clip) => {
            mixer.clipAction(clip).play();
        })
    },
    function ( xhr ) {
        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    function ( error ) {
        console.error( 'An error happened while loading the model:', error );
    })
//#endregion

const canvas = document.getElementById('obj-container').appendChild(renderer.domElement);
camera.position.z = 25;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const topLight = new THREE.DirectionalLight(0xffffff, 1);
topLight.position.set(500, 500, 0);
topLight.castShadow = true;
scene.add(topLight);

const ambientLight = new THREE.AmbientLight(0x333333, 5);
scene.add(ambientLight);

window.addEventListener('resize', () => {
    adjustZ();
});

document.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget && !e.toElement) {
        isCursorOut = true;
    }
    else {
        isCursorOut = false;
    }

    console.log(isCursorOut);
});

document.addEventListener('touchmove', (e) => {
    mouseX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
    isCursorOut = false;
});

document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    isCursorOut = false;
})

canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObject(objects[0], true);

  if (intersects.length > 0) {
    console.log('Model clicked/touched!', intersects[0]);
    const titleArray = Array.from(document.getElementById('title-container').children);
    const objCont = document.getElementById('obj-container');
    const playlistCont = document.getElementById('playlist-container');

    titleArray.forEach(element => {
        element.classList.add('fade-out');
    });
    objCont.classList.add('fade-out');
    objCont.style.zIndex = '2';
    objCont.style.pointerEvents = 'none';

    objCont.addEventListener('animationend', () => {
        objects[0].visible = false;
        objCont.classList.add('fade-in');

        playlistCont.style.visibility = 'visible';
        playlistCont.style.zIndex = '1';
        playlistCont.classList.add('fade-in');

        willMoveWalkman = true;
        console.log('animation ended!');
    });
  }
});

const cards = document.querySelectorAll('.card');
const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            entry.target.style.animation = '';
        })

        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'rotate 0.5s ease forwards';
            }
        }),
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                entry.target.style.animation = 'rotate-back 0.5s ease forwards';
            }
        })
    },
    {
        root: document.querySelector('.card-list'),
        threshold: 0.75
    }
);

cards.forEach(card => observer.observe(card));

function animate() {
    if (willMoveWalkman) {
        moveWalkman();

        document.addEventListener('animationend', () => {
            startBob = true;
        })
    }
    if (startBob) {
        bobWalkman();
    }
    updateObjectRotation();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();