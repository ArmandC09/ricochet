import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import PhaserGame from '../game/PhaserGame.jsx'
import { PLAYER_MAX_LIVES } from '../game/config/constants.js'

function Hearts({ count, colorClass }) {
  return (
    <div className={`hud-hearts ${colorClass}`}>
      {Array.from({ length: PLAYER_MAX_LIVES }).map((_, i) => (
        <span key={i} className={i < count ? '' : 'heart-empty'}>♥</span>
      ))}
    </div>
  )
}

function ScoreBadge({ value, target, colorClass }) {
  return (
    <div className={`hud-score ${colorClass}`}>
      <span>{value}</span>
      {typeof target === 'number' && <span className="hud-score-target">/ {target}</span>}
    </div>
  )
}

export default function GameScreen({ mode, gameType, difficulty, arenaId, onExitToMenu }) {
  const [matchKey, setMatchKey] = useState(0)
  const [hud, setHud] = useState({ type: 'lives', p1: PLAYER_MAX_LIVES, p2: PLAYER_MAX_LIVES })
  const [countdown, setCountdown] = useState('3')
  const [paused, setPaused] = useState(false)
  const [over, setOver] = useState(null)
  const [ricochetMsg, setRicochetMsg] = useState(null)

  const emitterRef = useRef(null)
  const gameRef = useRef(null)
  const ricochetTimerRef = useRef(null)
  if (!emitterRef.current) emitterRef.current = new Phaser.Events.EventEmitter()

  useEffect(() => {
    const emitter = emitterRef.current
    const onHud = (v) => setHud(v)
    const onCountdown = (v) => setCountdown(v)
    const onGameOver = (payload) => setOver(payload)
    const onRicochet = (label) => {
      setRicochetMsg(label)
      if (ricochetTimerRef.current) clearTimeout(ricochetTimerRef.current)
      ricochetTimerRef.current = setTimeout(() => setRicochetMsg(null), 1100)
    }
    emitter.on('hudChange', onHud)
    emitter.on('countdown', onCountdown)
    emitter.on('gameOver', onGameOver)
    emitter.on('ricochetKill', onRicochet)
    return () => {
      emitter.off('hudChange', onHud)
      emitter.off('countdown', onCountdown)
      emitter.off('gameOver', onGameOver)
      emitter.off('ricochetKill', onRicochet)
      if (ricochetTimerRef.current) clearTimeout(ricochetTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && !over && countdown === null) {
        togglePause()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, over, countdown])

  function togglePause() {
    const game = gameRef.current
    if (!game) return
    setPaused((p) => {
      const next = !p
      if (next) game.scene.pause('Arena')
      else game.scene.resume('Arena')
      return next
    })
  }

  function handleRematch() {
    setHud({ type: 'lives', p1: PLAYER_MAX_LIVES, p2: PLAYER_MAX_LIVES })
    setCountdown('3')
    setPaused(false)
    setOver(null)
    setRicochetMsg(null)
    setMatchKey((k) => k + 1)
  }

  function resultLabel() {
    if (!over) return ''
    if (mode === 'solo') return over.winnerId === 'p1' ? 'YOU WIN' : 'YOU LOSE'
    return over.winnerId === 'p1' ? 'PLAYER 1 WINS' : 'PLAYER 2 WINS'
  }

  const isWinP1 = over?.winnerId === 'p1'

  return (
    <div className="game-screen">
      <PhaserGame
        key={matchKey}
        mode={mode}
        gameType={gameType}
        difficulty={difficulty}
        arenaId={arenaId}
        emitter={emitterRef.current}
        onReady={(game) => (gameRef.current = game)}
      />

      <div className="game-help">
        <span className="p1-help"><strong>P1</strong> WASD MOVE · Q/E ROTATE · SPACE SHOOT</span>
        {mode === 'local' ? (
          <span className="p2-help"><strong>P2</strong> ARROWS MOVE · J/L ROTATE · K SHOOT</span>
        ) : (
          <span className="p2-help"><strong>BOT</strong> SURVIVE THE RICOCHETS</span>
        )}
      </div>

      <div className="hud">
        {hud.type === 'lives' ? (
          <>
            <Hearts count={hud.p1} colorClass="p1" />
            <Hearts count={hud.p2} colorClass="p2" />
          </>
        ) : (
          <>
            <ScoreBadge value={hud.p1} target={hud.target} colorClass="p1" />
            <ScoreBadge value={hud.p2} target={hud.target} colorClass="p2" />
          </>
        )}
      </div>

      {ricochetMsg && !over && (
        <div className="ricochet-banner">{ricochetMsg}</div>
      )}

      {countdown && !over && (
        <div className="overlay" style={{ background: 'rgba(4,5,8,0.35)' }}>
          <span className="countdown-num">{countdown}</span>
        </div>
      )}

      {paused && !over && (
        <div className="overlay">
          <div className="screen" style={{ position: 'static', animation: 'none' }}>
            <p className="subtitle">PAUSED</p>
            <div className="menu-list">
              <button className="btn accent" onClick={togglePause}>RESUME</button>
              <button className="btn" onClick={handleRematch}>RESTART</button>
              <button className="btn ghost" onClick={onExitToMenu}>MAIN MENU</button>
            </div>
          </div>
        </div>
      )}

      {over && (
        <div className="overlay">
          <div className="screen" style={{ position: 'static', animation: 'none' }}>
            <h2 className={`overlay-title ${isWinP1 || mode === 'local' ? 'win' : 'lose'}`}>
              {resultLabel()}
            </h2>
            <div className="menu-list">
              <button className="btn accent" onClick={handleRematch}>REMATCH</button>
              <button className="btn ghost" onClick={onExitToMenu}>MAIN MENU</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
