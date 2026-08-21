# BIABYSS 시각 방향

## 1. 핵심 문장

“차갑고 어두운 미시 우주 속에서 반투명 생명체가 작은 성운 같은 내부 빛을 품고 천천히 꿈틀거린다.”

우주를 모티브로 삼되 행성·우주선·별자리를 직접 묘사하지 않는다. cyan·violet·magenta 광운, 먼 별처럼
반짝이는 미세 포자와 점액성 안개를 겹쳐 `cosmic microbial deep`을 만든다. 어디까지나 세포와 유체가 있는
미생물 세계이며, 우주 사진을 배경으로 붙이지 않는다.

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

1. 외부 aura: `UnrealBloomPass`가 공유하는 emissive mask
2. membrane shadow: 반투명 어두운 외곽
3. membrane rim: 얇은 Fresnel 유사 하이라이트
4. cytoplasm: domain-warped noise와 완만한 gradient
5. nucleoid strand: 느리게 변형되는 선 또는 ribbon
6. ribosome/granule: 적은 수의 내부 particle
7. specular arc: 화면 광원 방향을 공유하는 짧은 highlight
8. gameplay cue: 보호, 위험, 흡수 event ring

Cell은 공유 PlaneGeometry와 종류별 공유 ShaderMaterial을 사용한다. 개별 blur filter를 붙이지 않고 화면 전체
`EffectComposer` bloom으로 발광을 합성한다.

형태는 원형 cocci, 타원형 yeast-like, 간균 bacillus, 쌍구균 diplococcus, 휘어진 vibrio, 불규칙 amoeboid의
6종 SDF를 기준으로 한다. 실제 종을 재현한다고 주장하지 않고 현미경 관찰 질감에서 형태 언어만 가져온다.

## 4. 유기적 움직임

- 경계 wobble: 저주파 noise 2~3 octave, 진폭은 반경의 2~4%
- 이동 변형: velocity 방향으로 늘어나고 수직 방향으로 압축
- 보행형 추진: 사인 주기의 전반에는 진행 방향 앞막이 길게 뻗고, 후반에는 뒤막과 내부 물질이 지연되어
  따라붙는다. 화면 변형은 충돌 반경을 바꾸지 않는다.
- 내부 관성: Cell 회전과 독립적으로 늦게 따라오는 offset
- 쌍광핵: 속도가 낮을 때 중심 가까이 모이고, 이동할 때 진행축으로 벌어지며 서로 다른 위상으로 호흡
- heartbeat: gameplay 판정과 무관한 작은 scale 변화
- 흡수: 대상 방향으로 막이 당겨졌다가 질량 증가와 함께 복원
- 사망: 즉시 사라지지 않고 외곽 붕괴 → 빛 소실 → 입자 분산 순서, 전체 600ms 이하
- 이동 trail: 진행 반대쪽에서 점액성 point가 방출되고 수명 동안 크기와 alpha가 함께 감소

내부 광점은 나선형 흐름을 따라 바깥으로 퍼졌다가 중심으로 모이고, 서로 다른 위상으로 짧게 반짝인다.
속도가 높을수록 흐름과 반짝임이 빨라진다. 은하를 연상시키는 응집·확산 리듬은 허용하지만 실제 별·천체를
복제하지 않는다. 외부막은 실루엣을 읽을 수 있는 얇고 부드러운 rim만 남기고, bloom의 가장 밝은 지점은
외부 aura가 아니라 내부 광점과 쌍광핵에 둔다.

## 5. 조이패드

- 조이패드는 pointer가 눌린 지점을 중심으로 Canvas 안에 표시한다.
- 바깥 원, 강도 호와 중앙 knob로 방향과 `0..1` 강도를 함께 보여준다.
- 최대 반지름은 CSS 좌표 기준으로 일정하며 DPR을 중복 적용하지 않는다.
- 해제 즉시 사라지고 pointer 소유권이 없는 hover만으로는 표시하지 않는다.
- 감소 모션에서는 pulse와 잔상 없이 위치·강도만 정적으로 표시한다.

## 6. 배경

- 단색 clear 위에 저채도 cyan·violet·magenta noise field를 합성한다.
- 배경은 bitmap을 반복하지 않고, 4 octave 이하의 noise와 domain warp를 하나의 field shader에서 계산한다.
- 큰 광운, 가는 filament와 미세 포자는 서로 다른 시간 위상으로 움직여 고정 무늬처럼 보이지 않게 한다.
- 작은 ambient particle은 먼 별을 연상시키되 미세 포자라는 형태 언어를 유지하며 약한 parallax를 만든다.
- 별자리, 행성, 우주선과 실제 우주 사진은 사용하지 않는다.
- 감소 모션에서는 공간층의 이동량과 반짝임 진폭을 낮추되 완전히 정지된 이미지로 바꾸지 않는다.

## 7. 후처리 예산

| Tier | 허용 |
|---|---|
| low | membrane shader, 단순 aura, vignette |
| medium | 절반 해상도 bloom, 약한 displacement, 흡수 ring |
| high | 다단 bloom, domain warp, 제한적 색수차와 shockwave |

색수차, noise, blur는 텍스트와 gameplay silhouette을 흐리지 않게 약하게 사용한다. `prefers-reduced-motion` 또는
기기 설정에서 shockwave, 큰 scale pulse와 화면 흔들림을 제거한다.

## 8. HUD

Title과 10Hz 이하 저주파 HUD는 DOM projection을 허용한다. 숫자는 고정 폭 font와 너비를 사용해 layout을
흔들지 않는다. 세포, particle, trail, world marker처럼 gameplay 공간에 속한 시각과 상호작용은 DOM에
중복 구현하지 않는다.
