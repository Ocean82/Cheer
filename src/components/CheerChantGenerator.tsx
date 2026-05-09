import { useCallback, useState } from 'react';
import type { ChantSource, CheerStructure } from '../services/chantService';
import { generateChant, STRUCTURE_LIMITS } from '../services/chantService';
import { Zap, Music, Layers, Rows3, Palette, Check } from 'lucide-react';

const SPORTS = [
  'Football',
  'Basketball',
  'Volleyball',
  'Cheerleading',
  'Soccer',
  'Track & Field',
  'Wrestling',
  'Baseball',
  'Softball',
  'Tennis',
] as const;

const DEFAULT_HEX_PRIMARY = '#5b21b6';
const DEFAULT_HEX_SECONDARY = '#db2777';

function rangeInclusive(min: number, max: number): number[] {
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

export function CheerChantGenerator() {
  const [sport, setSport] = useState<string>('Football');
  const [schoolMascot, setSchoolMascot] = useState('');
  const [competitorMascot, setCompetitorMascot] = useState('');
  const [stanzas, setStanzas] = useState(2);
  const [linesPerStanza, setLinesPerStanza] = useState(4);
  const [primaryColorName, setPrimaryColorName] = useState('Purple');
  const [secondaryColorName, setSecondaryColorName] = useState('Gold');
  const [primaryHex, setPrimaryHex] = useState(DEFAULT_HEX_PRIMARY);
  const [secondaryHex, setSecondaryHex] = useState(DEFAULT_HEX_SECONDARY);
  const [chant, setChant] = useState('');
  const [chantSource, setChantSource] = useState<ChantSource | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  const totalLinesPreview = stanzas * linesPerStanza;

  const handleGenerateChant = async () => {
    if (!schoolMascot.trim() || !competitorMascot.trim()) {
      setError('Please enter both your school mascot and the competitor mascot.');
      return;
    }

    const structure: CheerStructure = {
      stanzas,
      linesPerStanza,
    };

    setError('');
    setLoading(true);
    setCopyState('idle');
    try {
      const result = await generateChant(sport, schoolMascot, competitorMascot, structure, {
        primary: primaryColorName,
        secondary: secondaryColorName,
      });
      setChant(result.chant);
      setChantSource(result.source);
    } catch (err) {
      setError('Failed to generate chant. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = useCallback(async () => {
    if (!chant) return;
    try {
      await navigator.clipboard.writeText(chant);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('error');
      window.setTimeout(() => setCopyState('idle'), 2500);
    }
  }, [chant]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Music className="h-8 w-8" style={{ color: primaryHex }} />
          <h1 className="text-4xl font-bold text-gray-900">Cheer Chant Generator</h1>
          <Music className="h-8 w-8" style={{ color: secondaryHex }} />
        </div>
        <p className="text-lg text-gray-600">
          Tune structure, weave in school colors in the chant, then generate.
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-8 space-y-6">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Layers className="h-4 w-4" style={{ color: primaryHex }} />
              Structure
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Stanzas</label>
                <select
                  value={stanzas}
                  onChange={(e) => setStanzas(Number(e.target.value))}
                  aria-label="Number of stanzas"
                  className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 text-gray-800 transition focus:border-purple-500 focus:outline-none"
                  style={{
                    borderColor: `${primaryHex}33`,
                  }}
                >
                  {rangeInclusive(
                    STRUCTURE_LIMITS.stanzas.min,
                    STRUCTURE_LIMITS.stanzas.max,
                  ).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'stanza' : 'stanzas'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-gray-600">
                  <Rows3 className="h-3.5 w-3.5 shrink-0" />
                  Lines per stanza
                </label>
                <select
                  value={linesPerStanza}
                  onChange={(e) => setLinesPerStanza(Number(e.target.value))}
                  aria-label="Lines per stanza"
                  className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 text-gray-800 transition focus:border-purple-500 focus:outline-none"
                  style={{ borderColor: `${secondaryHex}33` }}
                >
                  {rangeInclusive(
                    STRUCTURE_LIMITS.linesPerStanza.min,
                    STRUCTURE_LIMITS.linesPerStanza.max,
                  ).map((n) => (
                    <option key={n} value={n}>
                      {n} lines
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              About <span className="font-semibold text-gray-700">{totalLinesPreview}</span> lines total (
              {stanzas} × {linesPerStanza}), grouped with blank lines between stanzas.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-gray-400">
              Lines follow the curated template order (wrapping cleanly) so each stanza flows; each new
              chant picks a random starting point for variety.
            </p>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Palette className="h-4 w-4" style={{ color: secondaryHex }} />
              School colors
            </label>
            <p className="mb-4 text-xs text-gray-500">
              Names appear in chant lines (say them how you cheer). Swatches personalize buttons and headings.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Primary—chant</label>
                <input
                  type="text"
                  value={primaryColorName}
                  onChange={(e) => setPrimaryColorName(e.target.value)}
                  placeholder="e.g. Navy, Crimson"
                  className="mb-2 w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none"
                  style={{
                    borderColor: `${primaryHex}55`,
                    boxShadow: `inset 0 0 0 1px ${primaryHex}18`,
                  }}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryHex}
                    onChange={(e) => setPrimaryHex(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
                    aria-label="Primary accent color"
                  />
                  <span className="text-xs text-gray-500">Accent (UI)</span>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Secondary—chant</label>
                <input
                  type="text"
                  value={secondaryColorName}
                  onChange={(e) => setSecondaryColorName(e.target.value)}
                  placeholder="e.g. Gold, Silver"
                  className="mb-2 w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none"
                  style={{
                    borderColor: `${secondaryHex}55`,
                    boxShadow: `inset 0 0 0 1px ${secondaryHex}18`,
                  }}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryHex}
                    onChange={(e) => setSecondaryHex(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
                    aria-label="Secondary accent color"
                  />
                  <span className="text-xs text-gray-500">Accent (UI)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sport */}
        <div className="mb-6 border-t border-gray-100 pt-6">
          <label className="mb-2 block text-sm font-semibold text-gray-700">Sport</label>
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            aria-label="Sport"
            className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-gray-800 transition focus:outline-none"
            style={{ borderColor: `${primaryHex}40` }}
          >
            {SPORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-gray-700">Your school mascot</label>
          <input
            type="text"
            value={schoolMascot}
            onChange={(e) => setSchoolMascot(e.target.value)}
            placeholder="e.g., Tigers, Eagles, Dragons"
            className="w-full rounded-lg border-2 px-4 py-3 text-gray-900 transition placeholder:text-gray-400 focus:outline-none"
            style={{ borderColor: `${primaryHex}40` }}
          />
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-gray-700">Competitor mascot</label>
          <input
            type="text"
            value={competitorMascot}
            onChange={(e) => setCompetitorMascot(e.target.value)}
            placeholder="e.g., Lions, Bears, Wolves"
            className="w-full rounded-lg border-2 px-4 py-3 text-gray-900 transition placeholder:text-gray-400 focus:outline-none"
            style={{ borderColor: `${secondaryHex}40` }}
          />
        </div>

        {error && (
          <div role="alert" className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-red-800">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGenerateChant}
          disabled={loading}
          className="w-full rounded-lg px-6 py-3 font-bold text-white shadow-sm transition hover:opacity-95 hover:shadow-md disabled:opacity-45"
          style={{
            background: `linear-gradient(90deg, ${primaryHex}, ${secondaryHex})`,
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Generating chant…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Zap className="h-5 w-5" />
              Generate chant
            </span>
          )}
        </button>

        {chant && (
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-800">Your chant</h2>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  chantSource === 'ai'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
                title={chantSource === 'ai' ? 'Generated by local Ocean82 model' : 'Generated by built-in template engine'}
              >
                {chantSource === 'ai' ? 'Engine: Local AI' : 'Engine: Template'}
              </span>
            </div>
            <div
              className="whitespace-pre-wrap rounded-lg border border-gray-100 p-6 leading-relaxed text-gray-900"
              style={{
                background: `linear-gradient(145deg, ${primaryHex}12, ${secondaryHex}12)`,
              }}
            >
              {chant}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold text-white transition hover:brightness-105"
              style={{ backgroundColor: primaryHex }}
            >
              {copyState === 'copied' ? (
                <>
                  <Check className="h-5 w-5" />
                  Copied
                </>
              ) : copyState === 'error' ? (
                <>Copy blocked—select text manually</>
              ) : (
                <>Copy chant</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
