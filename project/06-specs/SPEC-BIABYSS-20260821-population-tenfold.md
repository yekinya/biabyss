# SPEC-BIABYSS-20260821-population-tenfold

## 배경과 목표

현미경 군집의 밀도를 더 높이기 위해 기존 기준 개체수의 8배였던 population을 10배로 상향한다. 기존 기준은
NPC 54개와 Mass 1 Nutrient 320개이며, 목표 population은 NPC 540개와 Nutrient 3200개다. Player 1개를
포함한 전체 Cell 수는 541개다.

이번 변경은 Species 분포, Aggro, 이동, 포식과 흡수 공식을 바꾸지 않는다. 기존 InstancedMesh와 pooled
Points 렌더링 경계를 유지해 개체수 증가가 개체별 draw call 증가로 이어지지 않게 한다.

## 범위

- `world.populationMultiplier`를 8에서 10으로 상향
- NPC 540개와 Mass 1 Nutrient 3200개의 stratified population
- 10배 population의 개체수·finite 상태·10초 fixed-step 안정성 검사
- 관련 게임 규칙과 시각 방향 문서 동기화

## 범위 밖

- Species 비율, Aggro 반경과 이동 수치 변경
- Mass·포식·흡수 공식 변경
- 셰이더, 실루엣과 Stage 색감 변경
- 서버·멀티플레이·원격 자산
- 브라우저 자동화·smoke·screenshot 검사

## 현재/목표 동작

### 현재

- `world.populationMultiplier=8`
- NPC 432개, Player 포함 Cell 433개
- Mass 1 Nutrient 2560개

### 목표

- `world.populationMultiplier=10`
- NPC 540개, Player 포함 Cell 541개
- Mass 1 Nutrient 3200개
- 같은 seed와 입력에서 기존 Species·Aggro·흡수 불변 조건을 유지한다.

## 도메인·RuleSet·화면·자산·플랫폼 영향

- domain/runtime model: Entity 종류와 상태 소유권은 바뀌지 않는다.
- RuleSet: population multiplier와 그로부터 계산되는 NPC/Nutrient 수만 상향한다.
- 화면: HUD·입력·Stage 흐름은 유지하고 World Canvas의 population 밀도만 높아진다.
- 자산: 새 bitmap·shader·font·audio를 추가하지 않는다.
- 플랫폼: 외부 자산과 native 권한을 추가하지 않는다.

## 구현 작업

1. RuleSet ID와 `world.populationMultiplier`를 10배 기준으로 갱신한다.
2. 중앙 multiplier에서 NPC 540개와 Nutrient 3200개가 계산되게 한다.
3. 게임 규칙과 시각 방향 문서의 현재 population 수치를 동기화한다.
4. 10초 fixed-step 고밀도 검사를 10배 명시 수치로 강화한다.
5. Q1 정적 검사·단위/결정성 검사·production build를 수행한다.

## 위험과 rollback

- 10배 개체가 CPU/GPU budget을 높일 수 있다. Cell InstancedMesh와 Nutrient pooled Points를 그대로 사용하고
  fixed-step benchmark에서 Entity 수와 finite 상태를 확인한다.
- 화면 밀도 증가가 작은 기기의 가독성을 낮출 수 있다. Species 형태와 Nutrient 크기는 바꾸지 않으며 native
  staging에서 프레임 pacing과 가독성을 후속 확인한다.
- rollback은 `world.populationMultiplier`를 8로 되돌려 이전의 NPC 432개·Nutrient 2560개 구성으로 복구한다.

## 요구사항별 수용 기준

- [x] `world.populationMultiplier`는 10이고 RuleSet 한 곳에서 population을 계산한다.
- [x] NPC는 540개이며 Player를 포함한 Cell은 정확히 541개다.
- [x] Nutrient는 Mass 1인 3200개로 Field 전체에 stratified 배치된다.
- [x] Species 분포, Aggro, 이동과 점진 흡수 규칙은 변경되지 않는다.
- [x] 10초 600 tick 뒤 Cell 수·Nutrient 수와 모든 Cell 수치가 finite 상태를 유지한다.
- [x] Cell은 instanced draw 단위, Nutrient는 pooled Points 단위를 계속 사용한다.
- [x] Q1 검사를 모두 통과한다.

## 필수 검사와 기기 matrix

- Node 22.22.1 / npm 10.9.4
- `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`
- 10배 population 개체수와 600 tick finite 상태 단위 검사
- 별도 600 tick fixed-step 실행 시간 기록
- 브라우저 검사는 저장소 규칙에 따라 제외
- native project가 아직 없으므로 iOS/Android app smoke는 packaging SPEC 공백으로 유지한다.
