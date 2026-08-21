# SPEC-BIABYSS-20260821-cell-render-microscope-contrast

## 배경과 목표

현재 실행 화면은 배지와 Nutrient 점만 보이고 Player와 NPC Cell 전체가 그려지지 않는다. 직전 변경에서
Cell Shader의 개별 instanced attribute가 10개까지 늘어났고, `instanceMatrix`와 기본 vertex attribute를 합치면
일반적인 WebGL `MAX_VERTEX_ATTRIBS` 경계에 도달한다. 기기·driver가 shader program을 link하지 못하면 하나의
InstancedMesh에 묶인 모든 Cell이 함께 사라질 수 있다.

동시에 Stage 1 배지는 거의 균일한 회백색이라 참고한 bright-field 현미경의 청회색 배양액, 황록·갈색 유기물
군집, 흐릿한 미세 잔해와 이중 세포막의 광학 대비가 드러나지 않는다. Cell instance 입력을 세 개의 `vec4`로
압축해 WebGL 최소 정점 속성 예산 안으로 되돌리고, shader compile/link 실패 시 단순 이중막 타원으로 전환하는
fallback을 추가한다. 배경과 Cell shader는 bitmap 없이 현미경 표본의 색층·과립·액포·막 대비를 강화한다.

## 범위

- Cell instance 입력 10개를 `vec4` 세 개로 packing
- UV 입력을 plane position에서 계산해 primary Cell shader 활성 vertex attribute를 8개 이하로 제한
- Cell shader compile/link 오류와 낮은 기기 attribute 예산에서 단순 현미경 타원 fallback 적용
- Stage 1부터 청회색 배양액, 황록·황토 colony, 갈색 detritus, 흐릿한 bubble/debris 층 표현
- Cell의 어두운 외막·내막, 반투명 세포질, 액포와 미세 과립 대비 강화
- attribute 예산, fallback 전환, 8종 형태와 procedural 배경의 정적·단위 검사

## 범위 밖

- Cell 수, Nutrient 수, 이동·Aggro·충돌·흡수 수치 변경
- runtime microscope bitmap 또는 외부 texture 추가
- DOM gameplay object와 별도 Canvas 추가
- 브라우저 자동화·smoke·screenshot 검사
- native project가 없는 상태의 iOS·Android app smoke

## 현재/목표 동작

### 현재

- Cell shader가 10개 custom instance attribute를 각각 사용한다.
- shader program link 실패를 Cell material 단위로 복구하지 못한다.
- Stage 1은 밝고 균일한 회백 면과 작은 점 위주라 현미경 표본의 유기물 군집과 광학 깊이가 약하다.
- Cell이 그려져도 배지와 세포질 명도가 가까워 외곽과 내부 조직 판독성이 낮다.

### 목표

- Cell shader는 세 개의 packed `vec4`로 같은 simulation 상태를 전달하고 활성 정점 속성을 WebGL 최소 보장
  수치인 8개 안에 둔다.
- primary shader가 실패해도 모든 Cell은 어두운 이중막과 반투명 세포질을 가진 단순 타원으로 계속 보인다.
- Stage 1부터 청회색 bath와 큰 황록·황토 colony, 어두운 micro-debris가 겹쳐 빈 회색 화면처럼 보이지 않는다.
- 8종 실루엣은 유지하고 외막·내막·과립·액포가 배경 stage마다 충분한 명도 대비를 갖는다.

## 문서·자산·플랫폼 영향

- domain/runtime/rules: gameplay 상태·공식·수치 변경이 없다.
- visual direction: Stage 1의 최소 배경 층과 Cell 이중막 대비 계약을 구체화한다.
- asset manifest: 실패한 v4를 `REJECTED`로 표시하고 packed/fallback 기반 v5를 등록한다.
- frontend/canvas: InstancedMesh attribute 예산과 shader 오류 fallback 계약을 추가한다.
- 플랫폼: 외부 자산·network·native 권한을 추가하지 않는다.

## 구현 작업

1. visual direction, asset manifest, frontend와 이 SPEC에 회귀 원인·attribute 예산·색층 계약을 기록한다.
2. Cell instance 상태를 세 개의 `vec4` attribute로 packing하고 vertex shader에서 unpack한다.
3. UV를 position에서 유도하고 primary/fallback shader의 활성 attribute 예산을 검사한다.
4. shader 오류 callback과 낮은 `MAX_VERTEX_ATTRIBS`에서 Cell fallback material로 전환한다.
5. field shader에 bath·colony·detritus·bubble/debris의 다중 scale 현미경 층을 추가한다.
6. cell shader의 이중막·과립·액포와 stage별 세포질 색 대비를 강화한다.
7. 정적·단위 검사와 Q1 production build를 수행한다.

## 위험과 rollback

- packed channel 순서가 어긋나면 gait·형태·흡수 표현이 잘못된다. packing 표를 코드 주석과 shader 검사에 함께
  고정하고 모든 buffer 값을 finite 검사한다.
- field contrast를 과도하게 높이면 Cell 판독성이 떨어진다. 큰 colony는 저주파·부분 면적에만 두고 Cell rim을
  모든 stage보다 어둡게 유지한다.
- shader 오류 callback이 다른 material 오류에 반응하지 않도록 vertex source의 Cell 전용 packed attribute를
  확인한 뒤 fallback한다.
- rollback은 v4 개별 attribute와 기존 field palette로 되돌리되, Cell 비표시 회귀가 재발하므로 fallback 없이
  출시하지 않는다.

## 요구사항별 수용 기준

- [x] Cell custom instanced attribute가 세 개의 `vec4`이고 이전 10개 개별 attribute는 geometry에 없다.
- [x] primary Cell shader의 활성 vertex attribute 예산이 8개 이하이고 WebGL 최소 보장치 안에 있다.
- [x] packed channel이 morph, gait, absorption, feeding과 color를 손실 없이 전달한다.
- [x] 낮은 attribute 예산 또는 Cell shader compile/link 실패 시 단순 이중막 fallback으로 전환한다.
- [x] Player 포함 1621 Cell matrix와 packed buffer의 모든 값이 finite다.
- [x] 8종 procedural SDF, gait 쌍축, 연속 absorption/feeding 표현이 유지된다.
- [x] Stage 1부터 청회 bath, 황록·황토 colony, 갈색 detritus와 어두운 micro-debris 층이 존재한다.
- [x] Cell은 어두운 외막·내막, 반투명 세포질, 액포와 과립을 procedural shader로 표현한다.
- [x] field/cell shader는 bitmap sampler와 runtime 외부 texture를 사용하지 않는다.
- [x] Q1 검사를 모두 통과한다.

## 필수 검사와 기기 matrix

- Node 22.22.1 / npm 10.9.4
- `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`
- packed attribute 개수·itemSize·capacity·finite 값 검사
- primary/fallback attribute 예산과 fallback 전환 단위 검사
- 8종 SDF, 이중막·과립·액포, procedural field 색층 정적 검사
- 브라우저 검사는 저장소 규칙에 따라 제외
- native project가 아직 없으므로 iOS/Android app smoke는 packaging SPEC 공백으로 유지한다.
