/**
 * Authoritative chant structure bounds (UI, template engine, and API validation).
 * Keep in sync with `backend/constants.py`.
 *
 * ## Why these numbers
 *
 * Cheer chants are typically short (repeatable, shoutable). Capping length keeps
 * outputs practical for squads and avoids wasting inference on oversized requests.
 *
 * ## Token budget (local AI — see `backend/app.py`)
 *
 * - **Ocean82** (`/generate-chant`): `max_new_tokens = max(128, targetLines * 20)`
 *   (~20 tokens per line headroom; continuation-style generation).
 * - **Llama creative** (`/generate-creative`): `n_ctx = 2048`, prompt ~400–600 tokens,
 *   generation `max(200, targetLines * 25)`.
 *
 * Worst case at these bounds: **4 × 6 = 24 lines** → ~480 new tokens (Ocean82) /
 * ~600 (creative), leaving comfortable margin inside typical small-model limits.
 * If you raise caps, re-check `max_new_tokens` / `max_tokens` in the backend.
 */
export const STRUCTURE_LIMITS = {
  stanzas: { min: 1, max: 4 },
  linesPerStanza: { min: 1, max: 6 },
} as const;

/** Maximum total lines when both dimensions are at their maxima. */
export const MAX_TOTAL_LINES =
  STRUCTURE_LIMITS.stanzas.max * STRUCTURE_LIMITS.linesPerStanza.max;
