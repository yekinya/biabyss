# BIABYSS 화면 정보 구조

## 1. 화면 원칙

앱은 route 중심 웹사이트가 아니라 하나의 게임 scene이다. gameplay, pause, settings와 result는 동일한 Canvas
Application 안에서 scene/overlay 상태로 전환한다. 브라우저 URL은 개발·진단 외에 게임 상태를 표현하지 않는다.

## 2. Scene 구조

```text
App Bootstrap
└── Loading Scene
    └── Title Scene
        ├── Gameplay Scene
        │   ├── HUD Layer
        │   ├── Pause Overlay
        │   └── Game Over Overlay
        └── Settings Overlay
```

| Scene/Overlay | 책임 |
|---|---|
| Loading | 필수 shader, font, audio 준비와 오류 |
| Title | 게임 정체성, 시작, 설정 |
| Gameplay | World와 Player 입력, HUD |
| Pause | simulation 정지, 계속, 재시작, 설정, 나가기 |
| Game Over | 결과, 최고 기록, 재시작, 타이틀 |
| Settings | 음량, 진동, 감소 모션, render tier |

## 3. Gameplay HUD

필수 정보만 상시 표시한다.

- 현재 Mass
- Score
- 흡수 수
- pause 버튼
- 시작 보호 시간 또는 위험 방향 cue

FPS, draw call, Entity 수, seed는 production HUD에 노출하지 않고 개발 diagnostics에서만 표시한다.

## 4. 레이어 순서

```text
world background
ambient field
nutrients
cells
gameplay effects
HUD
modal scrim
overlay panel
accessibility focus proxy
```

게임 객체 z-order와 충돌 우선순위를 연결하지 않는다.

## 5. 반응형과 safe area

- 세로·가로 방향을 모두 기술적으로 지원하되 MVP 권장 방향은 세로다.
- `env(safe-area-inset-*)`를 native shell에서 Canvas viewport padding으로 전달한다.
- HUD는 notch, home indicator와 system gesture 영역을 침범하지 않는다.
- world 좌표계 resize 정책은 `contain` 또는 world 재계산 중 하나를 RuleSet/SPEC에서 명시한다.
- 회전 중 simulation은 pause하고 좌표 변환과 render target을 재생성한 뒤 resume한다.

## 6. 접근성 대체면

시각 화면은 Canvas 한 장이지만 다음 최소 DOM 접근성 면을 허용한다.

- 앱과 현재 phase의 accessible name
- 중요한 결과를 한 번 알리는 live region
- Canvas와 동기화된 시작·pause·재시작 focus proxy
- 감소 모션, 음량과 진동 설정을 조작할 수 있는 접근 가능한 control

DOM control은 화면 밖에 숨긴 중복 게임이 아니라 Canvas control과 같은 Application Command를 호출한다.
