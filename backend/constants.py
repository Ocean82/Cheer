"""Authoritative chant structure bounds. Keep in sync with src/constants/chantStructure.ts."""

# Sport chants are usually short; these caps match the frontend dropdowns.
STANZAS_MIN = 1
STANZAS_MAX = 4
LINES_PER_STANZA_MIN = 1
LINES_PER_STANZA_MAX = 6

# Worst-case line count (4 stanzas × 6 lines). Used when reasoning about token budgets.
MAX_TOTAL_LINES = STANZAS_MAX * LINES_PER_STANZA_MAX
