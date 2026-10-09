import { useRef, useState } from 'react'
import { DoneScreen } from './components/DoneScreen'
import { Landing } from './components/Landing'
import { Maker } from './components/Maker'
import { DEFAULT_STATE, type BadgeState } from './lib/badge'

type Screen = 'land' | 'make' | 'done'

export default function App() {
  const [screen, setScreen] = useState<Screen>('land')
  const [state, setState] = useState<BadgeState>(DEFAULT_STATE)
  const badgeRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className={`page-fig relative min-h-dvh overflow-x-hidden ${
        screen === 'land' ? 'is-landing' : screen === 'done' ? 'is-done' : 'app-shell'
      }`}
    >
      {screen === 'land' ? <Landing onStart={() => setScreen('make')} /> : null}
      <div className={screen === 'make' ? 'block' : 'hidden'}>
        <Maker
          state={state}
          onChange={setState}
          onDone={() => setScreen('done')}
          onBack={() => setScreen('land')}
          badgeRef={badgeRef}
        />
      </div>
      {screen === 'done' ? (
        <DoneScreen state={state} onEdit={() => setScreen('make')} />
      ) : null}
    </div>
  )
}
