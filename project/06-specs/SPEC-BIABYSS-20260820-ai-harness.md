# SPEC-BIABYSS-20260820-ai-harness

## 1. 배경

BIABYSS는 실행 가능한 PixiJS prototype만 있고 제품 도메인, 리소스 계약, Canvas 구현 규칙과 일관된 Git
전달 절차가 없었다. 다른 저장소의 문서 중심 AI 하네스 형식을 참고하되 그 제품의 내용과 흔적은 제거하고
BIABYSS 전용 기준선을 만든다.

## 2. 목표

- `AGENTS.md`, `CLAUDE.md`와 `project/` 문서 지도 구축
- 도메인·runtime model·게임 규칙을 구현보다 먼저 정의
- 절차적 시각·음향·자산 manifest 설계
- Canvas 전용 React/PixiJS 코딩 hard rule 정의
- Capacitor + Codemagic 앱 배포 방향 결정
- `main → develop → feature/*`와 feature→develop 자동 완료 절차 정의
- PR 품질 게이트 추가

## 3. 범위 밖

- Capacitor dependency와 `ios/`, `android/` project 생성
- Apple/Google 개발자 계정, signing secret와 Codemagic 연결
- shader·음향·앱 아이콘 실제 제작
- prototype의 fixed-step engine 전면 refactor
- 온라인 사람 멀티플레이

## 4. 변경

### 문서

- 루트 AI 진입 문서와 필수 읽기 순서
- `project/01-domain`부터 `07-releases`까지 축소된 단일 책임 구조
- 도메인 상태·불변 조건, runtime 객체와 RuleSet
- 화면 흐름, 플랫폼 구조, Canvas 규칙, 테스트·Git 절차

### 코드·자동화

- 원격 Google Fonts 제거와 system font fallback
- 순수 Mass/Radius 규칙 module과 단위 테스트
- GitHub Actions web quality workflow
- `npm test` script와 Vitest

## 5. 배포 결정

- 모바일 앱 셸: Capacitor
- PR 검증: GitHub Actions
- signing·staging·store: Codemagic
- develop: TestFlight/Play internal 후보
- main: 운영 store 후보
- 공개 web production: 없음

## 6. 위험과 통제

| 위험 | 통제 |
|---|---|
| 원본 규칙이 섞임 | target 전체에서 원본명·서버/DB 용어 grep |
| 문서가 prototype을 완료품으로 주장 | 현재 공백을 test strategy와 architecture에 명시 |
| 자동 merge가 검증을 우회 | 필수 check 통과 뒤 agent가 merge |
| app-only인데 원격 자산 의존 | Google Fonts 제거, hard rule과 network smoke |
| 과도한 native 선개발 | packaging은 별도 SPEC 전까지 문서 결정만 |

## 7. 수용 기준

- [ ] 루트 `AGENTS.md`, `CLAUDE.md`가 BIABYSS만 설명한다.
- [ ] `project/README.md`가 모든 설계 문서의 단일 책임을 연결한다.
- [ ] Domain, Runtime, RuleSet, Resource manifest가 존재한다.
- [ ] Canvas single-surface, fixed timestep, 상태 소유권과 app lifecycle 규칙이 명시된다.
- [ ] Capacitor/Codemagic 선택, branch→channel mapping과 store rollback 한계가 명시된다.
- [ ] `main`, `develop`, `feature/*` 구조로 작업하고 PR base가 develop이다.
- [ ] typecheck, lint, test, build가 통과한다.
- [ ] runtime 외부 font 요청이 없다.
- [ ] 부모 저장소 이름·도메인 식별자 흔적이 0이다.
- [ ] feature PR이 develop에 squash merge된다.
