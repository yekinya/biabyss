# BIABYSS 시각 방향

## 1. 핵심 문장

“밝은 현미경 배지 속 반투명 생명체가 어두운 막과 미세 과립을 품고 한 발씩 수축하며 나아간다.”

실제 bright-field/phase-contrast 현미경의 회백 배지, 이중 윤곽, 반투명 세포질, 작은 검은 과립과 투명 액포를
우선한다. 우주 모티브는 사진이나 발광 팔레트가 아니라 과립이 응집·확산하는 추상적 리듬에만 남긴다. 사용자가
제공한 참고 이미지는 형태·광학·색 분석에만 사용하고 runtime bitmap이나 texture로 복제하지 않는다.

## 2. 색 체계

| 역할 | 기준 색 | 보조 신호 |
|---|---|---|
| Stage 1 배지 | 회백 `#B8BDBB` | 옅은 청회 광학 얼룩 |
| Stage 2 배지 | 청록회 `#789CA0` | 황록·황토 응집물 |
| Stage 3 배지 | 회녹 `#9AA092` | 올리브·갈색 detritus |
| Player | 반투명 회백·연녹 | 진한 이중 rim, 일정한 쌍축 |
| 작은 Prey | 옅은 녹회 | 안쪽 수축 pulse |
| 큰 Threat | 짙은 갈회·자회 | 굵은 이중 rim, 느린 변형 |
| Nutrient | 회녹·황록 미립자 | 약한 크기 호흡 |

색각 차이를 위해 위협은 색 외에도 굵은 rim, 느린 변형, 크기 대비로 표현한다.

## 3. Cell 렌더 레이어

뒤에서 앞으로:

1. phase halo: 막 바깥의 매우 얇은 밝고 어두운 광학 이중선
2. membrane shadow: 짙은 회색·갈색 외곽
3. cytoplasm: 배지보다 약간 밝거나 어두운 반투명 회백 면
4. vacuole: 투명한 중심과 어두운 가는 테두리의 불규칙 원
5. movement axes: 진행축 위의 두 짙은 내부 중심
6. granule: 크기와 농도가 다른 검은색·올리브 미세 점
7. cilia grain: 실루엣 가장자리의 매우 짧은 자글거림
8. gameplay cue: 색보다 rim 두께·수축 방향·크기 차이

Cell은 공유 PlaneGeometry와 종류별 공유 ShaderMaterial을 사용한다. 개별 blur filter를 붙이지 않고 화면 전체
`EffectComposer`는 얇은 현미경 halo가 뭉개지지 않는 최소 강도로만 사용한다.

형태는 원형 cocci, 타원형 yeast-like, 간균 bacillus, 쌍구균 diplococcus, 휘어진 vibrio, 불규칙 amoeboid의
6종 SDF를 기준으로 한다. 실제 종을 재현한다고 주장하지 않고 현미경 관찰 질감에서 형태 언어만 가져온다.

## 4. 유기적 움직임

- 경계 wobble: 저주파 noise 2~3 octave, 진폭은 반경의 2~4%
- 이동 변형: velocity 방향으로 늘어나고 수직 방향으로 압축
- 보행형 추진: Simulation `gaitPhase`의 reach에서 앞 이동축과 앞막이 먼저 뻗고, drive에서 몸체가 급가속한
  뒤 catch에서 뒤 이동축·세포질·과립이 끌려와 합쳐진다. rest에서는 실제 속도와 형태가 함께 멈춘다.
  화면 변형은 충돌 반경을 바꾸지 않는다.
- 내부 관성: Cell 회전과 독립적으로 늦게 따라오는 offset
- 쌍이동축: 별도 시간 애니메이션이 아니라 `gaitPhase`로 벌어지고 가까워지며 실제 추진 펄스와 일치
- heartbeat: gameplay 판정과 무관한 작은 scale 변화
- 흡수: 대상 방향으로 막이 당겨졌다가 질량 증가와 함께 복원
- 사망: 즉시 사라지지 않고 외곽 붕괴 → 빛 소실 → 입자 분산 순서, 전체 600ms 이하
- 이동 trail: 진행 반대쪽에서 점액성 point가 방출되고 수명 동안 크기와 alpha가 함께 감소

내부 과립은 발광하지 않는다. reach에서 앞축 주변으로 느리게 당겨지고, drive에 몸체와 함께 이동하며,
catch에서 뒤쪽 과립이 지연되어 회수된다. 액포는 세포질 안에서 미세하게 흔들리지만 gait와 무관한 빠른 공전·
반짝임은 사용하지 않는다. bloom은 광학 halo가 번지지 않을 정도로 최소화한다.

## 5. 조이패드

- 조이패드는 pointer가 눌린 지점을 중심으로 Canvas 안에 표시한다.
- 바깥 원, 강도 호와 중앙 knob로 방향과 `0..1` 강도를 함께 보여준다.
- 최대 반지름은 CSS 좌표 기준으로 일정하며 DPR을 중복 적용하지 않는다.
- 해제 즉시 사라지고 pointer 소유권이 없는 hover만으로는 표시하지 않는다.
- 감소 모션에서는 pulse와 잔상 없이 위치·강도만 정적으로 표시한다.

## 6. 배경

- Stage 1 `bright-field`: 밝은 회백 배지, 옅은 청회 얼룩, 낮은 밀도의 투명 기포.
- Stage 2 `algae-bloom`: 청록회 배지, 황록·황토 응집물, 중간 밀도의 부유 과립.
- Stage 3 `detritus-deep`: 회녹 배지, 올리브·갈색 detritus, 짙은 작은 입자와 불규칙 덩어리.
- 배경은 bitmap을 반복하지 않고 4 octave 이하 noise와 domain warp를 하나의 field shader에서 계산한다.
- Stage는 Player Mass 성장률에서 연속 보간하는 Presentation 값이며 gameplay 판정에는 사용하지 않는다.

## 7. 후처리 예산

| Tier | 허용 |
|---|---|
| low | membrane shader, 얇은 광학 halo, vignette |
| medium | 최소 강도 bloom, 약한 displacement, 흡수 ring |
| high | 최소 강도 bloom, domain warp, 제한적 색수차와 shockwave |

색수차, noise, blur는 텍스트와 gameplay silhouette을 흐리지 않게 약하게 사용한다. `prefers-reduced-motion` 또는
기기 설정에서 shockwave, 큰 scale pulse와 화면 흔들림을 제거한다.

## 8. HUD

Title과 10Hz 이하 저주파 HUD는 DOM projection을 허용한다. 숫자는 고정 폭 font와 너비를 사용해 layout을
흔들지 않는다. 세포, particle, trail, world marker처럼 gameplay 공간에 속한 시각과 상호작용은 DOM에
중복 구현하지 않는다.

Title overlay는 배경 배양액을 가리는 검은 광채 대신 옅은 회백 표본판과 회녹 잉크를 사용한다. 시작 문구는
bright-field 관찰과 한 발씩 수축하는 조작을 설명하고, 포식자 cue를 발광 색이 아니라 크기와 진한 윤곽으로
안내한다.
