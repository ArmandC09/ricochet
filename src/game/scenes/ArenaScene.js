import Phaser from 'phaser'
import { sfx } from '../audio.js'
import { getArena } from '../config/arenas.js'
import {
  ARENA_WIDTH,
  ARENA_HEIGHT,
  COLORS,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  PLAYER_MAX_LIVES,
  PLAYER_INVULN_MS,
  RESPAWN_INVULN_MS,
  BULLET_RADIUS,
  BULLET_SPEED,
  BULLET_LIFESPAN_MS,
  BULLET_FADE_MS,
  BULLET_MAX_PER_PLAYER,
  BULLET_COOLDOWN_MS,
  BULLET_BOUNCE_COOLDOWN_MS,
  AIM_ROTATE_SPEED_RAD,
  BOT_FIRE_COOLDOWN_MS,
  BOT_PREFERRED_DIST,
  DEATHMATCH_TARGET_KILLS,
  SURVIVAL_LIVES,
  FIRST_TO_TARGET_ROUNDS,
  DIFFICULTIES,
} from '../config/constants.js'

const RICOCHET_LABELS = ['', 'RICOCHET!', 'DOUBLE RICOCHET!', 'TRIPLE RICOCHET!']
const RICOCHET_INSANE = 'INSANE RICOCHET!'
const PLAYER_HIT_RADIUS = PLAYER_RADIUS + BULLET_RADIUS + 1
const BULLET_EPSILON = 1.5

function ricochetLabel(bounces) {
  if (bounces <= 0) return null
  if (bounces >= 4) return RICOCHET_INSANE
  return RICOCHET_LABELS[bounces]
}

function normalizeAngle(a) {
  return Phaser.Math.Angle.Wrap(a)
}

export default class ArenaScene extends Phaser.Scene {
  constructor() {
    super('Arena')
  }

  init(data) {
    this.mode = data.mode || 'solo'
    this.gameType = data.gameType || 'survival'
    this.difficultyKey = data.difficulty || 'normal'
    this.difficulty = DIFFICULTIES[this.difficultyKey] || DIFFICULTIES.normal
    this.arena = getArena(data.arenaId)
    this.emitter = this.game.registry.get('emitter')
  }

  create() {
    this.roundActive = false
    this.isOver = false
    this.lastShot = { p1: -9999, p2: -9999 }
    this.score = { p1: 0, p2: 0 }
    this.bulletSeq = 0
    this.keyState = Object.create(null)

    this.botState = {
      strafeDir: Math.random() < 0.5 ? -1 : 1,
      nextStrafeSwitch: 0,
      nextShot: 0,
      nextDecision: 0,
      moveTarget: null,
      lastX: 0,
      lastY: 0,
      stuckFor: 0,
      dodgeUntil: 0,
      dodgeDir: 1,
      preferredDistOffset: Phaser.Math.Between(-45, 45),
    }

    this.buildTextures()
    this.add.rectangle(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, ARENA_WIDTH, ARENA_HEIGHT, COLORS.bg).setDepth(-20)
    this.drawArenaBackground()

    this.physics.world.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT)

    this.obstacles = this.physics.add.staticGroup()
    this.obstacleRects = []
    this.arena.obstacles.forEach((o) => this.addObstacle(o))

    this.trailGfx = this.add.graphics().setDepth(3)

    const s1 = this.arena.spawns.p1
    const s2 = this.arena.spawns.p2
    this.player1 = this.createPlayer('p1', s1.x, s1.y, COLORS.p1)
    const p2Color = this.mode === 'solo' ? COLORS.purple : COLORS.p2
    this.player2 = this.createPlayer('p2', s2.x, s2.y, p2Color)
    this.player1.aimAngle = Math.atan2(s2.y - s1.y, s2.x - s1.x)
    this.player2.aimAngle = Math.atan2(s1.y - s2.y, s1.x - s2.x)

    this.physics.add.collider(this.player1.sprite, this.obstacles)
    this.physics.add.collider(this.player2.sprite, this.obstacles)
    this.physics.add.collider(this.player1.sprite, this.player2.sprite)

    // IMPORTANT: projectiles intentionally do NOT use Arcade Physics.
    // They are deterministic kinematic objects updated once per frame.
    // This removes the collision callback chain that caused freezes when a
    // shot hit a player in the previous implementation.
    this.bullets = this.add.group()

    this.setupInput()
    this.initScoreForMode()
    this.emitHud()
    this.updateCannon(this.player1)
    this.updateCannon(this.player2)
    this.startCountdown()

    this.events.once('shutdown', () => this.cleanup())
    this.events.once('destroy', () => this.cleanup())
  }

  buildTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false })
    const drawPlayer = (key, color) => {
      g.clear()
      g.fillStyle(color, 0.14)
      g.fillCircle(26, 26, 26)
      g.lineStyle(3, color, 1)
      g.strokeCircle(26, 26, PLAYER_RADIUS)
      g.fillStyle(color, 0.88)
      g.fillCircle(26, 26, PLAYER_RADIUS - 6)
      g.generateTexture(key, 52, 52)
    }
    drawPlayer('tex-p1', COLORS.p1)
    drawPlayer('tex-purple', COLORS.purple)
    drawPlayer('tex-p2', COLORS.p2)

    g.clear()
    g.fillStyle(0xffffff, 1)
    g.fillCircle(7, 7, BULLET_RADIUS)
    g.generateTexture('tex-bullet', 14, 14)

    g.clear()
    g.fillStyle(0xffffff, 1)
    g.fillCircle(3, 3, 3)
    g.generateTexture('tex-spark', 6, 6)
    g.destroy()
  }

  drawArenaBackground() {
    const gfx = this.add.graphics().setDepth(-10)
    gfx.fillStyle(0x0b111b, 1)
    gfx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT)
    gfx.lineStyle(1, 0x1d3954, 0.72)
    for (let x = 0; x <= ARENA_WIDTH; x += 50) gfx.lineBetween(x, 0, x, ARENA_HEIGHT)
    for (let y = 0; y <= ARENA_HEIGHT; y += 50) gfx.lineBetween(0, y, ARENA_WIDTH, y)
    gfx.lineStyle(5, COLORS.p1, 0.95)
    gfx.strokeRect(4, 4, ARENA_WIDTH - 8, ARENA_HEIGHT - 8)
    gfx.lineStyle(3, COLORS.purple, 0.95)
    const c = 58
    gfx.lineBetween(8, 8, 8 + c, 8); gfx.lineBetween(8, 8, 8, 8 + c)
    gfx.lineBetween(ARENA_WIDTH - 8, 8, ARENA_WIDTH - 8 - c, 8); gfx.lineBetween(ARENA_WIDTH - 8, 8, ARENA_WIDTH - 8, 8 + c)
    gfx.lineBetween(8, ARENA_HEIGHT - 8, 8 + c, ARENA_HEIGHT - 8); gfx.lineBetween(8, ARENA_HEIGHT - 8, 8, ARENA_HEIGHT - 8 - c)
    gfx.lineBetween(ARENA_WIDTH - 8, ARENA_HEIGHT - 8, ARENA_WIDTH - 8 - c, ARENA_HEIGHT - 8); gfx.lineBetween(ARENA_WIDTH - 8, ARENA_HEIGHT - 8, ARENA_WIDTH - 8, ARENA_HEIGHT - 8 - c)
    this.add.text(22, 18, this.arena?.name || 'RICOCHET', {
      fontFamily: 'monospace', fontSize: '18px', color: '#36b6ff',
    }).setDepth(2).setAlpha(0.82)
  }

  addObstacle({ x, y, w, h }) {
    const rect = this.add.rectangle(x, y, w, h, 0x182231).setDepth(1)
    rect.setStrokeStyle(3, COLORS.purple, 0.95)
    this.physics.add.existing(rect, true)
    this.obstacles.add(rect)
    this.obstacleRects.push({
      left: x - w / 2,
      right: x + w / 2,
      top: y - h / 2,
      bottom: y + h / 2,
      x, y, w, h,
    })
  }

  createPlayer(id, x, y, color) {
    const texKey = id === 'p1' ? 'tex-p1' : this.mode === 'solo' ? 'tex-purple' : 'tex-p2'
    const sprite = this.physics.add.sprite(x, y, texKey).setDepth(5)
    sprite.setCircle(PLAYER_RADIUS, 26 - PLAYER_RADIUS, 26 - PLAYER_RADIUS)
    sprite.setCollideWorldBounds(true)
    sprite.setData('id', id)

    const cannon = this.add.rectangle(x, y, 32, 7, color).setDepth(6)
    cannon.setOrigin(0, 0.5)
    return {
      id, sprite, cannon, color,
      lives: PLAYER_MAX_LIVES,
      aimAngle: 0,
      invulnerable: false,
      eliminated: false,
      spawn: { x, y },
    }
  }

  setupInput() {
    // Phaser keyboard plus a small window-level fallback. The fallback makes
    // controls reliable even when the canvas itself does not own DOM focus.
    this.keys = this.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      q: Phaser.Input.Keyboard.KeyCodes.Q,
      e: Phaser.Input.Keyboard.KeyCodes.E,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      j: Phaser.Input.Keyboard.KeyCodes.J,
      l: Phaser.Input.Keyboard.KeyCodes.L,
      k: Phaser.Input.Keyboard.KeyCodes.K,
    })

    const watched = new Set(['w','a','s','d','q','e',' ','arrowup','arrowdown','arrowleft','arrowright','j','l','k'])
    this._keyDown = (ev) => {
      const key = ev.key.toLowerCase()
      if (watched.has(key)) {
        this.keyState[key] = true
        if ([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(key)) ev.preventDefault()
      }
    }
    this._keyUp = (ev) => {
      const key = ev.key.toLowerCase()
      if (watched.has(key)) {
        this.keyState[key] = false
        if ([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(key)) ev.preventDefault()
      }
    }
    window.addEventListener('keydown', this._keyDown, { passive: false })
    window.addEventListener('keyup', this._keyUp, { passive: false })
  }

  isDown(name, domKey = name) {
    return Boolean(this.keys?.[name]?.isDown || this.keyState[domKey])
  }

  initScoreForMode() {
    if (this.gameType === 'survival') {
      this.score.p1 = SURVIVAL_LIVES
      this.score.p2 = SURVIVAL_LIVES
      this.player1.lives = SURVIVAL_LIVES
      this.player2.lives = SURVIVAL_LIVES
    } else {
      this.score.p1 = 0
      this.score.p2 = 0
    }
  }

  startCountdown() {
    const steps = ['3', '2', '1', 'RICOCHET!']
    steps.forEach((label, i) => {
      this.time.delayedCall(i * 650, () => {
        if (!this.scene.isActive() || this.isOver) return
        this.emitter?.emit('countdown', label)
        if (label === 'RICOCHET!') {
          this.time.delayedCall(400, () => {
            if (!this.scene.isActive() || this.isOver) return
            this.roundActive = true
            this.emitter?.emit('countdown', null)
          })
        }
      })
    })
  }

  // ---------- deterministic projectile system ----------

  shoot(player) {
    if (this.isOver || !this.roundActive || player.eliminated) return
    const now = this.time.now
    if (now - this.lastShot[player.id] < BULLET_COOLDOWN_MS) return
    const activeCount = this.bullets.getChildren().filter((b) => b.active && b.getData('owner') === player.id).length
    if (activeCount >= BULLET_MAX_PER_PLAYER) return

    this.lastShot[player.id] = now
    const angle = player.aimAngle
    const spawnX = player.sprite.x + Math.cos(angle) * (PLAYER_RADIUS + 14)
    const spawnY = player.sprite.y + Math.sin(angle) * (PLAYER_RADIUS + 14)
    const bullet = this.add.image(spawnX, spawnY, 'tex-bullet').setDepth(4).setTint(player.color)
    bullet.setDataEnabled()
    bullet.setData('id', ++this.bulletSeq)
    bullet.setData('owner', player.id)
    bullet.setData('vx', Math.cos(angle) * BULLET_SPEED)
    bullet.setData('vy', Math.sin(angle) * BULLET_SPEED)
    bullet.setData('bounces', 0)
    bullet.setData('lastBounceTime', -9999)
    bullet.setData('spawnTime', now)
    bullet.setData('prevX', spawnX)
    bullet.setData('prevY', spawnY)
    bullet.setData('removed', false)
    this.bullets.add(bullet)

    this.muzzleFlash(spawnX, spawnY, player.color)
    try { sfx.shoot() } catch (_) { /* audio must never affect gameplay */ }
  }

  removeBullet(bullet) {
    if (!bullet || bullet.getData('removed')) return
    bullet.setData('removed', true)
    bullet.setActive(false).setVisible(false)
    this.bullets.remove(bullet, true, true)
  }

  muzzleFlash(x, y, color) {
    const flash = this.add.circle(x, y, 10, color, 0.55).setDepth(7)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 0.25,
      duration: 110,
      onComplete: () => flash.destroy(),
    })
  }

  spawnBounceParticles(x, y, color) {
    for (let i = 0; i < 4; i++) {
      const p = this.add.image(x, y, 'tex-spark').setDepth(7).setTint(color)
      const ang = Math.random() * Math.PI * 2
      const dist = 8 + Math.random() * 14
      this.tweens.add({
        targets: p,
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist,
        alpha: 0,
        duration: 180,
        onComplete: () => p.destroy(),
      })
    }
    try { sfx.bounce() } catch (_) { /* no-op */ }
  }

  registerBounce(bullet, time) {
    const last = bullet.getData('lastBounceTime') || -9999
    if (time - last < BULLET_BOUNCE_COOLDOWN_MS) return false
    bullet.setData('lastBounceTime', time)
    bullet.setData('bounces', (bullet.getData('bounces') || 0) + 1)
    this.spawnBounceParticles(bullet.x, bullet.y, bullet.tintTopLeft)
    return true
  }

  moveBullet(b, time, dt) {
    let x = b.x
    let y = b.y
    let vx = b.getData('vx')
    let vy = b.getData('vy')
    const prevX = x
    const prevY = y

    x += vx * dt
    y += vy * dt

    let bounced = false
    if (x <= BULLET_RADIUS) {
      x = BULLET_RADIUS + BULLET_EPSILON
      vx = Math.abs(vx)
      bounced = true
    } else if (x >= ARENA_WIDTH - BULLET_RADIUS) {
      x = ARENA_WIDTH - BULLET_RADIUS - BULLET_EPSILON
      vx = -Math.abs(vx)
      bounced = true
    }
    if (y <= BULLET_RADIUS) {
      y = BULLET_RADIUS + BULLET_EPSILON
      vy = Math.abs(vy)
      bounced = true
    } else if (y >= ARENA_HEIGHT - BULLET_RADIUS) {
      y = ARENA_HEIGHT - BULLET_RADIUS - BULLET_EPSILON
      vy = -Math.abs(vy)
      bounced = true
    }

    // Axis-aligned obstacle reflection. Use previous position to determine the
    // side entered; if the bullet steps into a corner, reflect both axes.
    for (let i = 0; i < this.obstacleRects.length; i++) {
      const r = this.obstacleRects[i]
      const inside = x + BULLET_RADIUS > r.left && x - BULLET_RADIUS < r.right && y + BULLET_RADIUS > r.top && y - BULLET_RADIUS < r.bottom
      if (!inside) continue

      const cameFromLeft = prevX + BULLET_RADIUS <= r.left
      const cameFromRight = prevX - BULLET_RADIUS >= r.right
      const cameFromTop = prevY + BULLET_RADIUS <= r.top
      const cameFromBottom = prevY - BULLET_RADIUS >= r.bottom

      if (cameFromLeft) {
        x = r.left - BULLET_RADIUS - BULLET_EPSILON
        vx = -Math.abs(vx)
      } else if (cameFromRight) {
        x = r.right + BULLET_RADIUS + BULLET_EPSILON
        vx = Math.abs(vx)
      } else if (cameFromTop) {
        y = r.top - BULLET_RADIUS - BULLET_EPSILON
        vy = -Math.abs(vy)
      } else if (cameFromBottom) {
        y = r.bottom + BULLET_RADIUS + BULLET_EPSILON
        vy = Math.abs(vy)
      } else {
        // Rare high-speed/corner penetration fallback: reflect along the
        // shallowest penetration axis and push outside immediately.
        const penL = Math.abs((x + BULLET_RADIUS) - r.left)
        const penR = Math.abs(r.right - (x - BULLET_RADIUS))
        const penT = Math.abs((y + BULLET_RADIUS) - r.top)
        const penB = Math.abs(r.bottom - (y - BULLET_RADIUS))
        const min = Math.min(penL, penR, penT, penB)
        if (min === penL) { x = r.left - BULLET_RADIUS - BULLET_EPSILON; vx = -Math.abs(vx) }
        else if (min === penR) { x = r.right + BULLET_RADIUS + BULLET_EPSILON; vx = Math.abs(vx) }
        else if (min === penT) { y = r.top - BULLET_RADIUS - BULLET_EPSILON; vy = -Math.abs(vy) }
        else { y = r.bottom + BULLET_RADIUS + BULLET_EPSILON; vy = Math.abs(vy) }
      }
      bounced = true
      break
    }

    b.x = x
    b.y = y
    b.setData('vx', vx)
    b.setData('vy', vy)
    if (bounced) this.registerBounce(b, time)
  }

  checkBulletPlayerHit(bullet, player) {
    if (!bullet.active || player.eliminated || player.invulnerable) return false
    const owner = bullet.getData('owner')
    const bounces = bullet.getData('bounces') || 0
    if (owner === player.id && bounces === 0) return false
    const dx = bullet.x - player.sprite.x
    const dy = bullet.y - player.sprite.y
    return dx * dx + dy * dy <= PLAYER_HIT_RADIUS * PLAYER_HIT_RADIUS
  }

  resolveBulletHit(bullet, player) {
    if (!bullet.active || this.isOver || !this.roundActive) return
    const owner = bullet.getData('owner')
    const bounces = bullet.getData('bounces') || 0
    this.removeBullet(bullet)
    this.resolveHit(player, owner, bounces)
  }

  updateBullets(time, delta) {
    this.trailGfx.clear()
    const dt = Math.min(delta, 40) / 1000
    const bullets = this.bullets.getChildren().slice()

    for (const b of bullets) {
      if (!b.active) continue
      const age = time - b.getData('spawnTime')
      if (age >= BULLET_LIFESPAN_MS) {
        this.removeBullet(b)
        continue
      }

      const prevX = b.x
      const prevY = b.y
      this.moveBullet(b, time, dt)
      if (!b.active) continue

      if (this.checkBulletPlayerHit(b, this.player1)) {
        this.resolveBulletHit(b, this.player1)
        continue
      }
      if (this.checkBulletPlayerHit(b, this.player2)) {
        this.resolveBulletHit(b, this.player2)
        continue
      }

      if (age > BULLET_LIFESPAN_MS - BULLET_FADE_MS) {
        b.setAlpha(Phaser.Math.Clamp((BULLET_LIFESPAN_MS - age) / BULLET_FADE_MS, 0, 1))
      }
      this.trailGfx.lineStyle(3, b.tintTopLeft, 0.35)
      this.trailGfx.lineBetween(prevX, prevY, b.x, b.y)
    }
  }

  // ---------- hit / match logic ----------

  resolveHit(victim, shooterId, bounces) {
    if (victim.invulnerable || victim.eliminated || this.isOver) return
    victim.invulnerable = true
    try { sfx.hit() } catch (_) { /* no-op */ }
    this.flashHit(victim)
    const label = ricochetLabel(bounces)

    if (this.gameType === 'survival') {
      victim.lives = Math.max(0, victim.lives - 1)
      this.score[victim.id] = victim.lives
      this.emitHud()
      if (label) this.emitter?.emit('ricochetKill', label)
      if (victim.lives <= 0) {
        victim.eliminated = true
        const winner = victim === this.player1 ? this.player2 : this.player1
        this.endMatch(winner, victim)
      } else {
        this.time.delayedCall(PLAYER_INVULN_MS, () => {
          if (victim && !victim.eliminated) victim.invulnerable = false
        })
      }
      return
    }

    if (this.gameType === 'deathmatch') {
      if (shooterId && shooterId !== victim.id) this.score[shooterId] = (this.score[shooterId] || 0) + 1
      this.emitHud()
      if (label) this.emitter?.emit('ricochetKill', label)
      const shooterScore = shooterId ? this.score[shooterId] || 0 : 0
      if (shooterId && shooterId !== victim.id && shooterScore >= DEATHMATCH_TARGET_KILLS) {
        const winner = shooterId === 'p1' ? this.player1 : this.player2
        const loser = winner === this.player1 ? this.player2 : this.player1
        this.endMatch(winner, loser)
      } else {
        this.respawnPlayer(victim)
      }
      return
    }

    if (this.gameType === 'firstTo5') {
      if (shooterId && shooterId !== victim.id) this.score[shooterId] = (this.score[shooterId] || 0) + 1
      this.emitHud()
      if (label) this.emitter?.emit('ricochetKill', label)
      const shooterScore = shooterId ? this.score[shooterId] || 0 : 0
      if (shooterId && shooterId !== victim.id && shooterScore >= FIRST_TO_TARGET_ROUNDS) {
        const winner = shooterId === 'p1' ? this.player1 : this.player2
        const loser = winner === this.player1 ? this.player2 : this.player1
        this.endMatch(winner, loser)
      } else {
        this.startNewRound()
      }
    }
  }

  flashHit(player) {
    this.cameras.main.flash(45, 255, 255, 255, false)
    const sprite = player.sprite
    this.tweens.killTweensOf(sprite)
    sprite.setAlpha(0.2)
    this.tweens.add({
      targets: sprite,
      alpha: 1,
      duration: 80,
      yoyo: true,
      repeat: 2,
      onComplete: () => sprite?.active && sprite.setAlpha(1),
    })
  }

  respawnPlayer(player) {
    player.sprite.setVelocity(0, 0)
    player.sprite.setPosition(player.spawn.x, player.spawn.y)
    player.invulnerable = true
    player.eliminated = false
    this.time.delayedCall(RESPAWN_INVULN_MS, () => {
      if (player && !player.eliminated) player.invulnerable = false
    })
  }

  startNewRound() {
    this.roundActive = false
    this.clearAllBullets()
    this.player1.sprite.setVelocity(0, 0)
    this.player2.sprite.setVelocity(0, 0)
    this.player1.sprite.setPosition(this.player1.spawn.x, this.player1.spawn.y)
    this.player2.sprite.setPosition(this.player2.spawn.x, this.player2.spawn.y)
    this.player1.invulnerable = false
    this.player2.invulnerable = false
    this.startCountdown()
  }

  clearAllBullets() {
    this.bullets.getChildren().slice().forEach((b) => this.removeBullet(b))
  }

  endMatch(winner, loser) {
    if (this.isOver) return
    this.isOver = true
    this.roundActive = false
    this.clearAllBullets()
    loser.sprite.setVelocity(0, 0)
    winner.sprite.setVelocity(0, 0)
    this.tweens.add({
      targets: loser.sprite,
      scale: 0.2,
      alpha: 0,
      duration: 260,
      ease: 'Quad.easeIn',
    })
    this.time.delayedCall(300, () => {
      if (this.scene.isActive()) this.emitter?.emit('gameOver', { winnerId: winner.id, mode: this.mode })
    })
  }

  emitHud() {
    if (this.gameType === 'survival') {
      this.emitter?.emit('hudChange', { type: 'lives', p1: this.score.p1, p2: this.score.p2 })
    } else {
      const target = this.gameType === 'deathmatch' ? DEATHMATCH_TARGET_KILLS : FIRST_TO_TARGET_ROUNDS
      this.emitter?.emit('hudChange', { type: 'score', p1: this.score.p1, p2: this.score.p2, target })
    }
  }

  // ---------- frame update / controls ----------

  update(time, delta) {
    this.updateCannon(this.player1)
    this.updateCannon(this.player2)
    if (!this.roundActive || this.isOver) {
      this.player1?.sprite?.setVelocity(0, 0)
      this.player2?.sprite?.setVelocity(0, 0)
      return
    }

    this.handlePlayer1(delta)
    if (this.mode === 'local') this.handlePlayer2Local(delta)
    else this.handleBot(time, delta)

    this.updateBullets(time, delta)
    this.updateCannon(this.player1)
    this.updateCannon(this.player2)
  }

  applyMove(sprite, dx, dy, speed = PLAYER_SPEED) {
    if (!sprite?.active) return
    if (!dx && !dy) {
      sprite.setVelocity(0, 0)
      return
    }
    const len = Math.hypot(dx, dy) || 1
    sprite.setVelocity((dx / len) * speed, (dy / len) * speed)
  }

  handlePlayer1(delta) {
    let dx = 0, dy = 0
    if (this.isDown('a')) dx -= 1
    if (this.isDown('d')) dx += 1
    if (this.isDown('w')) dy -= 1
    if (this.isDown('s')) dy += 1
    this.applyMove(this.player1.sprite, dx, dy)

    const rot = AIM_ROTATE_SPEED_RAD * (Math.min(delta, 40) / 1000)
    if (this.isDown('q')) this.player1.aimAngle -= rot
    if (this.isDown('e')) this.player1.aimAngle += rot
    this.player1.aimAngle = normalizeAngle(this.player1.aimAngle)
    if (this.isDown('space', ' ')) this.shoot(this.player1)
  }

  handlePlayer2Local(delta) {
    let dx = 0, dy = 0
    if (this.isDown('left', 'arrowleft')) dx -= 1
    if (this.isDown('right', 'arrowright')) dx += 1
    if (this.isDown('up', 'arrowup')) dy -= 1
    if (this.isDown('down', 'arrowdown')) dy += 1
    this.applyMove(this.player2.sprite, dx, dy)

    const rot = AIM_ROTATE_SPEED_RAD * (Math.min(delta, 40) / 1000)
    if (this.isDown('j')) this.player2.aimAngle -= rot
    if (this.isDown('l')) this.player2.aimAngle += rot
    this.player2.aimAngle = normalizeAngle(this.player2.aimAngle)
    if (this.isDown('k')) this.shoot(this.player2)
  }

  // ---------- improved bot AI ----------

  hasLineOfSight(fromX, fromY, toX, toY) {
    const dx = toX - fromX
    const dy = toY - fromY
    const len = Math.hypot(dx, dy)
    const steps = Math.max(4, Math.ceil(len / 26))
    for (let i = 1; i < steps; i++) {
      const t = i / steps
      const px = fromX + dx * t
      const py = fromY + dy * t
      for (const r of this.obstacleRects) {
        if (px > r.left && px < r.right && py > r.top && py < r.bottom) return false
      }
    }
    return true
  }

  nearestThreatBullet(bot) {
    let best = null
    let bestT = Infinity
    for (const b of this.bullets.getChildren()) {
      if (!b.active) continue
      const vx = b.getData('vx') || 0
      const vy = b.getData('vy') || 0
      const speed2 = vx * vx + vy * vy
      if (speed2 < 1) continue
      const rx = bot.sprite.x - b.x
      const ry = bot.sprite.y - b.y
      const t = (rx * vx + ry * vy) / speed2
      if (t < 0 || t > 0.55) continue
      const closestX = b.x + vx * t
      const closestY = b.y + vy * t
      const miss = Math.hypot(bot.sprite.x - closestX, bot.sprite.y - closestY)
      if (miss < 54 && t < bestT) {
        bestT = t
        best = { bullet: b, t, miss }
      }
    }
    return best
  }

  chooseSafeTarget(bot) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const x = Phaser.Math.Between(90, ARENA_WIDTH - 90)
      const y = Phaser.Math.Between(90, ARENA_HEIGHT - 90)
      const blocked = this.obstacleRects.some((r) => x > r.left - 45 && x < r.right + 45 && y > r.top - 45 && y < r.bottom + 45)
      if (!blocked) return { x, y }
    }
    return { x: ARENA_WIDTH / 2, y: ARENA_HEIGHT / 2 }
  }

  predictTargetAngle(bot, target, leadFactor) {
    const tx = target.sprite.x + target.sprite.body.velocity.x * leadFactor
    const ty = target.sprite.y + target.sprite.body.velocity.y * leadFactor
    return Math.atan2(ty - bot.sprite.y, tx - bot.sprite.x)
  }

  bounceAimAngle(bot, target) {
    // Single-wall mirror solutions: left, right, top, bottom. Pick the one
    // whose outgoing segment from bot to wall is unobstructed and shortest.
    const bx = bot.sprite.x, by = bot.sprite.y
    const tx = target.sprite.x, ty = target.sprite.y
    const candidates = [
      { x: -tx, y: ty },
      { x: 2 * ARENA_WIDTH - tx, y: ty },
      { x: tx, y: -ty },
      { x: tx, y: 2 * ARENA_HEIGHT - ty },
    ]
    candidates.sort((a, b) => Math.hypot(a.x - bx, a.y - by) - Math.hypot(b.x - bx, b.y - by))
    return Math.atan2(candidates[0].y - by, candidates[0].x - bx)
  }

  handleBot(time, delta) {
    const bot = this.player2
    const target = this.player1
    const diff = this.difficulty
    const st = this.botState
    if (bot.eliminated) return

    const bx = bot.sprite.x, by = bot.sprite.y
    const tx = target.sprite.x, ty = target.sprite.y
    const toTarget = Math.atan2(ty - by, tx - bx)
    const dist = Phaser.Math.Distance.Between(bx, by, tx, ty)

    // Detect meaningful lack of movement rather than comparing against only
    // the immediately preceding frame (which made the old bot look inert).
    if (!st.lastX && !st.lastY) { st.lastX = bx; st.lastY = by }
    const moved = Math.hypot(bx - st.lastX, by - st.lastY)
    st.stuckFor = moved < 2 ? st.stuckFor + delta : 0
    if (time > st.nextDecision) {
      st.lastX = bx
      st.lastY = by
      st.nextDecision = time + 300
    }

    if (time > st.nextStrafeSwitch) {
      st.strafeDir *= -1
      st.nextStrafeSwitch = time + Phaser.Math.Between(900, this.difficultyKey === 'hard' ? 1700 : 2500)
      st.preferredDistOffset = Phaser.Math.Between(-55, 55)
    }

    const threat = this.nearestThreatBullet(bot)
    const edgeMargin = 72
    const nearEdge = bx < edgeMargin || bx > ARENA_WIDTH - edgeMargin || by < edgeMargin || by > ARENA_HEIGHT - edgeMargin

    let dx = 0, dy = 0
    let speedMult = this.difficultyKey === 'easy' ? 0.78 : this.difficultyKey === 'hard' ? 1.04 : 0.92

    if (threat && (this.difficultyKey !== 'easy' || Math.random() < 0.38)) {
      const bvx = threat.bullet.getData('vx')
      const bvy = threat.bullet.getData('vy')
      const perpA = Math.atan2(bvy, bvx) + Math.PI / 2
      // choose perpendicular direction that points more toward arena center
      const ax = Math.cos(perpA), ay = Math.sin(perpA)
      const centerX = ARENA_WIDTH / 2 - bx, centerY = ARENA_HEIGHT / 2 - by
      const sign = ax * centerX + ay * centerY >= 0 ? 1 : -1
      dx = ax * sign
      dy = ay * sign
      speedMult = this.difficultyKey === 'hard' ? 1.14 : 1.0
      st.dodgeUntil = time + 260
    } else if (nearEdge) {
      const a = Math.atan2(ARENA_HEIGHT / 2 - by, ARENA_WIDTH / 2 - bx)
      dx = Math.cos(a) + Math.cos(toTarget + Math.PI / 2) * 0.35 * st.strafeDir
      dy = Math.sin(a) + Math.sin(toTarget + Math.PI / 2) * 0.35 * st.strafeDir
    } else if (st.stuckFor > 700) {
      if (!st.moveTarget || Phaser.Math.Distance.Between(bx, by, st.moveTarget.x, st.moveTarget.y) < 45) st.moveTarget = this.chooseSafeTarget(bot)
      const a = Math.atan2(st.moveTarget.y - by, st.moveTarget.x - bx)
      dx = Math.cos(a)
      dy = Math.sin(a)
    } else {
      const preferred = BOT_PREFERRED_DIST + st.preferredDistOffset
      const radial = dist < preferred - 60 ? -0.9 : dist > preferred + 90 ? 0.75 : 0
      const strafe = this.difficultyKey === 'easy' ? 0.48 : this.difficultyKey === 'hard' ? 1.0 : 0.78
      dx = Math.cos(toTarget) * radial + Math.cos(toTarget + Math.PI / 2) * strafe * st.strafeDir
      dy = Math.sin(toTarget) * radial + Math.sin(toTarget + Math.PI / 2) * strafe * st.strafeDir
    }

    this.applyMove(bot.sprite, dx, dy, PLAYER_SPEED * speedMult)

    // Aim differs visibly by difficulty: easy reacts slowly and has large
    // wandering error; hard predicts player movement and uses bounce shots.
    const los = this.hasLineOfSight(bx, by, tx, ty)
    const lead = this.difficultyKey === 'hard' ? Math.min(0.28, dist / BULLET_SPEED * 0.55) : this.difficultyKey === 'normal' ? 0.09 : 0
    let desiredAim = this.predictTargetAngle(bot, target, lead)
    let tryingBounce = false
    const bounceProbability = diff.bounceShotChance * (los ? 0.16 : 1)
    if (Math.random() < bounceProbability * Math.min(delta / 16.67, 1.5)) {
      desiredAim = this.bounceAimAngle(bot, target)
      tryingBounce = true
    }

    const errorScale = this.difficultyKey === 'easy' ? 1.0 : this.difficultyKey === 'normal' ? 0.45 : 0.16
    desiredAim += Math.sin(time * 0.0027 + 2.3) * diff.aimError * errorScale
    const rotateSpeed = AIM_ROTATE_SPEED_RAD * diff.aimSpeedMult * (Math.min(delta, 40) / 1000)
    bot.aimAngle = Phaser.Math.Angle.RotateTo(bot.aimAngle, desiredAim, rotateSpeed)

    if (!st.nextShot) st.nextShot = time + 450
    const aimDiff = Math.abs(normalizeAngle(bot.aimAngle - desiredAim))
    const tolerance = this.difficultyKey === 'easy' ? 0.24 : this.difficultyKey === 'hard' ? 0.11 : 0.17
    const canFire = los || tryingBounce || this.difficultyKey === 'hard'
    if (time >= st.nextShot && aimDiff < tolerance && canFire) {
      this.shoot(bot)
      const jitter = this.difficultyKey === 'easy' ? Phaser.Math.Between(100, 500) : Phaser.Math.Between(-80, 180)
      st.nextShot = time + BOT_FIRE_COOLDOWN_MS * diff.fireCooldownMult + jitter
    }
  }

  updateCannon(player) {
    if (!player?.cannon || !player?.sprite) return
    player.cannon.x = player.sprite.x
    player.cannon.y = player.sprite.y
    player.cannon.rotation = player.aimAngle
  }

  cleanup() {
    this.roundActive = false
    this.clearAllBullets?.()
    if (this._keyDown) window.removeEventListener('keydown', this._keyDown)
    if (this._keyUp) window.removeEventListener('keyup', this._keyUp)
    this._keyDown = null
    this._keyUp = null
    this.keyState = Object.create(null)
  }
}
