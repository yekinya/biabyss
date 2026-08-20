# @biabyss/mobile

BIABYSS의 Vite + React + PixiJS 모바일 웹 애플리케이션입니다. 브라우저에서 개발하고 이후 Capacitor로
iOS·Android 앱을 패키징합니다.

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
