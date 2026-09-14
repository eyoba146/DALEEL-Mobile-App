# DALEEL — Backend (Express + Prisma + PostgreSQL)

## What's built
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` — JWT auth, bcrypt password hashing
- `GET /api/destinations`, `GET /api/services` (optional `?category=`), `GET /api/events` — real data endpoints matching the frontend's sample data
- `GET/POST/DELETE /api/favorites` — save/unsave places, services, events (auth required)
- Zod validation on all inputs, central error handler, CORS enabled

## Not built yet
Admin dashboard routes, marketplace, investment section, notifications,
business-provider portal. These are real work — flagged as phase 2.

## ⚠️ Important — verify this yourself
This backend was written in a sandboxed environment that could not reach
Prisma's binary CDN, so **I could not run `prisma generate` or actually
compile this against a live database here.** The code is written
correctly against the schema, but you must verify it runs before
demoing it Monday. Don't skip the steps below.

## Setup

### 1. Get a PostgreSQL database
Fastest free options if you don't have Postgres installed locally:
- [Neon](https://neon.tech) or [Supabase](https://supabase.com) — free tier, gives you a `DATABASE_URL` in under 2 minutes
- Or local Postgres if you already have it installed

### 2. Configure environment
```bash
cd daleel-backend
cp .env.example .env
# edit .env — paste your real DATABASE_URL, set a random JWT_SECRET
```

### 3. Install, generate, migrate, seed
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

### 4. Run it
```bash
npm run dev
```
Server runs at `http://localhost:4000`. Test it:
```bash
curl http://localhost:4000/api/health
# {"ok":true}
```

### 5. Point the frontend at it
In the **frontend** project root, create `.env`:
```
EXPO_PUBLIC_API_URL=http://localhost:4000/api
```
If testing on a physical phone via Expo Go, `localhost` won't work —
use your computer's local network IP instead (e.g. `http://192.168.1.x:4000/api`),
and make sure your phone is on the same WiFi network.

## Quick end-to-end test
1. Start the backend (`npm run dev`)
2. Start the frontend (`npx expo start`)
3. In the app: complete onboarding → Register with a real email/password
4. You should land on Home, and the Profile tab should show your real
   name, email, and country — pulled from the database, not sample data
