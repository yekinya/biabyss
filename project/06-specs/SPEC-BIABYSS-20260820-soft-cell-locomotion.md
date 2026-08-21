# SPEC-BIABYSS-20260820-soft-cell-locomotion

## 배경과 목표

현재 플레이어 이동은 횡방향 사인 가속만 더한 미끄러짐에 가깝고 입력 강도가 없다. 세포 표현도 속도에 따른
작은 대칭 scale과 강한 외곽 rim 위주라 앞막이 뻗고 뒤가 따라붙는 말랑한 추진, 내부 물질의 응집·확산이
충분히 보이지 않는다. 배경 또한 고정 현미경 bitmap을 변형해 반복하므로 오래 머물면 같은 무늬가 드러난다.
눌린 위치에 나타나는 Canvas 조이패드와 강도 기반 보행형 추진을 만들고, 내부 광점을 중심으로 부드러운 세포
질감을 재조정한다. 환경은 bitmap 없이 cyan·violet·magenta 성운과 미세 포자가 천천히 섞이는 절차적
`cosmic microbial deep`으로 전환한다.

## 범위

- 첫 active pointer가 눌린 Canvas CSS 좌표를 중심으로 하는 부유형 원형 조이패드
- 조이패드 중심~가장자리 비율을 `0..1` 입력 강도로 정규화
- 입력 강도와 사인 주기를 함께 적용한 플레이어 전진 추진·횡방향 꿈틀거림·속도 상한
- 진행 방향의 앞막이 먼저 늘어나고 뒤막·내부 물질이 따라붙는 비권위 렌더 변형
- 세포 내부 광점의 나선형 확산·응집, 관성 offset과 서로 다른 글로우 반짝임
- `IDLE/MOVE`를 속도에서 파생해 가까워지고 벌어지는 두 내부 광핵과 상태별 내부 흐름
- 외부막 emissive와 전체 bloom을 줄이고 내부 광점 대비 강화
- 고정 배경 bitmap·texture sampling 제거, 다중 noise field의 시간 기반 domain warp와 색상 블렌딩
- 감소 모션에서 환경 변화량과 pulse를 낮추는 shader fallback
- pointer capture, up/cancel/blur/visibility 해제 처리
- 조이패드 강도·결정성 단위 검사와 정적 shader contract 검사

## 범위 밖

- 멀티터치 동시 조작
- 조이패드 위치·크기 사용자 설정
- NPC 판단 규칙과 흡수 공식 변경
- 물리 기반 연체 시뮬레이션 또는 다관절 지렁이 Entity
- 세포 종류별 상속 계층과 렌더러가 소유하는 별도 gameplay 상태
- 네이티브 햅틱·오디오 추가

## 현재/목표 동작

### 현재

- pointer 위치가 직접 world target이 되어 화면 가장자리일수록 멀리 향하지만 입력 강도는 항상 같다.
- pointerup을 명시적으로 처리하지 않고 pointerleave에서만 입력을 해제한다.
- 전진 가속은 일정하고 횡가속만 사인 함수라 한 발씩 내딛는 추진감이 약하다.
- 세포는 중심 기준으로 대칭 stretch하며, 내부 particle은 일정 반경을 계속 공전한다.
- 밝은 외곽 rim이 내부 구조보다 강하게 bloom된다.
- 배경은 번들 PNG를 6회 반복 sampling하므로 고정 무늬가 보이고 변화가 작다.

### 목표

- pointerdown 지점에 반경 72 CSS px의 조이패드가 나타나고 knob와 강도 호가 방향·입력량을 표시한다.
- 입력 강도 0은 추가 추진이 없고, 가장자리 1은 한 추진 주기의 이동 거리와 속도 상한을 최대로 만든다.
- 사인 주기에 맞춰 앞쪽이 뻗은 뒤 뒤쪽과 내부 물질이 따라붙는 움직임이 보인다.
- 내부 광점이 서로 다른 위상으로 퍼졌다 모이고 반짝이며, 외부막은 얇고 부드럽게 남는다.
- 속도가 낮으면 두 광핵이 중심으로 모이고, 이동하면 진행축을 따라 벌어지며 내부 입자 흐름이 빨라진다.
- 배경은 외부 이미지 없이 청록·자주·심홍 층이 서로 다른 속도로 순환하며 매 순간 새로운 혼합을 만든다.

## 도메인·RuleSet·화면·자산·플랫폼 영향

- 도메인: `InputIntent`에 `0..1` 강도를 추가하되 Simulation이 입력 상태의 유일한 소비자라는 경계를 유지한다.
- RuleSet: 보행 주기 최저 추진 비율과 조이패드 CSS 반경을 중앙화한다.
- 화면: gameplay effect와 HUD 사이에 Canvas joystick 레이어를 추가한다.
- 자산: soft-locomotion cell shader, 절차적 joystick material과 cosmic microbial field shader를 manifest에서
  추적한다. 기존 현미경 bitmap은 runtime에서 사용하지 않는다.
- 플랫폼: Pointer Events와 pointer capture만 사용하며 runtime 외부 자산·네이티브 권한은 추가하지 않는다.

## 구현 작업

1. RuleSet에 stride 최저 비율과 조이패드 반경을 추가한다.
2. Simulation 입력에 강도를 추가하고 전진·횡 가속과 속도 상한에 반영한다.
3. 단일 active pointer를 소유하는 입력 adapter와 포인터 해제 경계를 구현한다.
4. Three.js scene 안에 바깥 원, 강도 호, knob로 구성한 조이패드를 구현한다.
5. cell shader와 transform에 비대칭 앞막/뒤막 위상, 부드러운 경계, 쌍광핵과 내부 광점 대비를 적용한다.
6. 내부 particle에 속도 반대 관성, 속도 기반 나선 회전과 확산·응집 반경을 적용한다.
7. field shader에서 bitmap sampler를 제거하고 저비용 다중 noise·domain warp·색상 순환으로 환경을 합성한다.
8. 단위·결정성 검사, 정적 검사와 production build를 수행한다.

## 위험과 rollback

- 조이패드가 카메라 이동에 따라 world에 붙어 보일 수 있다. world scene과 분리된 overlay camera에서 Canvas
  CSS 좌표를 직접 투영해 화면에 고정한다.
- 비대칭 SDF가 collision silhouette과 달라 보일 수 있다. 변형을 반경의 제한된 범위에 두고 권위 충돌 반경은
  변경하지 않는다.
- 내부 particle 증가와 bloom이 fill-rate를 높일 수 있다. 고정 pool을 유지하고 외부 bloom 강도를 함께 낮춘다.
- 절차적 배경의 다중 noise가 저사양 GPU의 fill-rate를 높일 수 있다. octave 수를 정적 4회로 제한하고 별도
  full-screen pass를 추가하지 않는다.
- rollback은 입력 강도를 1로 고정하고 joystick view와 새 shader uniform을 제거해 기존 이동·표현으로 복귀한다.

## 요구사항별 수용 기준

- [ ] pointerdown 지점에 원형 조이패드가 Canvas 안에서 표시된다.
- [ ] knob는 반경 안에서 clamp되고 중심~가장자리 비율이 `0..1` 강도가 된다.
- [ ] 강도가 클수록 같은 시간 동안 전진 이동 거리와 속도 상한이 커진다.
- [ ] 전진 추진과 횡방향 꿈틀거림이 고정 timestep 사인 주기로 반복된다.
- [ ] 앞막이 늘어난 뒤 뒤막·내부 물질이 지연되어 따라붙는 렌더 변형이 보인다.
- [ ] 내부 광점이 확산·응집하며 서로 다른 위상으로 반짝인다.
- [ ] `IDLE`에서 두 광핵이 가까워지고 `MOVE`에서 진행축을 따라 벌어지며 내부 입자 흐름이 빨라진다.
- [ ] 외부막 glow가 기존보다 약하고 내부 발광이 시각적 중심이 된다.
- [ ] 배경 renderer와 production bundle이 고정 bitmap 또는 texture sampler를 사용하지 않는다.
- [ ] cyan·violet·magenta 환경층이 서로 다른 위상으로 계속 섞이며 camera 이동 중 반복 seam이 두드러지지 않는다.
- [ ] 감소 모션에서 배경과 세포 pulse 변화량이 줄어들고 gameplay silhouette은 유지된다.
- [ ] pointerup/cancel, blur, visibility change와 pause에서 입력·조이패드가 해제된다.
- [ ] 감소 모션에서도 입력 피드백은 유지하되 pulse성 조이패드 효과는 없다.
- [ ] 기존 흡수·pause·game-over와 결정성 검사가 유지된다.

## 필수 검사와 기기 matrix

- Node 22.22.1 / npm 10.9.4
- `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`
- 중앙·절반·가장자리 조이패드 강도 단위 검사
- 고정 bitmap·texture sampler·production PNG data URI 0 정적 검사
- 브라우저 자동화·smoke·screenshot 검사는 저장소 규칙에 따라 제외
- native project가 아직 없으므로 iOS/Android app smoke는 후속 packaging SPEC 공백으로 유지한다.
