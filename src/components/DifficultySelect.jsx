const OPTIONS = [
  { id: 'easy', label: 'EASY', desc: 'Bot aims slowly, shoots less, dodges rarely.' },
  { id: 'normal', label: 'NORMAL', desc: 'A balanced, fair opponent.' },
  { id: 'hard', label: 'HARD', desc: 'Fast reflexes, sharper aim, uses ricochet shots often.' },
]

export default function DifficultySelect({ onSelect, onBack }) {
  return (
    <div className="screen">
      <p className="subtitle">SELECT DIFFICULTY</p>
      <div className="menu-list">
        {OPTIONS.map((o) => (
          <button key={o.id} className="btn wide" onClick={() => onSelect(o.id)}>
            <span className="btn-title">{o.label}</span>
            <span className="btn-sub">{o.desc}</span>
          </button>
        ))}
        <button className="btn ghost" onClick={onBack}>BACK</button>
      </div>
    </div>
  )
}
