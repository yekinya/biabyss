import {
  Application,
  BlurFilter,
  Container,
  Graphics,
  type Ticker,
} from 'pixi.js'
import { useGameStore } from '../../store/gameStore'
import { radiusForMass } from '../../domain/rules/mass'

interface Point {
  x: number
  y: number
}

interface Food {
  view: Graphics
  x: number
  y: number
  phase: number
  mass: number
}

interface Cell {
  view: Container
  bubbles: Graphics[]
  x: number
  y: number
  vx: number
  vy: number
  mass: number
  phase: number
  direction: number
  color: number
}

const BASE_RADIUS = 28
const PLAYER_COLOR = 0x71f7ff
const NPC_COLORS = [0xff6fb5, 0x9d83ff, 0xffc857, 0x70f0a5]

export class BiabyssGame {
  private readonly world = new Container()
  private readonly pointer: Point = { x: 0, y: 0 }
  private readonly foods: Food[] = []
  private readonly npcs: Cell[] = []
  private player!: Cell
  private running = false
  private pointerInitialized = false
  private invulnerableUntil = 0

  constructor(private readonly app: Application) {
    this.app.stage.addChild(this.world)
    this.buildWorld()
    this.app.ticker.add(this.update)
    this.app.canvas.addEventListener('pointermove', this.handlePointerMove)
  }

  setRunning(running: boolean) {
    this.running = running
  }

  reset() {
    this.world.removeChildren().forEach((child) => child.destroy({ children: true }))
    this.foods.length = 0
    this.npcs.length = 0
    this.pointerInitialized = false
    this.invulnerableUntil = performance.now() + 2500
    this.buildWorld()
  }

  destroy() {
    this.app.ticker.remove(this.update)
    this.app.canvas.removeEventListener('pointermove', this.handlePointerMove)
  }

  private buildWorld() {
    this.addAmbientParticles(90)
    this.addFood(55)

    const { width, height } = this.app.screen
    this.player = this.createCell(width / 2, height / 2, 36, PLAYER_COLOR)
    this.world.addChild(this.player.view)

    for (let index = 0; index < 10; index += 1) {
      const mass = 18 + Math.random() * 62
      const position = this.randomPositionAwayFrom(this.player, 260)
      const npc = this.createCell(
        position.x,
        position.y,
        mass,
        NPC_COLORS[index % NPC_COLORS.length],
      )
      npc.direction = Math.random() * Math.PI * 2
      this.npcs.push(npc)
      this.world.addChild(npc.view)
    }
  }

  private createCell(x: number, y: number, mass: number, color: number): Cell {
    const view = new Container()
    const aura = new Graphics()
      .circle(0, 0, BASE_RADIUS * 1.18)
      .fill({ color, alpha: 0.32 })
    aura.filters = [new BlurFilter({ strength: 14, quality: 3 })]

    const membrane = new Graphics()
      .circle(0, 0, BASE_RADIUS)
      .fill({ color, alpha: 0.18 })
      .stroke({ color, width: 1.8, alpha: 0.86 })

    const cytoplasm = new Graphics()
      .circle(-4, -5, BASE_RADIUS * 0.74)
      .fill({ color, alpha: 0.14 })

    const highlight = new Graphics()
      .arc(0, 0, BASE_RADIUS * 0.79, Math.PI * 1.05, Math.PI * 1.72)
      .stroke({ color: 0xffffff, width: 2.2, alpha: 0.58 })

    const bubbles = Array.from({ length: 5 }, (_, index) => {
      const angle = (index / 5) * Math.PI * 2
      const distance = 6 + Math.random() * 10
      const bubble = new Graphics()
        .circle(0, 0, 1.3 + Math.random() * 2.1)
        .fill({ color: 0xffffff, alpha: 0.42 })
      bubble.position.set(Math.cos(angle) * distance, Math.sin(angle) * distance)
      return bubble
    })

    view.addChild(aura, membrane, cytoplasm, ...bubbles, highlight)

    return {
      view,
      bubbles,
      x,
      y,
      vx: 0,
      vy: 0,
      mass,
      phase: Math.random() * Math.PI * 2,
      direction: 0,
      color,
    }
  }

  private addFood(count: number) {
    const { width, height } = this.app.screen

    for (let index = 0; index < count; index += 1) {
      const color = index % 3 === 0 ? 0xa98dff : 0x65e8ff
      const view = new Graphics()
        .circle(0, 0, 2.2)
        .fill({ color, alpha: 0.9 })
        .circle(0, 0, 5.5)
        .stroke({ color, width: 1, alpha: 0.18 })
      const food = {
        view,
        x: Math.random() * width,
        y: Math.random() * height,
        phase: Math.random() * Math.PI * 2,
        mass: 0.9,
      }
      view.position.set(food.x, food.y)
      this.foods.push(food)
      this.world.addChild(view)
    }
  }

  private addAmbientParticles(count: number) {
    const { width, height } = this.app.screen

    for (let index = 0; index < count; index += 1) {
      const size = 0.4 + Math.random() * 1.2
      const particle = new Graphics()
        .circle(0, 0, size)
        .fill({ color: 0x7fc8db, alpha: 0.08 + Math.random() * 0.12 })
      particle.position.set(Math.random() * width, Math.random() * height)
      this.world.addChild(particle)
    }
  }

  private readonly handlePointerMove = (event: PointerEvent) => {
    const bounds = this.app.canvas.getBoundingClientRect()
    this.pointer.x = ((event.clientX - bounds.left) / bounds.width) * this.app.screen.width
    this.pointer.y = ((event.clientY - bounds.top) / bounds.height) * this.app.screen.height
    this.pointerInitialized = true
  }

  private readonly update = (ticker: Ticker) => {
    const delta = Math.min(ticker.deltaMS / 16.6667, 2)
    const time = ticker.lastTime / 1000

    this.animateCell(this.player, time)
    for (const npc of this.npcs) this.animateCell(npc, time)
    this.animateFood(time)

    if (!this.running) return

    this.movePlayer(delta)
    this.moveNpcs(delta, time)
    this.consumeFood()
    this.resolveNpcContacts()
  }

  private movePlayer(delta: number) {
    if (!this.pointerInitialized) {
      this.pointer.x = this.app.screen.width / 2
      this.pointer.y = this.app.screen.height / 2
    }

    const dx = this.pointer.x - this.player.x
    const dy = this.pointer.y - this.player.y
    const distance = Math.hypot(dx, dy)

    if (distance > 8) {
      const acceleration = 0.12 / Math.max(0.8, Math.sqrt(this.player.mass / 36))
      this.player.vx += (dx / distance) * acceleration * delta
      this.player.vy += (dy / distance) * acceleration * delta
    }

    this.player.vx *= 0.965 ** delta
    this.player.vy *= 0.965 ** delta
    this.limitVelocity(this.player, 3.4)
    this.integrate(this.player, delta)
  }

  private moveNpcs(delta: number, time: number) {
    for (const npc of this.npcs) {
      const dx = this.player.x - npc.x
      const dy = this.player.y - npc.y
      const distance = Math.max(1, Math.hypot(dx, dy))
      const relation = npc.mass > this.player.mass * 1.1 ? 1 : -0.75
      const awareness = distance < 240 ? relation : 0

      npc.direction += Math.sin(time * 0.7 + npc.phase) * 0.008 * delta
      npc.vx +=
        (Math.cos(npc.direction) * 0.025 + (dx / distance) * awareness * 0.032) *
        delta
      npc.vy +=
        (Math.sin(npc.direction) * 0.025 + (dy / distance) * awareness * 0.032) *
        delta
      npc.vx *= 0.982 ** delta
      npc.vy *= 0.982 ** delta
      this.limitVelocity(npc, 1.45)
      this.integrate(npc, delta)
    }
  }

  private integrate(cell: Cell, delta: number) {
    const radius = this.radiusFor(cell.mass)
    const width = this.app.screen.width
    const height = this.app.screen.height

    cell.x += cell.vx * delta
    cell.y += cell.vy * delta

    if (cell.x < radius || cell.x > width - radius) {
      cell.vx *= -0.8
      cell.x = Math.min(width - radius, Math.max(radius, cell.x))
    }
    if (cell.y < radius || cell.y > height - radius) {
      cell.vy *= -0.8
      cell.y = Math.min(height - radius, Math.max(radius, cell.y))
    }
  }

  private animateCell(cell: Cell, time: number) {
    const pulse = Math.sin(time * 1.8 + cell.phase)
    const scale = this.radiusFor(cell.mass) / BASE_RADIUS
    cell.view.position.set(cell.x, cell.y)
    cell.view.scale.set(scale * (1 + pulse * 0.025), scale * (1 - pulse * 0.02))
    cell.view.rotation = Math.atan2(cell.vy, cell.vx) * 0.08

    cell.bubbles.forEach((bubble, index) => {
      bubble.rotation += 0.004 * (index + 1)
      bubble.alpha = 0.28 + Math.sin(time * 1.3 + index + cell.phase) * 0.12
    })
  }

  private animateFood(time: number) {
    for (const food of this.foods) {
      const pulse = 0.86 + Math.sin(time * 2.2 + food.phase) * 0.16
      food.view.scale.set(pulse)
    }
  }

  private consumeFood() {
    const playerRadius = this.radiusFor(this.player.mass)

    for (const food of this.foods) {
      if (Math.hypot(food.x - this.player.x, food.y - this.player.y) > playerRadius + 4) {
        continue
      }

      this.player.mass += food.mass
      useGameStore.getState().addMass(food.mass)
      this.respawnFood(food)
    }
  }

  private resolveNpcContacts() {
    if (performance.now() < this.invulnerableUntil) return

    const playerRadius = this.radiusFor(this.player.mass)

    for (const npc of this.npcs) {
      const contactDistance = playerRadius + this.radiusFor(npc.mass) * 0.72
      if (Math.hypot(npc.x - this.player.x, npc.y - this.player.y) > contactDistance) {
        continue
      }

      if (this.player.mass > npc.mass * 1.12) {
        const gainedMass = npc.mass * 0.28
        this.player.mass += gainedMass
        useGameStore.getState().addMass(gainedMass)
        this.respawnNpc(npc)
      } else if (npc.mass > this.player.mass * 1.08) {
        this.running = false
        useGameStore.getState().finish()
        return
      }
    }
  }

  private respawnFood(food: Food) {
    food.x = Math.random() * this.app.screen.width
    food.y = Math.random() * this.app.screen.height
    food.phase = Math.random() * Math.PI * 2
    food.view.position.set(food.x, food.y)
  }

  private respawnNpc(npc: Cell) {
    const position = this.randomPositionAwayFrom(this.player, 220)
    npc.x = position.x
    npc.y = position.y
    npc.vx = 0
    npc.vy = 0
    npc.mass = 18 + Math.random() * 62
    npc.phase = Math.random() * Math.PI * 2
  }

  private randomPositionAwayFrom(cell: Cell, minimumDistance: number): Point {
    let point = { x: 0, y: 0 }

    for (let attempt = 0; attempt < 20; attempt += 1) {
      point = {
        x: 60 + Math.random() * Math.max(1, this.app.screen.width - 120),
        y: 60 + Math.random() * Math.max(1, this.app.screen.height - 120),
      }

      if (Math.hypot(point.x - cell.x, point.y - cell.y) >= minimumDistance) break
    }

    return point
  }

  private limitVelocity(cell: Cell, maximum: number) {
    const speed = Math.hypot(cell.vx, cell.vy)
    if (speed <= maximum) return

    cell.vx = (cell.vx / speed) * maximum
    cell.vy = (cell.vy / speed) * maximum
  }

  private radiusFor(mass: number) {
    return radiusForMass(mass)
  }
}
