# BIABYSS 자산 Manifest

현재는 설계 우선 단계다. 아래 항목은 필요한 자산 계약이며 구현 파일이 존재한다고 주장하지 않는다.

| assetId | kind | 예정 위치 | 상태 | fallback | 연결 SPEC |
|---|---|---|---|---|---|
| `shader.world.fog.v1` | shader | `src/game/rendering/shaders/world-fog.frag.glsl` | PLANNED | 단색 radial gradient | foundation |
| `shader.cell.membrane.v1` | shader | `src/game/rendering/shaders/cell-membrane.frag.glsl` | PLANNED | PixiJS Graphics 원형 | foundation |
| `shader.cell.cytoplasm.v1` | shader | `src/game/rendering/shaders/cell-cytoplasm.frag.glsl` | PLANNED | 반투명 gradient | foundation |
| `shader.post.bloom.v1` | shader | `src/game/rendering/shaders/bloom.frag.glsl` | PLANNED | 단순 aura | foundation |
| `material.cell.player.v1` | material | `src/game/rendering/materials/` | PLANNED | cyan Graphics | foundation |
| `material.cell.prey.v1` | material | `src/game/rendering/materials/` | PLANNED | green Graphics | foundation |
| `material.cell.threat.v1` | material | `src/game/rendering/materials/` | PLANNED | magenta Graphics | foundation |
| `font.ui.mono.v1` | font | `public/assets/fonts/` | PLANNED | system monospace | ui-baseline |
| `audio.ambience.deep.v1` | audio | `public/assets/audio/` | PLANNED | silence | audio-baseline |
| `audio.nutrient.absorb.v1` | audio | `public/assets/audio/` | PLANNED | silence | audio-baseline |
| `audio.player.consumed.v1` | audio | `public/assets/audio/` | PLANNED | silence | audio-baseline |
| `image.app.icon.v1` | image | `public/assets/images/` + native assets | PLANNED | 없음 | app-packaging |
| `image.app.splash.v1` | image | `public/assets/images/` + native assets | PLANNED | solid brand color | app-packaging |

각 항목을 구현할 때 checksum, 형식, 크기, source/license, 승인자와 실제 SPEC-ID를 추가한다.
