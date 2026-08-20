# BIABYSS

빛나는 미생물 심연을 배경으로 한 Canvas 생존 게임입니다. 웹 기술로 개발하고 Capacitor 기반 iOS·Android
앱으로만 배포하는 것을 목표로 합니다.

## 기술 구성

- React 19 + TypeScript
- Vite 8
- PixiJS 8 (WebGL 렌더링)
- Zustand (메뉴와 HUD 상태)
- ESLint
- Vitest

현재 prototype은 React DOM으로 시작 화면과 HUD를 검증하고, 매 프레임 갱신되는 게임 상태와 렌더링은
PixiJS 엔진 내부에서 처리합니다. 제품 구현에서는 `project/04-platform/canvas-hardrules.md`에 따라 시각
HUD와 조작 UI도 단일 Canvas scene으로 이동합니다.

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
│           │   └── store/
│           └── vite.config.ts
├── project/
├── AGENTS.md
└── CLAUDE.md
```

현재 베이스 장면에는 포인터 이동, 질량 증가, 먹기/피식 판정, 단순 NPC 조향과 반응형 HUD가 포함되어 있습니다.

## 프로젝트 문서

작업 전 루트 `AGENTS.md`와 `project/README.md`의 필수 읽기 순서를 따릅니다. 제품 도메인, 게임 규칙,
Canvas hard rule, 앱 배포와 feature→develop 자동 병합 절차는 `project/` 아래에서 관리합니다.
