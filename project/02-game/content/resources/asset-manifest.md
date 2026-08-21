# BIABYSS 자산 Manifest

구현 항목은 실제 위치와 SPEC을 연결한다. checksum과 크기는 기술 검증 뒤 기록한다.

| assetId | kind | 예정 위치 | 상태 | fallback | 연결 SPEC |
|---|---|---|---|---|---|
| `shader.world.fog.v1` | shader | `biabyss-apps/apps/mobile/src/game/rendering/shaders/fieldShader.js` | REJECTED | 단색 radial gradient | SPEC-BIABYSS-20260820-three-microscope-world |
| `shader.world.cosmic-fluid.v2` | shader | `biabyss-apps/apps/mobile/src/game/rendering/shaders/fieldShader.js` | REJECTED | 저채도 2-layer noise | SPEC-BIABYSS-20260820-soft-cell-locomotion |
| `shader.world.microscope-stages.v3` | shader | `biabyss-apps/apps/mobile/src/game/rendering/shaders/fieldShader.js` | DRAFT | 회백 단색 배지 | SPEC-BIABYSS-20260821-microscope-gait-stages |
| `shader.cell.membrane.v1` | shader | `biabyss-apps/apps/mobile/src/game/rendering/shaders/cellShader.js` | TECH_QA | `MeshBasicMaterial` 원형 | SPEC-BIABYSS-20260820-three-microscope-world |
| `shader.cell.cytoplasm.v1` | shader | `biabyss-apps/apps/mobile/src/game/rendering/shaders/cellShader.js` | TECH_QA | 반투명 gradient | SPEC-BIABYSS-20260820-three-microscope-world |
| `shader.cell.soft-locomotion.v1` | shader | `biabyss-apps/apps/mobile/src/game/rendering/shaders/cellShader.js` | REJECTED | 속도 기반 단순 타원 scale | SPEC-BIABYSS-20260820-soft-cell-locomotion |
| `shader.cell.microscope-organelles.v2` | shader | `biabyss-apps/apps/mobile/src/game/rendering/shaders/cellShader.js` | DRAFT | 회백 타원 + 이중 rim | SPEC-BIABYSS-20260821-microscope-gait-stages |
| `shader.cell.ecology-archetypes.v3` | shader | `biabyss-apps/apps/mobile/src/game/rendering/shaders/cellShader.js` | DRAFT | 종별 단순 SDF | SPEC-BIABYSS-20260821-npc-ecology-absorption |
| `shader.cell.ecology-archetypes.v4` | shader | `biabyss-apps/apps/mobile/src/game/rendering/shaders/cellShader.js` | REJECTED | 8종 단순 SDF + overscan | SPEC-BIABYSS-20260821-predator-ecosystem-density |
| `shader.cell.microscope-contrast.v5` | shader | `biabyss-apps/apps/mobile/src/game/rendering/shaders/cellShader.js` | TECH_QA | packed attribute 이중막 타원 | SPEC-BIABYSS-20260821-cell-render-microscope-contrast |
| `shader.world.microscope-culture.v4` | shader | `biabyss-apps/apps/mobile/src/game/rendering/shaders/fieldShader.js` | TECH_QA | 청회 단색 배지 | SPEC-BIABYSS-20260821-cell-render-microscope-contrast |
| `material.cell.instanced-swarm.v1` | material | `biabyss-apps/apps/mobile/src/game/rendering/CellRenderer.js` | REJECTED | 종별 공유 Mesh | SPEC-BIABYSS-20260821-npc-ecology-absorption |
| `material.cell.packed-swarm.v2` | material | `biabyss-apps/apps/mobile/src/game/rendering/CellRenderer.js` | TECH_QA | 정적 이중막 타원 | SPEC-BIABYSS-20260821-cell-render-microscope-contrast |
| `shader.particle.nutrient-swarm.v2` | shader | `biabyss-apps/apps/mobile/src/game/rendering/shaders/particleShader.js` | DRAFT | 단색 Point | SPEC-BIABYSS-20260821-npc-ecology-absorption |
| `material.ui.joystick.v1` | procedural material | `biabyss-apps/apps/mobile/src/game/rendering/JoystickRenderer.js` | DRAFT | 입력은 유지하고 표시만 생략 | SPEC-BIABYSS-20260820-soft-cell-locomotion |
| `shader.particle.fluid.v1` | shader | `biabyss-apps/apps/mobile/src/game/rendering/shaders/particleShader.js` | TECH_QA | 원형 `PointsMaterial` | SPEC-BIABYSS-20260820-three-microscope-world |
| `shader.post.bloom.v1` | post-process | Three.js `UnrealBloomPass` | TECH_QA | emissive aura 없음 | SPEC-BIABYSS-20260820-three-microscope-world |
| `material.cell.player.v1` | material | `biabyss-apps/apps/mobile/src/game/rendering/CellRenderer.js` | REJECTED | cyan 기본 material | SPEC-BIABYSS-20260820-three-microscope-world |
| `material.cell.prey.v1` | material | `biabyss-apps/apps/mobile/src/game/rendering/CellRenderer.js` | REJECTED | green 기본 material | SPEC-BIABYSS-20260820-three-microscope-world |
| `material.cell.threat.v1` | material | `biabyss-apps/apps/mobile/src/game/rendering/CellRenderer.js` | REJECTED | magenta 기본 material | SPEC-BIABYSS-20260820-three-microscope-world |
| `material.cell.microscope-staged.v2` | material | `biabyss-apps/apps/mobile/src/game/rendering/CellRenderer.js` | DRAFT | 회백 cell + 진한 rim | SPEC-BIABYSS-20260821-microscope-gait-stages |
| `image.field.microscope.v1` | image | `biabyss-apps/apps/mobile/src/assets/images/microscope-field-v1.png` | REJECTED | procedural shader 배경 | SPEC-BIABYSS-20260820-three-microscope-world |
| `font.ui.mono.v1` | font | `biabyss-apps/apps/mobile/public/assets/fonts/` | PLANNED | system monospace | ui-baseline |
| `audio.ambience.deep.v1` | audio | `biabyss-apps/apps/mobile/public/assets/audio/` | PLANNED | silence | audio-baseline |
| `audio.nutrient.absorb.v1` | audio | `biabyss-apps/apps/mobile/public/assets/audio/` | PLANNED | silence | audio-baseline |
| `audio.player.consumed.v1` | audio | `biabyss-apps/apps/mobile/public/assets/audio/` | PLANNED | silence | audio-baseline |
| `image.app.icon.v1` | image | `biabyss-apps/apps/mobile/public/assets/images/` + native assets | PLANNED | 없음 | app-packaging |
| `image.app.splash.v1` | image | `biabyss-apps/apps/mobile/public/assets/images/` + native assets | PLANNED | solid brand color | app-packaging |

각 항목을 구현할 때 checksum, 형식, 크기, source/license, 승인자와 실제 SPEC-ID를 추가한다.

`shader.cell.ecology-archetypes.v4`와 `material.cell.instanced-swarm.v1`은 개별 instance attribute 증가로 일반적인
WebGL 정점 속성 한계에 도달해 Cell batch 전체가 보이지 않는 회귀가 확인되어 거부했다. v5/v2는 세 개의
`vec4` packing과 compile/link fallback으로 교체한다.

## `image.field.microscope.v1` 생성 기록

- source: OpenAI built-in image generation
- 형식/크기: PNG RGB, 1254×1254, 약 1.7 MB
- SHA-256: `01d0cd7b84c4889bedfd23bacc616357976ad3d8c4f6e95746f46319a73de7eb`
- prompt: dark-field microscopy의 어두운 수중 배지, 점액 섬유, 미세 부유물과 cyan/violet 광학 흔적. 큰 세포,
  생명체, 텍스트, 워터마크, 우주 이미지는 제외하고 camera 이동용 균일 밀도 texture로 생성.
- 권리/상태: 프로젝트 전용 생성 자산, checksum·single-file inline·브라우저 표시 검증으로 `TECH_QA`
- 교체: `SPEC-BIABYSS-20260820-soft-cell-locomotion`에서 고정 반복 무늬 제거 요구에 따라 runtime 사용을
  중단했다. 파일은 과거 생성 기록 보존을 위해 저장소에 남지만 production bundle에는 포함하지 않는다.
