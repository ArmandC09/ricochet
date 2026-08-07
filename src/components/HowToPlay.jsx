export default function HowToPlay({ onBack }) {
  return (
    <div className="screen">
      <div className="panel">
        <h2>HOW TO PLAY</h2>
        <div className="how-row">
          <span className="how-key">P1: WASD</span>
          <span className="how-text">Move around the arena</span>
        </div>
        <div className="how-row">
          <span className="how-key">P1: Q / E</span>
          <span className="how-text">Rotate cannon left / right</span>
        </div>
        <div className="how-row">
          <span className="how-key">P1: SPACE</span>
          <span className="how-text">Shoot</span>
        </div>
        <div className="how-row">
          <span className="how-key">P2: ARROWS</span>
          <span className="how-text">Move around the arena</span>
        </div>
        <div className="how-row">
          <span className="how-key">P2: J / L</span>
          <span className="how-text">Rotate cannon left / right</span>
        </div>
        <div className="how-row">
          <span className="how-key">P2: K</span>
          <span className="how-text">Shoot</span>
        </div>
        <div className="how-row">
          <span className="how-key">ESC</span>
          <span className="how-text">Pause the match</span>
        </div>
        <p className="how-text" style={{ marginTop: 18, lineHeight: 1.6 }}>
          Movement and aim are independent — move one way while firing another. The cannon
          rotates freely, a full 360°. Your own projectile becomes dangerous after its first
          ricochet. Chain several bounces into one kill for a RICOCHET / DOUBLE / TRIPLE /
          INSANE RICOCHET bonus callout.
        </p>
      </div>
      <button className="btn ghost" onClick={onBack}>BACK</button>
    </div>
  )
}
