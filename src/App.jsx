import { useEffect, useState } from 'react'
import StartScreen from './components/StartScreen.jsx'
import MainMenu from './components/MainMenu.jsx'
import ModeSelect from './components/ModeSelect.jsx'
import GameTypeSelect from './components/GameTypeSelect.jsx'
import DifficultySelect from './components/DifficultySelect.jsx'
import ArenaSelect from './components/ArenaSelect.jsx'
import HowToPlay from './components/HowToPlay.jsx'
import GameScreen from './components/GameScreen.jsx'
import MobileWarning from './components/MobileWarning.jsx'

const isMobile = () =>
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 900

// start -> menu -> mode -> gametype -> [difficulty (solo only)] -> arena -> game -> how
export default function App() {
  const [screen, setScreen] = useState('start')
  const [mode, setMode] = useState(null) // 'solo' | 'local'
  const [gameType, setGameType] = useState(null) // 'deathmatch' | 'survival' | 'firstTo5'
  const [difficulty, setDifficulty] = useState('normal')
  const [arenaId, setArenaId] = useState(null)
  const [blocked] = useState(isMobile())

  useEffect(() => {
    document.title = 'RICOCHET — ONE SHOT. INFINITE CHAOS.'
  }, [])

  if (blocked) return <MobileWarning />

  return (
    <div className="app-shell">
      <div className="bg-grid" />
      {screen === 'start' && <StartScreen onStart={() => setScreen('menu')} />}

      {screen === 'menu' && (
        <MainMenu
          onPlay={() => setScreen('mode')}
          onHow={() => setScreen('how')}
        />
      )}

      {screen === 'mode' && (
        <ModeSelect
          onSelect={(m) => {
            setMode(m)
            setScreen('gametype')
          }}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'gametype' && (
        <GameTypeSelect
          onSelect={(g) => {
            setGameType(g)
            setScreen(mode === 'solo' ? 'difficulty' : 'arena')
          }}
          onBack={() => setScreen('mode')}
        />
      )}

      {screen === 'difficulty' && (
        <DifficultySelect
          onSelect={(d) => {
            setDifficulty(d)
            setScreen('arena')
          }}
          onBack={() => setScreen('gametype')}
        />
      )}

      {screen === 'arena' && (
        <ArenaSelect
          onSelect={(id) => {
            setArenaId(id)
            setScreen('game')
          }}
          onBack={() => setScreen(mode === 'solo' ? 'difficulty' : 'gametype')}
        />
      )}

      {screen === 'how' && <HowToPlay onBack={() => setScreen('menu')} />}

      {screen === 'game' && (
        <GameScreen
          mode={mode}
          gameType={gameType}
          difficulty={difficulty}
          arenaId={arenaId}
          onExitToMenu={() => setScreen('menu')}
        />
      )}
    </div>
  )
}
