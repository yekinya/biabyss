# BIABYSS 도메인 설계

## 1. 제품 정의

BIABYSS는 빛나는 미생물 심연에서 하나의 세포를 조종해 더 작은 생명체와 영양체를 흡수하고, 더 큰
포식자를 피하며 최대한 오래 성장하는 짧은 세션형 생존 게임이다.

제품의 핵심 감정은 `부유 → 발견 → 접근 → 흡수 → 성장 → 공포 → 소멸`이다. 규칙은 즉시 이해되지만
세포의 관성, 크기 변화와 절차적 시각 표현에서 깊이가 생겨야 한다.

## 2. 현재 제품 경계

### 포함

- 로컬 사람 플레이어 1명
- 같은 world 안의 다수 NPC 세포
- 영양체 흡수, 세포 간 포식, 질량 성장과 게임오버
- pointer/touch 기반 방향 입력
- 절차적 Canvas 시각과 앱 번들 내 음향
- 로컬 설정과 최고 기록
- iOS·Android 앱 배포

### 제외

- 사람 대 사람 온라인 멀티플레이
- 계정, 서버 저장, 채팅, 친구, 랭킹 서버
- 광고, 인앱 결제, 실물 화폐 경제
- 네이티브 UI로 복제한 게임 화면
- 공개 웹 서비스와 PWA 배포

제외 항목은 금지가 아니라 별도 SPEC, 아키텍처와 개인정보·스토어 정책 검토가 필요한 경계다.

## 3. 공통 언어

| 용어 | 의미 |
|---|---|
| Run | 시작부터 소멸 또는 종료까지 한 번의 플레이 세션 |
| World | Run 동안 Entity가 존재하는 유한한 2D 공간 |
| Field | World의 물리 경계. Run 시작 viewport 가로·세로의 6배이며 면적은 36배다. |
| Viewport | 카메라가 현재 Canvas에 투영하는 Field의 일부 영역 |
| Cell | 질량·위치·속도·행동 주체를 가진 생명체 |
| Player Cell | 사람의 Input Intent를 따르는 유일한 Cell |
| NPC Cell | RuleSet과 감지 결과로 행동하는 Cell |
| Cell Species | 형태·기동 방식·어그로 프로필·감지 반경을 묶는 NPC 종 정의 |
| Aggro Profile | `pursue-player | pursue-cell | flee | passive` 중 감지 대상과 반응을 정한 불변 성향 |
| Aggro Target | 공격형 NPC가 감지 반경 안에서 Mass 조건과 표적 범위를 만족해 추적하는 Cell |
| Nutrient | 의사결정 없이 흡수되며 seed 기반으로 서로 다른 Mass와 크기를 가진 질량 공급원 |
| Mass | 크기, 기동성과 포식 관계를 결정하는 핵심 스칼라 |
| Radius | Mass에서 계산되는 충돌·표현 반경 |
| Absorption | 큰 Cell이 작은 대상의 질량 일부 또는 전부를 얻는 판정 |
| Absorption Transition | 외곽 접촉 뒤 겹침 깊이에 따라 prey Mass가 줄고 포식자에게 당겨지며 질량이 이전되는 구간 |
| Threat | Player를 흡수할 수 있는 NPC Cell |
| Prey | Player가 흡수할 수 있는 NPC Cell 또는 Nutrient |
| RuleSet | 한 Run의 모든 판정 수치와 한계를 가진 불변 설정 |
| Simulation Tick | 고정 간격으로 한 번 수행되는 권위 있는 상태 전이 |
| Render Frame | Simulation 결과를 보간해 그리는 비권위 표현 단계 |

## 4. Run 상태

```text
BOOT → READY → RUNNING ⇄ PAUSED → GAME_OVER
                    └────────────→ TERMINATED
```

- `BOOT`: 앱과 자산을 준비한다.
- `READY`: world는 미리 보일 수 있으나 점수·충돌 판정은 진행하지 않는다.
- `RUNNING`: 입력·NPC·물리·흡수·종료 판정이 진행된다.
- `PAUSED`: 앱 background, 시스템 interruption 또는 사용자 일시정지 상태다.
- `GAME_OVER`: 결과 snapshot을 고정하고 재시작 입력만 받는다.
- `TERMINATED`: 앱 또는 Run이 명시적으로 폐기되어 리소스를 해제한다.

`PAUSED` 동안 누락된 실시간을 나중에 몰아서 simulation하지 않는다.

## 5. 핵심 불변 조건

1. 한 Run에는 Player Cell이 정확히 하나만 있다.
2. 살아 있는 Entity ID는 Run 안에서 유일하다.
3. Mass와 Radius는 유한한 양수이며 `NaN`, `Infinity`, 음수가 될 수 없다.
4. Radius는 Mass의 파생 값이다. 별도 저장한 반경이 Mass와 갈라지지 않는다.
5. 한 대상은 같은 tick에 두 번 흡수되지 않는다.
6. 포식 결과는 렌더링 순서나 frame rate에 좌우되지 않는다.
7. `GAME_OVER` 뒤 score, mass, world 결과는 재시작 전까지 변하지 않는다.
8. NPC는 Field 밖으로 이탈하지 않으며 spawn 즉시 Player와 충돌하지 않는다.
9. 모든 난수는 Run seed에서 나온다. 테스트에서 같은 seed와 입력은 같은 결과를 낸다.
10. 일시정지와 resume은 숨은 질량 증가·NPC 순간 이동·즉시 사망을 만들지 않는다.
11. 흡수 전이 중인 Cell은 다른 포식자의 새 흡수 대상으로 중복 선택되지 않는다.
12. NPC 어그로 성향·표적 범위와 감지 반경은 Species RuleSet에서만 결정한다.
13. 공격형 NPC는 현재 Mass로 흡수 가능한 작은 Cell만 Aggro Target으로 선택한다.
14. Cell 흡수 중 prey의 실제 Mass 감소와 predator의 실제 Mass 증가는 같은 fixed tick drain에서 계산한다.
15. 접촉한 두 Cell은 현재 Mass가 큰 쪽을 predator로 정하며 동일 Mass는 안정 ID로 한쪽을 선택한다.
16. 시작 보호는 Player가 prey인 흡수만 막고 Player가 작은 Cell을 흡수하는 행동은 막지 않는다.

## 6. 도메인 경계

### Simulation

World 상태와 게임 결과의 유일한 권위자다. 입력 의도, RuleSet과 고정 tick을 받아 다음 상태와 Domain Event를 만든다.

### Presentation

Simulation snapshot과 event를 Canvas·오디오·촉각 피드백으로 투영한다. Mass와 승패를 직접 바꾸지 않는다.

### Application Shell

Run 생성·재시작, 설정, 앱 생명주기, 자산 준비와 native adapter를 조정한다. 게임 공식을 소유하지 않는다.

### Persistence

설정, 접근성 선택, 최고 기록만 기기 로컬에 저장한다. 진행 중 World를 자동 복구하는 기능은 별도 SPEC 전까지 없다.

## 7. Domain Event

- `RunStarted`
- `NutrientAbsorbed`
- `CellAbsorbed`
- `PlayerMassChanged`
- `ThreatEnteredRange`
- `PlayerConsumed`
- `RunEnded`
- `RunPaused`
- `RunResumed`

Event는 이미 확정된 사실이다. Renderer와 Audio가 event를 소비할 수 있지만 event를 다시 Simulation 명령으로
바꾸지 않는다.

## 8. 성공 기준

- 첫 입력까지 3초 이내에 규칙을 이해할 수 있다.
- 성장할수록 시각적 밀도와 위협감이 함께 커진다.
- 사망 원인이 화면에서 설명 가능하다.
- 30초 플레이와 10분 플레이 모두 frame pacing이 안정적이다.
- 네트워크가 없어도 전체 Run을 시작하고 끝낼 수 있다.

## 9. 주요 위험

| 위험 | 통제 |
|---|---|
| frame rate에 따른 판정 차이 | 고정 timestep, seed 기반 PRNG, 결정성 테스트 |
| 개체 증가에 따른 충돌 O(n²) | spatial hash, 활성 한도, object pool |
| filter 남용에 따른 fill-rate 폭증 | 공유 shader/batch, tier별 post-process budget |
| 앱 background 뒤 즉시 사망 | pause 후 accumulator 폐기, 안전한 resume |
| 원격 자산 불가로 첫 실행 실패 | 모든 런타임 자산 번들 포함 |
| 단순 WebView 포장으로 보이는 스토어 심사 | 완결된 게임 경험, 오프라인 실행, 앱 생명주기·촉각·오디오 통합 |
