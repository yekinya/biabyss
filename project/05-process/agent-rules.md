# BIABYSS 에이전트 작업 규칙

## 1. 시작 규칙

모든 작업자는 루트 `AGENTS.md`의 필수 읽기 순서를 지킨다. 사용자의 요청이 단순해 보여도 현재 도메인,
RuleSet과 Canvas 제약을 확인하기 전 코드를 수정하지 않는다.

작업 시작 시 확인:

1. 현재 branch가 `feature/*`인지 확인한다.
2. feature가 최신 `develop`에서 분기했는지 확인한다.
3. dirty worktree의 기존 변경과 소유자를 확인한다.
4. 대응 `project/06-specs/<SPEC-ID>.md`를 찾거나 먼저 만든다.
5. 영향 문서와 코드 경계를 기록한다.

## 2. SPEC

ID 형식:

```text
SPEC-BIABYSS-{yyyyMMdd}-{kebab-name}
```

파일과 branch:

```text
project/06-specs/<SPEC-ID>.md
feature/<SPEC-ID>
```

SPEC 필수 항목:

- 배경과 목표
- 범위와 범위 밖
- 현재/목표 동작
- 도메인·RuleSet·화면·자산·플랫폼 영향
- 구현 작업
- 위험과 rollback
- 요구사항별 수용 기준
- 필수 검사와 기기 matrix

작은 버그도 원인, 불변 조건과 재발 방지 검사를 기록한다. 결과만 맞추는 assertion 변경은 SPEC가 아니다.

## 3. 개발 루프

### A — 분석

- 재현 또는 현재 구조를 실제 코드에서 확인한다.
- 사용자 요구를 수용 기준으로 분해한다.
- Simulation, Presentation, Shell, Platform 중 소유 경계를 결정한다.
- 불확실한 규칙은 구현 상수로 결정하지 않는다.

### D — 문서 설계

- 도메인 의미 → runtime model → game rule → screen → platform 순으로 영향을 반영한다.
- 수치가 생기면 RuleSet 위치와 테스트 경계를 정한다.
- 새 자산은 manifest에 먼저 등록한다.
- 새 native plugin은 권한·거부·store metadata를 설계한다.

### I — 구현

- 승인된 SPEC 범위의 최소 diff를 만든다.
- domain/simulation의 순수성을 보존한다.
- prototype debt를 확장해야 하면 SPEC에 제거 조건을 기록한다.
- 새 문제로 범위가 바뀌면 문서 단계로 돌아간다.

### V — 검증

- `test-strategy.md`의 Q1~Q5를 현재 범위에 맞게 수행한다.
- 실패를 skip하거나 threshold를 낮춰 통과시키지 않는다.
- 브라우저 smoke는 console error와 Canvas 초기화만이 아니라 핵심 입력·상태 전이를 확인한다.

### M — 전달과 병합

- diff에서 요구 밖 변경과 부모 프로젝트 흔적을 검사한다.
- Conventional Commit으로 feature에 commit한다.
- feature를 push하고 base `develop` PR을 만든다.
- CI와 review finding을 확인하고 실패 시 feature에서 수정한다.
- 필수 check가 모두 통과하면 담당 에이전트가 squash merge하고 remote feature를 삭제한다.
- local `develop`을 fast-forward한 뒤 merge SHA와 검사 결과를 보고한다.

## 4. Git 명령 계약

기본 흐름:

```bash
git fetch origin
git switch develop
git pull --ff-only origin develop
git switch -c feature/<SPEC-ID>

# 문서·코드·검사

git push -u origin feature/<SPEC-ID>
gh pr create --base develop --head feature/<SPEC-ID>
gh pr checks --watch
gh pr merge --squash --delete-branch
git switch develop
git pull --ff-only origin develop
```

- `main`, `develop` 직접 commit/push 금지
- `feature/* → main` PR 금지
- merge commit보다 squash merge 우선
- force push, history rewrite와 destructive reset 금지
- PR이 열린 뒤 develop이 변해 conflict가 생기면 feature에서 develop을 반영하고 다시 검사

## 5. 자동 병합의 의미

“자동”은 검증을 생략하거나 무조건 merge한다는 뜻이 아니다. 에이전트가 다음 책임을 끝까지 수행한다는 뜻이다.

1. PR 생성
2. check 대기
3. 실패 수정
4. unresolved review finding 0 확인
5. merge 실행
6. feature 삭제와 develop 동기화

권한, branch protection 또는 외부 서비스 장애로 merge할 수 없을 때만 정확한 blocker를 사용자에게 보고한다.

## 6. main 릴리스

- routine 개발은 `develop`에서 끝난다.
- 사용자가 운영 릴리스를 명시하면 `develop → main` release PR을 만든다.
- 해당 버전 `project/07-releases/<version>/` 기록과 web/native 검증이 있어야 한다.
- TestFlight/Play internal smoke가 실패하면 main에 merge하지 않는다.
- 게이트가 통과하면 에이전트가 release PR을 merge하고 tag·store pipeline을 추적한다.
- store 제출, 계정·서명 권한처럼 외부 승인 경계는 임의로 우회하지 않는다.

## 7. 변경 통제

- 사용자와 다른 작업자의 변경을 보존한다.
- 문서의 과거 릴리스 사실을 현재 편의에 맞게 고치지 않는다.
- package manager conflict를 `--force` 또는 `--legacy-peer-deps`로 숨기지 않는다.
- 비밀값, 개인 경로, source repository 이름을 commit하지 않는다.
- generated output, `node_modules`, `dist`, native build와 signing 파일을 stage하지 않는다.
- 네트워크·서버·분석 SDK를 조용히 추가하지 않는다.

## 8. 검토 기준

코드 리뷰는 최소 다음을 검사한다.

- 요구사항과 SPEC 추적
- Simulation/Renderer 권위 분리
- fixed timestep과 seed 결정성
- mass/radius/absorption 불변 조건
- Canvas 좌표와 DPR 변환
- resize, background/resume, context loss
- listener, animation loop, GPU/audio resource 정리
- low tier와 감소 모션 fallback
- 외부 runtime 자산 요청 0
- iOS/Android packaging 영향
- test가 결과가 아니라 규칙을 검증하는지

## 9. 완료 정의

작업은 다음이 모두 참일 때 완료다.

- SPEC과 영향 문서가 현재 동작을 설명한다.
- 수용 기준이 코드와 검사로 추적된다.
- Q1 필수 검사와 범위에 필요한 Q2~Q5가 통과한다.
- 부모 저장소의 이름·도메인·식별자 흔적이 없다.
- feature PR이 `develop`에 merge됐다.
- local branch가 최신 `develop`이고 worktree가 깨끗하다.
- 사용자가 실행 방법, merge SHA와 남은 제한을 알 수 있다.
