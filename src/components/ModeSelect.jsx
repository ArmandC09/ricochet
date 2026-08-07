export default function ModeSelect({ onSelect, onBack }) {
  return (
    <div className="screen">
      <p className="subtitle">SELECT MODE</p>
      <div className="menu-list">
        <button className="btn" onClick={() => onSelect('solo')}>SOLO</button>
        <button className="btn" onClick={() => onSelect('local')}>LOCAL MULTIPLAYER</button>
        <button className="btn ghost" onClick={onBack}>BACK</button>
      </div>
    </div>
  )
}
