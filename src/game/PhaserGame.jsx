import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import ArenaScene from './scenes/ArenaScene.js'
import { ARENA_WIDTH, ARENA_HEIGHT, COLORS } from './config/constants.js'

export default function PhaserGame({ mode, gameType, difficulty, arenaId, emitter, onReady }) {
  const containerRef = useRef(null)
  const gameRef = useRef(null)

  useEffect(() => {
    const config = {
      // Force the Canvas renderer for maximum compatibility in browsers where
      // WebGL can initialize but render a blank frame (seen in Opera/Chromium).
      // RICOCHET uses only 2D primitives, so Canvas is fully sufficient.
      type: Phaser.CANVAS,
      parent: containerRef.current,
      width: ARENA_WIDTH,
      height: ARENA_HEIGHT,
      backgroundColor: COLORS.bg,
      // Keep a fixed logical arena. CSS scales the canvas to the visible box.
      // This avoids Scale.FIT booting with a zero/incorrect parent measurement.
      scale: {
        mode: Phaser.Scale.NONE,
        width: ARENA_WIDTH,
        height: ARENA_HEIGHT,
      },
      physics: {
        default: 'arcade',
        arcade: { debug: false },
      },
      render: { antialias: true, pixelArt: false },
    }

    // The parent has an explicit aspect-ratio/size in CSS. Measuring it
    // here also prevents Phaser from booting against a collapsed React div.
    const bounds = containerRef.current?.getBoundingClientRect()
    if (!bounds || bounds.width < 10 || bounds.height < 10) {
      console.warn('[RICOCHET] Phaser container had no usable size at boot.', bounds)
    }

    const game = new Phaser.Game(config)
    gameRef.current = game
    game.registry.set('emitter', emitter)
    game.scene.add('Arena', ArenaScene, false)
    game.scene.start('Arena', { mode, gameType, difficulty, arenaId })

    onReady?.(game)

    return () => {
      game.destroy(true)
      gameRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div id="phaser-container" ref={containerRef} />
}
