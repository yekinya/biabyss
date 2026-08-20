# BIABYSS 게임 규칙

## 1. RuleSet 원칙

Run 시작 시 하나의 불변 RuleSet을 선택한다. Run 도중 배포·설정 변경으로 수치가 바뀌지 않는다. 아래 값은
초기 설계 기준이며 실제 구현 전 플레이테스트 SPEC에서 조정할 수 있다.

```ts
interface RuleSet {
  id: string
  simulationHz: number
  world: {
    viewportSpanMultiplier: number
    viewportAreaMultiplier: number
  }
  player: {
    initialMass: number
    startProtectionMs: number
    acceleration: number
    dragPerSecond: number
    maxSpeed: number
    wriggleAmplitude: number
    wriggleFrequency: number
  }
  mass: {
    radiusScale: number
    cellAbsorbRatio: number
    nutrientEfficiency: number
    cellEfficiency: number
    maximum: number
  }
  npc: {
    count: number
    decisionIntervalTicks: number
    awarenessRadius: number
    wanderAcceleration: number
    pursueAcceleration: number
    fleeAcceleration: number
  }
  nutrient: {
    targetCount: number
    massMin: number
    massMax: number
  }
}
```

초기 기준:

| 값 | 기준 |
|---|---:|
| `simulationHz` | 60 |
| `player.initialMass` | 36 |
| `player.startProtectionMs` | 6000 |
| `world.viewportSpanMultiplier` | 6 |
| `world.viewportAreaMultiplier` | 36 |
| `player.wriggleAmplitude` | 22 |
| `player.wriggleFrequency` | 2.4 Hz |
| `mass.radiusScale` | 4 |
| `mass.cellAbsorbRatio` | 1.12 |
| `mass.nutrientEfficiency` | 1.0 |
| `mass.cellEfficiency` | 0.28 |
| `npc.count` | 54 |
| `nutrient.targetCount` | 320 |

## 2. 질량과 반경

2D 면적이 질량에 비례하도록 반경을 계산한다.

```text
radius(mass) = sqrt(mass) × radiusScale
```

- Mass가 4배가 되면 Radius는 2배가 된다.
- Mass는 `(0, maximum]` 범위에서 clamp한다.
- 화면 scale이나 pulse animation을 충돌 반경에 반영하지 않는다.

## 3. 입력과 이동

입력은 현재 위치가 아니라 목표 world 좌표를 전달한다.

```text
desired = normalize(target - position)
massFactor = sqrt(initialMass / currentMass)
side = perpendicular(desired) × sin(elapsed × wriggleFrequency + phase)
acceleration = (desired × playerAcceleration + side × wriggleAmplitude) × massFactor
velocity = clampMagnitude((velocity + acceleration × dt) × drag, maxSpeed × massFactor)
position = position + velocity × dt
```

- 목표까지의 거리가 dead zone 안이면 추가 가속하지 않는다.
- wriggle은 등속 직선 이동을 깨는 횡가속이며 seed로 정한 phase를 사용한다.
- touch와 mouse는 같은 `InputIntent`로 정규화한다.
- 화면 밖 pointer는 가장 가까운 world 경계 좌표로 clamp한다.
- resize 중 입력 좌표가 이전 viewport 기준으로 남지 않게 다시 계산한다.

## 4. World 경계

MVP World는 Run 시작 viewport 가로·세로의 6배인 유한 Field다. Cell 중심이 반경보다 Field 경계 밖으로
나가지 않는다. Viewport는 Player를 추적하되 Field 경계를 넘어가지 않는다.

경계 접촉 처리:

1. position을 합법 범위로 clamp한다.
2. 경계 법선 방향 velocity를 감쇠 반사한다.
3. 같은 tick에 경계와 흡수가 겹쳐도 보정된 position으로 충돌을 판정한다.

무한 world, camera 이동과 wrap-around는 별도 SPEC이다.

## 5. Nutrient 흡수

Player 또는 NPC의 충돌 반경과 Nutrient 중심이 접촉하면 흡수 후보가 된다. 같은 Nutrient에 여러 Cell이
접촉하면 다음 순서로 승자를 고른다.

1. tick 시작 시 더 가까운 중심 거리
2. 더 큰 Mass
3. 더 작은 Entity ID

획득 질량:

```text
gainedMass = nutrient.mass × nutrientEfficiency
```

Nutrient는 한 번만 소비되고 SpawnSystem이 목표 밀도를 회복한다.

## 6. Cell 흡수

Cell A가 Cell B를 흡수하려면 모두 참이어야 한다.

```text
A.mass >= B.mass × cellAbsorbRatio
distance(A, B) <= radius(A) + radius(B) × contactDepthRatio
A와 B가 alive
```

획득 질량:

```text
gainedMass = B.mass × cellEfficiency
```

Player가 흡수되면 즉시 `PlayerConsumed`와 `RunEnded`를 만들고 이후 후보는 처리하지 않는다. Player가 NPC를
흡수하면 NPC는 consumed 처리 후 안전 위치와 새 Mass로 respawn한다.

## 7. NPC 판단

NPC는 매 frame이 아니라 `decisionIntervalTicks`마다 mode를 선택한다.

- `flee`: 감지 범위 안에 자신을 흡수할 수 있는 Cell이 있음
- `pursue`: 감지 범위 안에 자신이 흡수할 수 있는 가장 가치 높은 Cell이 있음
- `wander`: 위 조건이 없음

우선순위는 `flee > pursue > wander`다. target 선택 tie-break는 거리, 질량 이득, Entity ID 순이다.

NPC가 Player만 인식하는 임시 구현은 prototype으로 표시한다. 최종 Simulation에서는 같은 규칙으로 NPC 간
위협과 먹이도 평가해야 한다.

## 8. Spawn 규칙

- Field를 동일 크기의 cell로 나눈 stratified grid에 NPC와 Nutrient를 배치하고 각 cell 안에서 seed jitter를 준다.
- Player 시작 위치에서 `safeSpawnDistance` 이상 떨어진 곳에 NPC를 만든다.
- 새 NPC는 Player의 시작 보호 시간 동안 Player를 흡수할 수 없다.
- spawn 후보가 기존 큰 Cell과 겹치면 제한 횟수만큼 다시 찾는다.
- 후보를 찾지 못하면 Entity 수를 일시적으로 줄인다. 충돌 위치 강제 spawn보다 안전을 우선한다.
- 난수는 Run seed 기반 PRNG만 사용한다.

## 9. Tick 처리 순서

한 Simulation Tick은 반드시 다음 순서를 지킨다.

1. phase와 입력 sequence 확인
2. NPC decision 갱신
3. Player/NPC acceleration 계산
4. velocity와 position 적분
5. world 경계 보정
6. spatial index 재구성 또는 갱신
7. Nutrient 충돌 후보 수집·안정 정렬·흡수
8. Cell 충돌 후보 수집·안정 정렬·흡수
9. spawn queue 적용
10. Mass·유한값·Entity 불변 조건 검사
11. 게임오버 판정
12. Domain Event와 snapshot 발행

Renderer callback, Three.js object 순서와 post-process 결과는 이 순서에 개입하지 않는다.

## 10. 점수

MVP 점수는 설명 가능한 정수 조합을 사용한다.

```text
score = floor(absorbedNutrientMass × 10)
      + floor(absorbedCellMass × 25)
      + floor(survivalSeconds × 2)
```

UI 애니메이션 값과 권위 score를 분리한다. game over에는 final score, mass, duration, absorbed count와
death cause를 고정한다.

## 11. Pause와 앱 생명주기

- `visibilitychange`, Capacitor app state inactive, audio interruption에서 `PAUSED`로 전환한다.
- resume 시 이전 frame timestamp와 accumulator를 폐기한다.
- background 경과 시간을 Simulation dt로 넣지 않는다.
- pause overlay가 없어도 Simulation과 Audio는 멈춰야 한다.

## 12. 결정성

같은 RuleSet ID, seed, viewport world 크기와 tick별 InputIntent sequence는 같은 RunResult와 주요 state hash를
만들어야 한다. 시각 particle과 shader noise는 결과 hash에서 제외할 수 있다.
