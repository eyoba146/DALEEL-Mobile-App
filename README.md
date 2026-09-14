# DALEEL (ደሊል) — The Digital Bridge to Ethiopia

DALEEL is a full-stack diaspora and fintech application connecting the Ethiopian diaspora, expats, and international travelers to local Ethiopian services, real estate, investment, community, and curated travel heritage.

---

## Architecture Overview

This repository is organized as a clean full-stack monorepo:

```text
daleel-app/
├── client/              # Mobile Application (React Native / Expo SDK 52)
│   ├── app/             # File-based routing (Expo Router)
│   ├── components/      # Reusable UI components & design system
│   ├── lib/             # API client, auth context, favorites context
│   ├── theme/           # Design tokens (Midnight Navy, Warm Gold, Off White)
│   └── assets/          # Brand icons, fonts, sample data
│
└── server/              # Backend REST API (Express / Prisma / PostgreSQL)
    ├── prisma/          # Database schema and migrations
    ├── src/             # Express routes, controllers, middleware
    └── uploads/         # Local uploaded media storage
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Expo Go app on mobile (or Android/iOS emulator)

---

### 1. Backend Setup (`server/`)

```bash
cd server

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and verify DATABASE_URL and JWT_SECRET

# Sync Prisma schema to PostgreSQL
npx prisma db push

# Start development server
npm run dev
```
The backend will run on `http://localhost:4000`.

---

### 2. Mobile App Setup (`client/`)

```bash
cd client

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Set EXPO_PUBLIC_API_URL to your backend URL (e.g. http://localhost:4000/api or your local LAN IP)

# Start Expo development server
npx expo start
```
Scan the QR code with **Expo Go** on your device to launch the application.

---

## Security & Secrets
All secret credentials (`.env`, database passwords, JWT secrets, keystores) are strictly excluded from version control via `.gitignore`. Always use `.env.example` as a template for configuring new environments.
