import { GAME_TYPES } from '../game/config/modes.js'

export default function GameTypeSelect({ onSelect, onBack }) {
  return (
    <div className="screen">
      <p className="subtitle">SELECT GAME TYPE</p>
      <div className="menu-list">
        {GAME_TYPES.map((g) => (
          <button key={g.id} className="btn wide" onClick={() => onSelect(g.id)}>
            <span className="btn-title">{g.name}</span>
            <span className="btn-sub">{g.description}</span>
          </button>
        ))}
        <button className="btn ghost" onClick={onBack}>BACK</button>
      </div>
    </div>
  )
}
