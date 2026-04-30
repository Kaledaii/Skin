# Skin Nepal

Nepal-first skincare routine app built with Expo React Native for Web and Mobile. It includes onboarding, routine generation, subscription gates, localization, progress tracking, products, short tips, community Q&A, and Firebase integration stubs.

## Run

```powershell
npm install
npm run web
```

## Firebase

Copy `.env.example` to `.env.local` and add Firebase web app values. The app currently runs with local mock data and local state; Firebase methods are isolated in `src/shared/services/firebase.ts` for production wiring.
