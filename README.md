# ShortFoot

InShorts-style football news app. Swipe 60-word AI-summarized cards, follow leagues/teams/players, get live match context inline.

## Stack

- **Mobile:** React Native (Expo SDK 52+), TypeScript, NativeWind (Tailwind), Phosphor icons, Reanimated 3
- **Backend:** Supabase (Postgres + Auth + Edge Functions + Realtime)
- **Ingestion worker:** Node/TS, runs on Supabase Edge Functions (cron) or Fly.io
- **AI:** Gemini 2.5 Flash for summarization + entity extraction
- **Stats:** football-data.org (MVP) → api-football (growth)
- **News source:** RSS from 15–20 publishers (BBC, Guardian, ESPN FC, OneFootball, Goal, etc.)

## Monorepo layout

```
shortfoot/
├── apps/
│   ├── mobile/          # Expo RN app
│   └── worker/          # RSS ingestion + Gemini pipeline
├── packages/
│   └── shared/          # Shared types, zod schemas, Supabase client
├── supabase/
│   └── migrations/      # SQL schema
└── docs/                # Architecture notes, phase plans
```

## Data flow

```
RSS feeds → worker (every 10 min) → Gemini (summarize + tag) → Supabase
                                                                   ↓
                                            RN app ← follow graph queries
                                              ↓
                                    football-data.org (live match widgets)
```

## Phase status

- [x] Phase 0: Foundations (this scaffold)
- [ ] Phase 1: Ingestion pipeline
- [ ] Phase 2: Core app (auth, onboarding, feed)
- [ ] Phase 3: Live layer (match widgets, standings)
- [ ] Phase 4: Push notifications + retention

See `docs/plan.md` for detail.
