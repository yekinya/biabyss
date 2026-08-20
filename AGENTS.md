# BIABYSS 저장소 작업 규칙과 설계 문서 지도

## 1. 적용 범위

이 규칙은 저장소 전체의 사람·AI 작업에 적용한다. BIABYSS는 웹 기술로 개발하고 네이티브 앱으로만
배포하는 2D Canvas 생존 게임이다. 현재 제품 경계는 로컬 플레이어 1명과 NPC 군집이며, 서버·계정·실시간
사람 멀티플레이는 승인된 별도 SPEC이 생기기 전까지 범위 밖이다.

상세 개발·검증·Git 절차는 [`project/05-process/agent-rules.md`](project/05-process/agent-rules.md)가
규정한다.

## 2. 필수 읽기 순서

모든 분석·계획·수정·검토·구현 작업은 다음 순서로 읽는다. 작은 수정도 1~5번을 생략하지 않는다.

1. [`project/01-domain/domain.md`](project/01-domain/domain.md) — 제품 경계, 언어, 상태와 불변 조건
2. [`project/01-domain/runtime-model.md`](project/01-domain/runtime-model.md) — 런타임 객체와 상태 소유권
3. [`project/02-game/rules.md`](project/02-game/rules.md) — 시뮬레이션 공식, 판정 순서와 RuleSet
4. [`project/02-game/content/README.md`](project/02-game/content/README.md) — 시각·음향·리소스 계약
5. [`project/05-process/agent-rules.md`](project/05-process/agent-rules.md) — 작업·검증·브랜치·병합 절차

작업 범위별 추가 문서는 [`project/README.md`](project/README.md)의 문서 지도에서 고른다.

## 3. 충돌 처리 우선순위

- 제품 의미와 경계: `domain.md`
- 런타임 상태와 소유권: `runtime-model.md`
- 게임 수치와 판정: `rules.md`
- 화면 이동과 상태: `03-screen/`
- 구현 제약: `04-platform/`
- 개발과 Git 절차: `agent-rules.md`

충돌이 해소되지 않으면 구현·PR·병합·배포를 중단하고 관련 문서를 먼저 정렬한다.

## 4. 문서 선행 변경

- 제품 경계, 용어, 상태, 불변 조건을 바꾸면 `domain.md`를 먼저 바꾼다.
- Entity·Value Object·상태 소유권을 바꾸면 `runtime-model.md`를 먼저 바꾼다.
- 공식, 수치, 처리 순서, NPC 판단을 바꾸면 `rules.md`와 RuleSet 영향을 먼저 바꾼다.
- 화면 단계나 입력 흐름을 바꾸면 `information-architecture.md` 또는 `flows.md`를 먼저 바꾼다.
- 렌더링·성능·입력·오디오 규약을 바꾸면 `frontend.md` 또는 `canvas-hardrules.md`를 먼저 바꾼다.
- 패키징·서명·스토어 채널을 바꾸면 `app-distribution.md`를 먼저 바꾼다.
- 모든 기능·개선·버그 수정은 `project/06-specs/<SPEC-ID>.md`에서 요구사항과 수용 기준을 먼저 기록한다.

문서와 코드는 가능하면 같은 PR에서 함께 변경한다. 문서에 없는 새 규칙을 코드 상수로 먼저 만들지 않는다.

## 5. 절대 구현 계약

1. 게임 플레이는 하나의 PixiJS Canvas가 그린다. React DOM은 앱 부트스트랩, 접근성 대체 정보와 개발용
   진단 셸에 한정한다.
2. React state와 Zustand에 매 프레임 위치·속도·파티클을 저장하지 않는다.
3. 시뮬레이션은 고정 timestep을 사용하고 렌더링과 분리한다.
4. 질량·이동·흡수·NPC 판정 수치는 중앙 RuleSet 한 곳에서 읽는다. 숫자를 화면이나 Entity에 흩뜨리지 않는다.
5. 렌더러는 게임 결과를 결정하지 않는다. 시뮬레이션 상태를 읽어 표현만 한다.
6. Canvas 좌표, CSS 좌표, device pixel 좌표를 구분한다. 입력은 하나의 world 좌표 변환 경계를 통과한다.
7. 세포는 절차적 도형·셰이더·파티클을 우선한다. 타 게임 이미지·문구·고유 명칭을 복제하지 않는다.
8. 앱 실행 중 필요한 폰트·셰이더·음향·이미지는 번들에 포함한다. 외부 CDN과 원격 폰트에 의존하지 않는다.
9. WebGL context loss, 앱 background/foreground, 화면 회전·resize, 저사양·감소 모션을 처리한다.
10. 네이티브 코드는 Capacitor 셸과 승인된 plugin adapter에만 둔다. 게임 규칙을 Swift/Kotlin에 복제하지 않는다.
11. 브라우저 개발 빌드는 검증 수단이지 공개 배포 채널이 아니다. 운영 산출물은 서명된 앱 번들이다.
12. 온라인 사람 멀티플레이, 서버, 광고, 결제, 계정, 원격 분석 SDK는 별도 SPEC과 개인정보 검토 전까지 추가하지 않는다.

## 6. 개발·검증 완료 조건

모든 변경은 `분석 → 문서 설계 → 구현 → 정적 검사 → 단위/결정성 검사 → 브라우저 smoke → 앱 smoke → PR → 병합`
순서를 따른다.

최소 필수 검사는 다음과 같다.

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

`test`가 아직 없는 기초 단계에서는 SPEC에 공백을 명시하고, 테스트 기반을 만드는 작업을 우선한다. 검증을
우회하는 skip, assertion 삭제, `--force` 설치는 허용하지 않는다.

## 7. Git 브랜치와 자동 병합 계약

- 브랜치 계층은 `main → develop → feature/*`다.
- `main`은 스토어 운영 기준, `develop`은 스테이징·통합 기준이다.
- 기능 브랜치는 최신 `develop`에서 `feature/<SPEC-ID>`로 만든다.
- 개발 PR의 base는 항상 `develop`, head는 항상 `feature/*`다.
- `main`과 `develop`에 직접 push하지 않는다. 원격 저장소 최초 부트스트랩만 예외다.
- 구현 에이전트는 작업 완료 후 feature commit·push·PR 생성에 이어 필수 check를 확인하고 squash merge와
  원격 feature 삭제까지 수행한다. PR 생성만 하고 사용자에게 병합을 넘기지 않는다.
- check 실패, conflict, 권한 부족이면 병합하지 않고 feature에서 수정한다. 외부 권한 문제만 사용자에게 보고한다.
- `develop → main`은 명시적인 릴리스 작업에서만 수행한다. 릴리스 PR도 필수 앱 빌드·스토어 게이트 통과 뒤
  담당 에이전트가 병합한다.
- Conventional Commits를 사용하고 commit/PR에 SPEC-ID를 연결한다.

## 8. 저장소 보호

- `AGENTS.md`, `CLAUDE.md`, `project/` 문서는 한국어로 작성한다. 코드 identifier와 표준명은 원형을 유지한다.
- 참고 저장소의 이름, 세계관, 서버·DB 구조, 파일 경로, 식별자를 BIABYSS 문서에 남기지 않는다.
- 사용자와 다른 작업자의 변경을 보존한다.
- 요청 범위 밖 파일을 삭제·이동하거나 공개 배포하지 않는다.
- 비밀값, 인증서, provisioning profile, keystore를 commit하지 않는다.
