import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls";

// ============================================
// CẤU HÌNH - THAY ĐỔI Ở ĐÂY
// ============================================
const CONFIG = {
  // Mật khẩu (ngày sinh: ddmmyyyy)
  password: "04072004",
  
  // Tên người sinh nhật
  birthdayName: "VƯƠNG_LÊ",
  
  // Lời chúc (mỗi dòng sẽ hiện từ từ)
  wishes: [
    "Chúc em tuổi mới bình yên trong lòng, vững vàng trong mọi lựa chọn và luôn được yêu thương đúng cách. 🌿",
    "Mong em luôn đủ mạnh mẽ để bước tiếp, đủ dịu dàng để mỉm cười, và đủ may mắn để gặp toàn điều tử tế. ✨",
    "Chúc em lớn lên theo cách em muốn: tự do, rực rỡ, nhưng vẫn giữ được trái tim ấm áp như bây giờ. 💛",
    "Hy vọng mỗi ngày của em đều có điều đáng mong chờ, và mọi cố gắng của em đều được đáp lại xứng đáng. 🌸",
    "Nếu có lúc mệt, hãy nhớ: em không cần hoàn hảo—chỉ cần hạnh phúc. Anh luôn ủng hộ em. 🤍"
  ],
  
  // Danh sách ảnh (ảnh index 2 sẽ làm avatar màn hình nhập pass)
  // Các ảnh còn lại sẽ quay trong thiên hà
  photos: [
    "1.jpg",  // index 0 - trong thiên hà
    "2.jpg",  // index 1 - trong thiên hà
    "4.jpg",  // index 2 - AVATAR màn hình nhập pass
    "3.jpg",  // index 3 - trong thiên hà (nếu có)
    "5.jpg"   // index 4 - trong thiên hà (nếu có)
  ],
  
  // Index của ảnh làm avatar (mặc định là 2 = ảnh thứ 3)
  avatarPhotoIndex: 2,
  
  // File nhạc nền (đặt file mp3 cùng thư mục)
  musicFile: "drums-274805.mp3",
  
  // Màu thiên hà (RGB 0-255)
  galaxyColor1: { r: 255, g: 154, b: 158 },  // Hồng
  galaxyColor2: { r: 161, g: 140, b: 209 }   // Tím
};

// ============================================
// BACKGROUND MUSIC
// ============================================
let bgMusic = null;

function initMusic() {
  bgMusic = new Audio(CONFIG.musicFile);
  bgMusic.loop = true;
  bgMusic.volume = 0.5;
}

function playMusic() {
  if (bgMusic) {
    bgMusic.play().catch(e => console.log("Music autoplay blocked:", e));
  }
}

// Initialize music on load
initMusic();

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
    
    // Play music when password correct
    playMusic();
    
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
let orbitingPhotos = [];

// Get photos for galaxy (exclude avatar photo)
function getGalaxyPhotos() {
  return CONFIG.photos.filter((_, index) => index !== CONFIG.avatarPhotoIndex);
}

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
  controls.enablePan = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.3;
  controls.minDistance = 5;
  controls.maxDistance = 100;

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

  // ===== ADD 3D ORBITING PHOTOS =====
  create3DPhotos();

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
    
    // Update orbiting photos
    updateOrbitingPhotos(t);
    
    renderer.render(scene, camera);
  }
  animate();
}

// ============================================
// 3D ORBITING PHOTOS
// ============================================
function create3DPhotos() {
  const textureLoader = new THREE.TextureLoader();
  const galaxyPhotos = getGalaxyPhotos();
  
  galaxyPhotos.forEach((photoUrl, index) => {
    textureLoader.load(photoUrl, (texture) => {
      const geometry = new THREE.PlaneGeometry(3, 3);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true
      });
      
      const photo = new THREE.Mesh(geometry, material);
      
      // Random orbit parameters
      const orbitData = {
        mesh: photo,
        photoUrl: photoUrl,
        radius: 12 + Math.random() * 8,
        speed: 0.2 + Math.random() * 0.3,
        offset: (index / galaxyPhotos.length) * Math.PI * 2,
        yOffset: (Math.random() - 0.5) * 6,
        tilt: Math.random() * 0.5,
        // For center animation
        isMovingToCenter: false,
        centerTime: 0,
        originalRadius: 12 + Math.random() * 8
      };
      
      orbitingPhotos.push(orbitData);
      scene.add(photo);
    });
  });
  
  // Schedule photos to fly to center one by one
  schedulePhotoToCenter();
}

let currentPhotoIndex = 0;
let centerDisplayElement = null;

function schedulePhotoToCenter() {
  setInterval(() => {
    if (orbitingPhotos.length === 0) return;
    
    const photoData = orbitingPhotos[currentPhotoIndex % orbitingPhotos.length];
    photoData.isMovingToCenter = true;
    photoData.centerTime = 0;
    
    currentPhotoIndex++;
  }, 5000); // Every 5 seconds
}

function updateOrbitingPhotos(time) {
  orbitingPhotos.forEach((data, index) => {
    if (!data.mesh) return;
    
    if (data.isMovingToCenter) {
      // Animate to center
      data.centerTime += 0.02;
      
      if (data.centerTime < 1) {
        // Moving to center
        const t = data.centerTime;
        const easeT = t * t * (3 - 2 * t); // Smooth step
        
        const angle = time * data.speed + data.offset;
        const orbitX = Math.cos(angle) * data.radius;
        const orbitZ = Math.sin(angle) * data.radius;
        const orbitY = data.yOffset + Math.sin(time * 0.5 + data.offset) * data.tilt;
        
        // Lerp to center (camera position)
        data.mesh.position.x = orbitX * (1 - easeT);
        data.mesh.position.y = orbitY * (1 - easeT);
        data.mesh.position.z = orbitZ * (1 - easeT) + 10 * easeT;
        
        // Scale up
        const scale = 1 + easeT * 2;
        data.mesh.scale.set(scale, scale, scale);
        
        // Face camera
        data.mesh.lookAt(camera.position);
        
      } else if (data.centerTime < 2.5) {
        // Stay at center
        data.mesh.position.set(0, 0, 10);
        data.mesh.scale.set(3, 3, 3);
        data.mesh.lookAt(camera.position);
        
        // Show in HTML overlay too
        showCenterPhoto(data.photoUrl);
        
      } else if (data.centerTime < 3.5) {
        // Move back to orbit
        const t = (data.centerTime - 2.5);
        const easeT = t * t * (3 - 2 * t);
        
        const angle = time * data.speed + data.offset;
        const orbitX = Math.cos(angle) * data.radius;
        const orbitZ = Math.sin(angle) * data.radius;
        const orbitY = data.yOffset;
        
        data.mesh.position.x = orbitX * easeT;
        data.mesh.position.y = orbitY * easeT;
        data.mesh.position.z = 10 * (1 - easeT) + orbitZ * easeT;
        
        const scale = 3 - easeT * 2;
        data.mesh.scale.set(scale, scale, scale);
        data.mesh.lookAt(camera.position);
        
        hideCenterPhoto();
        
      } else {
        // Reset
        data.isMovingToCenter = false;
        data.centerTime = 0;
      }
      
    } else {
      // Normal orbit
      const angle = time * data.speed + data.offset;
      data.mesh.position.x = Math.cos(angle) * data.radius;
      data.mesh.position.z = Math.sin(angle) * data.radius;
      data.mesh.position.y = data.yOffset + Math.sin(time * 0.5 + data.offset) * data.tilt;
      
      data.mesh.scale.set(1, 1, 1);
      data.mesh.lookAt(camera.position);
    }
  });
}

function showCenterPhoto(src) {
  if (!centerDisplayElement) {
    centerDisplayElement = document.getElementById("centerPhotoDisplay");
  }
  if (centerDisplayElement) {
    centerDisplayElement.querySelector("img").src = src;
    centerDisplayElement.classList.add("show");
  }
}

function hideCenterPhoto() {
  if (centerDisplayElement) {
    centerDisplayElement.classList.remove("show");
  }
}


// ============================================
// BIRTHDAY EFFECTS
// ============================================
function startBirthdayShow() {
  createHearts();
  typeWishes();
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
// Set avatar image from config (photo index 2 = 3rd photo)
document.getElementById("avatarImg").src = CONFIG.photos[CONFIG.avatarPhotoIndex];

console.log("Birthday Galaxy loaded!");
console.log("Tip: Thay doi CONFIG o dau file script.js de tuy chinh");
console.log("Keo chuot de xoay, cuon de zoom");
console.log("Nhac se phat khi nhap dung mat khau");
