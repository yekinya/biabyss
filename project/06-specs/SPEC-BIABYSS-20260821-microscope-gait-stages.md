# SPEC-BIABYSS-20260821-microscope-gait-stages

## 배경과 목표

현재 이동은 매 tick의 연속 가속에 사인 횡가속을 더해 매끄러운 등속 미끄러짐처럼 보인다. Renderer도
Simulation과 별도로 `elapsed` 기반 보행 위상을 계산해 실제 이동과 앞막·뒤막·내부 광핵 변형이 어긋난다.
시각은 cyan·magenta 발광과 어두운 우주 배경이 중심이라 사용자가 제공한 bright-field 현미경 모티브의 회백색
배지, 어두운 이중 윤곽, 미세 과립, 액포와 회녹·황록 배양액 질감을 전달하지 못한다.

하나의 권위 `gaitPhase`가 실제 이동과 모든 세포 변형을 함께 구동하도록 이동을 재설계한다. 시각은 외부
참고 이미지를 runtime 자산으로 복제하지 않고 절차적 bright-field 현미경 표현으로 바꾸며, 성장에 따라
회백 → 청록·황록 → 회녹·올리브의 Optical Stage가 전환되게 한다.

## 범위

- Player와 NPC CellState가 소유하는 고정 tick `previousGaitPhase`, `gaitPhase`와 `gaitCycle`
- 앞축 뻗기 → 짧은 급가속 → 강한 감속 → 뒤축 회수·정지의 4구간 보행
- 같은 gait sample을 공유하는 Simulation 추진과 Renderer 막·쌍축·내부 과립 변형
- 밝은 배지, 이중 막 윤곽, 반투명 세포질, 검은 미세 과립, 투명 액포의 절차적 세포 shader
- Player 성장률에서 파생되는 표현 전용 Optical Stage 3종
- 스테이지별 배지·세포·영양체·부유물 팔레트와 약한 광학 잡음
- 첫 화면의 dark-field 문구·검은 광채를 회백 표본판과 회녹 잉크의 bright-field 관찰 안내로 교체
- 이동 burst/settle 구간, 위상 결정성과 stage 파생 값 단위 검사

## 범위 밖

- 참고 이미지 파일의 복사·번들 포함·texture sampling
- 실제 미생물 종 재현 또는 생물학적 분류 주장
- Optical Stage가 흡수·질량·NPC 판단에 미치는 gameplay 효과
- 물리 기반 soft body와 다관절 지렁이 simulation
- 브라우저 자동화·smoke·screenshot 검사

## 현재/목표 동작

### 현재

- 입력 중 작은 가속이 계속 누적되고 약한 drag만 적용되어 속도가 매끄럽게 이어진다.
- 실제 이동 stride와 shader의 stride가 서로 다른 clock에서 계산된다.
- 내부 두 광핵은 속도 비율로만 벌어져 보행 단계와 일치하지 않는다.
- 어두운 cyan·violet·magenta 배경과 강한 bloom이 현미경보다 우주 장면에 가깝다.

### 목표

- 주기 초반에는 앞 이동축만 뻗고 몸체는 거의 정지한다.
- drive 구간의 사인 펄스에서만 빠르게 전진하고, catch 구간에는 속도가 눈에 띄게 0에 가까워진다.
- 뒤 이동축과 내부 과립이 catch 구간에 앞쪽으로 회수된 뒤 다음 보행이 시작된다.
- Simulation과 Renderer가 같은 `gaitPhase`/sample을 사용해 위치와 형태가 항상 같은 단계에 있다.
- 시작은 회백 bright-field, 성장 중간은 청록 배지·황록 응집물, 후반은 회녹 배지·올리브 과립으로 변한다.

## 도메인·RuleSet·화면·자산·플랫폼 영향

- 도메인: 제품 경계와 Mass/Absorption 의미는 바뀌지 않는다.
- runtime model: CellState가 `gaitPhase`, `gaitCycle`을 소유한다. Optical Stage는 저장하지 않는 Presentation
  파생 값이다.
- RuleSet: gait 구간 경계, player/NPC 주기·burst acceleration·구간별 감속률을 중앙화한다.
- 화면: 단일 Three.js Canvas와 HUD 구조는 유지한다.
- 자산: staged microscope field/cell shader 계약을 manifest에 등록하고 기존 cosmic palette를 교체한다.
- 플랫폼: 외부 URL·이미지·폰트·네이티브 권한을 추가하지 않는다.

## 구현 작업

1. 순수 `sampleGait(phase)` helper와 구간 경계 RuleSet을 구현한다.
2. CellState에 gait state를 추가하고 fixed tick에서만 위상을 진행한다.
3. Player/NPC acceleration과 damping을 같은 gait sample로 계산한다.
4. CellRenderer와 InternalParticles가 위치와 같은 alpha로 gait를 보간해 읽도록 별도 elapsed stride를 제거한다.
5. field shader에 3단계 bright-field 배지 palette와 광학 grain·응집물·부유물을 구현한다.
6. cell shader를 어두운 이중 윤곽, 세포질 과립, 액포, 두 이동축 중심의 현미경 표현으로 교체한다.
7. bloom과 particle 색을 밝은 현미경 배지에 맞게 낮추고 stage progression을 diagnostics에 노출한다.
8. Title overlay의 검은 veil과 cyan 발광 문구를 밝은 현미경 표본판 스타일로 교체한다.
9. 단위·결정성·정적 검사와 production build를 수행한다.

## 위험과 rollback

- 강한 감속으로 조작 반응이 둔해질 수 있다. reach 구간을 짧게 유지하고 입력 강도가 frequency와 burst 모두에
  반영되게 한다.
- 위상 경계에서 속도가 튈 수 있다. 모든 easing은 연속 사인/smoothstep envelope를 사용하고 고정 tick fixture로
  구간별 peak/settle을 검증한다.
- 밝은 배경이 HUD와 gameplay cue 대비를 낮출 수 있다. Cell 관계는 색뿐 아니라 rim 두께·크기·motion으로
  유지하고 HUD는 어두운 반투명 배경을 유지한다.
- rollback은 gait state를 제거하고 직전 연속 가속 공식을 복원하며 microscope stage uniforms를 단일 palette로
  고정한다.

## 요구사항별 수용 기준

- [x] `gaitPhase`가 Simulation fixed tick에서만 진행되고 같은 seed/input에서 결정적이다.
- [x] reach 구간의 이동량은 drive 구간보다 작고 drive 구간에 뚜렷한 속도 peak가 있다.
- [x] catch/rest 구간 끝 속도는 같은 cycle peak의 15% 이하다.
- [x] 앞축·뒤축·막 stretch·내부 과립이 Simulation과 동일한 gait sample을 사용한다.
- [x] Player는 타원형/섬모형 실루엣, 이중 윤곽, 반투명 회백 세포질, 과립과 액포로 표현된다.
- [x] Optical Stage가 회백 bright-field → 청록·황록 bloom → 회녹·올리브 detritus 순으로 변한다.
- [x] Title이 밝은 배양액을 가리지 않고 bright-field 관찰과 보행형 조작을 안내한다.
- [x] 관계 cue는 stage 색과 무관하게 rim·크기·motion으로 구분된다.
- [x] runtime reference bitmap, texture sampler와 외부 요청이 없다.
- [x] 기존 흡수·pause·game-over와 입력 강도 결정성 검사가 유지된다.

## 필수 검사와 기기 matrix

- Node 22.22.1 / npm 10.9.4
- `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`
- gait reach/drive/catch/rest 구간별 속도와 이동량 단위 검사
- 30/60/120 render schedule과 무관한 fixed tick state 비교
- shader sampler 0, 정적 octave·uniform 계약 검사
- 브라우저 검사는 저장소 규칙에 따라 제외
- native project가 아직 없으므로 iOS/Android app smoke는 packaging SPEC 공백으로 유지한다.
