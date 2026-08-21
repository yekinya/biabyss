# SPEC-BIABYSS-20260821-npc-ecology-absorption

## 배경과 목표

현재 NPC는 형태만 여섯 가지이고 실제 행동은 자신의 Mass와 Player Mass 비교에서 매 tick 자동 결정된다. 종별
성향과 어그로 범위가 없고 54개 Cell·320개 Nutrient만 있어 현미경 배양액의 군집감이 약하다. Cell 접촉은 같은
tick에 즉시 respawn 또는 게임오버가 되어 빨려 들어가는 포식 과정도 보이지 않는다.

NPC를 다섯 Species와 세 Aggro Profile로 구성하고 종별 감지 반경·형태·기동을 RuleSet에 정의한다. NPC와
Nutrient를 각각 8배로 늘리되 instanced Cell과 pooled Point로 draw call을 제한한다. 포식은 Mass 비율로만
결정하되 0.72초의 점진 흡수 전이를 거쳐 완료되게 한다.

## 범위

- `pursue | flee | passive` Aggro Profile과 종별 감지 반경
- 미립구균, 섬모편모충, 다족유생충, 촉수아메바, 쌍구균 5종
- 보행형·등속 다족형·저속 부유형 NPC locomotion
- NPC 432개와 Mass 1 Nutrient 2560개의 stratified population
- 한 predator/한 prey 선점, 점진 질량 이전, 당김·늘어남·축소의 Absorption Transition
- Cell InstancedMesh와 종별 procedural SDF, 영양체 pooled Points
- 행동 경계·흡수 진행·개체수·결정성·shader 계약 검사

## 범위 밖

- NPC끼리의 포식과 먹이 선택
- 군집 flocking, 번식, 세대·유전 시스템
- 실제 생물 종의 생물학적 재현 주장
- 서버·멀티플레이·원격 자산
- 브라우저 자동화·smoke·screenshot 검사

## 현재/목표 동작

### 현재

- NPC는 가까이 있을 때 Mass 비교로 flee/pursue가 바뀌어 고유 성향이 없다.
- 모든 NPC가 같은 burst 이동 수치를 사용한다.
- 54개 NPC와 320개 Nutrient로 화면 내 밀도가 낮다.
- 포식 판정 tick에 대상이 즉시 사라진다.
- Cell마다 Mesh와 ShaderMaterial이 있어 8배 증원 시 draw call이 선형 증가한다.

### 목표

- 미립구균은 Player가 300 안에 오면 빠르게 도주한다.
- 섬모편모충과 촉수아메바는 각각 390/480 안에서 Player를 추격한다.
- 다족유생충은 Player를 무시하고 다리를 발발거리며 등속 이동한다.
- 쌍구균은 Player를 무시하고 느리게 떠다닌다.
- 어그로와 무관하게 접촉 시 큰 Cell만 작은 Cell을 흡수할 수 있다.
- prey가 0.72초 동안 predator로 당겨지고 가늘어지며 질량이 점진 이전된 뒤 완료된다.
- 432 Cell을 한 instanced draw 단위로, 2560 Nutrient를 한 pooled Points 단위로 표현한다.

## 도메인·RuleSet·화면·자산·플랫폼 영향

- domain: Species, Aggro Profile, Absorption Transition 용어와 중복 흡수 불변 조건을 추가한다.
- runtime model: Cell에 species/흡수 진행 상태를 추가하고 Simulation이 active absorption을 소유한다.
- RuleSet: 종별 행동·반경·질량·속도, `world.populationMultiplier=8`, 흡수 duration/pull을 중앙화한다.
- 화면: HUD·입력 흐름은 유지하며 World Canvas의 밀도와 포식 표현만 바뀐다.
- 자산: 종별 SDF cell shader, instanced material, nutrient swarm 계약을 manifest에 등록한다.
- 플랫폼: 외부 자산과 native 권한을 추가하지 않는다.

## 구현 작업

1. RuleSet에 5종 archetype과 aggro/locomotion/population/absorption 수치를 추가한다.
2. CellState와 Simulation에 species, absorbedBy, absorptionProgress, active absorption을 추가한다.
3. 종별 감지 반경과 고유 movement를 구현하고 Mass 비교를 steering에서 제거한다.
4. 접촉 시 즉시 결과 대신 absorption을 시작하고 fixed tick에서 pull·질량 이전·완료를 처리한다.
5. NPC/Nutrient를 8배 stratified spawn하고 respawn에서도 species 불변 조건을 유지한다.
6. CellRenderer를 instanced attributes 기반으로 바꾸고 5종 실루엣·흡수 stretch/shrink를 shader에 구현한다.
7. Nutrient를 작은 중심광·halo Point로 조정하고 particle budget을 재배분한다.
8. 단위·결정성·정적 검사와 production build를 수행한다.

## 위험과 rollback

- 8배 개체가 CPU/GPU budget을 넘길 수 있다. Cell은 instancing, Nutrient는 단일 Points buffer를 사용하고 내부
  particle 수를 낮춰 총 buffer 크기를 제한한다.
- 어그로 추격이 초반 즉사로 이어질 수 있다. 시작 보호 시간 동안 pursue 개체가 Player 접촉 포식을 시작하지
  못하는 기존 보호 규칙을 유지한다.
- 흡수 중 predator가 움직여 prey가 튈 수 있다. fixed tick exponential pull과 진행률 기반 시각 scale을 사용한다.
- rollback은 `populationMultiplier`를 1로 고정하고 absorption duration을 0으로 처리하며 기존 단일 morph renderer로
  되돌린다.

## 요구사항별 수용 기준

- [x] 다섯 Species 이름·형태·기동·Aggro Profile이 RuleSet과 CellState로 추적된다.
- [x] pursue는 반경 안에서 접근하고 flee는 반경 안에서 이탈하며 passive는 Player 방향에 반응하지 않는다.
- [x] 각 종의 어그로 판정은 해당 `aggroRadius` 경계 안/밖에서 결정적으로 바뀐다.
- [x] Cell 포식 가능 여부는 Species/Aggro가 아니라 기존 Mass ratio만 사용한다.
- [x] Cell은 즉시 사라지지 않고 0.72초 pull/stretch/shrink와 점진 질량 이전 뒤 완료된다.
- [x] 전이 중 prey 중복 선택과 predator의 동시 다중 흡수가 없다.
- [x] NPC는 432개, Nutrient는 Mass 1인 2560개로 Field 전체에 stratified 배치된다.
- [x] 5종 procedural silhouette과 작은 유기물 pulse가 bitmap 없이 표현된다.
- [x] Cell population은 instanced draw 단위를 사용하고 개체별 ShaderMaterial을 만들지 않는다.
- [x] 같은 seed/input의 30/60/120Hz 결과와 기존 흡수·pause·game-over 불변 조건이 유지된다.

## 필수 검사와 기기 matrix

- Node 22.22.1 / npm 10.9.4
- `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`
- aggro 경계, passive 비반응, 종 분포, 8배 population, absorption progression 단위 검사
- 30/60/120 render schedule fixed tick 결정성 검사
- shader instancing/종별 SDF/bitmap sampler 0 정적 계약 검사
- 브라우저 검사는 저장소 규칙에 따라 제외
- native project가 아직 없으므로 iOS/Android app smoke는 packaging SPEC 공백으로 유지한다.
