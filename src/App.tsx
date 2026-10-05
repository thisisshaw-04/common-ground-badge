import { useRef, useState } from 'react'
import { DoneScreen } from './components/DoneScreen'
import { Maker } from './components/Maker'
import { DEFAULT_STATE, type BadgeState } from './lib/badge'

type Screen = 'make' | 'done'

export default function App() {
  const [screen, setScreen] = useState<Screen>('make')
  const [state, setState] = useState<BadgeState>(DEFAULT_STATE)
  const badgeRef = useRef<HTMLDivElement>(null)

  return (
    <div className="page-shell relative min-h-dvh overflow-x-hidden">
      <div className={screen === 'make' ? 'block' : 'hidden'}>
        <Maker
          state={state}
          onChange={setState}
          onDone={() => setScreen('done')}
          badgeRef={badgeRef}
        />
      </div>
      {screen === 'done' ? (
        <DoneScreen
          state={state}
          badgeNode={badgeRef.current}
          onEdit={() => setScreen('make')}
        />
      ) : null}
    </div>
  )
}
