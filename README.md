# Sentimo

> Bawat piso, sinusubaybayan.

A personal finance tracker built for Filipinos. Track your salary, expenses, bills, and savings goals — all in one place with a calendar view.

## Tech Stack

- **Frontend** — React + Vite
- **Auth** — Firebase Authentication (Email/Password + Google Sign-In)
- **Database** — Firebase Firestore (real-time, per-user)
- **Hosting** — Vercel

## Features

- Login / Register (Email + Google)
- Dashboard — monthly income, expenses, net balance, savings rate
- Calendar — monthly view with transaction dots, click any day to add/view
- Income tracker — salary, freelance, recurring support
- Expense / purchase tracker — categories, recurring
- Bills — due date tracking, paid/unpaid toggle
- Savings goals — progress bar, contribution tracking

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/bryllemontesclaros/sentimo.git
cd sentimo
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your Firebase config:

```bash
cp .env.example .env.local
```

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run locally

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

## Firestore Structure

```
users/
  {uid}/
    income/       { desc, amount, date, cat, recur, type, createdAt }
    expenses/     { desc, amount, date, cat, recur, type, createdAt }
    bills/        { name, amount, due, cat, freq, paid, createdAt }
    goals/        { name, target, current, date, createdAt }
```

## Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Add all `VITE_FIREBASE_*` environment variables in Vercel project settings
4. Deploy

## License

MIT
