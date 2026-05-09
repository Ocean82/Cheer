# Cheer Chant Generator

A small web app for cheer squads to generate school-friendly, sport-specific chants using your mascot and your opponent’s. This is the first prototype: templates run entirely in the browser—no server required.

## Features

- **Sports** — Football, basketball, volleyball, cheerleading, soccer, track & field, wrestling, baseball, softball, and tennis.
- **Inputs** — Your school mascot and the competitor mascot are woven into curated lines.
- **Output** — 10–15 lines per generation, copied to the clipboard in one click.
- **Deploy** — Production build is a **single HTML file** (via `vite-plugin-singlefile`), easy to host on any static file host.

## Tech stack

- [React](https://react.dev/) 19 + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) 7
- [Tailwind CSS](https://tailwindcss.com/) 4
- [Lucide](https://lucide.dev/) icons

## Requirements

- [Node.js](https://nodejs.org/) 20+ (recommended; aligns with current Vite/React tooling)

## Getting started

```bash
npm install
npm run dev
```

Open the URL Vite prints (e.g. `http://localhost:5173/`).

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build to `dist/` (single inlined HTML) |
| `npm run preview` | Serve the production build locally |

## Project layout

```
src/
  App.tsx                      # Root layout
  main.tsx                     # Entry
  index.css                    # Tailwind entry
  components/
    CheerChantGenerator.tsx    # Main UI
  services/
    chantService.ts            # Sport templates and generation
  utils/
    cn.ts                      # Class name helper (tailwind-merge + clsx)
```

More detail on product behavior lives in [FEATURES.md](./FEATURES.md).

## License

This project is licensed under the [MIT License](./LICENSE).
