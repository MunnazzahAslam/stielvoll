"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { advance, bindMesh, createJelly, deformMesh, dragBy, grab, nudge, release } from "@/lib/jelly";

/** The bar, in scene units. Its bottom edge sits on the stick. */
const BAR = { width: 1.5, height: 2.6, depth: 0.6, bottom: -0.7 };
const BAR_TOP = BAR.bottom + BAR.height;

/** The feel of the jelly: tuned to wobble 3 to 4 times before it settles. */
const FIRMNESS = 1800;
const HOME = 240;
const DAMPING = 4;

/** Camera: 28° lens, far enough back to see the popsicle plus room to swing. */
const FOV = 28;
const VISIBLE_HEIGHT = 5;
const CAMERA_Z = VISIBLE_HEIGHT / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));

/** A rounded bar with a domed top and two moulded grooves, like a classic ice lolly. */
function buildBar() {
  const box = new THREE.BoxGeometry(BAR.width, BAR.height, BAR.depth, 32, 40, 8);
  const p = box.attributes.position;
  const hx = BAR.width / 2, hy = BAR.height / 2, hz = BAR.depth / 2;
  const r = 0.27;
  const smooth = THREE.MathUtils.smoothstep;

  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    // Round every edge: pull the point onto a sphere of radius r around the nearest inner-box point.
    const cx = THREE.MathUtils.clamp(x, -(hx - r), hx - r);
    const cy = THREE.MathUtils.clamp(y, -(hy - r), hy - r);
    const cz = THREE.MathUtils.clamp(z, -(hz - r), hz - r);
    const len = Math.hypot(x - cx, y - cy, z - cz);
    if (len > 0) {
      x = cx + ((x - cx) / len) * r;
      y = cy + ((y - cy) / len) * r;
      z = cz + ((z - cz) / len) * r;
    }
    // Dome the top.
    const s = Math.max(0, (y - 0.45) / (hy - 0.45));
    x *= 1 - 0.3 * s * s;
    // Two shallow vertical grooves on the front and back.
    const groove = Math.exp(-(((Math.abs(x) - 0.27) / 0.065) ** 2)) * smooth(y, -1.0, -0.75) * (1 - smooth(y, 0.4, 0.75));
    z *= 1 - 0.24 * groove;
    p.setXYZ(i, x, y + BAR.bottom + hy, z);
  }

  // Weld the box's six faces into one skin so shading is smooth across the edges.
  box.deleteAttribute("normal");
  box.deleteAttribute("uv");
  const bar = mergeVertices(box, 1e-4);
  bar.computeVertexNormals();
  // The shape changes every frame; a generous fixed sphere keeps picking correct.
  bar.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.6, 0), 6);
  return bar;
}

/** How big a bite is, and how many fit. Each bite is one arc with a row of tooth marks along it. */
const BITE = { radius: 0.3, tooth: 0.08, teeth: [-68, -34, 0, 34, 68], max: 8 };
const CIRCLES_PER_BITE = 1 + BITE.teeth.length;
const MAX_CIRCLES = BITE.max * CIRCLES_PER_BITE;

/**
 * Glossy ice, with a soft rim of lighter colour at the edges for a hint of
 * translucency. Bites are cut out here, per pixel: the mesh itself stays whole,
 * so a bite's edge is an exact arc however the jelly bends.
 */
function makeIceMaterial(color: string) {
  const material = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.34,
    clearcoat: 0.55,
    clearcoatRoughness: 0.28,
    envMapIntensity: 0.9,
    // Through a bite you see the inside of the far wall, which reads as the cut's depth.
    side: THREE.DoubleSide,
    // Smooth (anti-aliased) bite edges.
    alphaToCoverage: true,
    premultipliedAlpha: true,
  });
  // Circles (x, y, radius) in the popsicle's own unbent coordinates.
  const bites = {
    uBites: { value: Array.from({ length: MAX_CIRCLES }, () => new THREE.Vector3()) },
    uBiteCount: { value: 0 },
  };
  material.userData.bites = bites;

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, bites);
    // `whole` is each vertex's position on the unbent popsicle.
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "attribute vec3 whole;\nvarying vec2 vWhole;\n#include <common>")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWhole = whole.xy;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `varying vec2 vWhole;
       uniform vec3 uBites[${MAX_CIRCLES}];
       uniform int uBiteCount;
       #include <common>`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
       // Distance to the nearest bite edge: negative inside a bite.
       float cut = 1000.0;
       for (int i = 0; i < ${MAX_CIRCLES}; i++) {
         if (i >= uBiteCount) break;
         cut = min(cut, length(vWhole - uBites[i].xy) - uBites[i].z);
       }
       float edge = max(fwidth(cut), 0.0001);
       float keep = smoothstep(-edge * 0.5, edge * 0.5, cut);
       if (keep <= 0.0) discard;
       diffuseColor.a *= keep;
       // The inside, seen through a bite, is the same ice in shadow.
       if (!gl_FrontFacing) diffuseColor.rgb *= 0.78;`,
      )
      .replace(
        "#include <opaque_fragment>",
        `float rim = pow(1.0 - saturate(dot(normalize(normal), normalize(vViewPosition))), 2.4);
       outgoingLight += diffuseColor.rgb * rim * 0.5 + vec3(rim * 0.1);
       #include <opaque_fragment>`,
      );
  };
  return material;
}

/** Everything that changes frame to frame. Created once, mutated outside React's render. */
type Sim = ReturnType<typeof createSim>;
type Circle = { x: number; y: number; r: number };

function createSim(color: string) {
  const geometry = buildBar();
  const jelly = createJelly({
    nx: 4, ny: 8, nz: 2,
    min: [-BAR.width / 2, BAR.bottom, -BAR.depth / 2],
    max: [BAR.width / 2, BAR_TOP, BAR.depth / 2],
    stiffness: FIRMNESS,
    homeStiffness: HOME,
    damping: DAMPING,
  });
  // The unbent shape: what the jelly bends, and what bites are measured against.
  const whole = (geometry.attributes.position.array as Float32Array).slice();
  geometry.setAttribute("whole", new THREE.BufferAttribute(whole, 3));
  // The silhouette: vertices on the middle of the bar's edge. First bites start here.
  const outline: number[] = [];
  for (let i = 0; i < whole.length / 3; i++) if (Math.abs(whole[i * 3 + 2]) < 0.02) outline.push(i);

  return {
    geometry,
    jelly,
    material: makeIceMaterial(color),
    whole,
    outline,
    circles: [] as Circle[],
    binding: bindMesh(jelly, whole),
    blend: { from: new THREE.Color(color), to: new THREE.Color(color), t: 1 },
  };
}

const biteCount = (sim: Sim) => sim.circles.length / CIRCLES_PER_BITE;

/** Send the current bites to the material. */
function syncBites(sim: Sim) {
  const { uBites, uBiteCount } = sim.material.userData.bites as {
    uBites: { value: THREE.Vector3[] };
    uBiteCount: { value: number };
  };
  sim.circles.forEach((c, i) => uBites.value[i].set(c.x, c.y, c.r));
  uBiteCount.value = sim.circles.length;
}

/** Roughly whether a point lies on the unbitten bar, seen from the front. */
function onBar(x: number, y: number) {
  if (y < BAR.bottom || y > BAR_TOP) return false;
  const half = BAR.height / 2;
  const s = Math.max(0, (y - BAR.bottom - half - 0.45) / (half - 0.45));
  return Math.abs(x) <= (BAR.width / 2) * (1 - 0.3 * s * s);
}

/**
 * Take a bite at the edge nearest to a tapped vertex: one arc with a row of
 * tooth marks along it. Later bites start from the edges earlier bites left behind.
 * Returns false when no bite fits.
 */
function takeBite(sim: Sim, tapped: number) {
  if (biteCount(sim) >= BITE.max) return false;
  const { whole, outline, circles } = sim;
  const tx = whole[tapped * 3], ty = whole[tapped * 3 + 1];
  const eaten = (x: number, y: number) => circles.some((c) => (x - c.x) ** 2 + (y - c.y) ** 2 < (c.r - 0.015) ** 2);
  // Keep clear of the end that holds the stick.
  const reachable = (y: number) => y > BAR.bottom + 0.5;

  // Find the nearest edge point, and which way is "out" of the popsicle there.
  let best = Infinity;
  let edge: { x: number; y: number; outX: number; outY: number } | null = null;
  const consider = (x: number, y: number, outX: number, outY: number) => {
    if (!reachable(y) || eaten(x, y)) return;
    const d = (x - tx) ** 2 + (y - ty) ** 2;
    if (d < best) [best, edge] = [d, { x, y, outX, outY }];
  };
  for (const i of outline) {
    const x = whole[i * 3], y = whole[i * 3 + 1];
    // Out: away from the bar's spine.
    const spineY = THREE.MathUtils.clamp(y, BAR.bottom + 0.6, BAR_TOP - 0.6);
    const len = Math.hypot(x, y - spineY) || 1;
    consider(x, y, x / len, (y - spineY) / len);
  }
  for (const c of circles) {
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      const x = c.x + Math.cos(a) * c.r, y = c.y + Math.sin(a) * c.r;
      // Out: back towards the middle of the bite that made this edge.
      if (onBar(x, y)) consider(x, y, -Math.cos(a), -Math.sin(a));
    }
  }
  if (!edge) return false;
  const e = edge as { x: number; y: number; outX: number; outY: number };

  // Centre a little outside the edge, so each bite takes a shallow arc.
  const cx = e.x + e.outX * BITE.radius * 0.15, cy = e.y + e.outY * BITE.radius * 0.15;
  // Leave a core along the stick's line below the top, so nothing is bitten clean off.
  if (cy < BAR_TOP - 0.8 && Math.abs(cx) - BITE.radius < 0.14) return false;

  circles.push({ x: cx, y: cy, r: BITE.radius });
  // Tooth marks: a row of small, even scallops along the inside of the arc.
  for (const degrees of BITE.teeth) {
    const a = Math.atan2(-e.outY, -e.outX) + THREE.MathUtils.degToRad(degrees);
    const reach = BITE.radius - 0.045;
    circles.push({ x: cx + Math.cos(a) * reach, y: cy + Math.sin(a) * reach, r: BITE.tooth });
  }
  syncBites(sim);
  // It recoils from the bite.
  nudge(sim.jelly, [-e.outX * 6, -e.outY * 4 + 1.5, 0]);
  return true;
}

/** A fresh popsicle. */
function restore(sim: Sim) {
  if (sim.circles.length === 0) return;
  sim.circles.length = 0;
  syncBites(sim);
  nudge(sim.jelly, [0, 6, 0]);
}

/** Flavour change: blend the colour over 300 ms and give a small upward bounce. */
function changeColour(sim: Sim, color: string) {
  if (sim.blend.to.equals(new THREE.Color(color))) return;
  sim.blend.from.copy(sim.material.color);
  sim.blend.to.set(color);
  sim.blend.t = 0;
  nudge(sim.jelly, [0.6, 7, 0]);
}

/** One frame: colour blend, idle sway, physics, then bend the mesh to match. */
function tick(sim: Sim, group: THREE.Group, time: number, delta: number) {
  const { blend, material, jelly, geometry } = sim;
  if (blend.t < 1) {
    blend.t = Math.min(1, blend.t + delta / 0.3);
    material.color.lerpColors(blend.from, blend.to, blend.t);
  }

  // Idle: a slow, gentle sway, paused while a finger holds it.
  jelly.sway = jelly.gripping ? [0, 0, 0] : [Math.sin(time * 1.25) * 22, 0, 0];
  group.rotation.y = Math.sin(time * 0.6) * 0.16;

  advance(jelly, delta);
  const positions = geometry.attributes.position;
  deformMesh(jelly, sim.binding, positions.array as Float32Array);
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
}

type SceneProps = {
  color: string;
  /** The DOM element over the popsicle that receives mouse and touch input. */
  hit: RefObject<HTMLDivElement | null>;
  /** The visitor has touched it (drag or tap). */
  onDrag: () => void;
  /** Called with the number of bites taken so far. */
  onBite: (bites: number) => void;
  /** Change this number to swap in a fresh, unbitten popsicle. */
  fresh: number;
};

/** A press shorter and smaller than this is a tap (a bite), not a drag. */
const TAP = { pixels: 8, ms: 350 };

function Scene({ color, hit, onDrag, onBite, fresh }: SceneProps) {
  const group = useRef<THREE.Group>(null!);
  const mesh = useRef<THREE.Mesh>(null!);
  const { camera, gl, size } = useThree();
  const [sim] = useState(() => createSim(color));
  const { jelly } = sim;

  useEffect(() => changeColour(sim, color), [sim, color]);
  // A new flavour, or the "fresh one" button, brings back a whole popsicle.
  useEffect(() => {
    restore(sim);
    onBite(0);
  }, [sim, color, fresh, onBite]);
  useFrame(({ clock }, delta) => tick(sim, group.current, clock.elapsedTime, delta));

  // Keep the input area over the bar, whatever size the canvas is.
  useEffect(() => {
    const el = hit.current;
    if (!el) return;
    const project = (x: number, y: number) => {
      const v = new THREE.Vector3(x, y, BAR.depth / 2).project(camera);
      return [((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height];
    };
    const pad = 14;
    const [left, top] = project(-BAR.width / 2, BAR_TOP);
    const [right, bottom] = project(BAR.width / 2, BAR.bottom);
    Object.assign(el.style, {
      left: `${left - pad}px`,
      top: `${top - pad}px`,
      width: `${right - left + pad * 2}px`,
      height: `${bottom - top + pad * 2}px`,
    });
  }, [hit, camera, size]);

  // Drag: the lattice points nearest the touch follow the pointer in the popsicle's plane.
  useEffect(() => {
    const el = hit.current;
    if (!el) return;
    const ray = new THREE.Raycaster();
    const plane = new THREE.Plane();
    const start = new THREE.Vector3();
    const point = new THREE.Vector3();
    let active = -1;
    let press = { x: 0, y: 0, at: 0, travelled: 0, vertex: 0 };

    const aim = (e: PointerEvent) => {
      const r = gl.domElement.getBoundingClientRect();
      ray.setFromCamera(
        new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1),
        camera,
      );
    };
    const down = (e: PointerEvent) => {
      if (active !== -1) return;
      aim(e);
      const touched = ray.intersectObject(mesh.current)[0];
      if (!touched) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      active = e.pointerId;
      plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(point).negate(), touched.point);
      start.copy(group.current.worldToLocal(touched.point.clone()));
      grab(jelly, [start.x, start.y, start.z]);
      press = { x: e.clientX, y: e.clientY, at: performance.now(), travelled: 0, vertex: touched.face!.a };
      el.dataset.dragging = "true";
      onDrag();
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== active) return;
      press.travelled = Math.max(press.travelled, Math.hypot(e.clientX - press.x, e.clientY - press.y));
      aim(e);
      if (!ray.ray.intersectPlane(plane, point)) return;
      group.current.worldToLocal(point);
      dragBy(jelly, [point.x - start.x, point.y - start.y, point.z - start.z]);
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== active) return;
      active = -1;
      release(jelly);
      delete el.dataset.dragging;
      // A quick tap without moving takes a bite; anything else was a drag.
      const tapped = e.type === "pointerup" && press.travelled < TAP.pixels && performance.now() - press.at < TAP.ms;
      if (tapped && takeBite(sim, press.vertex)) onBite(biteCount(sim));
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      release(jelly);
    };
  }, [hit, camera, gl, jelly, sim, onDrag, onBite]);

  // Fast scrolling gives it a small shove.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const dy = THREE.MathUtils.clamp(window.scrollY - last, -60, 60);
      last = window.scrollY;
      if (Math.abs(dy) > 6 && !jelly.gripping) nudge(jelly, [dy * 0.012, -dy * 0.02, 0]);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [jelly]);

  return (
    <>
      <ambientLight intensity={1.15} />
      <directionalLight position={[-3, 5, 6]} intensity={1.5} />
      {/* A tiny studio drawn in code: gives the glossy highlight without downloading an HDR. */}
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.2} position={[-3, 3.5, 4]} scale={[5, 5, 1]} />
        <Lightformer form="rect" intensity={0.9} position={[4.5, 0, 3]} scale={[2.5, 7, 1]} />
        <Lightformer form="rect" intensity={0.5} position={[0, -4, 2]} scale={[8, 3, 1]} />
      </Environment>

      <group ref={group}>
        <RoundedBox args={[0.3, 1.7, 0.1]} radius={0.05} smoothness={4} position={[0, BAR.bottom - 0.35, 0]}>
          <meshStandardMaterial color="#D8B98A" roughness={0.75} />
        </RoundedBox>
        <mesh ref={mesh} geometry={sim.geometry} material={sim.material} frustumCulled={false} />
      </group>
    </>
  );
}

type JellyPopsicleProps = SceneProps & {
  /** Rendering pauses while the hero is off screen. */
  running: boolean;
  onReady: () => void;
};

export default function JellyPopsicle({ running, onReady, ...scene }: JellyPopsicleProps) {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      frameloop={running ? "always" : "never"}
      camera={{ fov: FOV, position: [0, 0, CAMERA_Z], near: 1, far: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      // Input comes through the hit area, so the page still scrolls around the popsicle.
      style={{ pointerEvents: "none" }}
      onCreated={onReady}
    >
      <Scene {...scene} />
    </Canvas>
  );
}
