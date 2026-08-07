import { useEffect } from 'react'

export default function StartScreen({ onStart }) {
  useEffect(() => {
    const handler = () => onStart()
    window.addEventListener('keydown', handler)
    window.addEventListener('pointerdown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      window.removeEventListener('pointerdown', handler)
    }
  }, [onStart])

  return (
    <div className="screen">
      <h1 className="logo-title">RICOCHET</h1>
      <p className="tagline">ONE SHOT. INFINITE CHAOS.</p>
      <p className="blink" style={{ marginTop: 30 }}>PRESS ANY KEY / CLICK TO START</p>
    </div>
  )
}
