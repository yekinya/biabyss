# SPEC-BIABYSS-20260820-mobile-workspace

## 1. 배경과 목표

실행 앱이 저장소 root에 놓여 있어 의도한 앱 workspace 구조와 달랐다. 실행 프로젝트 전체를
`biabyss-apps/apps/mobile/`로 이동하고 `biabyss-apps/`를 npm workspace root로 만든다.

## 2. 목표 구조

```text
biabyss/
├── biabyss-apps/
│   ├── .nvmrc
│   ├── package.json
│   ├── package-lock.json
│   └── apps/
│       └── mobile/
│           ├── package.json
│           ├── src/
│           ├── index.html
│           ├── eslint.config.js
│           ├── tsconfig*.json
│           └── vite.config.ts
├── project/
├── AGENTS.md
└── CLAUDE.md
```

## 3. 변경

- Vite/React/PixiJS 코드와 앱 설정을 `apps/mobile`로 이동
- lockfile과 Node 기준을 `biabyss-apps` workspace root로 이동
- `@biabyss/mobile` workspace package 선언
- workspace root에 dev/check/build 조정 script 추가
- CI, README, AI 규칙과 리소스 경로를 새 구조에 맞춤
- `.idea/`는 사용자 로컬 설정으로 보존하되 Git 추적에서 제외

## 4. 범위 밖

- Capacitor dependency와 native `ios/`, `android/` project 생성
- 도메인·게임 규칙 변경
- Canvas UI refactor

## 5. 위험과 통제

- lockfile workspace drift: 새 root에서 `npm install`, 이어서 `npm ci` 검증
- 상대 import 손상: 앱 내부 디렉터리 전체를 함께 이동하고 typecheck/build 수행
- CI cwd 오류: `working-directory`와 cache lockfile 경로를 명시
- root generated output 혼재: 이전 root `dist/`, `node_modules/`를 새 install 성공 뒤 제거

## 6. 수용 기준

- [ ] 저장소 root에 앱 `src`, `package.json`, Vite/TS 설정이 없다.
- [ ] 실행 프로젝트가 `biabyss-apps/apps/mobile/`에 있다.
- [ ] `biabyss-apps/`에서 `npm ci`와 `npm run check`가 통과한다.
- [ ] 브라우저 시작·실행 smoke와 console 오류 0건을 확인한다.
- [ ] 문서와 CI가 새 경로만 참조한다.
- [ ] feature PR이 `develop`에 squash merge된다.
