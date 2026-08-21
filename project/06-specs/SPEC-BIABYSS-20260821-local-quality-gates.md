# SPEC-BIABYSS-20260821-local-quality-gates

## 배경과 목표

GitHub Actions `Web quality` workflow가 원격 계정 실행 제한에 의존하고, 브라우저 자동화 smoke가 실행 환경의
브라우저 연결 여부에 좌우되어 로컬에서 완료된 변경의 병합을 막고 있다. 품질 게이트를 저장소가 고정한 Node와
npm 명령으로 단순화하고, 개발·문서·도구·규칙 변경 PR의 base를 항상 `develop`로 고정한다.

## 범위

- `.github/workflows/ci.yml` 제거
- GitHub Actions workflow를 품질 게이트로 사용하거나 새로 추가하지 않는 저장소 규칙
- `npm ci`, typecheck, lint, test, build로 구성한 로컬 필수 검사
- 브라우저 자동화·smoke·screenshot 검사를 모든 작업의 필수·선택 게이트에서 제외
- 기능·버그·문서·도구·규칙 변경 PR의 base를 `develop`, head를 `feature/*`로 고정
- 에이전트 병합 절차를 원격 check 대기 대신 로컬 검사와 review finding 확인 기준으로 변경

## 범위 밖

- iOS·Android native smoke와 스토어 설치 검증 제거
- `develop → main` 명시적 릴리스 절차 변경
- 테스트 assertion, lint 또는 typecheck 기준 완화
- Codemagic과 서명·스토어 배포 설정 추가

## 현재/목표 동작

### 현재

- PR과 `develop`/`main` push에서 GitHub Actions가 로컬 검사와 같은 명령을 다시 실행한다.
- 실행 환경에 브라우저가 없으면 브라우저 smoke 미실행이 병합 blocker로 남는다.
- 에이전트 절차가 원격 check 대기를 필수 병합 단계로 요구한다.

### 목표

- 품질 검사는 고정 Node 버전에서 로컬 명령으로 수행하고 결과를 PR에 기록한다.
- 브라우저 테스트는 검사 계획, 완료 조건과 병합 게이트에 넣지 않는다.
- 일반 작업 PR은 예외 없이 `feature/* → develop` 구조를 사용한다.
- 로컬 필수 검사와 review finding이 통과하면 원격 check 없이 담당 에이전트가 squash merge한다.

## 도메인·RuleSet·화면·자산·플랫폼 영향

- 도메인·RuleSet·화면·자산: 영향 없음.
- 플랫폼: 웹·네이티브 런타임 동작은 바꾸지 않고 검증·병합 운영만 변경한다.
- 프로세스: 루트 규칙, 에이전트 규칙과 테스트 전략을 로컬 게이트 기준으로 정렬한다.
- 배포: 스토어 릴리스의 native build·설치·스토어 게이트는 유지한다.

## 구현 작업

1. GitHub Actions workflow를 제거한다.
2. 루트 규칙에 로컬 검사, 브라우저 테스트 제외와 `develop` base 고정을 명시한다.
3. 에이전트 절차에서 원격 check 대기와 브라우저 smoke를 제거한다.
4. 테스트 전략을 Q1 로컬 검사, Q2 Domain/Simulation, Q3 Native, Q4 Release로 정리한다.
5. 아키텍처와 배포 문서의 GitHub Actions 품질 게이트 설명을 로컬 검사로 교체한다.
6. 로컬 필수 검사 통과 후 `develop` 대상 PR을 squash merge한다.

## 위험과 rollback

- 원격 CI 제거로 개발자 환경 차이가 드러나지 않을 수 있다. `.nvmrc`, lockfile과 `npm ci`를 필수로 사용하고
  PR에 Node/npm 버전과 검사 결과를 기록한다.
- 브라우저 테스트 제외로 WebGL 기기 문제를 개발 PR에서 잡지 못할 수 있다. 공개 웹 배포는 하지 않으며,
  native staging과 스토어 릴리스의 실제 앱 smoke는 유지한다.
- rollback은 workflow 파일을 새 SPEC으로 복원하고 원격 실행 권한·비용·필수 check 정책을 함께 승인한다.

## 요구사항별 수용 기준

- [ ] `.github/workflows/` 아래 GitHub Actions workflow가 없다.
- [ ] 저장소 규칙이 GitHub Actions workflow 추가 금지와 로컬 필수 검사를 명시한다.
- [ ] 모든 일반 작업 PR의 base가 `develop`, head가 `feature/*`로 규정된다.
- [ ] 브라우저 자동화·smoke·screenshot 검사가 완료 조건과 병합 게이트에서 제외된다.
- [ ] native staging과 store release smoke는 유지된다.
- [ ] Node 22.22.1에서 로컬 필수 검사가 통과한다.
- [ ] 본 변경 PR이 `develop`에 squash merge된다.

## 필수 검사와 기기 matrix

- Node 22.22.1 / npm 10.9.4
- `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`
- 브라우저 검사 없음
- 실행 코드가 바뀌지 않으므로 iOS·Android 기기 검사는 해당 없음
