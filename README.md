# BIABYSS

빛나는 미생물 심연을 배경으로 한 브라우저 생존 게임입니다.

## 기술 구성

- React 19 + TypeScript
- Vite 8
- PixiJS 8 (WebGL 렌더링)
- Zustand (메뉴와 HUD 상태)
- ESLint

React는 화면과 HUD를 담당하고, 매 프레임 갱신되는 게임 상태와 렌더링은 PixiJS 엔진 내부에서 처리합니다.

## 시작하기

Node.js 22.13 이상이 필요합니다. `.nvmrc`에는 개발 기준 버전이 지정되어 있습니다.

```bash
nvm use
npm install
npm run dev
```

## 명령어

```bash
npm run dev        # 개발 서버
npm run typecheck  # TypeScript 검사
npm run lint       # ESLint 검사
npm run build      # 프로덕션 빌드
npm run preview    # 빌드 결과 미리보기
```

## 주요 구조

```text
src/
├── game/
│   ├── GameCanvas.tsx
│   └── engine/BiabyssGame.ts
├── store/gameStore.ts
├── App.tsx
├── main.tsx
└── styles.css
```

현재 베이스 장면에는 포인터 이동, 질량 증가, 먹기/피식 판정, 단순 NPC 조향과 반응형 HUD가 포함되어 있습니다.
