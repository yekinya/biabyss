# BIABYSS 리소스 계약

## 1. 구현 위치

```text
biabyss-apps/apps/mobile/src/game/rendering/shaders/     # GLSL/WGSL과 uniform type
biabyss-apps/apps/mobile/src/game/rendering/materials/   # palette, shader 조합, fallback
biabyss-apps/apps/mobile/src/game/rendering/particles/   # particle emitter 설정
biabyss-apps/apps/mobile/public/assets/audio/            # 앱 번들 음향
biabyss-apps/apps/mobile/public/assets/fonts/            # 번들 폰트와 license
biabyss-apps/apps/mobile/public/assets/images/           # icon/splash 등 필요한 정적 이미지
project/02-game/content/resources/
└── asset-manifest.md           # 출처와 승인 상태 정본
```

아직 디렉터리에 자산이 없으면 빈 폴더를 만들지 않는다. 첫 자산 SPEC이 구현 위치와 manifest 행을 같은 PR에
추가한다.

## 2. 이름 규칙

- shader: `cell-membrane.frag.glsl`, `world-fog.frag.glsl`
- palette/material ID: `cell.player.cyan.v1`
- audio: `<domain>.<event>.<variant>.<ext>`
- image: `<surface>-<purpose>-<density>.<ext>`
- ID는 경로와 분리하며 코드가 파일 경로를 조립하지 않는다.

## 3. 필수 메타데이터

- 안정 `assetId`
- kind와 runtime 경로
- source 유형과 권리
- 생성 prompt/source가 있으면 해당 위치
- 기술 규격, 용량과 checksum
- 연결된 SPEC
- `PLANNED`부터 `APPROVED`까지 상태
- fallback과 low-tier 대체재

## 4. 금지

- 타 게임 또는 검색 이미지 임시 포함
- 외부 URL을 runtime 경로로 사용
- manifest 없이 파일만 추가
- source master만 있고 앱 파생본이 없는 상태를 `APPROVED`로 표시
- shader fallback 없이 WebGL extension을 가정
- license 또는 생성 출처가 불명확한 폰트·음향
