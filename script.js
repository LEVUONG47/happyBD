import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls";

// ============================================
// CẤU HÌNH - THAY ĐỔI Ở ĐÂY
// ============================================
const CONFIG = {
  // Mật khẩu (ngày sinh: ddmmyyyy)
  password: "15012000",
  
  // Tên người sinh nhật
  birthdayName: "Em yêu",
  
  // Lời chúc (mỗi dòng sẽ hiện từ từ)
  wishes: [
    "Chúc em sinh nhật vui vẻ! 🎉",
    "Mong em luôn khỏe mạnh, hạnh phúc...",
    "Tuổi mới nhiều niềm vui, thành công!",
    "Em là người tuyệt vời nhất! 💕",
    "Yêu em nhiều lắm! 🥰"
  ],
  
  // Danh sách ảnh (thay link ảnh của bạn vào đây)
  photos: [
    "https://i.pinimg.com/564x/cb/bc/ef/cbbcef5a5db90cfb9e34f94e87f22dd6.jpg",
    "https://i.pinimg.com/564x/a7/3c/5d/a73c5d8e9f0a1b2c3d4e5f6a7b8c9d0e.jpg",
    "https://i.pinimg.com/564x/b8/4d/6e/b84d6e9f0a1b2c3d4e5f6a7b8c9d0e1f.jpg",
    "https://i.pinimg.com/564x/c9/5e/7f/c95e7f0a1b2c3d4e5f6a7b8c9d0e1f2a.jpg",
    "https://i.pinimg.com/564x/da/6f/80/da6f801b2c3d4e5f6a7b8c9d0e1f2a3b.jpg"
  ],
  
  // Màu thiên hà (RGB 0-255)
  galaxyColor1: { r: 255, g: 154, b: 158 },  // Hồng
  galaxyColor2: { r: 161, g: 140, b: 209 }   // Tím
};

// ============================================
// PASSWORD LOGIC
// ============================================
let enteredPass = "";
const passDisplay = document.getElementById("passDisplay");
const errorMsg = document.getElementById("errorMsg");
const passwordScreen = document.getElementById("passwordScreen");
const galaxyScreen = document.getElementById("galaxyScreen");

function updateDisplay() {
  const len = enteredPass.length;
  passDisplay.textContent = len > 0 ? "•".repeat(Math.min(len, 8)) : "••••••••";
}

// Number keys
document.querySelectorAll(".key-num").forEach(btn => {
  btn.addEventListener("click", () => {
    if (enteredPass.length < 8) {
      enteredPass += btn.dataset.num;
      updateDisplay();
      errorMsg.classList.remove("show");
    }
  });
});

// Delete key
document.getElementById("keyDelete").addEventListener("click", () => {
  enteredPass = enteredPass.slice(0, -1);
  updateDisplay();
  errorMsg.classList.remove("show");
});

// Check key
document.getElementById("keyCheck").addEventListener("click", checkPassword);

function checkPassword() {
  if (enteredPass === CONFIG.password) {
    passwordScreen.classList.add("hidden");
    setTimeout(() => {
      galaxyScreen.classList.add("active");
      initGalaxy();
      startBirthdayShow();
    }, 500);
  } else {
    errorMsg.classList.add("show");
    enteredPass = "";
    updateDisplay();
  }
}

// Keyboard support
document.addEventListener("keydown", (e) => {
  if (passwordScreen.classList.contains("hidden")) return;
  
  if (e.key >= "0" && e.key <= "9" && enteredPass.length < 8) {
    enteredPass += e.key;
    updateDisplay();
    errorMsg.classList.remove("show");
  } else if (e.key === "Backspace") {
    enteredPass = enteredPass.slice(0, -1);
    updateDisplay();
  } else if (e.key === "Enter") {
    checkPassword();
  }
});


// ============================================
// THREE.JS GALAXY
// ============================================
let scene, camera, renderer, controls, points;
let gu = { time: { value: 0 } };

function initGalaxy() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x160016);
  
  camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);
  camera.position.set(0, 4, 21);
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  galaxyScreen.appendChild(renderer.domElement);
  
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;

  // Create galaxy particles
  let sizes = [];
  let shift = [];
  let pts = [];

  const pushShift = () => {
    shift.push(
      Math.random() * Math.PI,
      Math.random() * Math.PI * 2,
      (Math.random() * 0.9 + 0.1) * Math.PI * 0.1,
      Math.random() * 0.9 + 0.1
    );
  };

  // Sphere particles (center)
  for (let i = 0; i < 25000; i++) {
    sizes.push(Math.random() * 1.5 + 0.5);
    pushShift();
    pts.push(new THREE.Vector3().randomDirection().multiplyScalar(Math.random() * 0.5 + 9.5));
  }

  // Disk particles (spiral arms)
  for (let i = 0; i < 50000; i++) {
    let r = 10, R = 40;
    let rand = Math.pow(Math.random(), 1.5);
    let radius = Math.sqrt(R * R * rand + (1 - rand) * r * r);
    pts.push(new THREE.Vector3().setFromCylindricalCoords(
      radius, 
      Math.random() * 2 * Math.PI, 
      (Math.random() - 0.5) * 2
    ));
    sizes.push(Math.random() * 1.5 + 0.5);
    pushShift();
  }

  let g = new THREE.BufferGeometry().setFromPoints(pts);
  g.setAttribute("sizes", new THREE.Float32BufferAttribute(sizes, 1));
  g.setAttribute("shift", new THREE.Float32BufferAttribute(shift, 4));

  // Custom shader material
  const c1 = CONFIG.galaxyColor1;
  const c2 = CONFIG.galaxyColor2;
  
  let m = new THREE.PointsMaterial({
    size: 0.1,
    transparent: true,
    blending: THREE.AdditiveBlending,
    onBeforeCompile: shader => {
      shader.uniforms.time = gu.time;
      shader.vertexShader = `
        uniform float time;
        attribute float sizes;
        attribute vec4 shift;
        varying vec3 vColor;
        ${shader.vertexShader}
      `.replace(
        `gl_PointSize = size;`,
        `gl_PointSize = size * sizes;`
      ).replace(
        `#include <color_vertex>`,
        `#include <color_vertex>
          float d = length(abs(position) / vec3(40., 10., 40));
          d = clamp(d, 0., 1.);
          vColor = mix(vec3(${c1.r}., ${c1.g}., ${c1.b}.), vec3(${c2.r}., ${c2.g}., ${c2.b}.), d) / 255.;
        `
      ).replace(
        `#include <begin_vertex>`,
        `#include <begin_vertex>
          float t = time;
          float moveT = mod(shift.x + shift.z * t, PI2);
          float moveS = mod(shift.y + shift.z * t, PI2);
          transformed += vec3(cos(moveS) * sin(moveT), cos(moveT), sin(moveS) * sin(moveT)) * shift.a;
        `
      );
      
      shader.fragmentShader = `
        varying vec3 vColor;
        ${shader.fragmentShader}
      `.replace(
        `#include <clipping_planes_fragment>`,
        `#include <clipping_planes_fragment>
          float d = length(gl_PointCoord.xy - 0.5);
          if (d > 0.5) discard;
        `
      ).replace(
        `vec4 diffuseColor = vec4( diffuse, opacity );`,
        `vec4 diffuseColor = vec4( vColor, smoothstep(0.5, 0.2, d) * 0.5 + 0.5 );`
      );
    }
  });

  points = new THREE.Points(g, m);
  points.rotation.order = "ZYX";
  points.rotation.z = 0.2;
  scene.add(points);

  // Resize handler
  window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // Animation loop
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    let t = clock.getElapsedTime() * 0.5;
    gu.time.value = t * Math.PI;
    points.rotation.y = t * 0.05;
    renderer.render(scene, camera);
  }
  animate();
}


// ============================================
// BIRTHDAY EFFECTS
// ============================================
function startBirthdayShow() {
  createFloatingPhotos();
  createHearts();
  typeWishes();
}

// Floating photos
function createFloatingPhotos() {
  const container = document.getElementById("floatingPhotos");
  
  // Create multiple copies of photos
  for (let i = 0; i < 15; i++) {
    const photo = document.createElement("div");
    photo.className = "float-photo";
    const src = CONFIG.photos[i % CONFIG.photos.length];
    photo.innerHTML = `<img src="${src}" alt="Photo">`;
    
    const size = 40 + Math.random() * 50;
    photo.style.width = size + "px";
    photo.style.height = size + "px";
    photo.style.left = Math.random() * 90 + 5 + "%";
    photo.style.bottom = "-100px";
    photo.style.animationDuration = 15 + Math.random() * 10 + "s";
    photo.style.animationDelay = Math.random() * -20 + "s";
    
    container.appendChild(photo);
  }
}

// Hearts animation
function createHearts() {
  const container = document.getElementById("heartsContainer");
  const hearts = ["💕", "💖", "💗", "💝", "❤️", "🩷", "✨", "🌟", "💫"];
  
  function addHeart() {
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    heart.style.left = Math.random() * 100 + "%";
    heart.style.animationDuration = 6 + Math.random() * 4 + "s";
    heart.style.fontSize = 15 + Math.random() * 25 + "px";
    container.appendChild(heart);
    
    setTimeout(() => heart.remove(), 10000);
  }
  
  // Initial hearts
  for (let i = 0; i < 20; i++) {
    setTimeout(addHeart, i * 150);
  }
  
  // Continuous hearts
  setInterval(addHeart, 400);
}

// Typewriter effect
function typeWishes() {
  const typingEl = document.getElementById("typingText");
  const titleEl = document.getElementById("birthdayTitle");
  
  // Update title with name
  titleEl.textContent = `🎂 Happy Birthday ${CONFIG.birthdayName}! 🎂`;
  
  // Build full text
  const fullText = CONFIG.wishes.join("\n\n");
  let i = 0;
  
  function type() {
    if (i < fullText.length) {
      const char = fullText.charAt(i);
      if (char === "\n") {
        typingEl.innerHTML += "<br>";
      } else {
        typingEl.innerHTML += char;
      }
      i++;
      setTimeout(type, 50);
    } else {
      // Add blinking cursor at end
      typingEl.innerHTML += '<span class="cursor"></span>';
    }
  }
  
  // Start typing after 1 second
  setTimeout(type, 1000);
}

// ============================================
// INITIALIZE
// ============================================
// Set avatar images from config
document.getElementById("avatarImg").src = CONFIG.photos[0];
document.getElementById("centerImg").src = CONFIG.photos[0];

console.log("🎂 Birthday Galaxy loaded!");
console.log("💡 Tip: Thay đổi CONFIG ở đầu file script.js để tùy chỉnh");