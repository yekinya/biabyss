# BIABYSS 런타임 모델

## 1. 소유권 원칙

Simulation state는 엔진 인스턴스 하나가 단독 소유한다. DOM, Three.js Object3D, Audio adapter가
같은 mutable 객체를 공동 소유하지 않는다.

```text
Input Adapter ──InputIntent──▶ Simulation ──Snapshot/Event──▶ Presentation
                                  │
                                  └──RunResult──▶ Local Persistence
```

## 2. Aggregate

### RunSession

```ts
interface RunSession {
  readonly runId: string
  readonly seed: number
  readonly ruleSetId: string
  phase: RunPhase
  tick: number
  elapsedMs: number
  score: number
  absorbedCount: number
  world: WorldState
}
```

RunSession은 시작·pause·resume·게임오버·종료 전이를 소유한다.

### WorldState

```ts
interface WorldState {
  readonly width: number
  readonly height: number
  readonly viewportAreaMultiplier: number
  readonly playerId: EntityId
  cells: Map<EntityId, CellState>
  nutrients: Map<EntityId, NutrientState>
  nextEntitySequence: number
}
```

Map 순회 순서를 판정 순서로 사용하지 않는다. 충돌 결과는 안정 ID로 정렬해 처리한다.

## 3. Entity

### CellState

```ts
interface CellState {
  readonly id: EntityId
  readonly kind: 'player' | 'npc'
  position: Vec2
  velocity: Vec2
  mass: number
  life: 'alive' | 'consumed'
  invulnerableUntilTick: number
  npcBrain?: NpcBrainState
}
```

`radius`, `speedLimit`, `isThreat`는 저장 필드가 아니라 RuleSet과 현재 상태로 계산하는 파생 값이다.

### NutrientState

```ts
interface NutrientState {
  readonly id: EntityId
  position: Vec2
  mass: number
  phase: number
}
```

### NpcBrainState

```ts
interface NpcBrainState {
  mode: 'wander' | 'pursue' | 'flee'
  heading: number
  nextDecisionTick: number
  targetId?: EntityId
}
```

## 4. Value Object

- `EntityId`: Run ID와 증가 sequence로 생성하는 안정 식별자
- `Vec2`: 유한한 x/y 값
- `InputIntent`: world target, `0..1` 조이패드 강도, 입력 활성 여부, 발생 sequence
- `SimulationSnapshot`: HUD와 renderer가 읽는 불변 투영
- `RunResult`: duration, finalMass, score, absorbedCount, deathCause, seed
- `RenderTier`: `low | medium | high`

Value Object는 생성 경계에서 유효성을 검사하고 Simulation 내부에 잘못된 숫자가 들어오지 않게 한다.

## 5. Service

- `SimulationEngine`: 고정 tick과 상태 전이 조정
- `MovementSystem`: 입력과 NPC steering을 velocity로 변환
- `SpatialIndex`: 충돌 후보 query
- `AbsorptionSystem`: 안정 순서의 영양체·세포 흡수 판정
- `SpawnSystem`: 밀도 유지와 안전 spawn
- `NpcDecisionSystem`: 감지 결과를 행동 mode로 변환
- `RuleSetRegistry`: 승인된 RuleSet 조회
- `RunResultRepository`: 기기 로컬 최고 기록 저장

## 6. Presentation 모델

Three.js 객체는 `CellView`, `NutrientView`, `WorldView`처럼 별도 관리한다. `CellView`가 가진 scale·material·particle은
Simulation field가 아니다. Entity ID로 view를 찾되 view 삭제가 Entity 삭제를 유발하지 않는다.

HUD에는 매 frame 전체 World를 넘기지 않고 다음 저주파 snapshot만 전달한다.

```ts
interface HudSnapshot {
  phase: RunPhase
  mass: number
  score: number
  absorbedCount: number
  elapsedMs: number
}
```

## 7. 로컬 저장 경계

저장 가능:

- 최고 점수와 최고 질량
- 음량, 진동, 감소 모션, render tier
- 튜토리얼 확인 여부

저장하지 않음:

- mutable World 전체
- Three.js 객체와 GPU resource
- 진행 중 NPC brain
- 일시정지 시각을 이용한 오프라인 성장

schema에는 `storageVersion`을 두고 migration 실패 시 안전한 기본 설정으로 복구한다.
