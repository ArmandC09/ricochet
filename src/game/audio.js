// Minimal procedural SFX using the Web Audio API — no external audio files.
let ctx = null

function getCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (AudioCtx) ctx = new AudioCtx()
  }
  if (ctx && ctx.state === 'suspended') ctx.resume()
  return ctx
}

function beep({ freq = 440, duration = 0.08, type = 'sine', gain = 0.06, slideTo = null }) {
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const amp = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, c.currentTime)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + duration)
  amp.gain.setValueAtTime(gain, c.currentTime)
  amp.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
  osc.connect(amp).connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + duration)
}

export const sfx = {
  shoot: () => beep({ freq: 720, slideTo: 340, duration: 0.07, type: 'square', gain: 0.05 }),
  bounce: () => beep({ freq: 500, slideTo: 620, duration: 0.05, type: 'triangle', gain: 0.04 }),
  hit: () => beep({ freq: 180, slideTo: 60, duration: 0.16, type: 'sawtooth', gain: 0.08 }),
}
