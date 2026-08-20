# BIABYSS 시스템 아키텍처

## 1. 결정 요약

- 단일 저장소의 Vite + Pure JavaScript ES module 웹 애플리케이션
- 단일 Three.js WebGL Canvas gameplay surface와 single-file production bundle
- 고정 timestep의 로컬 Simulation
- 앱 셸은 Capacitor iOS·Android
- 공개 웹 배포 없음
- GitHub Actions는 PR 품질 게이트, Codemagic은 서명·TestFlight·Google Play 배포 후보

## 2. 논리 계층

```text
application
├── domain          # 순수 타입, RuleSet, 불변 조건
├── simulation      # systems, fixed loop, PRNG, spatial index
├── presentation
│   ├── rendering   # Three.js, GLSL, Points, post-processing, camera
│   ├── audio       # Web Audio mixer
│   └── hud         # Canvas HUD와 접근성 projection
├── platform
│   ├── input       # pointer/touch 정규화
│   ├── lifecycle   # visibility/Capacitor App state
│   ├── storage     # local settings/result
│   └── haptics     # optional native adapter
└── shell           # DOM bootstrap와 error boundary
```

의존 방향:

```text
shell → application → simulation → domain
                    ↘ presentation
                    ↘ platform adapters
```

`domain`과 `simulation`은 Three.js, DOM, Capacitor를 import하지 않는다. Presentation은 Simulation을 변경하지
않고 command/application boundary를 통해서만 행동을 요청한다.

## 3. 목표 소스 구조

```text
biabyss-apps/apps/mobile/src/
├── app/
├── domain/
│   ├── model/
│   └── rules/
├── simulation/
│   ├── systems/
│   ├── spatial/
│   └── random/
├── game/
│   ├── rendering/
│   │   ├── shaders/
│   │   ├── materials/
│   │   └── particles/
│   ├── audio/
│   └── scenes/
├── platform/
│   ├── input/
│   ├── lifecycle/
│   ├── storage/
│   └── native/
├── store/                  # 저주파 UI projection만
└── test/
```

현재 `biabyss-apps/apps/mobile/src/game/engine/BiabyssGame.ts` 단일 prototype은 이 목표 구조로 가기 전의
실행형 기준선이다. 새 기능을 계속 한 파일에 추가하지 않고 첫 simulation SPEC에서 분리한다.

## 4. 런타임 흐름

```text
pointer/touch
  → InputAdapter
  → InputIntent queue
  → FixedStepLoop
  → Simulation systems
  → Snapshot + Domain Events
  → Three Renderer / Audio / HUD projection
```

render callback의 delta를 곧바로 게임 판정 dt로 사용하지 않는다. accumulator는 최대 catch-up tick을 제한하고
초과 시간은 폐기한다.

## 5. 네이티브 패키징

`biabyss-apps/apps/mobile/dist/`를 Capacitor `webDir`로 포함한다. iOS는 WKWebView, Android는 platform
WebView에서 같은 bundle을 실행한다. Native project는 빌드·서명·아이콘·splash와 승인 plugin만 담당한다.

게임 코드가 `Capacitor.isNativePlatform()` 분기를 곳곳에 만들지 않도록 adapter interface를 주입한다.

## 6. 저장

MVP는 server가 없다. local persistence는 versioned repository 하나로 제한한다.

- 설정: key-value 저장
- 최고 기록: 작은 versioned record
- 민감 정보: 없음
- 진행 중 World save: 없음

## 7. 관측

개발 build에서만 다음을 수집한다.

- average/95p frame time
- simulation tick overrun
- draw calls와 texture memory 추정
- active Cell/Nutrient/Particle 수
- WebGL context loss 횟수
- state hash와 seed

원격 analytics SDK는 별도 개인정보 SPEC 전까지 금지한다.

## 8. 의도적으로 하지 않는 것

- SSR, Next.js, API route, backend proxy
- 공개 CDN에서 gameplay code·asset 로드
- DOM 기반 Cell/particle
- full physics engine
- native별 별도 gameplay 구현
- 앱 업데이트를 우회하는 원격 code push
