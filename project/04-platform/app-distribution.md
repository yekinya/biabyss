# BIABYSS 앱 패키징과 배포

## 1. 선택

모바일 iOS·Android의 1차 셸은 **Capacitor**를 사용한다. BIABYSS는 Vite/Three.js 웹 코드이며,
Capacitor는 기존 web app의 `dist/`를 native project에 포함하고 필요한 native API만 plugin adapter로 열 수 있다.

Tauri 2는 desktop까지 단일 체계로 확장할 때 재검토한다. 현재 모바일 앱만을 위해 Rust toolchain과 별도
runtime 경계를 추가할 이점은 작다.

## 2. 배포 플랫폼

추천 조합:

- GitHub Actions: feature/develop/main PR의 typecheck, lint, test, web build
- Codemagic: macOS build machine, iOS/Android signing, TestFlight와 Google Play track 배포
- App Store Connect TestFlight: iOS staging
- Google Play Internal testing: Android staging
- App Store / Google Play production: main 릴리스

Codemagic 설정과 signing secret은 실제 Apple/Google 개발자 계정이 준비되는 packaging SPEC에서 추가한다.

## 3. 브랜치와 채널

| Git ref | 결과 | 외부 배포 |
|---|---|---|
| `feature/*` | web quality gate | 없음 |
| `develop` | unsigned native build + staging 후보 | TestFlight internal / Play internal |
| `main` | signed release candidate | App Store / Play production |
| version tag | immutable release evidence | 해당 store build와 연결 |

웹 `dist/`는 공개 URL에 운영 배포하지 않는다. 로컬 개발 서버와 CI artifact는 검증 전용이다.

## 4. 빌드 원칙

1. Node와 package lock으로 web build를 재현한다.
2. `biabyss-apps/`에서 `npm run build`한 mobile 산출물을 Capacitor `webDir`에 sync한다.
3. 같은 commit SHA에서 iOS와 Android를 만든다.
4. signing은 CI secret store에서 수행한다.
5. `.p8`, certificate, provisioning profile, keystore와 비밀번호를 Git에 저장하지 않는다.
6. bundle ID, version name, build number와 commit SHA를 release 기록에 남긴다.

## 5. 스토어 대응

- 앱은 원격 웹사이트를 감싼 WebView가 아니라 로컬 번들로 완결된 게임이어야 한다.
- 첫 실행과 전체 Run이 오프라인에서 동작해야 한다.
- placeholder, 깨진 URL과 미완성 메뉴를 제출 build에 포함하지 않는다.
- iOS WebKit/WKWebView와 Android system WebView 실기기에서 안정성을 검증한다.
- 개인정보 수집이 없다면 store privacy metadata도 실제 동작과 일치하게 유지한다.
- native plugin을 추가하면 사용 목적, 권한 문구, 거부 시 fallback을 같은 SPEC에서 설계한다.

## 6. Rollback

스토어 앱은 서버처럼 즉시 binary rollback할 수 없다.

- staging track에서 먼저 검증한다.
- Android는 staged rollout을 사용한다.
- iOS는 phased release를 사용하고 문제 시 rollout을 중단한다.
- 저장 schema는 이전 앱과 호환되게 forward migration한다.
- 치명적 문제는 수정 patch를 새 build number로 제출한다.
- 원격 code push로 심사를 우회하지 않는다.

## 7. Desktop 확장 조건

Windows/macOS 배포 요구가 생기면 Tauri 2를 별도 SPEC으로 평가한다. Canvas/Simulation 코드는 유지하되
input, window lifecycle, filesystem와 store 서명 경계를 새 adapter로 추가한다.
