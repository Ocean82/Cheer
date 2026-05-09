# Cheer Chant Generator

A small web app for cheer squads to generate school-friendly, sport-specific chants using your mascot and your opponent's.

The app supports two generation paths:

- Built-in template engine (always available)
- Optional local AI server (CPU-only) using your own model

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
- Optional for local AI: Python 3.10+

## Getting started

```bash
npm install
npm run dev
```

Open the URL Vite prints (e.g. `http://localhost:5173/`).

## Local AI mode (Ocean82 lyrics model)

This project can call a local CPU-only model server and falls back to templates if AI output is unavailable or invalid.

### 1) Start Python server

From project root:

```bash
python -m venv backend/.venv
backend/.venv/Scripts/activate
pip install -r backend/requirements.txt
set CHEER_MODEL_PATH=D:\MY-MODELS\models--Ocean82--lyrics-generator
uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

### 2) Enable frontend AI calls

```bash
copy .env.example .env
```

`.env` values:

```env
VITE_USE_LOCAL_AI=true
VITE_AI_API_URL=http://127.0.0.1:8000/generate-chant
```

Then run:

```bash
npm run dev
```

If AI mode is disabled or the server/model fails, the app uses the built-in template generator automatically.

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
    chantService.ts            # Template generation + optional local AI bridge
backend/
  app.py                       # FastAPI local AI endpoint
  requirements.txt             # Python dependencies for local inference
  utils/
    cn.ts                      # Class name helper (tailwind-merge + clsx)
```

More detail on product behavior lives in [FEATURES.md](./FEATURES.md).

## License

This project is licensed under the [MIT License](./LICENSE).
