# SPEC-BIABYSS-20260820-three-microscope-world

## 배경과 목표

현재 PixiJS prototype은 화면 크기와 World가 같고 단순 원·blur 조합이라 현미경으로 관찰하는 생명체의
질감, 넓은 탐색 공간과 꿈틀거리는 이동을 전달하지 못한다. 렌더링 기준선을 Three.js WebGL로 교체해
반투명 세포막, 내부 소기관, 블룸, 미세 입자와 액체성 이동 흔적을 하나의 Canvas에서 합성한다.

## 범위

- Three.js `WebGLRenderer`, 직교 카메라와 `EffectComposer` 기반 단일 Canvas
- `UnrealBloomPass`와 GLSL 세포 SDF/노이즈 셰이더
- `THREE.Points + BufferGeometry` 기반 배경·내부·trail particle
- viewport와 분리된 viewport 면적 36배의 유한 Field
- 격자 층화 배치로 고르게 분포한 다수 NPC와 Nutrient
- 구형·타원형·간균형·쌍구균형 등 서로 다른 세포 silhouette
- 진행 방향의 횡가속이 주기적으로 변하는 꿈틀거림과 감쇠 trail
- 현미경 배경 bitmap을 앱 bundle에 포함
- Pure JavaScript ES module과 단일 HTML production bundle

## 범위 밖

- Navier-Stokes 전체 유체 해석
- Marching Cubes 3D volume과 자유 회전 3D camera
- 온라인 멀티플레이, 서버와 원격 asset
- native iOS/Android project 생성

## 현재/목표 동작

### 현재

- 화면 크기가 곧 World 경계다.
- NPC 10개와 Nutrient 55개가 단순 난수로 배치된다.
- 원형 Graphics와 개별 blur filter로 세포를 표현한다.
- 속도 방향으로 미끄러지는 운동만 있고 액체 trail이 없다.

### 목표

- Field는 Run 시작 viewport의 가로·세로 각각 6배, 면적 36배다.
- 카메라는 Player를 추적하고 Field 경계에서 clamp된다.
- NPC 54개와 Nutrient 320개를 층화 grid jitter로 분포시킨다.
- 세포는 공유 geometry와 GLSL material을 사용하고 종류별 SDF parameter로 형태가 달라진다.
- Simulation의 lateral wriggle과 Presentation의 membrane wobble을 분리한다.
- trail은 최대 640개 point pool에서 수명에 따라 크기와 alpha가 감소한다.

## 도메인·RuleSet·화면·자산·플랫폼 영향

- 도메인: `Viewport`와 `Field`를 구분하고 World가 camera보다 큼을 명시한다.
- RuleSet: field span, NPC/Nutrient 수, wriggle 수치와 camera follow 기준을 중앙화한다.
- 화면: Title과 HUD는 접근 가능한 DOM projection을 유지하고 gameplay object는 Canvas에만 둔다.
- 자산: 현미경 배경 bitmap과 세포·배경·particle shader를 manifest에 등록한다.
- 플랫폼: Three.js는 npm dependency로 번들해 앱의 오프라인 조건을 유지한다. runtime CDN은 사용하지 않는다.
- build: `vite-plugin-singlefile`로 CSS, JavaScript와 로컬 bitmap을 단일 HTML 산출물에 inline한다.

## 구현 작업

1. React, PixiJS와 Zustand prototype dependency를 Three.js와 단일 HTML plugin으로 교체한다.
2. 순수 JavaScript Simulation, 입력 adapter와 저주파 HUD projection을 분리한다.
3. 직교 camera, Field 배경, ambient particle, nutrient, cell과 trail renderer를 구현한다.
4. custom cell fragment shader에 SDF, domain-warp noise, membrane rim, cytoplasm, nucleoid와 granule을 합성한다.
5. fixed timestep으로 player/NPC 이동·흡수·respawn·game over를 처리한다.
6. WebGL context loss, visibility pause, resize와 감소 모션을 처리한다.
7. gameplay 흐름과 pure rule helper를 테스트한다.

## 위험과 rollback

- bloom과 full-screen shader의 fill-rate가 높은 기기에서 frame pacing을 낮출 수 있다. DPR을 1.5로 제한하고
  감소 모션/저성능 설정에서는 bloom strength와 particle budget을 줄인다.
- shader compile 실패 시 단순 원형 `MeshBasicMaterial` fallback을 사용한다.
- 단일 HTML에 bitmap을 inline하면 bundle 크기가 증가하므로 texture는 2048px 이하 PNG로 제한한다.
- rollback은 직전 PixiJS prototype commit으로 되돌리고 이 SPEC의 renderer 문서를 복구하는 것이다.

## 요구사항별 수용 기준

- [x] 렌더러가 Three.js `WebGLRenderer`와 하나의 Canvas를 사용한다.
- [x] `EffectComposer`와 `UnrealBloomPass`가 활성화된다.
- [x] 세포의 막, 세포질, 뉴클레오이드와 과립이 한 shader에서 움직인다.
- [x] 적어도 5종의 silhouette와 크기·색·내부 phase 차이가 보인다.
- [x] Field 면적이 viewport의 36배이고 camera가 Player를 추적한다.
- [x] NPC가 Field 전체에 고르게 분포하고 안전 spawn을 지킨다.
- [x] 이동 방향에 수직인 wriggle이 있고 trail이 생성 후 작아지며 사라진다.
- [x] runtime 외부 네트워크 요청 없이 production bundle이 실행된다.
- [x] production `dist/index.html` 하나에 실행 코드와 필수 bitmap이 포함된다.
- [x] 시작, 이동, 흡수, game over와 재시작이 유지된다.

## 필수 검사와 기기 matrix

- Node 22.22.1 / npm 10.9.4
- typecheck(checkJs), ESLint, Vitest, production build
- Chromium 1440×900, mobile 390×844
- Canvas 1개, WebGL renderer, bloom pass와 Field/camera 진단 확인
- pointer 이동, 흡수, game over, 재시작 smoke
- console error/warning과 runtime 외부 request 0
- native project가 아직 없으므로 iOS/Android app smoke는 후속 packaging SPEC으로 남긴다.
