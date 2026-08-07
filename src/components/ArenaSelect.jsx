import { ARENAS, randomArenaId } from '../game/config/arenas.js'
import { ARENA_WIDTH, ARENA_HEIGHT } from '../game/config/constants.js'

function Thumb({ arena }) {
  const vb = `0 0 ${ARENA_WIDTH} ${ARENA_HEIGHT}`
  return (
    <svg viewBox={vb} className="arena-thumb-svg" preserveAspectRatio="xMidYMid meet">
      <rect x="4" y="4" width={ARENA_WIDTH - 8} height={ARENA_HEIGHT - 8} rx="6" className="thumb-bg" />
      {arena.obstacles.map((o, i) => (
        <rect
          key={i}
          x={o.x - o.w / 2}
          y={o.y - o.h / 2}
          width={o.w}
          height={o.h}
          className="thumb-obstacle"
        />
      ))}
      <circle cx={arena.spawns.p1.x} cy={arena.spawns.p1.y} r="16" className="thumb-p1" />
      <circle cx={arena.spawns.p2.x} cy={arena.spawns.p2.y} r="16" className="thumb-p2" />
    </svg>
  )
}

export default function ArenaSelect({ onSelect, onBack }) {
  return (
    <div className="screen">
      <p className="subtitle">SELECT ARENA</p>
      <div className="arena-grid">
        {ARENAS.map((arena) => (
          <button key={arena.id} className="arena-card" onClick={() => onSelect(arena.id)}>
            <Thumb arena={arena} />
            <div className="arena-card-info">
              <span className="arena-card-name">{arena.name}</span>
              <span className={`arena-card-diff diff-${arena.difficulty.toLowerCase()}`}>
                {arena.difficulty}
              </span>
            </div>
            <p className="arena-card-desc">{arena.description}</p>
          </button>
        ))}
        <button className="arena-card arena-card-random" onClick={() => onSelect(randomArenaId())}>
          <div className="random-icon">?</div>
          <div className="arena-card-info">
            <span className="arena-card-name">RANDOM</span>
          </div>
          <p className="arena-card-desc">Picks one of the 5 arenas at random.</p>
        </button>
      </div>
      <button className="btn ghost" onClick={onBack}>BACK</button>
    </div>
  )
}
