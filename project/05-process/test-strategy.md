# BIABYSS 테스트 전략

## 1. 목표

frame rate와 기기가 달라도 같은 규칙이 적용되고, Canvas가 실제 앱 WebView에서 안정적으로 실행되는 것을
검증한다. 시각적 화려함 때문에 도메인 판정 검사가 약해지지 않게 계층별로 분리한다.

## 2. Q1 — 모든 PR 필수

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
```

검사 중 warning을 무시하는 설정을 새로 추가하지 않는다. production build에 source map·진단·test fixture가
노출되는지도 확인한다.

## 3. Q2 — Domain/Simulation

### 단위

- Mass → Radius 공식
- 입력 dead zone과 속도 clamp
- Cell 흡수 비율의 직전/정확/직후 경계
- Nutrient 경쟁 tie-break
- 안전 spawn과 재시도 소진
- score와 maximum clamp
- pause/resume accumulator 초기화

### 결정성

같은 RuleSet, seed와 InputIntent fixture를 30fps/60fps/120fps render schedule로 구동해 다음을 비교한다.

- tick별 핵심 state hash
- final RunResult
- event type·tick·Entity ID sequence

shader time, particle 위치와 audio timing은 hash에서 제외한다.

### Property/soak

- 모든 Mass/position/velocity가 finite
- 소비된 Entity 재소비 0
- Player 수 정확히 1
- 10분 가속 simulation에서 Entity 수와 memory가 한계 안

## 4. Q3 — Renderer와 브라우저

- Canvas가 container 크기와 DPR 상한에 맞음
- 시작 → 이동 → 흡수 → game over → 재시작 흐름
- pointer cancel과 viewport resize
- 감소 모션과 low tier
- WebGL context loss/restore 가능한 범위의 복구
- console error/warning 0
- runtime 외부 network 요청 0
- React StrictMode 재마운트 뒤 Canvas/listener 중복 0

시각 회귀는 대표 viewport와 render tier screenshot으로 비교하되, shader noise는 안정 seed 또는 mask를 사용한다.

## 5. Q4 — Native smoke

develop staging 후보에서 최소 다음 기기를 검증한다.

| 플랫폼 | 최소 범위 |
|---|---|
| iOS | 지원 최저 iOS simulator + 최근 실제 iPhone |
| Android | 지원 최저 API emulator + 중급 실제 Android |

검사:

- cold start와 첫 Run
- touch latency와 multi-touch cancel
- background 10초 후 resume
- orientation/resize 정책
- audio interruption과 silent mode 정책
- safe area와 home indicator
- 10분 memory/frame pacing
- offline 전체 Run

## 6. Q5 — Release

- develop commit과 native artifact SHA 연결
- signed IPA/AAB 생성
- TestFlight internal / Play internal 설치와 smoke
- icon, splash, version/build number, privacy metadata
- 저장 schema upgrade
- production source map·diagnostics·dev menu 부재
- phased/staged rollout과 중단 절차

## 7. 실패 처리

- 테스트가 틀렸다고 판단해도 요구사항과 문서를 먼저 재검토한다.
- timing test는 무작정 timeout을 늘리지 않고 clock을 주입한다.
- flaky random test는 seed를 기록하고 재현 fixture로 승격한다.
- 성능 실패는 기기, viewport, DPR, tier, Entity 수와 trace를 함께 남긴다.
- 필수 검사가 실패하면 PR auto merge를 실행하지 않는다.

## 8. 현재 공백

기초 prototype은 아직 fixed-step Simulation, seed PRNG, spatial hash, context restore와 native project를 갖추지
않았다. 해당 항목을 구현하기 전 “규칙 엔진 완료” 또는 “앱 배포 가능”으로 판정하지 않는다.
