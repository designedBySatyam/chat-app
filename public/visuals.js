// Vibe blue ambient field
(function initVibeField() {
  const canvas = document.getElementById("bgScene") || document.getElementById("bgCanvas");
  if (!canvas || !window.THREE) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 0, 520);

  const group = new THREE.Group();
  scene.add(group);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  const key = new THREE.DirectionalLight(0x2f8ef4, 1.0);
  key.position.set(1, 1, 1);
  const fill = new THREE.PointLight(0x1b6fd8, 0.9, 0, 2);
  fill.position.set(-220, 120, 160);
  const rim = new THREE.PointLight(0x22d98a, 0.7, 0, 2);
  rim.position.set(220, -140, 180);
  scene.add(ambient, key, fill, rim);

  const orbGeo = new THREE.IcosahedronGeometry(120, 2);
  const orbMat = new THREE.MeshStandardMaterial({
    color: 0x0d1524,
    metalness: 0.55,
    roughness: 0.4,
    emissive: 0x0a1020,
    transparent: true,
    opacity: 0.92,
  });
  const orb = new THREE.Mesh(orbGeo, orbMat);
  group.add(orb);

  const ringGeo = new THREE.TorusGeometry(210, 2.2, 16, 220);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x2f8ef4,
    metalness: 0.4,
    roughness: 0.45,
    emissive: 0x0b0f1d,
    transparent: true,
    opacity: 0.55,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2.6;
  group.add(ring);

  const sparkCount = 520;
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPos = new Float32Array(sparkCount * 3);
  for (let i = 0; i < sparkCount; i++) {
    sparkPos[i * 3] = (Math.random() - 0.5) * window.innerWidth * 1.2;
    sparkPos[i * 3 + 1] = (Math.random() - 0.5) * window.innerHeight * 1.2;
    sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 800;
  }
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  const sparkMat = new THREE.PointsMaterial({
    size: 2.2,
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const stars = new THREE.Points(sparkGeo, sparkMat);
  scene.add(stars);

  let mouseX = 0;
  let mouseY = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * -2;
  });

  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  function render(time) {
    requestAnimationFrame(render);

    const t = time * 0.0007;
    const rotSpeed = reducedMotion ? 0.0003 : 0.001;

    group.rotation.y += rotSpeed;
    group.rotation.x += rotSpeed * 0.5;
    ring.rotation.z = t * 0.6;
    stars.rotation.y = t * 0.08;
    stars.rotation.z = t * 0.05;

    camera.position.x += (mouseX * 50 - camera.position.x) * 0.03;
    camera.position.y += (mouseY * 40 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  render(0);
})();
