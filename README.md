# Sentimo

> Bawat piso, sinusubaybayan. — Every peso, tracked.

A personal finance tracker built for Filipinos. Calendar-based expense tracking, spending breakdown charts, budgeting, savings goals, accounts, receipt scanning, and smart notifications.

## Tech Stack

- **Frontend** — React + Vite
- **Auth** — Firebase Authentication (Email/Password + Google Sign-In)
- **Database** — Firestore (real-time, per-user, secured)
- **Hosting** — Vercel
- **PWA** — Installable on mobile (Add to Home Screen)

## Features

- 📅 Calendar-based transaction tracking (income, expenses, bills)
- ⚡ Quick Add — numpad expense logging in 1-2 taps
- 🧾 Receipt scanning — OCR auto-fills amount, date, category
- 📊 Spending breakdown — pie charts, monthly bar chart
- 🎯 Budget limits per category with overspending alerts
- 🔔 Smart notifications — bill reminders, budget warnings, goal alerts
- 💳 Accounts tracker — cash, bank, e-wallet balances
- ◎ Savings goals with progress tracking
- ☀/🌙 Dark/light mode toggle
- 🌍 Multi-currency support + live PHP exchange rates
- 📋 Transaction history with search, filter, sort
- 🖨 Monthly report PDF export
- ☁ Cloud sync across devices via Firestore
- 📲 PWA — installable on mobile

## Getting Started

```bash
git clone https://github.com/bryllemontesclaros/sentimo.git
cd sentimo
npm install
cp .env.example .env.local
# Fill in your Firebase config in .env.local
npm run dev
```

## Environment Variables

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Deploy Firestore Security Rules

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

## Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Add all `VITE_FIREBASE_*` env vars in Vercel project settings
4. Deploy
5. Add your Vercel URL to Firebase Console → Authentication → Authorized domains

## PWA — Install on Mobile

1. Open the deployed URL in Chrome (Android) or Safari (iOS)
2. Android: tap the menu → "Add to Home Screen"
3. iOS: tap the Share icon → "Add to Home Screen"

## Firestore Structure

```
users/{uid}/
  income/       { desc, amount, date, cat, recur, type, createdAt }
  expenses/     { desc, amount, date, cat, recur, type, createdAt }
  bills/        { name, amount, due, cat, freq, paid, createdAt }
  goals/        { name, target, current, date, createdAt }
  accounts/     { name, type, balance, color, notes, createdAt }
  budgets/      { cat, limit, createdAt }
  profile/main  { salary, paySchedule, currency }
```

## License

MIT
