export default function MainMenu({ onPlay, onHow }) {
  return (
    <div className="screen">
      <h1 className="logo-title" style={{ fontSize: 'clamp(38px, 6vw, 60px)' }}>RICOCHET</h1>
      <div className="menu-list">
        <button className="btn accent" onClick={onPlay}>PLAY</button>
        <button className="btn ghost" onClick={onHow}>HOW TO PLAY</button>
      </div>
    </div>
  )
}
