# Samayal Arayayil

React Native app (Expo SDK 58, Expo Router, Supabase) built from the Figma file
**Samayal Arayayil — App Screens → "Onboarding v2"**.

## Screens

| # | Figma frame | Route |
|---|---|---|
| 01 | Splash | `src/app/index.tsx` |
| 02–04 | Intro · Decide / Family / Kitchen | `intro-decide`, `intro-family`, `intro-kitchen` |
| 05 | Sign up (name only) | `sign-up` |
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

The app uses the Supabase project **SUDARVEL's Project** (`soyaeuffzytrjojifvdz`), shared with
another app, so all Samayal tables are prefixed `samayal_`.

- Sign-up asks only for a name. Users are signed in **anonymously**
  (Authentication → Sign In / Providers → "Allow anonymous sign-ins" is on).
- `supabase/migrations/20261114000000_onboarding.sql` creates `samayal_profiles`,
  `samayal_households` and `samayal_household_members`; row-level security limits every
  user to their own rows. It is already applied to the project.
- `.env` (git-ignored) holds `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`;
  the same values are set as EAS environment variables for development, preview and production.

## Builds and OTA updates (EAS)

Expo project: `@sudarvel1234/Un-samayal-Arraiyil`. On Windows PowerShell use `npx.cmd`.

```bash
npx.cmd eas-cli@latest build -p android --profile preview          # installable APK
npx.cmd eas-cli@latest build -p android --profile production-aab   # Play Store bundle
npx.cmd eas-cli@latest update --channel preview --environment preview --message "what changed"
```

OTA updates reach builds on the same channel and app version; adding native packages or
changing the version needs a new build.

### Notes

- Reminders use `expo-notifications`, which needs a development build
  (`npx expo run:android` / `run:ios`) rather than Expo Go for full support.
- The home screen after "See tomorrow’s plan" is a placeholder; it isn’t in the Figma file yet.

## Scripts

```bash
npm run typecheck
npm run lint
```
