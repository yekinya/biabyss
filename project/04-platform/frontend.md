# BIABYSS 웹·Canvas 코딩 가이드

> 대상: `biabyss-apps/apps/mobile/`

## 1. 기술 기준선

- Vite
- Pure JavaScript ES2022 module + TypeScript `checkJs`
- Three.js `WebGLRenderer`, `EffectComposer`, `UnrealBloomPass`
- Vite + `vite-plugin-singlefile`: 단일 HTML production bundle
- Vitest: 순수 domain/simulation 단위·결정성 검사
- Capacitor: iOS·Android 패키징

## 2. 역할 분리

### Application Shell

- 앱 boot와 Canvas host
- 오류 경계
- 접근성 live region과 focus proxy
- 개발 diagnostics
- Application service 조립

### Three.js

- scene graph, 직교 camera와 Canvas draw
- GLSL ShaderMaterial, post-processing, BufferGeometry와 Points
- pointer hit target를 직접 판정해야 하는 Canvas UI

### Simulation

- 모든 Entity 위치, 속도, 질량과 phase
- collision, absorption, spawn와 NPC 판단
- fixed tick, seed와 score

### DOM projection

- 10Hz 이하 HUD snapshot과 접근성 live region만 반영한다.
- DOM을 Simulation database처럼 사용하지 않는다.

## 3. JavaScript와 정적 검사

- ES2022 module과 `// @ts-check`를 사용하고 `checkJs`, `strict`, `noUnusedLocals`를 유지한다.
- JSDoc으로 public boundary와 구조체를 명시한다.
- 단위가 다른 숫자는 이름 또는 branded type으로 구분한다: `WorldX`, `CssPixel`, `Milliseconds`, `Tick`.
- public system 함수는 입력·출력·mutation을 type으로 드러낸다.
- domain enum 대신 판별 가능한 union을 우선한다.
- random, clock, storage와 native API는 주입한다.

## 4. Simulation loop

```ts
const stepMs = 1000 / ruleSet.simulationHz

while (accumulator >= stepMs && steps < maxCatchUpSteps) {
  simulation.step(stepMs)
  accumulator -= stepMs
  steps += 1
}

renderer.render(simulation.snapshot(accumulator / stepMs))
```

- `maxCatchUpSteps`를 넘은 누적 시간은 폐기하고 diagnostic event를 남긴다.
- pause/resume에서 accumulator를 초기화한다.
- render callback 안에서 고빈도 DOM update를 호출하지 않는다.

## 5. Entity와 view 수명

- Simulation Entity가 생성되면 view factory가 ID에 맞는 view를 얻는다.
- 소비된 Entity는 frame 끝에 view pool로 반환한다.
- texture, material, geometry를 Entity마다 새로 만들지 않고 공유한다.
- InstancedMesh의 per-instance 상태는 `vec4` packing을 우선하고, 기본 geometry attribute와 `instanceMatrix`를
  포함한 활성 vertex attribute가 WebGL 최소 보장치 8개를 넘지 않게 설계한다.
- scene 종료 시 animation loop, DOM listener, audio voice와 GPU resource를 모두 해제한다.
- restart와 scene 재생성에서도 Canvas와 listener가 중복되지 않아야 한다.

## 6. 상태 갱신

- Renderer는 매 frame mutable DisplayObject를 직접 갱신할 수 있다.
- HUD snapshot은 값이 달라졌을 때와 최대 10Hz에서만 store로 보낸다.
- settings 변경은 Application Command를 거쳐 필요한 adapter에 전파한다.
- 파생 값 radius, threat relation과 score presentation을 중복 저장하지 않는다.

## 7. 자산

- 모든 runtime 자산은 import 또는 로컬 `/assets/` 경로로 가져오고 단일 HTML에 inline한다.
- CSS `@import` 원격 font, CDN script, 원격 shader와 audio stream을 금지한다.
- 자산은 안정 `assetId`로 Registry에서 해석한다. component가 경로 문자열을 조립하지 않는다.
- preload 필수/지연 가능/scene 전용 자산을 manifest에서 구분한다.
- load 실패는 fallback을 사용하고 화면에 recoverable 오류를 표시한다.
- Cell shader compile/link 실패 또는 기기 attribute 예산 부족은 gameplay을 중단하지 않고 외막·세포질만 가진
  단순 procedural material로 전환하며 diagnostics에 fallback 상태를 남긴다.

## 8. 오류 처리

오류를 세 등급으로 정규화한다.

- `RECOVERABLE`: 자산 한 개 fallback, audio decode 실패, haptics 미지원
- `RUN_ABORTED`: invariant 위반, Simulation 유한값 실패, world 생성 실패
- `APP_BLOCKED`: 필수 bundle 손상, WebGL 초기화·복구 실패

production UI에 stack과 기기 식별 정보를 노출하지 않는다. 개발 build에서는 seed, tick, ruleSetId와 함께
진단할 수 있다.

## 9. 접근성

- 감소 모션은 CSS뿐 아니라 shader, camera shake, particle burst에도 적용한다.
- 중요한 게임 결과는 live region에서 한 번만 읽는다.
- 시작, pause, resume, 재시작은 키보드와 스위치 입력으로도 호출 가능해야 한다.
- 색만으로 먹이/위협을 구분하지 않는다.
- text scale 확대 시 Canvas HUD가 잘리면 별도 접근성 HUD scale을 적용한다.

## 10. 성능 기준

- 목표: 기준 기기에서 60fps, low tier에서 최소 30fps 유지
- device pixel ratio 상한: 기본 2
- full-screen offscreen pass 수는 tier별로 제한
- 충돌 broadphase는 일정 Entity 수 이상 spatial hash 사용
- hot loop에서 배열 spread, 객체 대량 생성과 string key 조합을 피한다.
- 프로파일 없이 micro-optimization하지 않되 O(n²) 구조와 full-screen pass 폭증은 설계 단계에서 차단한다.

## 11. Native adapter

```ts
interface AppLifecyclePort {
  onStateChange(listener: (active: boolean) => void): () => void
}

interface HapticsPort {
  impact(kind: 'light' | 'medium' | 'heavy'): Promise<void>
}
```

브라우저 개발에서는 no-op/web adapter, Capacitor에서는 native adapter를 주입한다. Simulation은 adapter를
import하지 않는다.

## 12. 신규 기능 체크리스트

1. SPEC과 영향 문서를 먼저 변경했는가?
2. 게임 공식이 중앙 RuleSet에 있는가?
3. Simulation과 rendering 책임이 분리됐는가?
4. frame rate·seed 결정성 테스트가 있는가?
5. touch, resize, background/resume을 확인했는가?
6. low render tier와 감소 모션 fallback이 있는가?
7. runtime 외부 네트워크 요청이 생기지 않았는가?
8. iOS·Android WebView에서 smoke할 수 있는가?
