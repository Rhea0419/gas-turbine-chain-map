import * as THREE from "../../vendor/three.module.js";
import { buildBomCards, buildSceneState, clamp01, COMPONENT_SPECS } from "./model-state.mjs";

const statusNode = document.querySelector("#threeStatus");
function setStatus(text, ready = false, state = ready ? "ready" : "loading") {
  if (!statusNode) return;
  statusNode.textContent = text;
  statusNode.dataset.state = state;
  statusNode.classList.toggle("ready", ready);
  if (ready) {
    document.querySelector("#stage")?.classList.add("three-ready");
    document.querySelector("#stage")?.classList.remove("three-fallback");
  }
}
function setErrorStatus(text) {
  document.querySelector("#stage")?.classList.add("three-fallback");
  setStatus(text, false, "error");
}
setStatus("Three.js 模块已加载，正在初始化场景...");

window.addEventListener("error", (event) => {
  const message = event?.message || "未知脚本错误";
  setErrorStatus(`3D 运行错误：${message}`);
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event?.reason?.message || event?.reason || "未知异步错误";
  setErrorStatus(`3D 异步错误：${reason}`);
});

const canvas = document.querySelector("#turbineCanvas");
const viewport = document.querySelector("#sceneViewport");
const hotspotLayer = document.querySelector("#hotspotLayer");
const bomTrack = document.querySelector("#bomTrack");
const explodeReadout = document.querySelector("#explodeReadout");
const slider = document.querySelector("#explodeSlider");
const explodeButton = document.querySelector("#explodeButton");
const autoButton = document.querySelector("#autoButton");
const urlParams = new URLSearchParams(window.location.search);
const isCaptureMode = urlParams.get("capture") === "1";
const captureTotalFrames = Number(urlParams.get("total") ?? 150);

const sceneState = {
  targetExplode: 0,
  currentExplode: 0,
  transparent: false,
  selectedId: null,
};

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x03111d, 0.032);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
camera.position.set(3.2, 2.65, 10.6);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
} catch (error) {
  setErrorStatus(`WebGL 初始化失败：${error?.message || error}`);
  throw error;
}
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = createSimpleOrbit(camera, canvas, new THREE.Vector3(-0.45, 0.1, 0));
controls.autoRotate = !isCaptureMode;

const turbineRoot = new THREE.Group();
scene.add(turbineRoot);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const componentEntries = new Map();
const hotspots = new Map();

initLighting();
initBackdrop();
initComponents();
initHotspots();
bindControls();
setExplodeFactor(0);
setStatus("风机 3D 模型已就绪", true);
if (isCaptureMode) {
  document.body.classList.add("capture-mode");
  autoButton.classList.remove("is-active");
  setExplodeFactor(0);
}
resizeRenderer();
requestAnimationFrame(renderLoop);

function initLighting() {
  scene.add(new THREE.HemisphereLight(0xb7eaff, 0x08111a, 2.25));

  const keyLight = new THREE.DirectionalLight(0xe8f8ff, 3.2);
  keyLight.position.set(-3.5, 5.4, 4.6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 18;
  keyLight.shadow.camera.left = -7;
  keyLight.shadow.camera.right = 7;
  keyLight.shadow.camera.top = 5;
  keyLight.shadow.camera.bottom = -5;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x22c9ff, 2.2);
  rimLight.position.set(5.4, 1.8, -4.4);
  scene.add(rimLight);

  const fill = new THREE.PointLight(0x4ae6ff, 25, 11, 2);
  fill.position.set(-1, 1.4, 3.6);
  scene.add(fill);
}

function initBackdrop() {
  const grid = new THREE.GridHelper(8.2, 16, 0x1cc6ff, 0x123044);
  grid.position.y = -1.18;
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  scene.add(grid);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.12, 1.28, 0.42, 96),
    new THREE.MeshStandardMaterial({
      color: 0x203241,
      roughness: 0.74,
      metalness: 0.42,
    }),
  );
  base.position.set(0.06, -1.27, 0);
  base.receiveShadow = true;
  scene.add(base);

  const baseBand = createCylinderX(0.025, 2.55, material({ color: 0x21baf4, roughness: 0.3, metalness: 0.3 }));
  baseBand.rotation.x = Math.PI / 2;
  baseBand.position.set(0.06, -1.06, 0);
  scene.add(baseBand);
}

function initComponents() {
  for (const spec of COMPONENT_SPECS) {
    const group = createComponent(spec);
    group.userData.componentId = spec.id;
    group.traverse((child) => {
      child.userData.componentId = spec.id;
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    turbineRoot.add(group);
    componentEntries.set(spec.id, {
      spec,
      group,
      materials: collectMaterials(group),
    });
  }
}

function createComponent(spec) {
  switch (spec.type) {
    case "blade":
      return createBladeSystem(spec);
    case "ring":
      return createPitchRing(spec);
    case "bearing":
      return createBearing(spec);
    case "shaft":
      return createShaft(spec);
    case "gearbox":
      return createGearbox(spec);
    case "coupling":
      return createCoupling(spec);
    case "generator":
      return createGenerator(spec);
    case "converter":
      return createConverter(spec);
    case "yaw":
      return createYawSystem(spec);
    case "platform":
      return createPlatform(spec);
    case "pipe":
      return createPipe(spec);
    case "shell":
      return createShell(spec);
    default:
      return new THREE.Group();
  }
}

function createBladeSystem(spec) {
  const group = new THREE.Group();
  const bladeMat = material({ color: spec.color, roughness: 0.38, metalness: 0.06 });
  const edgeMat = material({ color: 0xc7d5de, roughness: 0.42, metalness: 0.12 });
  const hubMat = material({ color: 0xe7eef4, roughness: 0.34, metalness: 0.36 });
  const darkMat = material({ color: 0x182434, roughness: 0.5, metalness: 0.64 });

  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.36, 56, 34), hubMat);
  hub.scale.set(1.05, 1, 1);
  group.add(hub);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.78, 56), bladeMat);
  nose.rotation.z = Math.PI / 2;
  nose.position.x = -0.5;
  group.add(nose);

  const rear = createCylinderX(0.24, 0.34, darkMat, 56);
  rear.position.x = 0.34;
  group.add(rear);

  for (let index = 0; index < 3; index += 1) {
    const pivot = new THREE.Group();
    pivot.rotation.x = (index * Math.PI * 2) / 3 - Math.PI / 2;

    const rootSleeve = createCylinderX(0.13, 0.3, edgeMat, 28);
    rootSleeve.rotation.y = Math.PI / 2;
    rootSleeve.position.y = 0.42;
    pivot.add(rootSleeve);

    const blade = new THREE.Mesh(createBladeGeometry(2.7, 0.34, 0.075, 18), bladeMat);
    blade.position.y = 0.45;
    blade.rotation.z = -0.055;
    blade.rotation.y = index % 2 ? -0.035 : 0.035;
    pivot.add(blade);

    const leadingEdge = new THREE.Mesh(createBladeEdgeGeometry(2.56, 0.018), edgeMat);
    leadingEdge.position.set(-0.05, 0.52, 0.012);
    leadingEdge.rotation.z = -0.055;
    pivot.add(leadingEdge);

    group.add(pivot);
  }

  return group;
}

function createBladeGeometry(length, rootChord, rootThickness, segments) {
  const vertices = [];
  const indices = [];

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const y = t * length;
    const taper = Math.pow(1 - t, 1.18);
    const chord = rootChord * (0.18 + 0.82 * taper);
    const thickness = rootThickness * (0.18 + 0.82 * taper);
    const twist = -0.15 + t * 0.31;
    const camber = Math.sin(t * Math.PI) * 0.045;
    const section = [
      [-chord * 0.52, y, 0],
      [-chord * 0.16, y, thickness * 0.55 + camber],
      [chord * 0.46, y, thickness * 0.28],
      [chord * 0.42, y, -thickness * 0.22],
      [-chord * 0.18, y, -thickness * 0.46 + camber * 0.3],
    ];

    for (const point of section) {
      const [x, py, z] = point;
      const cos = Math.cos(twist);
      const sin = Math.sin(twist);
      vertices.push(x * cos - z * sin, py, x * sin + z * cos);
    }
  }

  const sectionSize = 5;
  for (let i = 0; i < segments; i += 1) {
    const a = i * sectionSize;
    const b = (i + 1) * sectionSize;
    for (let j = 0; j < sectionSize; j += 1) {
      const next = (j + 1) % sectionSize;
      indices.push(a + j, b + j, b + next);
      indices.push(a + j, b + next, a + next);
    }
  }

  for (let j = 1; j < sectionSize - 1; j += 1) indices.push(0, j, j + 1);
  const tip = segments * sectionSize;
  for (let j = 1; j < sectionSize - 1; j += 1) indices.push(tip, tip + j + 1, tip + j);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createBladeEdgeGeometry(length, radius) {
  const points = [
    [0, 0, 0],
    [0.015, length * 0.28, 0.018],
    [0.026, length * 0.64, 0.01],
    [0.01, length, -0.004],
  ];
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
    24,
    radius,
    8,
    false,
  );
}

function createPitchRing(spec) {
  const group = new THREE.Group();
  const ringMat = material({ color: spec.color, roughness: 0.25, metalness: 0.78 });
  const shadowMat = material({ color: 0x111925, roughness: 0.52, metalness: 0.7 });

  group.add(torusX(0.48, 0.055, ringMat));
  group.add(torusX(0.34, 0.034, shadowMat));

  for (let index = 0; index < 16; index += 1) {
    const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), shadowMat);
    const angle = (index / 16) * Math.PI * 2;
    bolt.position.set(0.02, Math.sin(angle) * 0.48, Math.cos(angle) * 0.48);
    group.add(bolt);
  }

  return group;
}

function createBearing(spec) {
  const group = new THREE.Group();
  const ringMat = material({ color: spec.color, roughness: 0.22, metalness: 0.84 });
  const rollerMat = material({ color: 0x7a8490, roughness: 0.22, metalness: 0.88 });
  const innerMat = material({ color: 0x182534, roughness: 0.38, metalness: 0.68 });
  const cageMat = material({ color: 0xb99454, roughness: 0.3, metalness: 0.7 });
  const boltMat = material({ color: 0x101820, roughness: 0.35, metalness: 0.85 });

  group.add(torusX(0.58, 0.075, ringMat));
  group.add(torusX(0.43, 0.035, cageMat));
  group.add(torusX(0.31, 0.055, innerMat));
  group.add(torusX(0.68, 0.026, ringMat));

  for (let row = 0; row < 2; row += 1) {
    const x = row === 0 ? -0.07 : 0.07;
    for (let index = 0; index < 22; index += 1) {
      const angle = (index / 22) * Math.PI * 2 + row * 0.08;
      const roller = createCylinderX(0.024, 0.18, rollerMat, 12);
      roller.position.set(x, Math.sin(angle) * 0.45, Math.cos(angle) * 0.45);
      roller.rotation.x = angle;
      group.add(roller);
    }
  }

  addBoltCircle(group, 0.7, 24, 0.018, boltMat, 0.035);
  addBoltCircle(group, 0.28, 16, 0.014, boltMat, -0.035);

  return group;
}

function createShaft(spec) {
  const group = new THREE.Group();
  const shaftMat = material({ color: spec.color, roughness: 0.2, metalness: 0.86 });
  const darkMat = material({ color: 0x1a2531, roughness: 0.32, metalness: 0.74 });

  group.add(createCylinderX(0.14, 1.16, shaftMat, 48));
  const leftCollar = createCylinderX(0.22, 0.18, darkMat, 48);
  leftCollar.position.x = -0.34;
  group.add(leftCollar);
  const rightCollar = createCylinderX(0.2, 0.16, darkMat, 48);
  rightCollar.position.x = 0.36;
  group.add(rightCollar);

  return group;
}

function createGearbox(spec) {
  const group = new THREE.Group();
  const blueMat = material({ color: spec.color, roughness: 0.34, metalness: 0.38 });
  const darkBlue = material({ color: 0x0d3e69, roughness: 0.44, metalness: 0.54 });
  const capMat = material({ color: 0x9dadba, roughness: 0.28, metalness: 0.72 });
  const gearMat = material({ color: 0xd0d8df, roughness: 0.18, metalness: 0.88 });
  const oilMat = material({ color: 0x071623, roughness: 0.2, metalness: 0.64 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.88, 0.82), blueMat);
  body.castShadow = true;
  group.add(body);

  const front = createCylinderX(0.31, 0.26, capMat, 56);
  front.position.x = -0.64;
  group.add(front);

  const rear = createCylinderX(0.33, 0.3, capMat, 56);
  rear.position.x = 0.66;
  group.add(rear);

  const topA = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.26), darkBlue);
  topA.position.set(-0.16, 0.56, -0.18);
  group.add(topA);

  const topB = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.26), darkBlue);
  topB.position.set(0.26, 0.55, 0.17);
  group.add(topB);

  for (let index = 0; index < 12; index += 1) {
    const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), capMat);
    bolt.position.set(-0.52 + index * 0.095, 0.47, 0.44);
    group.add(bolt);
  }

  for (let index = 0; index < 8; index += 1) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.54, 0.035), darkBlue);
    fin.position.set(-0.38 + index * 0.11, 0.02, -0.445);
    group.add(fin);
  }

  const gearA = createGearWheel(0.18, 0.055, gearMat, 18);
  gearA.position.set(-0.28, 0.1, 0.455);
  group.add(gearA);
  const gearB = createGearWheel(0.24, 0.055, gearMat, 22);
  gearB.position.set(0.02, -0.12, 0.462);
  group.add(gearB);
  const gearC = createGearWheel(0.15, 0.055, gearMat, 16);
  gearC.position.set(0.32, 0.12, 0.455);
  group.add(gearC);

  const oilSight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.018), oilMat);
  oilSight.position.set(0.37, -0.24, 0.425);
  group.add(oilSight);

  addBoltCircle(group, 0.38, 18, 0.015, capMat, -0.64);
  addBoltCircle(group, 0.4, 18, 0.015, capMat, 0.66);

  return group;
}

function createCoupling(spec) {
  const group = new THREE.Group();
  const mat = material({ color: spec.color, roughness: 0.25, metalness: 0.84 });
  const darkMat = material({ color: 0x202a35, roughness: 0.32, metalness: 0.76 });
  const brakeMat = material({ color: 0x303b46, roughness: 0.38, metalness: 0.84 });
  const caliperMat = material({ color: 0x2d89c6, roughness: 0.34, metalness: 0.55 });

  group.add(createCylinderX(0.2, 0.62, mat, 48));
  for (const x of [-0.22, 0.22]) {
    const ring = createCylinderX(0.28, 0.08, darkMat, 48);
    ring.position.x = x;
    group.add(ring);
  }

  const brakeDisc = createCylinderX(0.42, 0.045, brakeMat, 72);
  brakeDisc.position.x = 0.39;
  group.add(brakeDisc);

  for (const y of [-0.28, 0.28]) {
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.2), caliperMat);
    caliper.position.set(0.43, y, 0.25);
    group.add(caliper);
  }

  addBoltCircle(group, 0.26, 12, 0.014, darkMat, 0);

  return group;
}

function createGenerator(spec) {
  const group = new THREE.Group();
  const bodyMat = material({ color: spec.color, roughness: 0.38, metalness: 0.62 });
  const ringMat = material({ color: 0x4c565f, roughness: 0.32, metalness: 0.72 });
  const darkMat = material({ color: 0x171f27, roughness: 0.5, metalness: 0.58 });
  const copperMat = material({ color: 0xd47a2d, roughness: 0.26, metalness: 0.58 });
  const coilMat = material({ color: 0x70d8ff, roughness: 0.2, metalness: 0.46, opacity: 0.76 });

  const body = createCylinderX(0.48, 1.18, bodyMat, 80);
  group.add(body);

  for (const x of [-0.58, -0.36, -0.14, 0.08, 0.3, 0.52]) {
    const rib = createCylinderX(0.505, 0.035, ringMat, 80);
    rib.position.x = x;
    group.add(rib);
  }

  const junction = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.28), darkMat);
  junction.position.set(0.08, 0.58, -0.04);
  group.add(junction);

  for (let index = 0; index < 18; index += 1) {
    const angle = (index / 18) * Math.PI * 2;
    const coil = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.045), copperMat);
    coil.position.set(-0.68, Math.sin(angle) * 0.36, Math.cos(angle) * 0.36);
    coil.rotation.x = angle;
    group.add(coil);
  }

  for (const x of [-0.22, 0.22]) {
    const stator = torusX(0.37, 0.022, coilMat);
    stator.position.x = x;
    group.add(stator);
  }

  const cable = makeTube(
    [
      [0.0, 0.66, 0.06],
      [0.18, 0.86, 0.16],
      [0.48, 0.84, 0.2],
      [0.68, 0.62, 0.22],
    ],
    0.018,
    copperMat,
  );
  group.add(cable);

  return group;
}

function createConverter(spec) {
  const group = new THREE.Group();
  const cabinetMat = material({ color: spec.color, roughness: 0.5, metalness: 0.36 });
  const glassMat = material({ color: 0x9fb7c7, roughness: 0.22, metalness: 0.25, opacity: 0.58 });
  const railMat = material({ color: 0xa8b3ba, roughness: 0.35, metalness: 0.62 });
  const copperMat = material({ color: 0xef8d30, roughness: 0.25, metalness: 0.58 });
  const cyanMat = material({ color: 0x40d7ff, roughness: 0.24, metalness: 0.44, opacity: 0.72 });

  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.96, 0.82), cabinetMat);
  group.add(cabinet);

  for (const z of [-0.28, 0, 0.28]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.58, 0.17), glassMat);
    panel.position.set(-0.565, 0.04, z);
    group.add(panel);
  }

  for (let index = 0; index < 4; index += 1) {
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.18, 0.012), cyanMat);
    handle.position.set(-0.596, -0.08 + index * 0.12, -0.34);
    group.add(handle);
  }

  for (const y of [-0.22, 0, 0.22]) {
    const busbar = makeTube(
      [
        [-0.34, y, 0.46],
        [-0.08, y + 0.05, 0.64],
        [0.38, y + 0.04, 0.62],
      ],
      0.018,
      copperMat,
    );
    group.add(busbar);
  }

  const roof = makeTube(
    [
      [-0.46, 0.54, -0.42],
      [-0.24, 0.82, -0.38],
      [0.24, 0.82, -0.38],
      [0.46, 0.54, -0.42],
    ],
    0.018,
    railMat,
  );
  group.add(roof);

  return group;
}

function createYawSystem(spec) {
  const group = new THREE.Group();
  const mat = material({ color: spec.color, roughness: 0.5, metalness: 0.58 });
  const cyanMat = material({ color: 0x1bc3f5, roughness: 0.32, metalness: 0.3, opacity: 0.72 });

  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.78, 0.62, 72), mat);
  column.position.y = -0.1;
  group.add(column);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.045, 12, 96), cyanMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.25;
  group.add(ring);

  for (let index = 0; index < 20; index += 1) {
    const angle = (index / 20) * Math.PI * 2;
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.06, 8), cyanMat);
    bolt.position.set(Math.sin(angle) * 0.74, 0.32, Math.cos(angle) * 0.74);
    group.add(bolt);
  }

  return group;
}

function createPlatform(spec) {
  const group = new THREE.Group();
  const deckMat = material({ color: spec.color, roughness: 0.55, metalness: 0.52 });
  const railMat = material({ color: 0x94a5b2, roughness: 0.35, metalness: 0.72 });
  const glowMat = material({ color: 0x1bc3f5, roughness: 0.35, metalness: 0.22, opacity: 0.45 });

  const deck = new THREE.Mesh(new THREE.BoxGeometry(5.25, 0.06, 1.38), deckMat);
  deck.position.y = -0.26;
  group.add(deck);

  const backRail = makeTube(
    [
      [-2.62, 0.02, -0.7],
      [-1.6, 0.08, -0.74],
      [0.2, 0.08, -0.74],
      [1.6, 0.04, -0.72],
      [2.62, 0.02, -0.68],
    ],
    0.014,
    railMat,
  );
  group.add(backRail);

  const frontRail = makeTube(
    [
      [-2.62, 0.02, 0.7],
      [-0.9, 0.08, 0.74],
      [0.9, 0.06, 0.74],
      [2.62, 0.02, 0.68],
    ],
    0.014,
    railMat,
  );
  group.add(frontRail);

  for (const x of [-2.54, -1.9, -1.27, -0.64, 0, 0.64, 1.27, 1.9, 2.54]) {
    group.add(cylinderBetween(new THREE.Vector3(x, -0.24, -0.7), new THREE.Vector3(x, 0.05, -0.7), 0.011, railMat));
    group.add(cylinderBetween(new THREE.Vector3(x, -0.24, 0.7), new THREE.Vector3(x, 0.05, 0.7), 0.011, railMat));
  }

  for (let index = 0; index < 11; index += 1) {
    const grate = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.012, 1.26), railMat);
    grate.position.set(-2.25 + index * 0.45, -0.21, 0);
    group.add(grate);
  }

  const underGlow = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.025, 1.12), glowMat);
  underGlow.position.y = -0.31;
  group.add(underGlow);

  const ladder = new THREE.Group();
  for (const z of [-0.12, 0.12]) {
    const side = cylinderBetween(new THREE.Vector3(2.25, -0.64, z), new THREE.Vector3(2.25, -0.24, z), 0.011, railMat);
    ladder.add(side);
  }
  for (const y of [-0.58, -0.48, -0.38, -0.28]) {
    ladder.add(cylinderBetween(new THREE.Vector3(2.25, y, -0.12), new THREE.Vector3(2.25, y, 0.12), 0.01, railMat));
  }
  group.add(ladder);

  return group;
}

function createPipe(spec) {
  const group = new THREE.Group();
  const pipeMat = material({ color: spec.color, roughness: 0.26, metalness: 0.54 });
  const bluePipe = material({ color: 0x2bbcff, roughness: 0.28, metalness: 0.44 });
  const greenPipe = material({ color: 0x53e09b, roughness: 0.3, metalness: 0.36 });

  const pipeSets = [
    { mat: pipeMat, z: 0.62, y: -0.04, radius: 0.026 },
    { mat: pipeMat, z: 0.52, y: -0.11, radius: 0.02 },
    { mat: bluePipe, z: 0.39, y: -0.23, radius: 0.018 },
    { mat: greenPipe, z: 0.28, y: -0.3, radius: 0.014 },
  ];

  for (const pipe of pipeSets) {
    group.add(
      makeTube(
        [
          [-1.42, pipe.y, pipe.z],
          [-0.75, pipe.y - 0.14, pipe.z + 0.06],
          [0.18, pipe.y - 0.08, pipe.z + 0.04],
          [0.74, pipe.y + 0.02, pipe.z - 0.04],
          [1.38, pipe.y + 0.08, pipe.z - 0.12],
        ],
        pipe.radius,
        pipe.mat,
      ),
    );
  }

  for (const x of [-0.84, -0.18, 0.48, 1.08]) {
    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.5), bluePipe);
    clamp.position.set(x, -0.22, 0.46);
    group.add(clamp);
  }

  return group;
}

function createShell(spec) {
  const group = new THREE.Group();
  const shellMat = material({
    color: spec.color,
    roughness: 0.28,
    metalness: 0.14,
    opacity: spec.opacity,
    side: THREE.DoubleSide,
  });
  const rimMat = material({ color: 0xb9c8d3, roughness: 0.3, metalness: 0.38, opacity: 0.36 });

  const upperShell = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.02, 4.95, 64, 1, true, 0.05, Math.PI * 1.08), shellMat);
  upperShell.rotation.z = Math.PI / 2;
  upperShell.position.set(0.2, 0.12, -0.18);
  group.add(upperShell);

  const lowerPanel = new THREE.Mesh(new THREE.BoxGeometry(4.72, 0.08, 0.28), shellMat);
  lowerPanel.position.set(0.22, -0.78, 0.22);
  group.add(lowerPanel);

  const noseRim = torusX(0.8, 0.026, rimMat);
  noseRim.position.x = -2.22;
  group.add(noseRim);

  const tailRim = torusX(0.96, 0.026, rimMat);
  tailRim.position.x = 2.56;
  group.add(tailRim);

  for (const x of [-1.8, -0.9, 0, 0.9, 1.8]) {
    const rib = torusX(0.92, 0.012, rimMat);
    rib.position.x = x;
    group.add(rib);
  }

  return group;
}

function initHotspots() {
  const visibleIds = ["blade-system", "main-bearing", "gearbox", "generator", "converter", "yaw-system"];

  for (const id of visibleIds) {
    const spec = COMPONENT_SPECS.find((component) => component.id === id);
    const node = document.createElement("button");
    node.type = "button";
    node.className = "hotspot";
    node.dataset.id = id;
    node.innerHTML = `<strong>${spec.name}</strong><small>${spec.material}</small>`;
    node.addEventListener("click", () => selectComponent(id));
    hotspotLayer.append(node);
    hotspots.set(id, node);
  }
}

function renderBom() {
  bomTrack.textContent = "";

  for (const card of buildBomCards()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bom-card";
    button.dataset.id = card.id;
    button.innerHTML = `
      <strong>${card.order}. ${card.name}</strong>
      <small>供应商：${card.supplier}<br />份额：${card.share}</small>
      <span class="status ${card.status === "跟踪" ? "track" : ""}">${card.status}</span>
    `;
    button.addEventListener("click", () => selectComponent(card.id));
    bomTrack.append(button);
  }
}

function bindControls() {
  slider.addEventListener("input", (event) => setExplodeFactor(event.currentTarget.value));

  explodeButton.addEventListener("click", () => {
    setExplodeFactor(sceneState.targetExplode > 0.55 ? 0 : 1);
  });

  autoButton.addEventListener("click", () => {
    controls.autoRotate = !controls.autoRotate;
    autoButton.classList.toggle("is-active", controls.autoRotate);
  });

  window.addEventListener("wind-part-focus", (event) => {
    const id = nameToComponentId(event.detail?.name);
    if (!id) return;
    selectComponent(id);
    setExplodeFactor(1);
  });

  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObjects(turbineRoot.children, true);
    if (hits.length === 0) return;

    const id = findComponentId(hits[0].object);
    if (id) {
      selectComponent(id);
    }
  });

  window.addEventListener("resize", resizeRenderer);
  new ResizeObserver(resizeRenderer).observe(viewport);
}

function setExplodeFactor(value) {
  sceneState.targetExplode = clamp01(value);
  slider.value = sceneState.targetExplode;
  explodeReadout.textContent = `${Math.round(sceneState.targetExplode * 100)}%`;
  explodeButton.classList.toggle("is-active", sceneState.targetExplode > 0.08);
  explodeButton.textContent = sceneState.targetExplode > 0.08 ? "爆炸视图" : "装配视图";
}

function selectComponent(id) {
  sceneState.selectedId = id;
  const selected = COMPONENT_SPECS.find((component) => component.id === id);

  document.querySelectorAll(".bom-card").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.id === id);
  });
  window.dispatchEvent(new CustomEvent("wind-three-select", { detail: { id, name: selected.name } }));
}

function nameToComponentId(name) {
  const map = {
    "叶片": "blade-system",
    "主轴承": "main-bearing",
    "齿轮箱": "gearbox",
    "发电机": "generator",
    "变流器": "converter",
    "变桨系统": "pitch-ring",
    "偏航系统": "yaw-system",
    "冷却系统": "cooling-pipe",
  };
  return map[name];
}

function resetCamera() {
  camera.position.set(3.2, 2.65, 10.6);
  controls.target.set(-0.45, 0.1, 0);
  controls.update();
}

function createSimpleOrbit(camera, domElement, target) {
  const spherical = new THREE.Spherical();
  const offset = new THREE.Vector3();
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const control = {
    target,
    autoRotate: true,
    autoRotateSpeed: 0.003,
    update() {
      offset.copy(camera.position).sub(target);
      spherical.setFromVector3(offset);
      if (this.autoRotate && !dragging) spherical.theta += this.autoRotateSpeed;
      spherical.phi = Math.max(0.55, Math.min(1.35, spherical.phi));
      spherical.radius = Math.max(5.6, Math.min(16.5, spherical.radius));
      offset.setFromSpherical(spherical);
      camera.position.copy(target).add(offset);
      camera.lookAt(target);
    },
  };

  domElement.addEventListener("pointerdown", (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    domElement.setPointerCapture?.(event.pointerId);
  });
  domElement.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    offset.copy(camera.position).sub(target);
    spherical.setFromVector3(offset);
    spherical.theta -= (event.clientX - lastX) * 0.006;
    spherical.phi -= (event.clientY - lastY) * 0.004;
    lastX = event.clientX;
    lastY = event.clientY;
    control.update();
  });
  domElement.addEventListener("pointerup", (event) => {
    dragging = false;
    domElement.releasePointerCapture?.(event.pointerId);
  });
  domElement.addEventListener("wheel", (event) => {
    event.preventDefault();
    offset.copy(camera.position).sub(target);
    spherical.setFromVector3(offset);
    spherical.radius += event.deltaY * 0.01;
    control.update();
  }, { passive: false });

  return control;
}

function renderLoop() {
  if (isCaptureMode) {
    sceneState.currentExplode = sceneState.targetExplode;
  } else {
    sceneState.currentExplode += (sceneState.targetExplode - sceneState.currentExplode) * 0.1;
    if (Math.abs(sceneState.currentExplode - sceneState.targetExplode) < 0.001) {
      sceneState.currentExplode = sceneState.targetExplode;
    }
  }

  const state = renderSceneAtCurrentState();
  controls.update();
  updateHotspots(state);
  renderer.render(scene, camera);
  requestAnimationFrame(renderLoop);
}

function renderSceneAtCurrentState() {
  const state = buildSceneState({
    explodeFactor: sceneState.currentExplode,
    transparent: sceneState.transparent,
    selectedId: sceneState.selectedId,
  });

  applySceneState(state);
  return state;
}

function renderCaptureFrame(frame, totalFrames = captureTotalFrames) {
  const total = Math.max(2, Number(totalFrames) || captureTotalFrames);
  const progress = clamp01(frame / (total - 1));
  const explodeProgress = smoothstep(clamp01((progress - 0.08) / 0.58));
  const selectedIds = ["main-bearing", "gearbox", "generator", "converter"];
  const selectedIndex = Math.min(selectedIds.length - 1, Math.floor(progress * selectedIds.length));

  setExplodeFactor(explodeProgress);
  sceneState.currentExplode = explodeProgress;
  selectComponent(selectedIds[selectedIndex]);
  setCameraForProgress(progress);

  const state = renderSceneAtCurrentState();
  updateHotspots(state);
  renderer.render(scene, camera);

  return {
    progress,
    explodeProgress,
    selectedId: sceneState.selectedId,
  };
}

function setCameraForProgress(progress) {
  const angle = -0.16 + progress * 0.44;
  const radius = 14.1 - Math.sin(progress * Math.PI) * 0.7;
  controls.target.set(-0.48, 0.12 + Math.sin(progress * Math.PI) * 0.08, 0);
  camera.position.set(Math.sin(angle) * 4.8 + 0.3, 3.05 + Math.sin(progress * Math.PI * 1.2) * 0.28, Math.cos(angle) * radius);
  camera.lookAt(controls.target);
  controls.update();
}

function smoothstep(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function applySceneState(state) {
  for (const part of state.parts) {
    const entry = componentEntries.get(part.id);
    if (!entry) continue;

    entry.group.position.set(part.position.x, part.position.y, part.position.z);
    const targetScale = part.selected ? 1.045 : 1;
    entry.group.scale.setScalar(targetScale);

    for (const mat of entry.materials) {
      const opacity = part.opacity;
      mat.opacity = opacity;
      mat.transparent = opacity < 0.985;
      mat.depthWrite = opacity >= 0.7;

      if (mat.emissive) {
        mat.emissive.set(part.selected ? 0x062f42 : 0x000000);
        mat.emissiveIntensity = part.selected ? 0.7 : 0;
      }
    }
  }
}

function updateHotspots(state) {
  const rect = viewport.getBoundingClientRect();

  for (const [id, node] of hotspots) {
    const part = state.parts.find((item) => item.id === id);
    if (!part) continue;

    const projected = new THREE.Vector3(part.labelPosition.x, part.labelPosition.y, part.labelPosition.z);
    projected.project(camera);

    const isVisible = projected.z > -1 && projected.z < 1;
    node.style.display = isVisible ? "block" : "none";
    node.style.left = `${(projected.x * 0.5 + 0.5) * rect.width}px`;
    node.style.top = `${(-projected.y * 0.5 + 0.5) * rect.height}px`;
    node.classList.toggle("is-selected", id === sceneState.selectedId);
  }
}

function resizeRenderer() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  if (!width || !height) return;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function collectMaterials(group) {
  const materials = new Set();
  group.traverse((child) => {
    if (!child.material) return;
    if (Array.isArray(child.material)) {
      child.material.forEach((mat) => materials.add(mat));
    } else {
      materials.add(child.material);
    }
  });
  return [...materials];
}

function findComponentId(object) {
  let current = object;
  while (current) {
    if (current.userData?.componentId) {
      return current.userData.componentId;
    }
    current = current.parent;
  }
  return null;
}

function material({
  color,
  roughness = 0.42,
  metalness = 0.5,
  opacity = 1,
  side = THREE.FrontSide,
}) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness,
    metalness,
    opacity,
    transparent: opacity < 1,
    side,
  });
}

function lineMaterial({ color, opacity = 1 }) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.32,
    metalness: 0.52,
    opacity,
    transparent: opacity < 1,
  });
}

function createCylinderX(radius, length, mat, segments = 32) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, segments), mat);
  mesh.rotation.z = Math.PI / 2;
  return mesh;
}

function torusX(radius, tube, mat) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 16, 72), mat);
  mesh.rotation.y = Math.PI / 2;
  return mesh;
}

function createGearWheel(radius, width, mat, teeth) {
  const group = new THREE.Group();
  const core = createCylinderX(radius * 0.76, width, mat, 48);
  group.add(core);
  group.add(torusX(radius * 0.9, width * 0.22, mat));

  for (let index = 0; index < teeth; index += 1) {
    const angle = (index / teeth) * Math.PI * 2;
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(width * 0.72, radius * 0.18, radius * 0.08), mat);
    tooth.position.set(0, Math.sin(angle) * radius, Math.cos(angle) * radius);
    tooth.rotation.x = angle;
    group.add(tooth);
  }

  const bore = createCylinderX(radius * 0.22, width * 1.08, material({ color: 0x111a24, roughness: 0.32, metalness: 0.78 }), 32);
  group.add(bore);

  return group;
}

function addBoltCircle(group, radius, count, boltRadius, mat, xOffset = 0) {
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(boltRadius, boltRadius, boltRadius * 1.8, 10), mat);
    bolt.position.set(xOffset, Math.sin(angle) * radius, Math.cos(angle) * radius);
    bolt.rotation.z = Math.PI / 2;
    group.add(bolt);
  }
}

function cylinderBetween(start, end, radius, mat) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 10), mat);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

function makeTube(points, radius, mat) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 48, radius, 10, false), mat);
}

if (sceneState.selectedId) {
  selectComponent(sceneState.selectedId);
}
window.__windTurbineRenderFrame = renderCaptureFrame;
window.__windTurbineCaptureReady = true;

if (isCaptureMode) {
  renderCaptureFrame(Number(urlParams.get("frame") ?? 0), captureTotalFrames);
}
