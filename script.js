import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.141.0/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(80, window.innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
renderer.setPixelRatio(window.devicePixelRatio);

//#region Global Variables
let mouseX = 0;
let mouseY = 0;

let isCursorOut = false;

let objects = [];
let objToRender = ['mixtape', 'walkman'];
const clock = new THREE.Clock();

let playlistLoaded = false;
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
function moveWalkman(direction) {
    if (!objects[1]) return;

    const targetYPos = direction ? 12.5 : 45;
    const targetScale = direction ? 1.2 : 0.3;
    let currentYPos = objects[1].position.y;
    let currentScale = objects[1].scale.x;

    currentYPos += (targetYPos - currentYPos)* 0.02;
    currentScale += (targetScale - currentScale)     * 0.02;

    objects[1].position.y = currentYPos;
    objects[1].scale.set(currentScale, currentScale, currentScale);
}

let startBob = false;
function bobWalkman() {
    if (!objects[1]) return;

    const time = clock.getElapsedTime();
    
    let bob = Math.sin(time * 3) * 0.01;

    objects[1].rotation.y += bob * 0.1;
    objects[1].rotation.z += bob * 0.125;
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

        console.log('Mixtape loaded!');
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
        object.position.set(1, 45, 0);
        object.rotation.set(0, 0, -6);
        object.scale.set(0.3, 0.3, 0.3);

        objects.push(object);
        adjustZ();

        console.log('Walkman loaded!');

    },
    function ( xhr ) {
        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    function ( error ) {
        console.error( 'An error happened while loading the model:', error );
    })
//#endregion

document.getElementById('obj-container').appendChild(renderer.domElement);
const canvas = renderer.domElement;
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
        playlistLoaded = true;

        playTrack(currentTrack);
        console.log(playlist[currentTrack]);
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

const letterObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                console.log('Observing Letter');
                willMoveWalkman = false;
            } else {
                if (playlistLoaded) {
                    willMoveWalkman = true;
                }
            }
        })
    },
    {
        threshold: 0.5
    }
);
letterObserver.observe(document.getElementById('letter'));

//#region Audio 
const playlist = [
            'See you again; Tyler, The Creator',
            'Something About You; Eyedress',
            'Is there free breakfast here?; Hotel Ugly',
            '2085; AJR',
            'Freaking Out the Neighborhood; Mac DeMarco',
            'Would That I; Hozier',
            'Snooze; SZA',
            'SWEET/I THOUGHT YOU WANTED TO DANCE; Tyler, The Creator',
            "Taking What's Not Yours; TV Girl",
            'Good Luck, Babe; Chappell Roan',
            'Loose; Daniel Ceasar',
            'BEST INTEREST; Tyler, The Creator',
            'Get You; Daniel Ceasar, Kali Uchis',
            'luther; Kendrick Lamar, SZA',
        ];

        let currentTrack = 0;
        const audioPlayer = document.getElementById('playlist-player');

        function playTrack(index) {
            console.log(audioPlayer.src = 'audio/playlist/' + String(playlist[index]) + '.mp3');
            audioPlayer.src = 'audio/playlist/' + playlist[index] + '.mp3';
            audioPlayer.play()

            let trackData = playlist[currentTrack].split('; ');
            document.getElementById('player-container').children[1].textContent = trackData[0];
            document.getElementById('player-container').children[2].textContent = trackData[1];
        }
        
        audioPlayer.addEventListener('ended', () => {
            currentTrack = (currentTrack + 1) % playlist.length;
            playTrack(currentTrack);
        });
//#endregion

function animate() {
    if (willMoveWalkman) {
        moveWalkman(true);
        document.addEventListener('animationend', () => {
            startBob = true;
        });
    } else {
        moveWalkman(false);
    }
    if (startBob) {
        bobWalkman();
    }
    updateObjectRotation();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();