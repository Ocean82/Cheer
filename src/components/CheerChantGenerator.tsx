import { useCallback, useState } from 'react';
import type { ChantStyle, CheerStructure, ChantResult } from '../services/chantService';
import {
  generateMultipleChants,
  generateCreativeChant,
  getSportTerms,
  STRUCTURE_LIMITS,
  clearAiDebug,
  getAiDebugSnapshot,
  type AiDebugEntry,
} from '../services/chantService';
import { cn } from '../utils/cn';
import { Zap, Music, Layers, Rows3, Palette, Check, Copy, RefreshCw, Megaphone, Flame, MessageSquare, Sparkles } from 'lucide-react';

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

const STYLES: { value: ChantStyle; label: string; icon: typeof Megaphone; desc: string }[] = [
  { value: 'standard', label: 'Standard', icon: Megaphone, desc: 'Classic AABB rhyming chants' },
  { value: 'call_and_response', label: 'Call & Response', icon: MessageSquare, desc: 'Leader-crowd interaction' },
  { value: 'aggressive', label: 'Aggressive', icon: Flame, desc: 'Bold & in-your-face' },
];

const DEFAULT_HEX_PRIMARY = '#5b21b6';
const DEFAULT_HEX_SECONDARY = '#db2777';

/** When true (`.env`), shows AI fetch/validation diagnostics after each generate. */
const SHOW_AI_DEBUG = import.meta.env.VITE_DEBUG_AI?.toLowerCase() === 'true';

function rangeInclusive(min: number, max: number): number[] {
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

/** Renders a single chant line with LEADER/CROWD highlighting for call & response */
function ChantLine({ line, primaryHex, secondaryHex }: { line: string; primaryHex: string; secondaryHex: string }) {
  if (/^(LEADER|Leader):/i.test(line)) {
    const text = line.replace(/^(LEADER|Leader):\s*/i, '');
    return (
      <div className="flex gap-2">
        <span className="shrink-0 font-bold" style={{ color: primaryHex }}>LEADER:</span>
        <span>{text}</span>
      </div>
    );
  }
  if (/^(CROWD|Crowd):/i.test(line)) {
    const text = line.replace(/^(CROWD|Crowd):\s*/i, '');
    return (
      <div className="flex gap-2">
        <span className="shrink-0 font-bold" style={{ color: secondaryHex }}>CROWD:</span>
        <span>{text}</span>
      </div>
    );
  }
  // ALL CAPS lines get bold treatment
  if (/^[A-Z\s!,.'—\-]+$/.test(line) && line.length > 5) {
    return <div className="font-bold">{line}</div>;
  }
  return <div>{line}</div>;
}

export function CheerChantGenerator() {
  const [sport, setSport] = useState<string>('Football');
  const [schoolMascot, setSchoolMascot] = useState('');
  const [competitorMascot, setCompetitorMascot] = useState('');
  const [stanzas, setStanzas] = useState(2);
  const [linesPerStanza, setLinesPerStanza] = useState(4);
  const [style, setStyle] = useState<ChantStyle>('standard');
  const [primaryColorName, setPrimaryColorName] = useState('Purple');
  const [secondaryColorName, setSecondaryColorName] = useState('Gold');
  const [primaryHex, setPrimaryHex] = useState(DEFAULT_HEX_PRIMARY);
  const [secondaryHex, setSecondaryHex] = useState(DEFAULT_HEX_SECONDARY);
  const [chants, setChants] = useState<ChantResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [creativeMode, setCreativeMode] = useState(false);
  const [aiDebugLines, setAiDebugLines] = useState<AiDebugEntry[]>([]);

  const totalLinesPreview = stanzas * linesPerStanza;
  const sportTerms = getSportTerms(sport);

  const handleGenerate = async () => {
    if (!schoolMascot.trim()) {
      setError('Please enter your school mascot.');
      return;
    }

    const structure: CheerStructure = { stanzas, linesPerStanza };
    const colors = { primary: primaryColorName, secondary: secondaryColorName };

    setError('');
    setLoading(true);
    setCopiedIndex(null);
    clearAiDebug();
    if (SHOW_AI_DEBUG) setAiDebugLines([]);
    try {
      if (creativeMode) {
        // Creative mode: single AI-generated chant (slower, higher quality)
        const result = await generateCreativeChant(
          sport, schoolMascot, competitorMascot, structure, colors, style,
        );
        setChants([result]);
      } else {
        // Standard mode: 3 template-based chants (instant)
        const results = await generateMultipleChants(
          sport, schoolMascot, competitorMascot, structure, colors, style, 3,
        );
        setChants(results);
      }
    } catch (err) {
      setError('Failed to generate chants. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
      if (SHOW_AI_DEBUG) setAiDebugLines(getAiDebugSnapshot());
    }
  };

  const handleCopy = useCallback(async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // fallback: do nothing
    }
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Music className="h-8 w-8" style={{ color: primaryHex }} />
          <h1 className="text-4xl font-bold text-gray-900">Cheer Chant Generator</h1>
          <Music className="h-8 w-8" style={{ color: secondaryHex }} />
        </div>
        <p className="text-lg text-gray-600">
          Pick a style, customize your team, and generate crowd-ready chants.
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-lg sm:p-8">
        {/* Style Selector */}
        <div className="mb-6">
          <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Zap className="h-4 w-4" style={{ color: primaryHex }} />
            Chant Style
          </label>
          <div className="grid gap-2 sm:grid-cols-3">
            {STYLES.map((s) => {
              const Icon = s.icon;
              const isActive = style === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStyle(s.value)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition',
                    isActive
                      ? 'border-current shadow-sm'
                      : 'border-gray-200 hover:border-gray-300',
                  )}
                  style={isActive ? { borderColor: primaryHex, backgroundColor: `${primaryHex}08` } : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" style={{ color: isActive ? primaryHex : '#9ca3af' }} />
                  <div>
                    <div className={cn('text-sm font-semibold', isActive ? 'text-gray-900' : 'text-gray-700')}>
                      {s.label}
                    </div>
                    <div className="text-xs text-gray-500">{s.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sport + Terms */}
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
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {sportTerms.slice(0, 6).map((term) => (
              <span
                key={term}
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: `${primaryHex}12`, color: primaryHex }}
              >
                {term}
              </span>
            ))}
            <span className="rounded-full px-2 py-0.5 text-xs text-gray-400">
              +{sportTerms.length - 6} more terms injected
            </span>
          </div>
        </div>

        {/* Structure */}
        <div className="mb-6 border-t border-gray-100 pt-6">
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
                className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 text-gray-800 transition focus:outline-none"
                style={{ borderColor: `${primaryHex}33` }}
              >
                {rangeInclusive(STRUCTURE_LIMITS.stanzas.min, STRUCTURE_LIMITS.stanzas.max).map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? 'stanza' : 'stanzas'}</option>
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
                className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 text-gray-800 transition focus:outline-none"
                style={{ borderColor: `${secondaryHex}33` }}
              >
                {rangeInclusive(STRUCTURE_LIMITS.linesPerStanza.min, STRUCTURE_LIMITS.linesPerStanza.max).map((n) => (
                  <option key={n} value={n}>{n} lines</option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            <span className="font-semibold text-gray-700">{totalLinesPreview}</span> lines total ({stanzas} × {linesPerStanza}) per chant. Generates 3 variations to pick from.
          </p>
        </div>

        {/* Colors */}
        <div className="mb-6 border-t border-gray-100 pt-6">
          <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Palette className="h-4 w-4" style={{ color: secondaryHex }} />
            School colors
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">Primary color name</label>
              <input
                type="text"
                value={primaryColorName}
                onChange={(e) => setPrimaryColorName(e.target.value)}
                placeholder="e.g. Navy, Crimson"
                className="mb-2 w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none"
                style={{ borderColor: `${primaryHex}55` }}
              />
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryHex}
                  onChange={(e) => setPrimaryHex(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
                  aria-label="Primary accent color"
                />
                <span className="text-xs text-gray-500">UI accent</span>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">Secondary color name</label>
              <input
                type="text"
                value={secondaryColorName}
                onChange={(e) => setSecondaryColorName(e.target.value)}
                placeholder="e.g. Gold, Silver"
                className="mb-2 w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none"
                style={{ borderColor: `${secondaryHex}55` }}
              />
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryHex}
                  onChange={(e) => setSecondaryHex(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
                  aria-label="Secondary accent color"
                />
                <span className="text-xs text-gray-500">UI accent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mascots */}
        <div className="mb-6 border-t border-gray-100 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Your school mascot</label>
              <input
                type="text"
                value={schoolMascot}
                onChange={(e) => setSchoolMascot(e.target.value)}
                placeholder="e.g., Tigers, Eagles"
                className="w-full rounded-lg border-2 px-4 py-3 text-gray-900 transition placeholder:text-gray-400 focus:outline-none"
                style={{ borderColor: `${primaryHex}40` }}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Competitor mascot</label>
              <input
                type="text"
                value={competitorMascot}
                onChange={(e) => setCompetitorMascot(e.target.value)}
                placeholder="e.g., Lions, Bears (optional)"
                className="w-full rounded-lg border-2 px-4 py-3 text-gray-900 transition placeholder:text-gray-400 focus:outline-none"
                style={{ borderColor: `${secondaryHex}40` }}
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-red-800">
            {error}
          </div>
        )}

        {SHOW_AI_DEBUG && aiDebugLines.length > 0 && (
          <div
            className="mb-6 max-h-52 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50/95 px-4 py-3 text-left font-mono text-xs leading-snug text-amber-950 shadow-sm"
            role="region"
            aria-label="AI debug log"
          >
            <div className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-wide text-amber-900">
              AI debug (VITE_DEBUG_AI)
            </div>
            <ul className="space-y-2">
              {aiDebugLines.map((entry, i) => (
                <li key={`${entry.source}-${entry.step}-${i}`}>
                  <span className="font-semibold text-amber-950">
                    [{entry.source}/{entry.step}]
                  </span>{' '}
                  {entry.detail}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Creative Mode Toggle */}
        <div className="mb-4 rounded-lg border-2 border-dashed border-gray-200 p-4">
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5" style={{ color: creativeMode ? primaryHex : '#9ca3af' }} />
              <div>
                <div className="text-sm font-semibold text-gray-800">Creative Mode</div>
                <div className="text-xs text-gray-500">
                  {creativeMode
                    ? 'Uses AI for unique, creative chants (20-40s)'
                    : 'Uses instant template engine (fast, reliable)'}
                </div>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={creativeMode ? 'true' : 'false'}
              aria-label="Creative mode"
              onClick={() => setCreativeMode(!creativeMode)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
                !creativeMode && 'bg-gray-300',
              )}
              style={creativeMode ? { backgroundColor: primaryHex } : undefined}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                  creativeMode ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </label>
          {creativeMode && (
            <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
              Requires the local AI server running. Generates 1 unique chant per click.
            </p>
          )}
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="w-full rounded-lg px-6 py-3.5 font-bold text-white shadow-sm transition hover:opacity-95 hover:shadow-md disabled:opacity-45"
          style={{ background: `linear-gradient(90deg, ${primaryHex}, ${secondaryHex})` }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              {creativeMode ? 'AI is writing…' : 'Generating 3 chants…'}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              {creativeMode ? <Sparkles className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
              {creativeMode ? 'Generate Creative Chant' : 'Generate Chants'}
            </span>
          )}
        </button>

        {/* Results — 3 chant cards */}
        {chants.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Your chants</h2>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </button>
            </div>

            {chants.map((result, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-lg border border-gray-100 transition hover:border-gray-200"
                style={{ background: `linear-gradient(145deg, ${primaryHex}06, ${secondaryHex}06)` }}
              >
                {/* Card header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: primaryHex }}
                    >
                      {index + 1}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        result.source === 'ai'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {result.source === 'ai' ? 'Local AI' : 'Template'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.chant, index)}
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition hover:bg-gray-100"
                    style={{ color: copiedIndex === index ? '#059669' : '#6b7280' }}
                  >
                    {copiedIndex === index ? (
                      <><Check className="h-3.5 w-3.5" /> Copied</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5" /> Copy</>
                    )}
                  </button>
                </div>

                {/* Chant content with line highlighting */}
                <div className="space-y-1 px-5 py-4 text-gray-900 leading-relaxed">
                  {result.chant.split('\n').map((line, lineIdx) => (
                    line === '' ? (
                      <div key={lineIdx} className="h-3" />
                    ) : (
                      <ChantLine
                        key={lineIdx}
                        line={line}
                        primaryHex={primaryHex}
                        secondaryHex={secondaryHex}
                      />
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
