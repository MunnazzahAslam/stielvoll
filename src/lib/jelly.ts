/**
 * A small soft body: a lattice of point masses joined by springs, integrated
 * with Verlet at a fixed timestep. The bottom row is pinned (that is where the
 * stick holds the popsicle), so the top swings most. A mesh follows the
 * lattice by free-form deformation (see `bindMesh` / `deformMesh`).
 *
 * Pure maths, no three.js, so it can be tuned and tested in Node.
 */

export type Vec3 = [number, number, number];

export type JellyOptions = {
  /** Lattice points along x, y, z. */
  nx: number;
  ny: number;
  nz: number;
  min: Vec3;
  max: Vec3;
  /** Firmness: stiffness of the springs between neighbouring points. */
  stiffness: number;
  /** A weaker pull of every point towards its rest position; sets the wobble speed. */
  homeStiffness: number;
  /** How fast it calms: velocity lost per second. */
  damping: number;
};

export type Jelly = {
  opts: JellyOptions;
  count: number;
  /** Current, previous and rest positions, xyz per point. */
  pos: Float32Array;
  prev: Float32Array;
  rest: Float32Array;
  pinned: Uint8Array;
  /** Spring endpoints (pairs of point indices) and rest lengths. */
  springs: Uint16Array;
  lengths: Float32Array;
  /** Drag state: per-point grip (0..1) and where each gripped point started. */
  grip: Float32Array;
  gripStart: Float32Array;
  gripOffset: Vec3;
  gripping: boolean;
  /** A steady sideways push, scaled by height, for the idle sway. */
  sway: Vec3;
  /** Unsimulated time carried between frames. */
  carry: number;
  force: Float32Array;
};

/** Fixed physics step. Small enough to stay stable with the stiffness used here. */
export const STEP = 1 / 240;
/** Never simulate more than this per frame (e.g. after a background tab wakes up). */
const MAX_FRAME = 1 / 20;
/** How hard the pointer pulls gripped points. */
const GRIP_STIFFNESS = 1600;
/** How far, in lattice units, the grip reaches from the touch point. */
const GRIP_RADIUS = 0.75;

export const pointIndex = (j: Jelly | JellyOptions, x: number, y: number, z: number) => {
  const o = "opts" in j ? j.opts : j;
  return x + o.nx * (y + o.ny * z);
};

export function createJelly(opts: JellyOptions): Jelly {
  const { nx, ny, nz, min, max } = opts;
  const count = nx * ny * nz;
  const rest = new Float32Array(count * 3);
  const pinned = new Uint8Array(count);

  for (let z = 0; z < nz; z++) {
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const i = pointIndex(opts, x, y, z);
        rest[i * 3] = min[0] + ((max[0] - min[0]) * x) / (nx - 1);
        rest[i * 3 + 1] = min[1] + ((max[1] - min[1]) * y) / (ny - 1);
        rest[i * 3 + 2] = min[2] + ((max[2] - min[2]) * z) / (nz - 1);
        // The bottom row sits on the stick.
        if (y === 0) pinned[i] = 1;
      }
    }
  }

  // Springs to every neighbour in the surrounding cells, diagonals included,
  // so the body resists stretching, shearing and twisting.
  const pairs: number[] = [];
  const lengths: number[] = [];
  for (let z = 0; z < nz; z++) {
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const a = pointIndex(opts, x, y, z);
        for (let dz = -1; dz <= 1; dz++) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const bx = x + dx, by = y + dy, bz = z + dz;
              if (bx < 0 || by < 0 || bz < 0 || bx >= nx || by >= ny || bz >= nz) continue;
              const b = pointIndex(opts, bx, by, bz);
              if (b <= a) continue;
              pairs.push(a, b);
              lengths.push(
                Math.hypot(rest[a * 3] - rest[b * 3], rest[a * 3 + 1] - rest[b * 3 + 1], rest[a * 3 + 2] - rest[b * 3 + 2]),
              );
            }
          }
        }
      }
    }
  }

  return {
    opts,
    count,
    pos: rest.slice(),
    prev: rest.slice(),
    rest,
    pinned,
    springs: Uint16Array.from(pairs),
    lengths: Float32Array.from(lengths),
    grip: new Float32Array(count),
    gripStart: new Float32Array(count * 3),
    gripOffset: [0, 0, 0],
    gripping: false,
    sway: [0, 0, 0],
    carry: 0,
    force: new Float32Array(count * 3),
  };
}

function substep(j: Jelly) {
  const { pos, prev, rest, force, springs, lengths, pinned, grip, gripStart } = j;
  const { stiffness, homeStiffness, damping, min, max } = j.opts;
  const h2 = STEP * STEP;
  const keep = 1 - damping * STEP;
  const height = max[1] - min[1];

  for (let i = 0; i < j.count; i++) {
    const a = i * 3;
    // Higher points catch more of the sway, like a reed in a breeze.
    const lift = (rest[a + 1] - min[1]) / height;
    force[a] = (rest[a] - pos[a]) * homeStiffness + j.sway[0] * lift;
    force[a + 1] = (rest[a + 1] - pos[a + 1]) * homeStiffness + j.sway[1] * lift;
    force[a + 2] = (rest[a + 2] - pos[a + 2]) * homeStiffness + j.sway[2] * lift;
    if (j.gripping && grip[i] > 0) {
      const g = GRIP_STIFFNESS * grip[i];
      force[a] += (gripStart[a] + j.gripOffset[0] - pos[a]) * g;
      force[a + 1] += (gripStart[a + 1] + j.gripOffset[1] - pos[a + 1]) * g;
      force[a + 2] += (gripStart[a + 2] + j.gripOffset[2] - pos[a + 2]) * g;
    }
  }

  for (let s = 0; s < lengths.length; s++) {
    const a = springs[s * 2] * 3;
    const b = springs[s * 2 + 1] * 3;
    const dx = pos[b] - pos[a], dy = pos[b + 1] - pos[a + 1], dz = pos[b + 2] - pos[a + 2];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
    const f = (stiffness * (len - lengths[s])) / len;
    force[a] += dx * f; force[a + 1] += dy * f; force[a + 2] += dz * f;
    force[b] -= dx * f; force[b + 1] -= dy * f; force[b + 2] -= dz * f;
  }

  for (let i = 0; i < j.count; i++) {
    if (pinned[i]) continue;
    for (let c = i * 3; c < i * 3 + 3; c++) {
      const next = pos[c] + (pos[c] - prev[c]) * keep + force[c] * h2;
      prev[c] = pos[c];
      pos[c] = next;
    }
  }
}

/** Advance the simulation by a frame's worth of time, in fixed steps. */
export function advance(j: Jelly, seconds: number) {
  j.carry += Math.min(seconds, MAX_FRAME);
  while (j.carry >= STEP) {
    substep(j);
    j.carry -= STEP;
  }
}

/** Start a drag at a point on the body: nearby lattice points take hold. */
export function grab(j: Jelly, at: Vec3) {
  for (let i = 0; i < j.count; i++) {
    const a = i * 3;
    const d2 = (j.pos[a] - at[0]) ** 2 + (j.pos[a + 1] - at[1]) ** 2 + (j.pos[a + 2] - at[2]) ** 2;
    j.grip[i] = j.pinned[i] ? 0 : Math.exp(-d2 / (GRIP_RADIUS * GRIP_RADIUS));
    j.gripStart[a] = j.pos[a];
    j.gripStart[a + 1] = j.pos[a + 1];
    j.gripStart[a + 2] = j.pos[a + 2];
  }
  j.gripOffset = [0, 0, 0];
  j.gripping = true;
}

/** Move the drag: how far the pointer is from where the drag began. */
export function dragBy(j: Jelly, offset: Vec3, maxPull = 1.4) {
  const len = Math.hypot(offset[0], offset[1], offset[2]);
  const k = len > maxPull ? maxPull / len : 1;
  j.gripOffset = [offset[0] * k, offset[1] * k, offset[2] * k];
}

export function release(j: Jelly) {
  j.gripping = false;
}

/** A sudden shove (flavour change, fast scroll): adds velocity, more at the top. */
export function nudge(j: Jelly, velocity: Vec3) {
  const { min, max } = j.opts;
  for (let i = 0; i < j.count; i++) {
    if (j.pinned[i]) continue;
    const a = i * 3;
    const lift = (j.rest[a + 1] - min[1]) / (max[1] - min[1]);
    // In Verlet, velocity lives in the gap between current and previous position.
    j.prev[a] -= velocity[0] * lift * STEP;
    j.prev[a + 1] -= velocity[1] * lift * STEP;
    j.prev[a + 2] -= velocity[2] * lift * STEP;
  }
}

/* ---------- Free-form deformation: a mesh that follows the lattice ---------- */

export type Binding = {
  /** For each vertex: the 8 lattice points of its cell and their weights. */
  indices: Uint16Array;
  weights: Float32Array;
};

/** Work out, once, which lattice cell each vertex sits in and how it blends. */
export function bindMesh(j: Jelly, vertices: ArrayLike<number>): Binding {
  const { nx, ny, nz, min, max } = j.opts;
  const n = vertices.length / 3;
  const indices = new Uint16Array(n * 8);
  const weights = new Float32Array(n * 8);
  const cell = (v: number, lo: number, hi: number, count: number) => {
    const t = Math.min(Math.max(((v - lo) / (hi - lo)) * (count - 1), 0), count - 1);
    const i = Math.min(Math.floor(t), count - 2);
    return [i, t - i] as const;
  };

  for (let v = 0; v < n; v++) {
    const [ix, fx] = cell(vertices[v * 3], min[0], max[0], nx);
    const [iy, fy] = cell(vertices[v * 3 + 1], min[1], max[1], ny);
    const [iz, fz] = cell(vertices[v * 3 + 2], min[2], max[2], nz);
    let k = v * 8;
    for (let dz = 0; dz <= 1; dz++) {
      for (let dy = 0; dy <= 1; dy++) {
        for (let dx = 0; dx <= 1; dx++) {
          indices[k] = pointIndex(j, ix + dx, iy + dy, iz + dz);
          weights[k] = (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy) * (dz ? fz : 1 - fz);
          k++;
        }
      }
    }
  }
  return { indices, weights };
}

/** Write the deformed vertex positions for the lattice's current shape. */
export function deformMesh(j: Jelly, binding: Binding, out: Float32Array) {
  const { indices, weights } = binding;
  const { pos } = j;
  for (let v = 0, k = 0; v < out.length; v += 3) {
    let x = 0, y = 0, z = 0;
    for (let c = 0; c < 8; c++, k++) {
      const p = indices[k] * 3;
      const w = weights[k];
      x += pos[p] * w; y += pos[p + 1] * w; z += pos[p + 2] * w;
    }
    out[v] = x; out[v + 1] = y; out[v + 2] = z;
  }
}
