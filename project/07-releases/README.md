# BIABYSS 릴리스 기록

스토어에 전달할 버전은 `project/07-releases/<semver>/`에 다음 증거를 남긴다.

```text
<version>/
├── patch-notes.md
├── release-spec.md
├── verification.md
└── deployment.md
```

- `patch-notes.md`: 사용자에게 보이는 변경
- `release-spec.md`: 포함 SPEC, 저장 호환성과 rollout/rollback
- `verification.md`: Q1~Q5 결과, commit SHA와 기기 matrix
- `deployment.md`: bundle ID, build number, artifact와 TestFlight/Play/App Store 상태

스토어에 제출되지 않은 feature/develop build를 RELEASED로 기록하지 않는다. 과거 버전 기록은 새 버전의 현재
설계를 설명하기 위해 수정하지 않는다.
