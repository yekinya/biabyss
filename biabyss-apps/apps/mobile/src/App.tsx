import { GameCanvas } from './game/GameCanvas'
import { useGameStore } from './store/gameStore'

export function App() {
  const { status, mass, absorbed, start } = useGameStore()

  return (
    <main className="app-shell">
      <GameCanvas />

      <header className="top-bar">
        <div className="brand">
          <span className="brand-mark" />
          <div>
            <strong>BIABYSS</strong>
            <small>MICROBIAL DEEP</small>
          </div>
        </div>

        <div className="hud" aria-live="polite">
          <div>
            <span>MASS</span>
            <strong>{mass.toFixed(1)}</strong>
          </div>
          <div>
            <span>ABSORBED</span>
            <strong>{absorbed}</strong>
          </div>
        </div>
      </header>

      {status !== 'running' && (
        <section className="start-panel">
          <p className="eyebrow">A LUMINOUS MICROBIAL SURVIVAL</p>
          <h1>{status === 'game-over' ? 'CONSUMED' : 'DESCEND INTO THE BIABYSS'}</h1>
          <p>
            {status === 'game-over'
              ? `${absorbed}개의 생명체를 흡수했습니다.`
              : '작은 생명체는 흡수하고, 더 거대한 포식자로부터 살아남으세요.'}
          </p>
          <button type="button" onClick={start}>
            {status === 'game-over' ? '다시 잠수하기' : '심연으로 들어가기'}
          </button>
          <small>마우스 또는 손가락으로 이동</small>
        </section>
      )}

      <footer className="footer-note">
        <span className="pulse-dot" />
        {status === 'running' ? '생체 신호 연결됨' : '표본 대기 중'}
      </footer>
    </main>
  )
}

