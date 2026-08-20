# BIABYSS 자산 Manifest

구현 항목은 실제 위치와 SPEC을 연결한다. checksum과 크기는 기술 검증 뒤 기록한다.

| assetId | kind | 예정 위치 | 상태 | fallback | 연결 SPEC |
|---|---|---|---|---|---|
| `shader.world.fog.v1` | shader | `biabyss-apps/apps/mobile/src/game/rendering/shaders/fieldShader.js` | TECH_QA | bitmap + 단색 radial gradient | SPEC-BIABYSS-20260820-three-microscope-world |
| `shader.cell.membrane.v1` | shader | `biabyss-apps/apps/mobile/src/game/rendering/shaders/cellShader.js` | TECH_QA | `MeshBasicMaterial` 원형 | SPEC-BIABYSS-20260820-three-microscope-world |
| `shader.cell.cytoplasm.v1` | shader | `biabyss-apps/apps/mobile/src/game/rendering/shaders/cellShader.js` | TECH_QA | 반투명 gradient | SPEC-BIABYSS-20260820-three-microscope-world |
| `shader.cell.soft-locomotion.v1` | shader | `biabyss-apps/apps/mobile/src/game/rendering/shaders/cellShader.js` | DRAFT | 속도 기반 단순 타원 scale | SPEC-BIABYSS-20260820-soft-cell-locomotion |
| `material.ui.joystick.v1` | procedural material | `biabyss-apps/apps/mobile/src/game/rendering/JoystickRenderer.js` | DRAFT | 입력은 유지하고 표시만 생략 | SPEC-BIABYSS-20260820-soft-cell-locomotion |
| `shader.particle.fluid.v1` | shader | `biabyss-apps/apps/mobile/src/game/rendering/shaders/particleShader.js` | TECH_QA | 원형 `PointsMaterial` | SPEC-BIABYSS-20260820-three-microscope-world |
| `shader.post.bloom.v1` | post-process | Three.js `UnrealBloomPass` | TECH_QA | emissive aura 없음 | SPEC-BIABYSS-20260820-three-microscope-world |
| `material.cell.player.v1` | material | `biabyss-apps/apps/mobile/src/game/rendering/CellRenderer.js` | TECH_QA | cyan 기본 material | SPEC-BIABYSS-20260820-three-microscope-world |
| `material.cell.prey.v1` | material | `biabyss-apps/apps/mobile/src/game/rendering/CellRenderer.js` | TECH_QA | green 기본 material | SPEC-BIABYSS-20260820-three-microscope-world |
| `material.cell.threat.v1` | material | `biabyss-apps/apps/mobile/src/game/rendering/CellRenderer.js` | TECH_QA | magenta 기본 material | SPEC-BIABYSS-20260820-three-microscope-world |
| `image.field.microscope.v1` | image | `biabyss-apps/apps/mobile/src/assets/images/microscope-field-v1.png` | TECH_QA | shader noise 배경 | SPEC-BIABYSS-20260820-three-microscope-world |
| `font.ui.mono.v1` | font | `biabyss-apps/apps/mobile/public/assets/fonts/` | PLANNED | system monospace | ui-baseline |
| `audio.ambience.deep.v1` | audio | `biabyss-apps/apps/mobile/public/assets/audio/` | PLANNED | silence | audio-baseline |
| `audio.nutrient.absorb.v1` | audio | `biabyss-apps/apps/mobile/public/assets/audio/` | PLANNED | silence | audio-baseline |
| `audio.player.consumed.v1` | audio | `biabyss-apps/apps/mobile/public/assets/audio/` | PLANNED | silence | audio-baseline |
| `image.app.icon.v1` | image | `biabyss-apps/apps/mobile/public/assets/images/` + native assets | PLANNED | 없음 | app-packaging |
| `image.app.splash.v1` | image | `biabyss-apps/apps/mobile/public/assets/images/` + native assets | PLANNED | solid brand color | app-packaging |

각 항목을 구현할 때 checksum, 형식, 크기, source/license, 승인자와 실제 SPEC-ID를 추가한다.

## `image.field.microscope.v1` 생성 기록

- source: OpenAI built-in image generation
- 형식/크기: PNG RGB, 1254×1254, 약 1.7 MB
- SHA-256: `01d0cd7b84c4889bedfd23bacc616357976ad3d8c4f6e95746f46319a73de7eb`
- prompt: dark-field microscopy의 어두운 수중 배지, 점액 섬유, 미세 부유물과 cyan/violet 광학 흔적. 큰 세포,
  생명체, 텍스트, 워터마크, 우주 이미지는 제외하고 camera 이동용 균일 밀도 texture로 생성.
- 권리/상태: 프로젝트 전용 생성 자산, checksum·single-file inline·브라우저 표시 검증으로 `TECH_QA`
