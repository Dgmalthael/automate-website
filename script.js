import * as THREE from 'https://cdn.skypack.dev/three@0.129.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/DRACOLoader.js';
import { gsap } from 'https://cdn.skypack.dev/gsap';

/* ══════════════════════════════════════
   3D BACKGROUND
══════════════════════════════════════ */
const camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

const scene = new THREE.Scene();
let bee, mixer;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
loader.load('/particle_wave_compressed.glb',
  (gltf) => {
    bee = gltf.scene;
    scene.add(bee);
    mixer = new THREE.AnimationMixer(bee);
    mixer.clipAction(gltf.animations[0]).play();
  },
  undefined, undefined
);

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const container3D = document.getElementById('conteiner3D');
if (container3D) container3D.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 5);
scene.add(ambientLight);
const topLight = new THREE.DirectionalLight(0xffffff, 2);
topLight.position.set(-500, 500, -500);
scene.add(topLight);
const bottomLight = new THREE.DirectionalLight(0xffffff, 2);
bottomLight.position.set(500, -500, 500);
scene.add(bottomLight);

let animSpeed = 0.005;

(function reRender3D() {
  requestAnimationFrame(reRender3D);
  renderer.render(scene, camera);
  if (mixer) mixer.update(animSpeed);
})();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* Scroll zoom + blur + slowdown — all tied to scroll position */
window.addEventListener('scroll', () => {
  const fraction = Math.min(window.scrollY / 1000, 1);
  gsap.to(camera.position, { z: 30 - fraction * 25, duration: 0.5, ease: 'power2.out' });

  if (container3D) container3D.style.filter = `blur(${fraction * 5}px)`;
  animSpeed = 0.005 - fraction * 0.004; // 0.005 at top → 0.001 at bottom
});

/* ══════════════════════════════════════
   DRAGGABLE SLIDER
══════════════════════════════════════ */
const slider = document.querySelector('.product-cards');
if (slider) {
  let isDown = false, startX, scrollLeft;
  slider.addEventListener('mousedown', (e) => {
    isDown = true;
    slider.classList.add('active');
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
    e.preventDefault(); // prevent native image/link drag from hijacking mousemove
  });
  slider.addEventListener('mouseleave', () => { isDown = false; slider.classList.remove('active'); });
  slider.addEventListener('mouseup', () => { isDown = false; slider.classList.remove('active'); });
  slider.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    slider.scrollLeft = scrollLeft - (e.pageX - slider.offsetLeft - startX) * 1.2;
  });

  // Touch support
  let touchStartX, touchScrollLeft;
  slider.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].pageX - slider.offsetLeft;
    touchScrollLeft = slider.scrollLeft;
  }, { passive: true });
  slider.addEventListener('touchmove', (e) => {
    const walk = e.touches[0].pageX - slider.offsetLeft - touchStartX;
    slider.scrollLeft = touchScrollLeft - walk;
  }, { passive: true });
}

/* ══════════════════════════════════════
   BLOG FILTER
══════════════════════════════════════ */
const filterBtns = document.querySelectorAll('.filter-btn');
const blogCards  = document.querySelectorAll('.blog-card');
const blogEmpty  = document.getElementById('blog-empty');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('filter-active'));
    btn.classList.add('filter-active');

    const filter = btn.dataset.filter;
    let visibleCount = 0;

    blogCards.forEach(card => {
      const match = filter === 'all' || card.dataset.category === filter;
      card.style.display = match ? '' : 'none';
      if (match) visibleCount++;
    });

    if (blogEmpty) {
      blogEmpty.style.display = visibleCount === 0 ? '' : 'none';
    }
  });
});

/* ══════════════════════════════════════
   FAQ ACCORDION (products page)
══════════════════════════════════════ */
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    /* close all */
    document.querySelectorAll('.faq-question').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.nextElementSibling.classList.remove('open');
    });
    /* toggle clicked */
    if (!isOpen) {
      btn.setAttribute('aria-expanded', 'true');
      btn.nextElementSibling.classList.add('open');
    }
  });
});

/* ══════════════════════════════════════
   CONTACT FORM
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  /* ── Hamburger menu ── */
  const toggle = document.querySelector('.nav-toggle');
  const nav    = document.querySelector('header nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open);
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', false);
      });
    });
  }

  /* ── Main contact form ── */
  const form = document.getElementById('contact-form');
  if (form) {
    const popup  = document.getElementById('popupMessage');
    const submit = form.querySelector('button[type="submit"]');

    function showPopup(msg, success = true) {
      popup.textContent = msg;
      popup.style.backgroundColor = success ? 'rgba(209,7,209,0.6)' : 'rgba(220,53,69,0.9)';
      popup.classList.add('show');
      setTimeout(() => popup.classList.remove('show'), 3500);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submit.disabled = true;
      submit.textContent = 'Sending…';
      try {
        const res    = await fetch(form.action, { method: 'POST', body: new FormData(form) });
        const result = await res.json();
        if (result.result === 'success') { showPopup("Message sent! We'll be in touch within 24 hours.", true); form.reset(); }
        else showPopup('Something went wrong: ' + (result.error || 'Unknown error'), false);
      } catch (err) {
        showPopup('Network error — please try again or email us directly.', false);
      } finally {
        submit.disabled = false;
        submit.textContent = 'Send Message';
      }
    });
  }

  /* ── Newsletter form (blog page) ── */
  const newsletter = document.getElementById('newsletter-form');
  if (newsletter) {
    const nlPopup = document.getElementById('newsletter-popup');

    newsletter.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = newsletter.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Subscribing…';
      try {
        const res    = await fetch(newsletter.action, { method: 'POST', body: new FormData(newsletter) });
        const result = await res.json();
        if (result.result === 'success') {
          nlPopup.textContent = "✓ Subscribed! You'll hear from us when new articles are published.";
          nlPopup.style.backgroundColor = 'rgba(209,7,209,0.6)';
          nlPopup.classList.add('show');
          newsletter.reset();
        } else {
          nlPopup.textContent = 'Something went wrong. Please try again.';
          nlPopup.style.backgroundColor = 'rgba(220,53,69,0.9)';
          nlPopup.classList.add('show');
        }
      } catch {
        nlPopup.textContent = 'Network error. Please try again.';
        nlPopup.style.backgroundColor = 'rgba(220,53,69,0.9)';
        nlPopup.classList.add('show');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Subscribe';
        setTimeout(() => nlPopup.classList.remove('show'), 4000);
      }
    });
  }
});
