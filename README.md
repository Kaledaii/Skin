# Prabha Skincare

Prabha Skincare is a Nepal-first skincare routine app built with Expo React Native for Android, web, and future iOS support. The app focuses on practical daily guidance for Nepali users: skin concerns, local weather, water quality, food habits, festivals, budget-friendly products, and routine consistency.

## Download Beta

Android testers can install the current beta APK here:

[Download Prabha Skincare Android Beta](https://expo.dev/accounts/kale_dai/projects/prabha-skincare/builds/0af71b88-4815-48d7-b6c8-7c7aa2545ca3)

Notes for testers:

- Open the link on an Android phone, preferably in Chrome.
- Android 7.0 or newer is recommended.
- Because this APK is installed outside Google Play, some phones may show a Play Protect warning. Choose `Install anyway` only if you trust this beta build.
- If installation fails, enable `Install unknown apps` for Chrome or your browser.

## Core Features

- Personalized onboarding quiz for symptoms, skin type, lifestyle, diet, junk food intake, water source, weather context, and current routine.
- Rule-based skin concern matching using a local knowledge base.
- Morning, evening, and weekly skincare routine generation.
- Nepali and English localization support.
- Light and dark mode with mobile-first UI.
- Today dashboard with routine progress, habit score, daily micro-tips, and adaptive guidance.
- Nepal-specific seasonal modes: monsoon, Dashain/Tihar, winter, summer/extreme heat, exam mode, and festival mode.
- Water-quality guidance for Kathmandu hard water, Terai well water, and mountain/tanker/chlorinated water.
- Diet and lifestyle cards with clear do/don't guidance.
- Progress tracking with weekly photo logs, hydration, sleep, consistency, and habit score.
- Product recommendations with budget filters, trust score, sponsor labels, category sections, and QR/manual payment premium flow.
- Tips feed with favorites, saved tips, and share actions.
- Learn section with articles, healthy habits, glossary, nutrients, and skin education.
- Community Q&A and expert/trust layer planning.
- Hidden admin panel for manual eSewa/Khalti payment review.
- In-app review form so beta testers can submit star ratings and written feedback.

## Tech Stack

- Expo React Native
- Expo Router
- TypeScript
- Firebase Auth, Firestore, Storage-ready sync
- Expo Notifications
- Cloudinary image upload fallback for payment screenshots
- Local rule-based skincare recommendation engine
- EAS Build for Android beta APK distribution

## Local Development

Install dependencies:

```powershell
npm install
```

Run locally:

```powershell
npm run web
```

Run typecheck:

```powershell
npm run typecheck
```

Create an Android beta build:

```powershell
npm run build:android:preview
```

## Environment Setup

Copy `.env.example` to `.env.local` and fill Firebase/Cloudinary values for local development.

Important:

- Do not commit `.env`, `.env.local`, service account JSON, keystores, or native Firebase config files.
- Public Expo builds need the same `EXPO_PUBLIC_*` values added in the Expo/EAS `preview` environment.
- Firestore rules must be deployed before real tester submissions are expected to appear in admin.

Deploy Firestore rules:

```powershell
npx firebase deploy --project prabha-skin --only firestore:rules
```

## Privacy And Safety

Prabha provides skincare education and routine guidance only. It is not a medical diagnosis or treatment app. Users with painful acne, bleeding, infection signs, severe irritation, spreading rashes, or long-term flare-ups should consult a dermatologist or qualified clinician.

Progress photos and payment screenshots should be handled carefully. Production release should include stricter Firebase rules, storage retention policies, and formal privacy/legal review.

## Repository Notes

Some local knowledge/database JSON files are intentionally ignored from Git to protect proprietary content. A cloned public repository may need replacement database files before it can build with the full local recommendation engine.
