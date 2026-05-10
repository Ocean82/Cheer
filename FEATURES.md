# Cheer Chant Generator - Features

## Overview

A fun and interactive web app for cheerleaders to generate competitive, school-friendly chants tailored to their sport and school mascot.

## Key Features

### 1. **Sport Selection**

   - Choose from 10 different sports:
     - Football
     - Basketball
     - Volleyball
     - Cheerleading
     - Soccer
     - Track & Field
     - Wrestling
     - Baseball
     - Softball
     - Tennis

### 2. **Customizable Mascots**

   - Enter your school mascot
   - Enter the competitor mascot (optional but encouraged for rivalry flavor)
   - Both are woven into generated lines when relevant

### 3. **Sport-Specific Chants**

   - Each sport has unique, sport-relevant terminology injected into templates
   - Football: gridiron, touchdowns, etc.
   - Basketball: fast breaks, defense, etc.
   - Other sports follow the same pattern

### 4. **Chant Structure**

   - **Stanzas:** 1–4 (short, repeatable segments suited to sidelines and timeouts)
   - **Lines per stanza:** 1–6
   - **Total lines:** up to **24** at maximum settings (4 × 6). Typical use is smaller for fast call-and-response or sideline chants.
   - Bounds are shared between the UI, template engine, and local AI API (`src/constants/chantStructure.ts` / `backend/constants.py`) so generation stays within what the local models budget for (see comments in those files).

### 5. **Generation Modes**

   - **Standard:** Three template-based variations per click (fast, works offline).
   - **Creative:** Optional single chant via local **Llama-Song-Stream-3B** when the Python server and GGUF model are configured (`/generate-creative`).
   - With **local AI** enabled for Ocean82 (`/generate-chant`), standard mode may label outputs “Local AI” when inference succeeds and passes validation; otherwise templates are used automatically.

### 6. **Styles**

   - Standard rhyming chants
   - Call-and-response patterns (some lines support LEADER/CROWD highlighting when prefixed that way)
   - Aggressive / high-energy phrasing

### 7. **User-Friendly Interface**

   - Clean layout with school color accents (names + optional color pickers)
   - One-click copy per chant card
   - Loading states and basic error messaging
   - Responsive layout for desktop and mobile

### 8. **Content Quality**

   - Templates aim for school-appropriate, energetic, sport-aware lines
   - AI output is validated for short, chant-like lines before display (with fallback to templates)

## How to Use

1. Pick a **chant style** and **sport**
2. Set **structure** (stanzas × lines per stanza)
3. Enter **school colors** (names and optional UI accents)
4. Enter **your mascot** and optionally **competitor mascot**
5. Toggle **Creative Mode** only if your local creative model server is running
6. Click **Generate Chants** (or **Generate Creative Chant** in creative mode)
7. **Copy** the chant you like

## Technical Stack

- React with TypeScript
- Vite for development and production builds
- Tailwind CSS for styling
- Lucide React for icons
- Optional FastAPI backend for local inference (see main README)
