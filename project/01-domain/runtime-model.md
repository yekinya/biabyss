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
  speciesId: 'player' | 'micrococcus' | 'ciliophoran' | 'larvoid' | 'tentacle-amoeba' | 'diplococcus'
  life: 'alive' | 'consumed'
  invulnerableUntilTick: number
  previousGaitPhase: number
  gaitPhase: number
  gaitCycle: number
  absorbedBy?: EntityId
  previousAbsorptionProgress: number
  absorptionProgress: number
  npcBrain?: NpcBrainState
}
```

`gaitPhase`는 fixed tick에서만 진행되는 `0..1` 보행 위상이며 실제 추진과 Presentation의 이동축·형태 변형이
함께 읽는다. `previousGaitPhase`는 `previousPosition`과 같은 렌더 보간 경계이고, Renderer는 동일한 alpha로
위치와 gait를 보간한다. `gaitCycle`은 좌우 꿈틀 방향을 안정적으로 교대하는 정수다. `radius`, `speedLimit`,
`isThreat`는 저장 필드가 아니라 RuleSet과 현재 상태로 계산하는 파생 값이다.

`speciesId`는 NPC의 형태·기동·어그로 프로필을 RuleSet에서 찾는 안정 ID다. `absorbedBy`가 있으면 해당 Cell은
자체 이동과 새 충돌 후보에서 제외되고, `absorptionProgress`는 fixed tick에서만 `0..1`로 증가한다.
`previousAbsorptionProgress`는 위치와 같은 alpha로 빨림 변형을 보간하기 위한 직전 tick 값이다.

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
  mode: 'wander' | 'pursue' | 'flee' | 'passive'
  heading: number
  nextDecisionTick: number
  targetId?: EntityId
}
```

### AbsorptionState

```ts
interface AbsorptionState {
  predatorId: EntityId
  preyId: EntityId
  elapsedSeconds: number
  durationSeconds: number
  startPreyMass: number
  transferredMass: number
}
```

포식 가능 여부와 대상 선점은 시작 tick에 확정한다. 전이 중 prey는 predator 쪽으로 당겨지고 획득 질량은
진행률 차이만큼 점진 이전된다. 완료 시 NPC prey는 respawn하고 Player prey는 `GAME_OVER`로 전환한다.

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

`OpticalStage`는 Player의 현재 Mass 비율에서 계산하는 `bright-field | algae-bloom | detritus-deep` 표현 값이다.
배지와 Cell palette를 바꾸지만 Simulation에 저장하지 않고 충돌·흡수·점수에 영향을 주지 않는다.

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
