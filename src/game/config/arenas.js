import { ARENA_WIDTH as W, ARENA_HEIGHT as H } from './constants.js'

// Every obstacle is an axis-aligned rectangle { x, y, w, h } in absolute
// arena coordinates. Arcade Physics only resolves AABB collisions, so
// "diagonal" / "triangular" looking arenas are built from small staggered
// blocks rather than rotated bodies — this keeps bounce trajectories exact
// instead of relying on approximate rotated-rect collision.
//
// Each arena also defines mirrored spawn points for p1 / p2 so nobody
// starts already lined up for an instant shot, and never inside geometry.

export const ARENAS = [
  {
    id: 'core',
    name: 'CORE',
    difficulty: 'EASY',
    description: 'Balanced rectangular arena with clean bounce lines. Best for learning.',
    spawns: {
      p1: { x: W * 0.18, y: H * 0.5 },
      p2: { x: W * 0.82, y: H * 0.5 },
    },
    obstacles: [
      { x: W * 0.5, y: H * 0.5, w: 120, h: 26 },
      { x: W * 0.27, y: H * 0.28, w: 26, h: 150 },
      { x: W * 0.73, y: H * 0.28, w: 26, h: 150 },
      { x: W * 0.27, y: H * 0.72, w: 26, h: 150 },
      { x: W * 0.73, y: H * 0.72, w: 26, h: 150 },
    ],
  },
  {
    id: 'crossfire',
    name: 'CROSSFIRE',
    difficulty: 'NORMAL',
    description: 'A huge central cross carves out sharp angles and tight bounce pockets.',
    spawns: {
      p1: { x: W * 0.14, y: H * 0.2 },
      p2: { x: W * 0.86, y: H * 0.8 },
    },
    obstacles: [
      { x: W * 0.5, y: H * 0.5, w: 300, h: 30 },
      { x: W * 0.5, y: H * 0.5, w: 30, h: 220 },
      { x: W * 0.5, y: H * 0.18, w: 90, h: 20 },
      { x: W * 0.5, y: H * 0.82, w: 90, h: 20 },
      { x: W * 0.18, y: H * 0.5, w: 20, h: 90 },
      { x: W * 0.82, y: H * 0.5, w: 20, h: 90 },
    ],
  },
  {
    id: 'fortress',
    name: 'FORTRESS',
    difficulty: 'NORMAL',
    description: 'Two mirrored bases give each player a home corner to defend or abandon.',
    spawns: {
      p1: { x: W * 0.13, y: H * 0.62 },
      p2: { x: W * 0.87, y: H * 0.38 },
    },
    obstacles: [
      // p1 base (L-shape), tucked into the top-left corner
      { x: W * 0.1, y: H * 0.22, w: 130, h: 20 },
      { x: W * 0.16, y: H * 0.32, w: 20, h: 140 },
      // p2 base (mirrored L-shape), tucked into the bottom-right corner
      { x: W * 0.9, y: H * 0.78, w: 130, h: 20 },
      { x: W * 0.84, y: H * 0.68, w: 20, h: 140 },
      // central obstacles
      { x: W * 0.5, y: H * 0.38, w: 120, h: 24 },
      { x: W * 0.5, y: H * 0.62, w: 120, h: 24 },
    ],
  },
  {
    id: 'maze',
    name: 'MAZE',
    difficulty: 'HARD',
    description: 'A loose labyrinth of corridors — open enough for long, clever ricochets.',
    spawns: {
      p1: { x: W * 0.12, y: H * 0.15 },
      p2: { x: W * 0.88, y: H * 0.85 },
    },
    obstacles: [
      { x: W * 0.28, y: H * 0.22, w: 22, h: 200 },
      { x: W * 0.28, y: H * 0.22, w: 160, h: 22 },
      { x: W * 0.5, y: H * 0.5, w: 22, h: 220 },
      { x: W * 0.72, y: H * 0.78, w: 22, h: 200 },
      { x: W * 0.62, y: H * 0.78, w: 160, h: 22 },
      { x: W * 0.72, y: H * 0.18, w: 130, h: 20 },
      { x: W * 0.2, y: H * 0.82, w: 130, h: 20 },
    ],
  },
  {
    id: 'chaos',
    name: 'CHAOS',
    difficulty: 'HARD',
    description: 'Staggered blocks scattered like shrapnel. Trajectories get unpredictable fast.',
    spawns: {
      p1: { x: W * 0.15, y: H * 0.85 },
      p2: { x: W * 0.85, y: H * 0.15 },
    },
    obstacles: [
      // staggered "diagonal" staircase (top-left to bottom-right), mirrored
      { x: W * 0.3, y: H * 0.2, w: 46, h: 46 },
      { x: W * 0.38, y: H * 0.3, w: 40, h: 40 },
      { x: W * 0.46, y: H * 0.4, w: 34, h: 34 },
      { x: W * 0.54, y: H * 0.6, w: 34, h: 34 },
      { x: W * 0.62, y: H * 0.7, w: 40, h: 40 },
      { x: W * 0.7, y: H * 0.8, w: 46, h: 46 },
      // scattered small blocks
      { x: W * 0.15, y: H * 0.45, w: 30, h: 30 },
      { x: W * 0.85, y: H * 0.55, w: 30, h: 30 },
      { x: W * 0.5, y: H * 0.5, w: 24, h: 24 },
    ],
  },
]

export function getArena(id) {
  return ARENAS.find((a) => a.id === id) || ARENAS[0]
}

export function randomArenaId() {
  const pool = ARENAS
  return pool[Math.floor(Math.random() * pool.length)].id
}
