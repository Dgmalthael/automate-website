import * as THREE from 'https://cdn.skypack.dev/three@0.129.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'https://cdn.skypack.dev/gsap';


const camera = new THREE.PerspectiveCamera(
    10,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 30;

const scene = new THREE.Scene();
let bee;
let mixer;
const loader = new GLTFLoader();
loader.load('/particle_wave.glb',
    function (gltf) {
        bee = gltf.scene;
        scene.add(bee);
        mixer =  new THREE.AnimationMixer(bee);
        mixer.clipAction(gltf.animations[0]).play();
        
        
    },
    function (xhr) {},
    function (error) {}
);
const renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize(window.innerWidth, window.innerHeight);

document.getElementById('conteiner3D').appendChild(renderer.domElement);

// light
const ambientLight = new THREE.AmbientLight(0xffffff, 5);
scene.add(ambientLight);

const topLight = new THREE.DirectionalLight(0xffffff, 2);
topLight.position.set( -500,  500, -500);
scene.add(topLight);
const bottomLight = new THREE.DirectionalLight(0xffffff, 2);
topLight.position.set( 500,  -500, 500);
scene.add(bottomLight);

const reRender3D = () => {
    requestAnimationFrame(reRender3D);
    renderer.render(scene, camera);
    if(mixer) mixer.update(0.005);
};
reRender3D();


const slider = document.querySelector('.product-cards');
  let isDown = false;
  let startX;
  let scrollLeft;

  slider.addEventListener('mousedown', (e) => {
    isDown = true;
    slider.classList.add('active');
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
  });

  slider.addEventListener('mouseleave', () => {
    isDown = false;
    slider.classList.remove('active');
  });

  slider.addEventListener('mouseup', () => {
    isDown = false;
    slider.classList.remove('active');
  });

  slider.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 1.2; // Speed factor
    slider.scrollLeft = scrollLeft - walk;
  });






window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;

  // Adjust these values:
  const maxScroll = 1000;  // Total scroll range to apply zoom
  const minZ = 5;         // Closest the camera can go
  const maxZ = 30;         // Starting distance

  const scrollFraction = Math.min(scrollTop / maxScroll, 1); // Clamp between 0 and 1
  const targetZ = maxZ - (scrollFraction * (maxZ - minZ));
  
  // Smooth zoom using GSAP
  gsap.to(camera.position, {
    z: targetZ,
    duration: 0.5,
    ease: 'power2.out'
  });
});






 document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contact-form');
    const popupMessage = document.getElementById('popupMessage');
    const submitButton = form.querySelector('button[type="submit"]');

    // Function to show the popup message
    function showPopup(message, isSuccess = true) {
      popupMessage.textContent = message;
      popupMessage.style.backgroundColor = isSuccess ? 'rgb(209, 7, 209,0.6)' : 'rgba(220, 53, 69, 0.9)'; // Green for success, red for error
      popupMessage.classList.add('show');

      // Hide the popup after 3 seconds
      setTimeout(() => {
        popupMessage.classList.remove('show');
      }, 3000);
    }

    form.addEventListener('submit', async function(event) {
      event.preventDefault(); // Prevent default form submission (page reload)

      submitButton.disabled = true; // Disable button to prevent multiple submissions
      submitButton.textContent = 'Sending...'; // Change button text

      try {
        const formData = new FormData(form);
        const response = await fetch(form.action, {
          method: 'POST',
          body: formData // FormData can be sent directly
        });

        // The Google Apps Script returns JSON. Parse it.
        const result = await response.json();

        if (result.result === 'success') {
          showPopup('Message sent successfully!', true);
          form.reset(); // Clear the form fields on success
        } else {
          // Display the error message from the Apps Script
          showPopup('Error sending message: ' + (result.error || 'Unknown error'), false);
        }
      } catch (error) {
        // Handle network errors or issues before reaching the Apps Script
        showPopup('Network error. Please try again: ' + error.message, false);
      } finally {
        submitButton.disabled = false; // Re-enable the button
        submitButton.textContent = 'Send'; // Reset button text
      }
    });
  });









/*
let scrollY = 0;
const maxRotation = 5; // radians
const minRotation = 0;
const maxScroll = 1000; // adjust based on your page height

window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
});

const reRender3D = () => {
  requestAnimationFrame(reRender3D);

  if (bee) {
    // Clamp scrollY between 0 and maxScroll
    const clampedScroll = Math.min(scrollY, maxScroll);
    
    // Map scroll to rotation range (5 to 0)
    const rotationY = maxRotation - (clampedScroll / maxScroll) * maxRotation;
    bee.rotation.y = Math.max(minRotation, rotationY); // Ensure it doesn't go below 0
  }

  renderer.render(scene, camera);
  if (mixer) mixer.update(0.005);
};

reRender3D(); */