# SPEC-BIABYSS-20260820-run-app-script

## 배경과 목표

개발자가 저장소 내부 위치와 관계없이 하나의 명령으로 BIABYSS 모바일 웹 앱의 개발 서버를 실행할 수 있어야
한다. 저장소 root의 `deploy/run-app.sh`가 workspace 경로, Node 기준 버전과 초기 의존성 설치를 처리한다.

## 범위

- `deploy/run-app.sh` 실행 파일 추가
- `.nvmrc` 기반 Node 선택
- 의존성이 없을 때 잠금 파일 기반 설치
- 추가 CLI 인자를 Vite 개발 서버로 전달
- root README에 실행 방법 기록

## 범위 밖

- 프로덕션 배포와 앱 스토어 제출
- 백그라운드 daemon 및 프로세스 종료 관리
- Windows용 실행 스크립트

## 현재/목표 동작

- 현재: `biabyss-apps`로 이동하고 Node와 npm 명령을 각각 준비해야 한다.
- 목표: 저장소 root에서 `./deploy/run-app.sh` 한 번으로 개발 서버가 시작된다.

## 영향

- 도메인·RuleSet·화면·자산: 영향 없음
- 플랫폼: 로컬 개발 실행 진입점만 추가
- 앱 bundle: 변경 없음

## 구현 작업

1. 스크립트 위치를 기준으로 저장소와 workspace 절대 경로를 계산한다.
2. NVM이 있으면 `biabyss-apps/.nvmrc`의 버전을 활성화한다.
3. Node 22.13 이상과 npm 사용 가능 여부를 검증한다.
4. workspace 의존성이 없으면 `npm ci`를 실행한다.
5. 모바일 개발 서버를 foreground에서 실행하고 받은 인자를 전달한다.

## 위험과 rollback

- NVM이 없는 환경은 이미 설치된 Node가 기준 버전을 충족해야 한다.
- 개발 서버는 foreground 프로세스이므로 `Ctrl+C`로 종료한다.
- rollback은 스크립트와 README 실행 안내를 제거하는 것이다.

## 수용 기준

- [ ] `deploy/run-app.sh`에 실행 권한이 있다.
- [ ] 저장소 밖의 현재 디렉터리에서도 실행된다.
- [ ] Node 22.13 이상에서 모바일 Vite 서버가 시작된다.
- [ ] `--host`, `--port` 같은 추가 인자가 Vite로 전달된다.
- [ ] 앱 시작 화면을 HTTP로 조회할 수 있다.

## 필수 검사와 기기 matrix

- macOS zsh에서 직접 실행
- Bash 문법 검사
- Node 22.22.1 / npm 10.9.4
- `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`
- 로컬 HTTP smoke
