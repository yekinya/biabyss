# BIABYSS 시각 방향

## 1. 핵심 문장

“차갑고 어두운 미시 심연 속에서 반투명 생명체가 내부 빛을 품고 천천히 꿈틀거린다.”

우주 배경처럼 보일 수 있지만 별과 은하를 직접 묘사하지 않는다. 부유 입자, 점액성 안개, 막과 내부 물질로
미생물 세계라는 정체성을 유지한다.

## 2. 색 체계

| 역할 | 기준 색 | 보조 신호 |
|---|---|---|
| 배경 | `#030710` | 청록·자주 저채도 안개 |
| Player | cyan `#71F7FF` | 흰색 rim, 안정된 heartbeat |
| 작은 Prey | 녹색·청색 | 안쪽으로 수축하는 pulse |
| 큰 Threat | magenta·적자주 | 바깥으로 팽창하는 pulse, 낮은 주파수 |
| Nutrient | cyan/violet 점광 | 느린 호흡 |
| 위험 순간 | warm amber | 짧은 vignette와 방향 cue |

색각 차이를 위해 위협은 색 외에도 굵은 rim, 느린 변형, 크기 대비로 표현한다.

## 3. Cell 렌더 레이어

뒤에서 앞으로:

1. 외부 aura: 저해상도 blur 또는 bloom mask
2. membrane shadow: 반투명 어두운 외곽
3. membrane rim: 얇은 Fresnel 유사 하이라이트
4. cytoplasm: domain-warped noise와 완만한 gradient
5. nucleoid strand: 느리게 변형되는 선 또는 ribbon
6. ribosome/granule: 적은 수의 내부 particle
7. specular arc: 화면 광원 방향을 공유하는 짧은 highlight
8. gameplay cue: 보호, 위험, 흡수 event ring

각 Cell에 고비용 blur filter를 독립 적용하는 방식은 prototype까지만 허용한다. 개체 수가 늘면 공유 RenderTexture,
batched shader 또는 screen-space bloom으로 전환한다.

## 4. 유기적 움직임

- 경계 wobble: 저주파 noise 2~3 octave, 진폭은 반경의 2~4%
- 이동 변형: velocity 방향으로 늘어나고 수직 방향으로 압축
- 내부 관성: Cell 회전과 독립적으로 늦게 따라오는 offset
- heartbeat: gameplay 판정과 무관한 작은 scale 변화
- 흡수: 대상 방향으로 막이 당겨졌다가 질량 증가와 함께 복원
- 사망: 즉시 사라지지 않고 외곽 붕괴 → 빛 소실 → 입자 분산 순서, 전체 600ms 이하

## 5. 배경

- 단색 clear 위에 저채도 radial field를 사용한다.
- 작은 먼지 particle은 parallax가 느껴질 정도로만 움직인다.
- 큰 안개는 full-screen shader 한 장으로 처리한다.
- 별자리, 행성, 우주선처럼 우주를 직접 암시하는 자산은 사용하지 않는다.

## 6. 후처리 예산

| Tier | 허용 |
|---|---|
| low | membrane shader, 단순 aura, vignette |
| medium | 절반 해상도 bloom, 약한 displacement, 흡수 ring |
| high | 다단 bloom, domain warp, 제한적 색수차와 shockwave |

색수차, noise, blur는 텍스트와 gameplay silhouette을 흐리지 않게 약하게 사용한다. `prefers-reduced-motion` 또는
기기 설정에서 shockwave, 큰 scale pulse와 화면 흔들림을 제거한다.

## 7. HUD

최종 gameplay HUD도 Canvas scene에 두는 것이 원칙이다. 텍스트는 BitmapFont 또는 번들된 폰트 atlas를
사용하고 숫자 변화가 layout을 흔들지 않게 고정 폭을 사용한다. 스크린 리더를 위한 최소 DOM live region은
허용하지만 시각 HUD와 상호작용을 DOM에 중복 구현하지 않는다.
