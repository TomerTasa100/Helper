# Helper

> ⚠️ Work in progress — early stage.

A web app for booking appointments between clients and therapists. The data and auth layer is built on **Supabase** (auth + a `profiles` table with `user` / `therapist` roles, plus `appointment` records); the Next.js frontend is still being built out.

> [TODO] Tomer — confirm/replace this one-line description with what Helper is actually meant to do.

## Tech stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS · Supabase (auth + database)

## Setup

```bash
npm install

# configure Supabase — copy the example env and fill in your project values
cp env.example .env.local
# set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Run

```bash
npm run dev      # start the dev server (http://localhost:3000)
npm run build    # production build
npm run lint     # ESLint
```

## Status

- [x] Supabase auth + profile/role data layer (`services/api.ts`)
- [ ] [TODO] Therapist browsing / appointment booking UI
- [ ] [TODO] Dashboard
- [ ] [TODO] Screenshot once there's a real UI
