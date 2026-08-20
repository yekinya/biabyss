# @biabyss/mobile

BIABYSS의 Vite + Pure JavaScript + Three.js 모바일 웹 애플리케이션입니다. `vite-plugin-singlefile`로
하나의 HTML bundle을 만들고 이후 Capacitor로 iOS·Android 앱을 패키징합니다.

명령은 workspace root인 `biabyss-apps/`에서 실행합니다.

```bash
nvm use
npm install
npm run dev:mobile
npm run check
```

앱 단독 명령이 필요하면 다음처럼 workspace를 지정합니다.

```bash
npm run test --workspace @biabyss/mobile
npm run build --workspace @biabyss/mobile
```
