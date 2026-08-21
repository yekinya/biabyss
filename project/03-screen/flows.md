# BIABYSS 사용자 흐름

## 1. 첫 실행

1. 앱이 native splash를 표시한다.
2. WebView가 로컬 번들을 열고 Loading Scene을 시작한다.
3. 필수 shader/font 설정을 준비한다. 음향 decode는 사용자 gesture 뒤로 미룰 수 있다.
4. 저장된 설정을 읽고 실패하면 기본값으로 복구한다.
5. Title Scene에 진입한다.

오류가 나면 빈 화면 대신 오류 종류와 재시도·안전한 low render tier 진입을 제공한다.

## 2. 시작

1. 사용자가 `표본 관찰 시작`을 선택한다.
2. Run seed와 RuleSet snapshot을 만든다.
3. World, Player, Nutrient와 안전 거리 밖 NPC를 생성한다.
4. 시작 보호 시간을 적용한다.
5. Gameplay Scene으로 전환하고 첫 InputIntent를 기다린다.

중복 tap으로 Run이 둘 생성되지 않게 command를 한 번만 수락한다.

## 3. 플레이

1. 첫 pointer/touch가 눌린 Canvas CSS 좌표를 조이패드 중심으로 잡는다.
2. 중심에서 현재 pointer까지의 방향과 반지름 비율을 world target과 `0..1` 강도로 변환한다.
3. 최신 InputIntent를 다음 simulation tick에서 소비한다.
4. 작은 Nutrient/Cell 접촉 시 흡수 event와 질량·점수 feedback을 표시한다. Cell은 prey Mass가 줄어드는 동안
   predator 방향으로 조각이 흐르고 predator가 같은 속도로 점진 성장한다.
5. 큰 Threat가 감지 범위에 들어오면 방향·크기·음향 cue를 한 번 제공한다.
6. pointer 해제·취소 또는 pause 전까지 고정 tick을 진행한다.
7. Player가 기준 Mass 이상 성장하면 camera가 부드럽게 zoom out하며 입력 world 변환도 넓어진 화면 범위를 따른다.

## 4. Pause와 Resume

Pause 진입 원인:

- 사용자가 pause 선택
- 앱 inactive/background
- 화면 회전 또는 렌더러 재설정
- 오디오 interruption처럼 즉시 gameplay를 멈춰야 하는 시스템 사건

Resume:

1. viewport와 WebGL context 상태를 확인한다.
2. 입력 포인터를 초기화한다.
3. frame clock accumulator를 폐기한다.
4. 3-2-1 countdown은 UX SPEC에서 선택하며 그동안 충돌을 진행하지 않는다.

## 5. Game Over

1. Player 흡수 판정이 나면 Simulation을 즉시 `GAME_OVER`로 고정한다.
2. 600ms 이하의 사망 표현을 재생한다.
3. final Mass, Score, duration, absorbed count와 최고 기록 여부를 표시한다.
4. `새 표본 배양`과 `타이틀로` 행동을 제공한다.
5. 재시작은 기존 GPU/view resource를 정리하고 새 Run seed로 World를 만든다.

## 6. 설정

설정은 Title, Pause에서 열 수 있다.

- master/music/sfx 음량
- 진동
- 감소 모션
- render tier: 자동/낮음/중간/높음
- 진단 정보: 개발 build에서만

Run 중 render tier를 낮추는 변경은 즉시 허용한다. 높이는 변경은 안전한 scene 전환 또는 다음 Run에 적용한다.

## 7. 종료·복구

- OS가 앱을 종료하면 진행 중 Run 복구를 보장하지 않는다.
- foreground 복귀 시 WebView가 살아 있으면 Pause에서 재개한다.
- WebView가 재생성되면 Title로 돌아가며 최고 기록과 설정만 복원한다.
