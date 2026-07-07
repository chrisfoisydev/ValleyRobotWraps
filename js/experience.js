// Valley Robot Wraps — scroll-driven 3D wrap experience
// three.js renders a procedural humanoid; GSAP ScrollTrigger drives the
// camera, the wrap application, and the copy as the user scrolls.

import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   Renderer / scene bootstrap
   ============================================================ */

const canvas = document.getElementById('stage');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
} catch (e) {
  document.body.classList.add('no-webgl');
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070f);
scene.fog = new THREE.Fog(0x05070f, 7, 16);

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 60);

// camera rig proxies tweened by the scroll timeline
const camPos = { x: 0, y: 1.7, z: 5.4 };
const camTgt = { x: 0, y: 1.1, z: 0 };

/* ============================================================
   Lights
   ============================================================ */

const ambient = new THREE.AmbientLight(0x8899bb, 0.55);
const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(3.5, 4.5, 4);
const rimLight = new THREE.DirectionalLight(0x66d9ff, 1.5);
rimLight.position.set(-4, 3, -4);
const fillLight = new THREE.PointLight(0x8b8ff8, 1.1, 12);
fillLight.position.set(-2.5, 1.2, 3);
scene.add(ambient, keyLight, rimLight, fillLight);

/* ============================================================
   Ground + dust particles
   ============================================================ */

const groundTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(256, 256, 40, 256, 256, 256);
  grad.addColorStop(0, '#10182b');
  grad.addColorStop(0.55, '#0a0f1d');
  grad.addColorStop(1, '#05070f');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 512);
  return new THREE.CanvasTexture(c);
})();
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(9, 48),
  new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.9, metalness: 0.1 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const grid = new THREE.GridHelper(18, 36, 0x1c2a45, 0x111a2e);
grid.position.y = 0.002;
scene.add(grid);

const dust = (() => {
  const n = 260;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 14;
    pos[i * 3 + 1] = Math.random() * 5;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0x3b82c4, size: 0.02, transparent: true, opacity: 0.55 });
  return new THREE.Points(geo, mat);
})();
scene.add(dust);

/* ============================================================
   Materials
   ============================================================ */

const BARE = { color: 0xb9c2cf, metalness: 0.85, roughness: 0.32 };
const bareMat  = new THREE.MeshStandardMaterial(BARE);                 // never wrapped (joints, hands, feet)
const darkMat  = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });
const visorMat = new THREE.MeshStandardMaterial({ color: 0x020617, metalness: 0.4, roughness: 0.15 });
const eyeMat   = new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: 1.6 });

// wrap targets — start bare, tweened to brand colors on scroll
const torsoMat = new THREE.MeshStandardMaterial(BARE); // -> brand cyan
const chestMat = new THREE.MeshStandardMaterial(BARE); // -> brand indigo
const armMat   = new THREE.MeshStandardMaterial(BARE); // -> brand indigo
const thighMat = new THREE.MeshStandardMaterial(BARE); // -> brand cyan

const WRAP = {
  torso: new THREE.Color(0x06b6d4),
  chest: new THREE.Color(0x4f46e5),
  arm:   new THREE.Color(0x4f46e5),
  thigh: new THREE.Color(0x0891b2),
};

// hi-vis bands — dark amber until the night-shift chapter lights them up
const hivisMat = new THREE.MeshStandardMaterial({
  color: 0x6b4406, emissive: 0xf59e0b, emissiveIntensity: 0, metalness: 0.2, roughness: 0.5,
});
const HIVIS_ON = new THREE.Color(0xfbbf24);

/* ============================================================
   Text decals (canvas textures)
   ============================================================ */

function textPlane(draw, w, h) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = Math.round(512 * (h / w));
  draw(c.getContext('2d'), c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0 });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

const nameTag = textPlane((g, w, h) => {
  g.fillStyle = '#0f172a';
  g.beginPath(); g.roundRect(6, 6, w - 12, h - 12, 26); g.fill();
  g.strokeStyle = '#22d3ee'; g.lineWidth = 6; g.stroke();
  g.fillStyle = '#e2e8f0';
  g.font = `700 ${h * 0.52}px "Courier New", monospace`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('UNIT-042', w / 2, h / 2 + 4);
}, 0.24, 0.07);

const roleTag = textPlane((g, w, h) => {
  g.fillStyle = '#ffffff';
  g.font = `800 ${h * 0.62}px Arial, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.letterSpacing = '8px';
  g.fillText('LOGISTICS', w / 2, h / 2 + 2);
}, 0.26, 0.05);

// chest badge: dark disc + cyan check
const badgeGroup = new THREE.Group();
{
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.012, 32),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5, roughness: 0.35, transparent: true, opacity: 0 })
  );
  disc.rotation.x = Math.PI / 2;
  const check = textPlane((g, w, h) => {
    g.strokeStyle = '#22d3ee'; g.lineWidth = 60;
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(w * 0.28, h * 0.52); g.lineTo(w * 0.45, h * 0.7); g.lineTo(w * 0.74, h * 0.3); g.stroke();
  }, 0.085, 0.085);
  check.position.z = 0.008;
  badgeGroup.add(disc, check);
  badgeGroup.userData.fadeMats = [disc.material, check.material];
}

/* ============================================================
   Procedural humanoid (≈2 m tall, feet at y=0)
   ============================================================ */

const robot = new THREE.Group();
scene.add(robot);

const capsule = (r, len, mat) => new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 16), mat);
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
const ball = (r, mat) => new THREE.Mesh(new THREE.SphereGeometry(r, 20, 16), mat);
const band = (r, h) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), hivisMat);

// -- torso group (breathes) --
const torsoGrp = new THREE.Group();
robot.add(torsoGrp);

const pelvis = box(0.34, 0.17, 0.22, darkMat);
pelvis.position.y = 1.02;

const torso = box(0.46, 0.5, 0.27, torsoMat);
torso.position.y = 1.37;

const chestPlate = box(0.36, 0.24, 0.05, chestMat);
chestPlate.position.set(0, 1.44, 0.15);

const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.1, 20), bareMat);
waist.position.y = 1.14;

badgeGroup.position.set(-0.1, 1.47, 0.185);
nameTag.position.set(0.055, 1.45, 0.183);
roleTag.position.set(0, 1.6, 0.155);

torsoGrp.add(pelvis, torso, chestPlate, waist, badgeGroup, nameTag, roleTag);

// -- head group (pivot at neck) --
const headGrp = new THREE.Group();
headGrp.position.y = 1.64;
const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.09, 16), bareMat);
neck.position.y = 0.03;
const head = box(0.24, 0.2, 0.22, bareMat);
head.position.y = 0.17;
const visor = box(0.19, 0.075, 0.02, visorMat);
visor.position.set(0, 0.185, 0.112);
const eyeL = ball(0.016, eyeMat); eyeL.position.set(-0.05, 0.185, 0.124);
const eyeR = ball(0.016, eyeMat); eyeR.position.set(0.05, 0.185, 0.124);
headGrp.add(neck, head, visor, eyeL, eyeR);
robot.add(headGrp);

// -- arms (pivot groups at shoulders / elbows) --
function makeArm(side) { // side: -1 left, +1 right
  const shoulder = new THREE.Group();
  shoulder.position.set(side * 0.3, 1.56, 0);
  shoulder.add(ball(0.075, bareMat));

  const upper = capsule(0.062, 0.24, armMat);
  upper.position.y = -0.17;
  shoulder.add(upper);

  const elbow = new THREE.Group();
  elbow.position.y = -0.34;
  elbow.add(ball(0.055, bareMat));

  const fore = capsule(0.05, 0.22, bareMat);
  fore.position.y = -0.16;
  const hvBand = band(0.058, 0.07);
  hvBand.position.y = -0.22;
  const hand = box(0.07, 0.11, 0.05, darkMat);
  hand.position.y = -0.335;
  elbow.add(fore, hvBand, hand);

  shoulder.add(elbow);
  robot.add(shoulder);
  return { shoulder, elbow };
}
const armL = makeArm(-1);
const armR = makeArm(1);

// -- legs --
function makeLeg(side) {
  const hip = new THREE.Group();
  hip.position.set(side * 0.115, 0.98, 0);

  const thigh = capsule(0.078, 0.28, thighMat);
  thigh.position.y = -0.2;
  const knee = ball(0.065, bareMat);
  knee.position.y = -0.4;
  const shin = capsule(0.058, 0.3, bareMat);
  shin.position.y = -0.62;
  const hvBand = band(0.066, 0.08);
  hvBand.position.y = -0.7;
  const ankle = ball(0.052, bareMat);
  ankle.position.y = -0.86;
  const foot = box(0.12, 0.07, 0.25, darkMat);
  foot.position.set(0, -0.92, 0.045);
  hip.add(thigh, knee, shin, hvBand, ankle, foot);
  robot.add(hip);
  return hip;
}
makeLeg(-1);
makeLeg(1);

/* ============================================================
   Scan ring
   ============================================================ */

const scanRing = new THREE.Mesh(
  new THREE.TorusGeometry(0.7, 0.012, 10, 64),
  new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0 })
);
scanRing.rotation.x = Math.PI / 2;
scanRing.position.y = 0.05;
const scanLight = new THREE.PointLight(0x22d3ee, 0, 3);
scanRing.add(scanLight);
scene.add(scanRing);

/* ============================================================
   Scroll-driven master timeline
   ============================================================ */

// proxies the timeline tweens; the render loop applies them
const rig = { spin: 0, wave: 0, scanOpacity: 0 };

const tl = gsap.timeline({
  defaults: { ease: 'none' },
  scrollTrigger: {
    trigger: '#chapters',
    start: 'top top',
    end: 'bottom bottom',
    scrub: prefersReducedMotion ? true : 1,
  },
});

// --- chapter 1 → 2: pull in for the scan ---
tl.addLabel('intro')
  .to(camPos, { x: 2.4, y: 1.45, z: 3.1, duration: 1 }, 'intro')
  .to(camTgt, { y: 1.15, duration: 1 }, 'intro')
  .to(rig, { spin: -0.55, duration: 1 }, 'intro')
  // scan ring sweeps the body twice
  .to(scanRing.position, { y: 2.0, duration: 0.85 }, 'intro+=0.1')
  .to(scanRing.material, { opacity: 0.9, duration: 0.15 }, 'intro+=0.1')
  .to(scanLight, { intensity: 2.4, duration: 0.15 }, 'intro+=0.1')
  .to(scanRing.material, { opacity: 0, duration: 0.15 }, 'intro+=0.85')
  .to(scanLight, { intensity: 0, duration: 0.15 }, 'intro+=0.85');

// --- chapter 2 → 3: orbit to the other side, apply the wrap ---
tl.addLabel('wrap')
  .to(camPos, { x: -2.1, y: 1.5, z: 2.7, duration: 1 }, 'wrap')
  .to(camTgt, { y: 1.3, duration: 1 }, 'wrap')
  .to(rig, { spin: 0.5, duration: 1 }, 'wrap')
  .to(torsoMat.color, { r: WRAP.torso.r, g: WRAP.torso.g, b: WRAP.torso.b, duration: 0.45 }, 'wrap+=0.15')
  .to(torsoMat, { metalness: 0.3, roughness: 0.42, duration: 0.45 }, 'wrap+=0.15')
  .to(chestMat.color, { r: WRAP.chest.r, g: WRAP.chest.g, b: WRAP.chest.b, duration: 0.4 }, 'wrap+=0.3')
  .to(chestMat, { metalness: 0.3, roughness: 0.42, duration: 0.4 }, 'wrap+=0.3')
  .to(armMat.color, { r: WRAP.arm.r, g: WRAP.arm.g, b: WRAP.arm.b, duration: 0.35 }, 'wrap+=0.5')
  .to(armMat, { metalness: 0.3, roughness: 0.42, duration: 0.35 }, 'wrap+=0.5')
  .to(thighMat.color, { r: WRAP.thigh.r, g: WRAP.thigh.g, b: WRAP.thigh.b, duration: 0.35 }, 'wrap+=0.62')
  .to(thighMat, { metalness: 0.3, roughness: 0.42, duration: 0.35 }, 'wrap+=0.62');

// --- chapter 3 → 4: dolly into the chest, reveal identity ---
const badgeFades = [
  ...badgeGroup.userData.fadeMats,
  nameTag.material,
  roleTag.material,
];
tl.addLabel('badge')
  .to(camPos, { x: 0.15, y: 1.42, z: 1.55, duration: 1 }, 'badge')
  .to(camTgt, { x: 0, y: 1.42, duration: 1 }, 'badge')
  .to(rig, { spin: 0, duration: 1 }, 'badge');
badgeFades.forEach((m, i) => {
  tl.to(m, { opacity: 1, duration: 0.3 }, `badge+=${0.25 + i * 0.08}`);
});

// --- chapter 4 → 5: night shift — lights down, hi-vis up ---
tl.addLabel('hivis')
  .to(camPos, { x: 2.3, y: 0.95, z: 2.9, duration: 1 }, 'hivis')
  .to(camTgt, { y: 0.85, duration: 1 }, 'hivis')
  .to(rig, { spin: -0.75, duration: 1 }, 'hivis')
  .to(ambient, { intensity: 0.12, duration: 0.5 }, 'hivis+=0.1')
  .to(keyLight, { intensity: 0.5, duration: 0.5 }, 'hivis+=0.1')
  .to(fillLight, { intensity: 0.3, duration: 0.5 }, 'hivis+=0.1')
  .to(hivisMat, { emissiveIntensity: 2.2, duration: 0.5 }, 'hivis+=0.25')
  .to(hivisMat.color, { r: HIVIS_ON.r, g: HIVIS_ON.g, b: HIVIS_ON.b, duration: 0.5 }, 'hivis+=0.25');

// --- chapter 5 → 6: lights back up, full turn + wave ---
tl.addLabel('final')
  .to(camPos, { x: 0, y: 1.55, z: 5.0, duration: 1 }, 'final')
  .to(camTgt, { x: 0, y: 1.1, duration: 1 }, 'final')
  .to(ambient, { intensity: 0.55, duration: 0.4 }, 'final')
  .to(keyLight, { intensity: 2.2, duration: 0.4 }, 'final')
  .to(fillLight, { intensity: 1.1, duration: 0.4 }, 'final')
  .to(rig, { spin: Math.PI * 2 - 0.75 + 0.75, duration: 0.9 }, 'final') // finish a full turn, face front
  .to(rig, { wave: 1, duration: 0.6 }, 'final+=0.35');

/* ============================================================
   Chapter copy fades
   ============================================================ */

gsap.utils.toArray('.chapter').forEach((section, i, all) => {
  const copy = section.querySelector('.chapter-copy');
  const last = i === all.length - 1;
  gsap.fromTo(copy, { autoAlpha: 0, y: 60 }, {
    autoAlpha: 1, y: 0, ease: 'none',
    scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 45%', scrub: true },
  });
  if (!last) {
    gsap.to(copy, {
      autoAlpha: 0, y: -50, ease: 'none',
      scrollTrigger: { trigger: section, start: 'bottom 55%', end: 'bottom 25%', scrub: true },
    });
  }
});

// progress bar
ScrollTrigger.create({
  trigger: '#chapters', start: 'top top', end: 'bottom bottom',
  onUpdate: (self) => { document.getElementById('progress-fill').style.width = (self.progress * 100).toFixed(2) + '%'; },
});

/* ============================================================
   Render loop — applies rig proxies + idle motion
   ============================================================ */

const clock = new THREE.Clock();

function render() {
  const t = clock.getElapsedTime();

  robot.rotation.y = rig.spin;

  // idle life: breathing, head drift, slight arm sway
  if (!prefersReducedMotion) {
    torsoGrp.position.y = Math.sin(t * 1.4) * 0.008;
    headGrp.position.y = 1.64 + Math.sin(t * 1.4 + 0.4) * 0.006;
    headGrp.rotation.y = Math.sin(t * 0.5) * 0.12;
    headGrp.rotation.x = Math.sin(t * 0.7) * 0.04;
    armL.shoulder.rotation.x = Math.sin(t * 1.1) * 0.03;
    dust.rotation.y = t * 0.012;
  }

  // scroll-scrubbed wave: right arm raises, forearm oscillates
  const env = Math.sin(rig.wave * Math.PI); // 0→1→0 envelope across the wave
  armR.shoulder.rotation.z = -rig.wave * 2.2;
  armR.elbow.rotation.z = -env * 0.5 + Math.sin(rig.wave * Math.PI * 4) * 0.45 * env;
  if (rig.wave === 0) armR.shoulder.rotation.x = Math.sin(t * 1.1 + 2) * 0.03;

  camera.position.set(camPos.x, camPos.y, camPos.z);
  camera.lookAt(camTgt.x, camTgt.y, camTgt.z);

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

/* ============================================================
   Resize
   ============================================================ */

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
