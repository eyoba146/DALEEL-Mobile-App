# DALEEL — Frontend (Expo / React Native)

## What's built so far
- Onboarding (user type → country → language)
- Register / Login (calls a real backend — see below)
- Bottom-tab app shell: Home, Explore, Services, Saved, Profile
- Home dashboard, Explore Ethiopia, Services directory — using realistic
  sample data (`assets/data/sample.ts`)
- Profile screen — shows real logged-in user data, logout works
- Design tokens in `theme/tokens.ts` (Deep Navy + Warm Gold + Off White)

## Not built yet (cut for the Monday deadline — see chat for the plan)
Marketplace, Investment section, Events (list view only used on Home so far),
Notifications center, multilingual text swap, Admin dashboard, Business
portal.

## Run it locally

```bash
unzip daleel-app-frontend.zip -d daleel-app
cd daleel-app
npm install --legacy-peer-deps
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android) to run it on your phone —
no Mac or Android Studio required.

## Wiring to your backend

The app expects a backend at `http://localhost:4000/api` by default
(see `lib/api.ts`). To point it at a real server:

1. Create a `.env` file in the project root:
   ```
   EXPO_PUBLIC_API_URL=https://your-backend-url.com/api
   ```
2. The backend needs these routes for what's already wired up:
   - `POST /auth/register` — body: `{ name, email, password, userType, country, language }` → returns `{ user, token }`
   - `POST /auth/login` — body: `{ email, password }` → returns `{ user, token }`
   - `GET /auth/me` — header: `Authorization: Bearer <token>` → returns the user

   `user` shape:
   ```ts
   {
     id: string;
     name: string;
     email: string;
     userType: 'diaspora' | 'foreign_resident';
     country: string;
     language: 'en' | 'am';
   }
   ```

Once those three routes exist, register → login → profile will work
end-to-end for real, not just against sample data.
