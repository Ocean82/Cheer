import { describe, expect, it } from 'vitest';
import { MAX_TOTAL_LINES, STRUCTURE_LIMITS } from '../constants/chantStructure';
import { clampStructure } from './chantService';

describe('clampStructure', () => {
  it('clamps stanza and lines-per-stanza into STRUCTURE_LIMITS', () => {
    expect(clampStructure({ stanzas: -5, linesPerStanza: -1 })).toEqual({
      stanzas: STRUCTURE_LIMITS.stanzas.min,
      linesPerStanza: STRUCTURE_LIMITS.linesPerStanza.min,
    });

    expect(clampStructure({ stanzas: 100, linesPerStanza: 100 })).toEqual({
      stanzas: STRUCTURE_LIMITS.stanzas.max,
      linesPerStanza: STRUCTURE_LIMITS.linesPerStanza.max,
    });
  });

  it('never exceeds MAX_TOTAL_LINES worth of content shape when dimensions fight', () => {
    const shape = clampStructure({ stanzas: STRUCTURE_LIMITS.stanzas.max, linesPerStanza: STRUCTURE_LIMITS.linesPerStanza.max });
    expect(shape.stanzas * shape.linesPerStanza).toBeLessThanOrEqual(MAX_TOTAL_LINES);
  });
});
