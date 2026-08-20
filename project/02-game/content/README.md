# BIABYSS 콘텐츠와 리소스 지도

BIABYSS의 핵심 시각은 정적 일러스트가 아니라 runtime에서 생성되는 세포, 유체와 발광이다. 따라서 콘텐츠
문서는 “이미지 목록”보다 절차적 재료·색·shader·audio cue와 성능 tier를 먼저 관리한다.

## 문서

| 문서 | 책임 |
|---|---|
| [`visual-direction.md`](visual-direction.md) | 형태, 색, 레이어, shader와 게임 피드백 |
| [`audio-direction.md`](audio-direction.md) | cue, mixer, 동시 재생과 앱 생명주기 |
| [`resources/README.md`](resources/README.md) | 자산 위치, 형식, 이름, 생성·검수 흐름 |
| [`resources/asset-manifest.md`](resources/asset-manifest.md) | 필요한 자산과 현재 상태 |

## 콘텐츠 원칙

1. 플레이어는 cyan 계열로 항상 식별 가능해야 한다.
2. 위협·먹이 관계는 색만으로 전달하지 않고 크기, 외곽 pulse와 motion으로 함께 전달한다.
3. 세포 내부는 세균 컨셉에 맞춰 뉴클레오이드 DNA, 리보솜, 과립과 기포를 사용한다. 막으로 둘러싸인 핵은
   가상 생물 설정이 문서화된 경우에만 사용한다.
4. 타 게임의 스크린샷, 세포 이미지, 로고, 사운드를 placeholder로도 포함하지 않는다.
5. runtime 외부 URL을 자산 출처로 사용하지 않는다. 모든 필수 자산은 앱 번들에 포함한다.
6. 생성형 자산은 생성 source, prompt, license/사용 권한, 편집본과 승인 상태를 manifest에 기록한다.
7. procedural shader도 자산이다. shader ID, uniform 계약과 fallback을 manifest에서 추적한다.

## 승인 상태

- `PLANNED`: 필요성만 합의
- `DRAFT`: 구현 또는 생성 중
- `TECH_QA`: 형식·크기·성능 검증 완료
- `ART_QA`: 시각·음향 방향 검수 완료
- `APPROVED`: 제품 사용 승인
- `REJECTED`: 사용 금지, 사유 기록
