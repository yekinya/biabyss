# BIABYSS 설계 문서 지도

이 파일은 `project/` 문서의 위치·읽는 순서·단일 책임을 정의하는 기준이다. 새 설계 문서를 만들거나
책임을 옮기면 이 파일만 갱신하고 다른 문서에 전체 지도를 복제하지 않는다.

## 1. 폴더 구조

```text
project/
├── README.md
├── 01-domain/
│   ├── domain.md                 # 제품 의미·경계·불변 조건
│   └── runtime-model.md          # 런타임 객체·상태 소유권
├── 02-game/
│   ├── rules.md                  # 공식·판정·NPC·RuleSet
│   └── content/
│       ├── README.md             # 콘텐츠 문서 지도
│       ├── visual-direction.md   # 절차적 시각 언어
│       ├── audio-direction.md    # 음향 큐와 재생 원칙
│       └── resources/
│           ├── README.md         # 자산 경로·생명주기
│           └── asset-manifest.md # 필요한 자산과 상태
├── 03-screen/
│   ├── information-architecture.md
│   └── flows.md
├── 04-platform/
│   ├── architecture.md
│   ├── frontend.md
│   ├── canvas-hardrules.md
│   └── app-distribution.md
├── 05-process/
│   ├── agent-rules.md
│   └── test-strategy.md
├── 06-specs/                     # SPEC-BIABYSS-{yyyyMMdd}-{name}
└── 07-releases/                  # 버전별 릴리스·검증·배포 기록
```

## 2. 필수 읽기 순서

1. [`01-domain/domain.md`](01-domain/domain.md)
2. [`01-domain/runtime-model.md`](01-domain/runtime-model.md)
3. [`02-game/rules.md`](02-game/rules.md)
4. [`02-game/content/README.md`](02-game/content/README.md)
5. [`05-process/agent-rules.md`](05-process/agent-rules.md)

작업별 추가 읽기:

| 작업 | 추가 문서 |
|---|---|
| 셰이더·파티클·세포 표현 | `visual-direction.md`, `canvas-hardrules.md` |
| 입력·상태·React/PixiJS | `frontend.md`, `canvas-hardrules.md` |
| 시작·플레이·게임오버 UX | `03-screen/` 전체 |
| 성능·앱 생명주기 | `architecture.md`, `canvas-hardrules.md` |
| iOS·Android 패키징·배포 | `app-distribution.md`, `test-strategy.md` |
| 기능 구현·버그 수정 | 해당 `06-specs/<SPEC-ID>.md`, `test-strategy.md` |
| 스토어 릴리스 | 해당 `07-releases/<version>/` 전체 |

## 3. 문서별 단일 책임

| 문서 | 단일 책임 |
|---|---|
| `domain.md` | 제품 언어, 범위, 상태, 불변 조건과 위험 |
| `runtime-model.md` | 시뮬레이션 객체, 값 객체, 상태 소유권과 직렬화 경계 |
| `rules.md` | 이동·성장·흡수·NPC 공식, 처리 순서와 RuleSet |
| `content/README.md` | 시각·음향·리소스 문서 연결과 콘텐츠 경계 |
| `visual-direction.md` | 색·형태·레이어·셰이더·피드백 시각 언어 |
| `audio-direction.md` | cue ID, 우선순위, mixer와 앱 생명주기 |
| `resources/*` | 실제 자산 경로, 출처, 생성·검수·사용 상태 |
| `information-architecture.md` | 화면 집합, 계층, 상태 표시 |
| `flows.md` | 입력부터 게임오버·재시작까지 사용자 흐름 |
| `architecture.md` | 논리 계층, 의존 방향, 런타임·배포 topology |
| `frontend.md` | React·TypeScript·PixiJS 구현 가이드 |
| `canvas-hardrules.md` | Canvas 좌표·루프·렌더링·성능 절대 규칙 |
| `app-distribution.md` | Capacitor, 서명, 스테이징과 스토어 승격 |
| `agent-rules.md` | 분석·설계·구현·Git·PR·병합 절차 |
| `test-strategy.md` | 정적·단위·결정성·브라우저·기기 검증 게이트 |
| `06-specs/*` | 변경 단위 요구사항, 영향, 작업과 수용 기준 |
| `07-releases/*` | 배포된 버전의 변경·증거·배포·rollback 기록 |

## 4. 설계 문서가 아닌 것

- `dist/`, `node_modules/`, native build output은 생성물이며 추적하지 않는다.
- `public/assets/` 또는 소스 안의 shader 파일은 구현 자산이다. 의미와 상태는 `asset-manifest.md`가 설명한다.
- SPEC과 릴리스 기록은 이미 병합된 사실을 보존한다. 과거 기록을 고쳐 현재 설계를 정당화하지 않는다.
