function mountCanvasFallback(canvas) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return () => {};

  let raf = 0;
  let frame = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawOrb(x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `${color},0.34)`);
    g.addColorStop(0.6, `${color},0.12)`);
    g.addColorStop(1, `${color},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function render() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const t = frame / 60;

    ctx.clearRect(0, 0, w, h);

    drawOrb(w * 0.24 + Math.sin(t * 0.7) * 26, h * 0.28 + Math.cos(t * 0.6) * 18, 230, 'rgba(61,90,62');
    drawOrb(w * 0.72 + Math.cos(t * 0.55) * 24, h * 0.24 + Math.sin(t * 0.5) * 22, 260, 'rgba(184,124,94');
    drawOrb(w * 0.58 + Math.sin(t * 0.8) * 20, h * 0.68 + Math.cos(t * 0.75) * 24, 210, 'rgba(212,197,169');

    frame += 1;
    raf = window.requestAnimationFrame(render);
  }

  resize();
  render();

  const onResize = () => resize();
  window.addEventListener('resize', onResize);

  return () => {
    window.removeEventListener('resize', onResize);
    window.cancelAnimationFrame(raf);
  };
}

async function mountThreeScene(canvas) {
  const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0.1, 4.8);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const root = new THREE.Group();
  scene.add(root);

  const orbGeometry = new THREE.IcosahedronGeometry(1, 3);

  function makeOrb(color, scale, position) {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.26,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(orbGeometry, material);
    mesh.scale.setScalar(scale);
    mesh.position.copy(position);
    root.add(mesh);
    return mesh;
  }

  const orbA = makeOrb(0x3d5a3e, 1.4, new THREE.Vector3(-1.6, 0.4, -1.0));
  const orbB = makeOrb(0xb87c5e, 1.75, new THREE.Vector3(1.6, 0.8, -1.3));
  const orbC = makeOrb(0xd4c5a9, 1.25, new THREE.Vector3(0.4, -1.3, -1.0));

  const particleCount = window.innerWidth < 900 ? 380 : 860;
  const particleGeo = new THREE.BufferGeometry();
  const particlePos = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i += 1) {
    const i3 = i * 3;
    particlePos[i3] = (Math.random() - 0.5) * 8;
    particlePos[i3 + 1] = (Math.random() - 0.5) * 5;
    particlePos[i3 + 2] = (Math.random() - 0.5) * 6;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

  const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({
      color: 0xb87c5e,
      size: 0.026,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true,
    })
  );
  root.add(particles);

  const grid = new THREE.GridHelper(12, 28, 0x5f7f61, 0x7f6b56);
  grid.position.y = -2;
  grid.material.opacity = 0.14;
  grid.material.transparent = true;
  root.add(grid);

  const mouse = { x: 0, y: 0 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function onMove(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    mouse.x = (x - 0.5) * 2;
    mouse.y = (y - 0.5) * 2;
  }

  let raf = 0;
  let t = 0;

  function render() {
    t += 0.006;

    orbA.rotation.x += 0.0024;
    orbA.rotation.y += 0.0028;
    orbA.position.y = 0.4 + Math.sin(t * 1.1) * 0.12;

    orbB.rotation.x -= 0.0018;
    orbB.rotation.z += 0.0022;
    orbB.position.x = 1.6 + Math.cos(t * 0.8) * 0.16;

    orbC.rotation.y += 0.0031;
    orbC.rotation.z += 0.0019;
    orbC.position.y = -1.3 + Math.cos(t * 1.35) * 0.13;

    particles.rotation.y += 0.0009;

    camera.position.x += ((mouse.x * 0.22) - camera.position.x) * 0.045;
    camera.position.y += ((-mouse.y * 0.16) - camera.position.y) * 0.045;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    raf = window.requestAnimationFrame(render);
  }

  resize();
  render();

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onMove, { passive: true });

  return () => {
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMove);
    window.cancelAnimationFrame(raf);
    renderer.dispose();
    orbGeometry.dispose();
    particleGeo.dispose();
  };
}

export function mountLoginScene3D(canvas) {
  if (!canvas) return () => {};
  if (window.getComputedStyle(canvas).display === 'none') return () => {};

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return mountCanvasFallback(canvas);
  }

  let disposed = false;
  let cleanup = () => {};

  mountThreeScene(canvas)
    .then((destroy) => {
      if (disposed) {
        destroy();
        return;
      }
      cleanup = destroy;
    })
    .catch(() => {
      if (disposed) return;
      cleanup = mountCanvasFallback(canvas);
    });

  return () => {
    disposed = true;
    cleanup();
  };
}
