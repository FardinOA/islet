import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/*
  The Islet sensor: a white puck on a fabric adhesive patch, built as a lathe
  profile so its rounded rim catches the room light like moulded plastic. The
  camera is set so one world unit is one CSS pixel at z = 0, which lets the
  hero place the puck straight from the headline's layout.
*/

export type PuckPose = {
  x: number; // screen px, centre
  y: number;
  r: number; // radius in px
  tilt: number; // 0 = lying back, 1 = face to the camera
  lookX: number; // pointer lean, -1..1
  lookY: number;
  spin: number;
  shadow: number; // 0..1
};

function profile(): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0.27)];
  const top = 0.27;
  const fr = 0.13; // top fillet
  const flat = 1 - fr;
  for (let i = 0; i <= 10; i++) pts.push(new THREE.Vector2((flat * i) / 10, top + 0.006 * (1 - (i / 10) ** 2)));
  for (let i = 1; i <= 14; i++) {
    const a = (i / 14) * (Math.PI / 2);
    pts.push(new THREE.Vector2(flat + Math.sin(a) * fr, top - fr + Math.cos(a) * fr));
  }
  const br = 0.05; // bottom fillet
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    pts.push(new THREE.Vector2(1 - br + Math.cos(a) * br, br - Math.sin(a) * br));
  }
  pts.push(new THREE.Vector2(0, 0));
  return pts;
}

function faceTexture(family: string): THREE.CanvasTexture {
  const s = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  const m = s / 2;
  // Moulded groove just inside the fillet.
  g.strokeStyle = "rgba(120,116,104,0.28)";
  g.lineWidth = 5;
  g.beginPath();
  g.arc(m, m, s * 0.43, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.9)";
  g.lineWidth = 3;
  g.beginPath();
  g.arc(m, m + 3, s * 0.43, 0, Math.PI * 2);
  g.stroke();
  // Debossed wordmark.
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `650 ${s * 0.13}px ${family}`;
  g.fillStyle = "rgba(255,255,255,0.95)";
  g.fillText("islet", m, m + 3);
  g.fillStyle = "rgba(128,124,112,0.42)";
  g.fillText("islet", m, m);
  // Small trace under the mark.
  g.lineWidth = 6;
  g.lineCap = "round";
  g.strokeStyle = "rgba(226,36,91,0.55)";
  g.beginPath();
  const w = s * 0.2;
  for (let i = 0; i <= 40; i++) {
    const x = m - w / 2 + (w * i) / 40;
    const k = i / 40;
    const y = m + s * 0.115 - Math.exp(-((k - 0.42) ** 2) / 0.02) * s * 0.035;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function shadowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, "rgba(20,21,18,0.42)");
  grad.addColorStop(0.45, "rgba(20,21,18,0.16)");
  grad.addColorStop(1, "rgba(20,21,18,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

export function createPuck(canvas: HTMLCanvasElement, family: string) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.85;

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-0.6, 1, 0.9);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffe9d6, 0.7);
  rim.position.set(1, -0.4, 0.5);
  scene.add(rim);

  const fov = 22;
  const camera = new THREE.PerspectiveCamera(fov, 1, 1, 20000);

  const pose = new THREE.Group();
  const puck = new THREE.Group();
  pose.add(puck);
  scene.add(pose);

  const shell = new THREE.Mesh(
    new THREE.LatheGeometry(profile(), 128),
    new THREE.MeshPhysicalMaterial({ color: 0xf6f5f1, roughness: 0.36, clearcoat: 0.7, clearcoatRoughness: 0.22, sheen: 0.2 }),
  );
  shell.position.y = 0.035;
  puck.add(shell);

  const face = new THREE.Mesh(
    new THREE.CircleGeometry(0.87, 96),
    new THREE.MeshPhysicalMaterial({ map: faceTexture(family), transparent: true, roughness: 0.4, clearcoat: 0.6, depthWrite: false }),
  );
  face.rotation.x = -Math.PI / 2;
  face.position.y = 0.035 + 0.2775;
  puck.add(face);

  // Fabric adhesive patch: a thin, slightly warmer disc with a soft edge.
  const patchShape: THREE.Vector2[] = [];
  for (let i = 0; i <= 12; i++) patchShape.push(new THREE.Vector2((1.16 * i) / 12, 0.03));
  for (let i = 1; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2);
    patchShape.push(new THREE.Vector2(1.16 + Math.sin(a) * 0.015, 0.015 + Math.cos(a) * 0.015));
  }
  patchShape.push(new THREE.Vector2(1.17, 0), new THREE.Vector2(0, 0));
  const patch = new THREE.Mesh(
    new THREE.LatheGeometry(patchShape, 128),
    new THREE.MeshStandardMaterial({ color: 0xe9e4d8, roughness: 0.96 }),
  );
  puck.add(patch);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }),
  );
  scene.add(shadow);

  let w = 1;
  let h = 1;
  function resize(width: number, height: number) {
    w = width;
    h = height;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.set(0, 0, h / 2 / Math.tan(THREE.MathUtils.degToRad(fov / 2)));
    camera.near = 1;
    camera.far = camera.position.z * 4;
    camera.updateProjectionMatrix();
  }

  function render(p: PuckPose) {
    const x = p.x - w / 2;
    const y = h / 2 - p.y;
    pose.position.set(x, y, 0);
    // Thickness stays near its resting size, so a puck scaled past the screen never swallows the camera.
    const thick = Math.min(p.r, 260);
    pose.scale.set(p.r, thick, p.r);
    const lie = 0.78;
    pose.rotation.set(lie + (Math.PI / 2 - lie) * p.tilt + p.lookY * 0.28 * (1 - p.tilt), p.lookX * 0.32 * (1 - p.tilt), (-0.14 + p.lookX * 0.05) * (1 - p.tilt));
    puck.rotation.y = p.spin;

    shadow.position.set(x + p.r * 0.18, y - p.r * 0.62, -p.r * 0.9);
    shadow.scale.set(p.r * 3.1, p.r * 1.25, 1);
    (shadow.material as THREE.MeshBasicMaterial).opacity = p.shadow;

    renderer.render(scene, camera);
  }

  function dispose() {
    renderer.dispose();
    pmrem.dispose();
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const m = o.material as THREE.MeshStandardMaterial;
        m.map?.dispose();
        m.dispose();
      }
    });
  }

  return { resize, render, dispose };
}
