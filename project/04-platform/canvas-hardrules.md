# BIABYSS Canvas 절대 규칙

## 1. 단일 Surface

- gameplay 시각은 Three.js WebGL Canvas 한 장에 그린다.
- DOM Cell, DOM particle, CSS로 움직이는 gameplay object를 만들지 않는다.
- DOM은 host, Title, 10Hz 이하 HUD, 접근성 projection과 개발 diagnostics만 담당한다.
- Canvas를 feature별로 여러 장 겹치지 않는다. offscreen canvas/render texture는 renderer 내부 구현이다.

## 2. 좌표계

반드시 다음 경계를 이름으로 구분한다.

```text
client coordinate
→ canvas CSS coordinate
→ renderer screen coordinate
→ camera/world coordinate
```

- `getBoundingClientRect()`와 renderer screen 크기로 pointer를 변환한다.
- `devicePixelRatio`를 입력 좌표에 두 번 적용하지 않는다.
- Simulation은 world coordinate만 받는다.
- safe area는 HUD layout에 적용하고 world 물리 경계를 암묵적으로 줄이지 않는다.

## 3. 시간

- Simulation은 고정 timestep만 사용한다.
- Render frame delta를 질량, score, NPC decision에 직접 쓰지 않는다.
- shader의 `uTime`은 시각 전용이며 Simulation clock이 아니다.
- background 경과 시간을 catch-up하지 않는다.
- timer는 `setInterval`로 게임 판정을 만들지 않고 tick deadline으로 표현한다.

## 4. 렌더링

- Cell geometry를 매 frame 재작성하지 않는다. 형태 변화는 shader uniform으로 계산한다.
- 반복 형태는 공유 geometry/context/texture를 사용한다.
- shader program과 uniform layout은 material별로 공유한다.
- 개체마다 별도 blur/bloom filter를 붙이지 않는다. prototype 예외는 SPEC에 제거 조건을 둔다.
- alpha overlap과 full-screen pass는 fill-rate 비용을 측정한다.
- simulation collision radius와 render wobble scale을 분리한다.

## 5. Shader

- shader source와 TypeScript uniform type을 같은 module 경계에서 관리한다.
- compile 실패 fallback이 있어야 한다.
- WebGL precision과 extension 요구를 명시한다.
- 분기·loop 상한은 정적이고 낮게 유지한다.
- random noise가 gameplay silhouette을 가리거나 hit 영역을 바꾸지 않는다.
- high tier 전용 shader는 low/medium 재료를 반드시 가진다.

## 6. Particle

- emitter는 event를 입력으로 받고 Simulation Entity를 생성하지 않는다.
- particle lifetime, 최대 활성 수와 burst 수를 중앙 budget에서 제한한다.
- 화면 밖 또는 alpha 0 particle을 계속 갱신하지 않는다.
- object pool을 사용하고 hot path 할당을 측정한다.
- particle 순서가 흡수 판정이나 score에 영향을 주지 않는다.

## 7. 입력

- pointer/touch/mouse를 하나의 adapter에서 정규화한다.
- multi-touch의 첫 MVP는 active pointer 하나만 소유한다.
- `pointercancel`, blur, visibility change에서 입력을 해제한다.
- UI button이 소비한 pointer를 World movement로 전달하지 않는다.
- drag distance보다 command 의미를 우선하고 platform별 gesture 차이를 숨긴다.

## 8. Resize와 Orientation

- resize observer 또는 renderer resize 경계는 한 곳만 둔다.
- 0×0, 극단 aspect ratio와 DPR 변경을 처리한다.
- resize 도중 Simulation을 pause하고 world mapping을 원자적으로 교체한다.
- composer render target과 camera projection을 새 viewport에 맞게 재생성한다.
- orientation lock은 제품 정책으로 결정하며 코드가 무단으로 강제하지 않는다.

## 9. WebGL context

- context loss에서 Simulation을 pause한다.
- context restore 뒤 AssetRegistry와 render resource를 재구축한다.
- 복구 전 tick을 진행하지 않는다.
- 반복 복구 실패는 `APP_BLOCKED` fallback 화면으로 이동한다.

## 10. Text와 HUD

- 매 frame 바뀌는 숫자에 고비용 HTMLText를 사용하지 않는다.
- BitmapText/공유 TextStyle과 고정 폭 숫자를 우선한다.
- score tween은 표현 값이고 authoritative score를 변경하지 않는다.
- HUD 갱신 빈도는 Simulation/renderer와 분리한다.

## 11. 성능 Tier

| 항목 | low | medium | high |
|---|---:|---:|---:|
| DPR 상한 | 1.25 | 1.5 | 2 |
| bloom pass | 0~1 | 1 | 2 |
| ambient particle | 낮음 | 중간 | 높음 |
| cell internal particle | 최소 | 표준 | 표준+detail |
| shockwave/chromatic | 없음 | 제한 | 제한 |

자동 tier 변경은 frame time의 충분한 이동 평균으로 판단하고 한 Run 안에서 반복 진동하지 않게 hysteresis를 둔다.

## 12. 금지 패턴

- `Math.random()`을 Simulation에서 직접 호출
- animation loop 안의 고빈도 DOM state 갱신
- CSS 좌표를 collision에 사용
- DisplayObject bounds를 권위 hitbox로 사용
- 색 또는 image 존재 여부로 threat/prey 판정
- 렌더 순회 중 Simulation collection 직접 삭제
- listener/animation loop/material/geometry/texture destroy 누락
- 외부 URL font, image, audio 또는 shader
