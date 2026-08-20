# BIABYSS

빛나는 미생물 심연을 배경으로 한 Canvas 생존 게임입니다. 웹 기술로 개발하고 Capacitor 기반 iOS·Android
앱으로만 배포하는 것을 목표로 합니다.

## 기술 구성

- Pure JavaScript ES2022 + TypeScript `checkJs`
- Vite 8
- Three.js WebGL + GLSL ShaderMaterial
- EffectComposer + UnrealBloomPass
- `THREE.Points` 기반 유체·내부·배경 particle
- 단일 HTML production bundle
- ESLint
- Vitest

viewport 면적의 36배인 Field를 직교 camera가 추적합니다. 세포막·세포질·뉴클레오이드와 과립은 GLSL로
합성하고, DOM은 시작 화면과 저주파 HUD projection만 담당합니다. Three.js와 모든 자산은 앱 bundle에
포함되어 runtime CDN에 의존하지 않습니다.

## 시작하기

Node.js 22.13 이상이 필요합니다. 앱 workspace의 `.nvmrc`에 개발 기준 버전이 지정되어 있습니다.

```bash
cd biabyss-apps
nvm use
npm install
npm run dev:mobile
```

저장소 root에서는 실행 스크립트를 사용할 수 있습니다.

```bash
./deploy/run-app.sh
./deploy/run-app.sh --host 0.0.0.0 --port 4173
```

## 명령어

```bash
npm run dev:mobile # 모바일 개발 서버
npm run typecheck  # TypeScript 검사
npm run lint       # ESLint 검사
npm run test       # 단위 테스트
npm run build      # 프로덕션 빌드
npm run check      # 전체 필수 검사
```

## 주요 구조

```text
biabyss/
├── biabyss-apps/
│   ├── package.json
│   └── apps/
│       └── mobile/
│           ├── package.json
│           ├── src/
│           │   ├── game/
│           │   ├── domain/
│           │   ├── simulation/
│           │   └── assets/
│           └── vite.config.js
├── project/
├── AGENTS.md
└── CLAUDE.md
```

현재 장면에는 fixed-step 이동·흡수·포식, 54개 NPC, 320개 Nutrient, Field camera, 블룸, 세포 GLSL과
감쇠형 유체 trail이 포함되어 있습니다.

## 프로젝트 문서

작업 전 루트 `AGENTS.md`와 `project/README.md`의 필수 읽기 순서를 따릅니다. 제품 도메인, 게임 규칙,
Canvas hard rule, 앱 배포와 feature→develop 자동 병합 절차는 `project/` 아래에서 관리합니다.
