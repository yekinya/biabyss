# SPEC-BIABYSS-20260821-predator-ecosystem-density

## 배경과 목표

현재 5종 NPC의 공격 성향은 크기와 무관하게 Player만 추적한다. 작은 공격형 NPC도 자신보다 큰 Player에게
다가오며, NPC끼리는 표적을 고르거나 포식하지 않는다. Cell 접촉은 외곽이 상당히 겹친 뒤 고정 시간의 true/false
전이로 바뀌고 prey의 실제 Mass는 줄지 않아 충돌 깊이와 피해가 연결되어 보이지 않는다.

현미경 생태계를 8종으로 늘리고 공격형을 `pursue-player`와 `pursue-cell` 두 범위로 나눈다. 공격형은 현재
Mass로 흡수 가능한 작은 Cell만 표적으로 삼고, `pursue-cell`은 Player와 NPC를 모두 후보로 삼는다. 현재 대비
NPC와 Nutrient를 각각 3배로 늘리며 spatial hash로 O(n²) 탐색을 피한다. Cell 외곽 접촉부터 겹침 깊이에 비례해
prey Mass를 매 fixed tick 감소시키고 predator Mass를 효율만큼 증가시키는 연속 피해 흡수를 구현한다.

## 범위

- 연쇄구균, 나선편모충, 방산포자충 3종과 procedural SDF 형태 추가
- `pursue-player | pursue-cell | flee | passive` Aggro Profile
- 공격형의 흡수 가능 Mass 필터와 결정적인 최근접 표적 선택
- Player를 포함한 NPC 간 접촉·연속 Mass 흡수
- NPC 1620개, Nutrient 9600개의 stratified population과 cell spatial hash
- Nutrient Mass 1~6 seed 난수, 질량 연동 충돌 반경과 더 큰 point 표현
- 이동 최고/목표 속도 2배, drive 가속 유지, catch 진행 속도 0.5배
- 세포 plane overscan으로 늘어난 막·꼬리·halo clipping 방지
- 접촉 깊이 기반 drain·pull·prey 축소·predator 신장 표현

## 범위 밖

- flocking, 번식, 세대·유전 시스템
- 공격 우선순위 학습과 집단 전술
- Species별 별도 포식 효율과 방어력
- 서버·멀티플레이·원격 자산
- 브라우저 자동화·smoke·screenshot 검사

## 현재/목표 동작

### 현재

- 5종, NPC 540개, Mass 1 Nutrient 3200개다.
- `pursue`는 상대 크기와 무관하게 Player만 추적한다.
- Cell 포식은 Player/NPC 사이에서만 깊은 접촉 threshold 뒤 시작한다.
- prey Mass는 전이 중 유지되고 완료 시 한 번에 respawn 또는 game over가 된다.
- Cell plane 경계에 가까운 꼬리와 늘어난 막의 halo가 잘릴 수 있다.

### 목표

- 8종, NPC 1620개, Mass 1~6 Nutrient 9600개다.
- `pursue-player`는 먹을 수 있는 Player만, `pursue-cell`은 먹을 수 있는 가장 가까운 모든 Cell을 추적한다.
- 모든 Cell 쌍은 외곽 접촉부터 크기 관계에 따라 하나의 연속 흡수를 시작할 수 있다.
- prey 실제 Mass가 접촉 깊이에 비례해 매 tick 줄고 predator는 손실 Mass의 효율만큼 점진 성장한다.
- 이동 목표/상한은 2배지만 drive 추진 가속은 유지하고 catch 애니메이션·감속은 2배 오래 지속된다.
- 최대 형태와 halo는 overscan plane 안에 남는다.

## 도메인·RuleSet·화면·자산·플랫폼 영향

- domain: Aggro Profile의 표적 범위, 연속 피해 흡수와 Mass 기반 공격 후보 불변 조건을 갱신한다.
- runtime model: Species union, NPC target/decision tick, predator feeding progress와 drain 상태를 추가한다.
- RuleSet: population, Nutrient 범위, 이동 배율, catch time scale, drain과 spatial hash 수치를 중앙화한다.
- 화면: HUD·입력 흐름은 유지하고 8종 형태, 큰 Nutrient, predator 신장과 clipping 여백을 표현한다.
- 자산: `shader.cell.ecology-archetypes.v4`를 기존 procedural shader 위치에 등록한다.
- 플랫폼: 외부 자산과 native 권한을 추가하지 않는다.

## 구현 작업

1. domain/runtime/rules/visual 문서에 새 Aggro·Species·연속 흡수 계약을 반영한다.
2. RuleSet을 8종, 1620 NPC, 9600 Nutrient와 새 이동·drain 수치로 갱신한다.
3. seed 기반 Nutrient Mass와 질량 연동 충돌·point 크기를 구현한다.
4. spatial hash와 안정 tie-break를 사용해 작은 표적만 선택하는 두 공격 범위를 구현한다.
5. 모든 Cell 쌍의 외곽 접촉을 수집하고 실제 Mass drain·gain·pull·완료를 구현한다.
6. gait catch 진행 속도를 낮추고 translation speed 배율을 적용한다.
7. 3종 SDF, predator feeding 신장과 shader plane overscan을 구현한다.
8. 경계·결정성·고밀도·shader 계약 검사와 Q1 production build를 수행한다.

## 위험과 rollback

- 1620 Cell의 전수 표적·충돌 비교는 O(n²)이다. 고정 크기 spatial hash와 낮은 빈도의 decision tick으로 후보를
  제한하고 600 tick 실행 시간을 기록한다.
- 9600 Point와 1621 Cell이 fill-rate와 buffer 갱신량을 높인다. 단일 Points와 InstancedMesh를 유지하며 point
  크기 상한과 내부 particle 예산을 중앙 RuleSet에서 제한한다.
- 연속 drain이 다수 접촉에서 중복 피해를 만들 수 있다. prey와 predator를 하나의 active absorption에만 선점하고
  안정 ID 순서로 접촉 후보를 처리한다.
- rollback은 RuleSet v3, 5종, multiplier 10, 고정 Nutrient Mass와 이전 absorption transition으로 되돌린다.

## 요구사항별 수용 기준

- [x] 8개 Species ID·이름·형태가 RuleSet, CellState와 shader에서 구분된다.
- [x] 공격형은 `cellAbsorbRatio`를 만족하지 않는 Player/NPC를 추적하지 않는다.
- [x] `pursue-player`는 Player만, `pursue-cell`은 Player와 NPC 중 최근접 작은 Cell을 결정적으로 고른다.
- [x] NPC 1620개, Player 포함 Cell 1621개와 Nutrient 9600개가 생성된다.
- [x] Nutrient Mass는 seed 기반 1~6 범위이고 point·충돌 크기가 Mass와 함께 커진다.
- [x] 이동 목표/상한은 이전의 2배, drive acceleration은 유지, catch 구간 시간은 2배다.
- [x] Cell 외곽 접촉 직후 prey 실제 Mass가 감소하고 predator 실제 Mass가 점진 증가한다.
- [x] drain 속도는 접촉 겹침 깊이에 따라 증가하고 중심 진입 시 한 tick 완료되지 않는다.
- [x] 한 prey와 predator는 동시에 하나의 absorption에만 참여한다.
- [x] 늘어난 막·꼬리·halo가 overscan plane 경계에서 잘리지 않는다.
- [x] spatial hash를 사용하며 600 tick 뒤 Entity 수와 모든 수치가 finite다.
- [x] Q1 검사를 모두 통과한다.

## 필수 검사와 기기 matrix

- Node 22.22.1 / npm 10.9.4
- `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`
- Aggro Mass 경계, 두 표적 범위, tie-break와 NPC 간 공격 단위 검사
- Nutrient 범위·결정성·크기 연동 검사
- 접촉 깊이별 Mass drain, 점진 gain, 중복 선점과 game over 검사
- catch segment 시간, movement multiplier와 shader overscan 정적 검사
- 1621 Cell/9600 Nutrient 600 fixed tick finite·실행 시간 검사
- 브라우저 검사는 저장소 규칙에 따라 제외
- native project가 아직 없으므로 iOS/Android app smoke는 packaging SPEC 공백으로 유지한다.
