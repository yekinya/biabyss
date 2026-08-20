import { useEffect, useRef } from 'react'
import { Application } from 'pixi.js'
import { BiabyssGame } from './engine/BiabyssGame'
import { useGameStore } from '../store/gameStore'

export function GameCanvas() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const app = new Application()
    let game: BiabyssGame | undefined
    let initialized = false
    let cancelled = false
    let unsubscribe: () => void = () => undefined

    const boot = async () => {
      await app.init({
        resizeTo: host,
        preference: 'webgl',
        background: '#030710',
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio, 2),
        powerPreference: 'high-performance',
      })

      initialized = true
      if (cancelled) {
        app.destroy()
        return
      }

      host.appendChild(app.canvas)
      game = new BiabyssGame(app)

      const syncState = () => {
        const state = useGameStore.getState()
        game?.setRunning(state.status === 'running')
      }

      syncState()
      unsubscribe = useGameStore.subscribe((state, previous) => {
        game?.setRunning(state.status === 'running')

        if (state.runId !== previous.runId) {
          game?.reset()
        }
      })
    }

    void boot()

    return () => {
      cancelled = true
      unsubscribe()
      game?.destroy()

      if (initialized) {
        app.destroy(true, { children: true })
      }
    }
  }, [])

  return <div ref={hostRef} className="game-canvas" aria-hidden="true" />
}
