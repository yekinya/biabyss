# SPEC-BIABYSS-20260821-continuous-consumption-camera-scale

## 배경과 목표

현재 시작 보호 시간은 Player가 prey인 충돌뿐 아니라 Player가 predator인 충돌도 건너뛰어 시작 직후 작은 Cell을
먹을 수 없다. `cellAbsorbRatio=1.12`는 질량 차이가 12% 이내인 두 Cell 사이에 어느 쪽도 흡수하지 못하는 중립
구간을 만든다. Player와 NPC Mass가 `maximum=520`에 도달하면 같은 상한에 묶인 큰 Cell이 더 자주 이 중립
상태에 남고 성장도 멈춘다.

Cell 흡수는 fixed tick마다 실제 Mass를 이전하지만, 깊은 겹침에서 약 1초 안에 끝나고 완료 event의 burst 외에는
prey 조각이 predator로 흐르는 지속 표현이 없어 한 번에 사라지는 것처럼 보인다. 이동의
`sqrt(referenceMass/currentMass)` 감속도 성장 후 지나치게 커진다. Orthographic camera는 Mass와 무관하게 같은
world 범위만 보여 큰 Player가 화면을 과도하게 차지한다.

시작 보호는 Player가 먹히는 경우에만 적용하고, 접촉한 두 Cell은 항상 더 큰 쪽이 작은 쪽을 흡수하도록 중립
구간을 없앤다. 현재 Mass에서 파생한 민감한 세포막 접촉 반경으로 흡수를 시작하고, prey HP인 Mass를 수초 동안
연속 감소시키면서 predator Mass를 같은 tick에 증가시킨다. 빨려 들어가는 조각 particle을 전이 내내 방출한다.
성장 이동 감속은 완만한 지수와 하한을 사용하고, 일정 Mass 이후 camera world scale을 부드럽게 확대한다.

## 범위

- 시작 보호 중 Player의 포식 허용, Player가 prey일 때만 보호
- Cell 포식 중립 구간 제거와 동일 Mass의 안정 ID tie-break
- 현재 Mass 기반 Radius와 막 접촉 여유를 매 tick 충돌·흡수에 적용
- 흡수 damage·pull 감속과 prey/predator 실제 Mass 동시 변화
- active absorption 동안 prey에서 predator로 흐르는 pooled fragment particle
- 최대 Mass 상향과 성장에 따른 이동 감속 완화
- Player Mass 기반 orthographic camera world scale과 좌표 변환 보정
- 질량·접촉·연속 drain·particle·이동·camera 경계 단위/결정성 검사

## 범위 밖

- Nutrient의 단계적 흡수 전환
- 다중 prey 동시 흡수와 포식자 합체
- Species별 방어력·damage resistance
- camera shake, cinematic cut와 별도 minimap
- 서버·계정·사람 멀티플레이
- 브라우저 자동화·smoke·screenshot 검사

## 현재/목표 동작

### 현재

- 시작 6초 동안 Player가 포함된 모든 Cell 접촉을 무시한다.
- predator가 prey보다 12% 이상 크지 않으면 어느 쪽도 흡수하지 않는다.
- Cell Mass는 520에서 멈추며 성장한 Player 이동 배율은 제곱근 비율로 급감한다.
- 깊은 겹침은 약 1초 안에 drain되고 완료 순간 외향 burst만 보여 단계적 질량 이전이 약하다.
- camera가 항상 Canvas 크기와 같은 world 범위를 투영한다.

### 목표

- 시작 보호 중에도 Player는 작은 Cell을 먹고, 큰 Cell이 Player를 먹는 것만 차단된다.
- 접촉한 두 Cell은 큰 쪽이 작은 쪽을 먹으며 동일 Mass는 안정 ID로 한쪽을 선택한다.
- `(radiusA + radiusB) × contactRadiusMultiplier` 막 경계에서 미세 접촉도 흡수를 시작한다.
- prey Mass는 깊은 접촉에서도 여러 fixed tick에 걸쳐 줄고 predator Mass는 효율만큼 같은 tick에 커진다.
- 전이 중 작은 조각이 prey 막에서 predator 쪽으로 연속 이동한다.
- 성장 감속은 완만해지고 최소 이동 배율 아래로 떨어지지 않는다.
- Player가 기준 Mass를 넘으면 camera가 부드럽게 zoom out해 최대 설정 배율까지 더 넓은 Field를 보여준다.

## 도메인·RuleSet·화면·자산·플랫폼 영향

- domain: 모든 Cell 접촉에 predator/prey가 정해지는 불변 조건과 시작 보호 방향을 추가한다.
- runtime model: AbsorptionState 의미는 유지하고 Presentation camera scale과 active drain particle 투영을 명시한다.
- RuleSet: absorb ratio, contact multiplier, damage/pull, maximum Mass, movement factor와 camera/particle 수치를 갱신한다.
- 화면: camera world scale에 맞춰 world 투영과 pointer 변환을 함께 갱신한다.
- 자산: 기존 procedural point material을 재사용하며 runtime bitmap을 추가하지 않는다.
- 플랫폼: 외부 network·native 권한·추가 Canvas가 없다.

## 구현 작업

1. domain/runtime/rules/flow/visual/frontend 문서와 이 SPEC에 새 포식·이동·camera 계약을 반영한다.
2. `canAbsorb` 중립 구간을 제거하고 접촉 관계를 큰 Mass·안정 ID 순서로 결정한다.
3. 시작 보호를 Player prey에만 적용하고 현재 Mass Radius와 접촉 multiplier로 후보를 수집한다.
4. damage·pull 수치를 낮춰 prey 감소와 predator 성장을 수초의 fixed tick 전이로 만든다.
5. active absorption을 읽는 pooled suction fragment emitter를 추가한다.
6. 중앙 `movementFactorForMass`를 Player와 모든 NPC locomotion에 적용한다.
7. 순수 camera scale 공식을 만들고 projection, camera clamp, screen-to-world와 diagnostics에 적용한다.
8. 경계·결정성·finite·고밀도 검사와 Q1 build를 수행한다.

## 위험과 rollback

- absorb ratio 1은 비슷한 크기끼리 포식이 잦아질 수 있다. 정확히 같은 Mass는 안정 ID tie-break로 결정성을
  보장하고 한 Cell당 하나의 active absorption 선점은 유지한다.
- 넓어진 접촉 반경이 시각 막과 지나치게 떨어질 수 있다. multiplier를 1에 가까운 값으로 제한하고 현재 Mass
  Radius에서만 계산한다.
- fragment 방출이 active absorption 수에 비례해 폭증할 수 있다. frame당 방출량과 전체 pool을 RuleSet에서
  제한하고 ring buffer로 재사용한다.
- camera zoom out이 world 밖을 보일 수 있다. 실제 표시 half extent로 camera 중심을 clamp하고 최대 scale을
  Field span보다 작게 제한한다.
- rollback은 v4 ratio·movement factor·고정 camera와 기존 trail burst로 되돌린다.

## 요구사항별 수용 기준

- [x] 시작 보호 중 Player는 작은 Cell을 흡수할 수 있고 큰 Cell은 Player를 흡수하지 못한다.
- [x] 접촉한 두 Cell은 Mass가 큰 쪽을 predator로 정하며 12% 중립 구간이 없다.
- [x] 동일 Mass 접촉도 안정 ID tie-break로 정확히 하나의 absorption을 시작한다.
- [x] 성장 직후 바뀐 Radius와 접촉 multiplier가 같은 tick 이후 충돌 후보에 반영된다.
- [x] 세포막의 1px 수준 미세 접촉에서도 absorption이 시작된다.
- [x] 깊은 접촉도 한 tick 또는 한 frame에 완료되지 않고 prey/predator Mass가 매 tick 함께 변한다.
- [x] active absorption 동안 fragment particle이 prey에서 predator 방향으로 연속 방출된다.
- [x] 성장 이동 factor는 완만한 지수와 하한을 사용하고 Player/NPC locomotion에 일관되게 적용된다.
- [x] 기준 Mass 이후 camera world scale이 단조 증가하며 maximum scale을 넘지 않는다.
- [x] camera scale이 projection, Field clamp와 screen-to-world 변환에 동일하게 적용된다.
- [x] 모든 Mass·Radius·위치·particle buffer가 finite이고 결정성이 유지된다.
- [x] Q1 검사를 모두 통과한다.

## 필수 검사와 기기 matrix

- Node 22.22.1 / npm 10.9.4
- `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`
- 시작 보호 predator/prey 방향과 동일/유사 Mass 포식 경계 검사
- 성장 전후 Radius 접촉, 얕은/깊은 drain 시간과 Mass 보존 효율 검사
- fragment pool 방향·수명·용량 검사
- movement factor 기준/성장/하한과 Player/NPC 적용 검사
- camera scale 시작/중간/상한과 world extent 좌표 검사
- 고밀도 600 tick finite·결정성 검사
- 브라우저 검사는 저장소 규칙에 따라 제외
- native project가 아직 없으므로 iOS/Android app smoke는 packaging SPEC 공백으로 유지한다.
