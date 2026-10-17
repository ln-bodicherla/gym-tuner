# Gym Tuner

A fitness tracking web app where users log workouts, injuries and goals, and Pro subscribers get AI-generated workout plans based on that data.

## Features

- Email sign-up, sign-in and password reset through Supabase Auth.
- A public landing page and privacy policy page.
- A dashboard with quick stats and a workout streak based on the user's workout schedule, plus a recent activity list and a full activity history page.
- A profile with fitness details: age, weight, height, fitness level, years of experience, workout schedule, min/max workout time, weekly goal, preferred workout types, availability and physical limitations.
- A workout tracker for logging workouts and viewing history.
- An injury tracker for reporting injuries, listing current ones and showing workout adjustments.
- A goal manager for creating and tracking fitness goals.
- AI workout plans (Pro): a Supabase Edge Function sends the user's profile, injuries, goals and recent workouts to Google Gemini and saves the generated plan. Plans can be marked as completed.
- Subscriptions through Stripe: a Gym Tuner Pro plan at $2.99/month with a 14-day free trial for first-time subscribers, checkout, cancel and reactivate, and a webhook that keeps subscription status in sync. Free users see locked cards for Pro features.
- Transactional emails (trial welcome, payment confirmation) sent with Resend and React Email templates.
- A site analytics page (sessions, page views, unique visitors, session length, top pages, devices, geography, daily traffic) fed by events the app records itself.
- A separate admin login and admin dashboard showing total, subscribed and trial users.

An "AI Insights" section is shown in the UI but currently displays a "Coming Soon" placeholder.

## Tech stack

- React 18, TypeScript, Vite
- Tailwind CSS, shadcn/ui (Radix UI), lucide-react icons
- React Router, TanStack Query, React Hook Form + Zod, Recharts, date-fns / date-fns-tz
- Supabase: Postgres (SQL migrations in `supabase/migrations`), Auth and Edge Functions (Deno)
- Stripe, Google Gemini API, Resend

The project was scaffolded with Lovable.

## Getting started

### Prerequisites

- Node.js and npm (a `bun.lockb` is also present if you prefer Bun)
- A Supabase project, and the Supabase CLI for applying migrations and deploying functions
- Stripe, Gemini and Resend accounts for the subscription, AI and email features

### Supabase client

The frontend imports its Supabase client from `src/integrations/supabase/client.ts`, but that file is not in the repository. Create it before building, exporting a `supabase` client made with `createClient` from `@supabase/supabase-js` with your project URL and anon key, typed with `Database` from `./types`.

### Database and Edge Functions

Apply the migrations and deploy the functions in `supabase/functions` to your Supabase project with the Supabase CLI. The functions read these secrets (set them with `supabase secrets set`):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `GEMINI_API_KEY`
- `RESEND_API_KEY`

Point a Stripe webhook at the deployed `stripe-webhook` function. A `customer-portal` function also exists, but the frontend does not call it yet.

### Run the frontend

```sh
npm install
npm run dev        # Vite dev server
npm run build      # production build
npm run build:dev  # development-mode build
npm run preview    # preview the production build
npm run lint
```

## Project structure

```
src/
├── pages/           Routes: Landing, Auth, Index (dashboard), Activity, Analytics, Admin, Privacy, NotFound
├── components/      Feature components (WorkoutTracker, InjuryTracker, GoalManager, WorkoutPlan,
│                    SubscriptionManager, AdminDashboard, ...) and shadcn/ui primitives in ui/
├── hooks/           Auth, admin auth, subscription, profile, analytics and activity logging hooks
├── contexts/        Activity context
├── config/          Pro feature list
├── utils/           Streak, activity and timezone helpers
└── integrations/    Generated Supabase types
supabase/
├── migrations/      SQL schema: profiles, workouts, workout_plans, goals, injuries, subscribers,
│                    activity_logs, analytics tables, admin tables
└── functions/       Edge Functions: generate-workout, create-checkout, check-subscription,
                     cancel-subscription, reactivate-subscription, customer-portal,
                     stripe-webhook, send-subscription-emails, test-email
```

## Status

Personal project, in active development.
