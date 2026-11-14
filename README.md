# Samayal Arayayil

React Native app (Expo SDK 58, Expo Router, Supabase) built from the Figma file
**Samayal Arayayil — App Screens → "Onboarding v2"**.

## Screens

| # | Figma frame | Route |
|---|---|---|
| 01 | Splash | `src/app/index.tsx` |
| 02–04 | Intro · Decide / Family / Kitchen | `intro-decide`, `intro-family`, `intro-kitchen` |
| 05 | Sign up | `sign-up` |
| 06 | Verify OTP | `verify` |
| 07–11 | Q1 Who · Q2 Diet · Q3 Dishes · Q4 Won’t eat · Q5 When you plan | `who`, `diet`, `dishes`, `dislikes`, `plan-time` |
| 12 | Invite family | `invite` |
| 13 | Turn on reminders | `reminders` |
| 14 | Setting up | `setting-up` |
| 15 | First plan ready | `ready` |

Design tokens (colours, Nunito / Space Mono text styles, shadow) are in `src/theme`,
and every illustration and icon is the original export from Figma in `assets/`.

## Setup

```bash
npm install
cp .env.example .env   # then add your Supabase URL and anon key
npx expo start
```

### Supabase

1. Create a project at supabase.com and copy **Project URL** and **anon key** into `.env`.
2. Run `supabase/migrations/20261114000000_onboarding.sql` in the SQL editor.
   It creates `profiles`, `households` and `household_members` with row-level security.
3. **Authentication → Providers**: enable **Phone** (with an SMS provider such as Twilio) for
   the OTP flow, and **Google** for "Continue with Google".
4. **Authentication → URL Configuration**: add `samayal://auth/callback` as a redirect URL.

Without `.env` the app still runs end to end in demo mode: OTP and Google sign-in are
skipped and nothing is saved.

### Notes

- Reminders use `expo-notifications`, which needs a development build
  (`npx expo run:android` / `run:ios`) rather than Expo Go for full support.
- The home screen after "See tomorrow’s plan" is a placeholder; it isn’t in the Figma file yet.

## Scripts

```bash
npm run typecheck
npm run lint
```
