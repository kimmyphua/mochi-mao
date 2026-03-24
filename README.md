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
