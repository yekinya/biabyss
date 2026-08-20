import { create } from 'zustand'

export type GameStatus = 'idle' | 'running' | 'game-over'

interface GameState {
  status: GameStatus
  mass: number
  absorbed: number
  runId: number
  start: () => void
  finish: () => void
  addMass: (amount: number) => void
}

const INITIAL_MASS = 36

export const useGameStore = create<GameState>((set) => ({
  status: 'idle',
  mass: INITIAL_MASS,
  absorbed: 0,
  runId: 0,
  start: () =>
    set((state) => ({
      status: 'running',
      mass: INITIAL_MASS,
      absorbed: 0,
      runId: state.runId + 1,
    })),
  finish: () => set({ status: 'game-over' }),
  addMass: (amount) =>
    set((state) => ({
      mass: state.mass + amount,
      absorbed: state.absorbed + 1,
    })),
}))

