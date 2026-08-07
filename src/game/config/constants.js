export const ARENA_WIDTH = 1180
export const ARENA_HEIGHT = 680

export const COLORS = {
  bg: 0x080a0f,
  surface: 0x111620,
  p1: 0x36b6ff,
  p2: 0xff4567,
  green: 0x45ffb1,
  purple: 0xa855f7,
  yellow: 0xffc857,
  text: 0xf5f7ff,
  wall: 0x1b2434,
}

export const PLAYER_RADIUS = 18
export const PLAYER_SPEED = 260
export const PLAYER_MAX_LIVES = 3
export const PLAYER_INVULN_MS = 500

// Respawn invulnerability (Deathmatch) — separate from post-hit invuln above.
export const RESPAWN_INVULN_MS = 1000

export const BULLET_RADIUS = 5
export const BULLET_SPEED = 620
export const BULLET_LIFESPAN_MS = 8000
export const BULLET_FADE_MS = 900
export const BULLET_MAX_PER_PLAYER = 3
export const BULLET_COOLDOWN_MS = 260

// Minimum time between two bounce events counted on the SAME bullet.
// Prevents a bullet wedged in a corner from registering dozens of
// bounces (and spawning dozens of particle bursts) within one frame.
export const BULLET_BOUNCE_COOLDOWN_MS = 60

// Cannon rotation speed for keyboard aiming (degrees/sec -> converted to rad/sec).
export const AIM_ROTATE_SPEED_DEG = 190
export const AIM_ROTATE_SPEED_RAD = (AIM_ROTATE_SPEED_DEG * Math.PI) / 180

export const BOT_AIM_TIME_MS = 1200
export const BOT_FIRE_COOLDOWN_MS = 1100
export const BOT_PREFERRED_DIST = 260

// Points/lives targets per game mode.
export const DEATHMATCH_TARGET_KILLS = 5
export const SURVIVAL_LIVES = 3
export const FIRST_TO_TARGET_ROUNDS = 5

export const DIFFICULTIES = {
  easy: {
    label: 'EASY',
    aimSpeedMult: 0.65,
    fireCooldownMult: 1.55,
    aimError: 0.32,
    dodgeChance: 0.25,
    bounceShotChance: 0.15,
  },
  normal: {
    label: 'NORMAL',
    aimSpeedMult: 1,
    fireCooldownMult: 1,
    aimError: 0.16,
    dodgeChance: 0.5,
    bounceShotChance: 0.32,
  },
  hard: {
    label: 'HARD',
    aimSpeedMult: 1.45,
    fireCooldownMult: 0.7,
    aimError: 0.05,
    dodgeChance: 0.82,
    bounceShotChance: 0.55,
  },
}
