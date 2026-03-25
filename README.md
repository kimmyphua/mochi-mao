# Mochi Mao

A cute mobile-first browser game built with React, TypeScript, and Vite.

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## Supabase Leaderboard Setup

This project now uses Supabase instead of `localStorage` for leaderboard scores.

### 1. Create a Supabase project

1. Open [Supabase](https://supabase.com/).
2. Create a new project.
3. Open `Project Settings` > `API`.
4. Copy:
   - `Project URL`
   - `anon public` key

### 2. Create the scores table

1. In Supabase, open `SQL Editor`.
2. Open `leaderboard.sql`
3. Run that SQL in the editor.

This creates the `scores` table and enables public read/insert policies for the leaderboard MVP.

### 3. Configure local environment

1. Copy `.env.example` to `.env.local`.
2. Fill in:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Configure GitHub Pages build secrets

1. Open your GitHub repository.
2. Click `Settings`.
3. In the left sidebar, click `Secrets and variables` > `Actions`.
4. Click `New repository secret`.
5. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

The GitHub Pages workflow reads those secrets during the production build.

## GitHub Pages Deploy

This repo is configured to deploy to GitHub Pages automatically with GitHub Actions on every push to `main`.

### Deploy Steps

1. Push this project to a GitHub repository.
2. In GitHub, open the repository.
3. Click `Settings`.
4. In the left sidebar, click `Pages`.
5. Under `Build and deployment`, set `Source` to `GitHub Actions`.
6. Push to the `main` branch.
7. Wait for the `Deploy To GitHub Pages` workflow to finish in the `Actions` tab.
8. Re-open `Settings` > `Pages` and use the published site URL shown there.

### Notes

- The Vite `base` path is set automatically in GitHub Actions from the repository name.
- Local production builds fall back to relative asset paths so `npm run build` still works before the repo is connected to GitHub.
- If the Supabase env vars are missing, the leaderboard will load empty and score saving will be disabled.
