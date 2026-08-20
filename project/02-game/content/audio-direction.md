# BIABYSS 음향 방향

## 1. 목표

음향은 물속·체내·진공 사이의 비현실적인 미시 공간을 만든다. 날카로운 UI 효과보다 둔탁한 저역, 유리처럼
짧은 고역과 점성 있는 변조를 사용한다.

## 2. Cue ID

| Cue | 의미 | 동시 재생 |
|---|---|---:|
| `run.start` | Run 시작 | 1 |
| `cell.drift` | 속도 변화가 큰 이동 | 1, loop 금지 |
| `nutrient.absorb` | 영양체 흡수 | 4 |
| `cell.absorb.small` | 작은 Cell 흡수 | 2 |
| `threat.near` | 큰 Threat 최초 접근 | 1, cooldown |
| `player.consumed` | 사망 | 1, 최우선 |
| `ui.confirm` | 시작·재시작 | 1 |

## 3. Mixer

- `master`, `music`, `ambience`, `sfx`, `ui` bus를 둔다.
- 같은 cue 폭주를 막기 위해 voice limit와 cooldown을 중앙 AudioSystem에서 관리한다.
- Mass가 커질수록 absorb cue pitch를 낮추되 gameplay 판정을 바꾸지 않는다.
- background 진입 시 모든 bus를 suspend하고 resume gesture 요구를 처리한다.
- 진동은 audio cue와 별도 native adapter이며 설정에서 독립적으로 끈다.

## 4. 자산 형식

원본 master는 무손실로 보관하고 앱에는 플랫폼 호환 압축본을 포함한다. 실제 codec과 bitrate는 기기 검증 후
manifest에 확정한다. 외부 스트리밍과 원격 CDN은 사용하지 않는다.
