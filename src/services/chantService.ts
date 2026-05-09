/** Bounds for chant structure (UI dropdowns mirror these). */
export const STRUCTURE_LIMITS = {
  stanzas: { min: 1, max: 6 },
  linesPerStanza: { min: 2, max: 6 },
} as const;

const MAX_TOTAL_LINES = STRUCTURE_LIMITS.stanzas.max * STRUCTURE_LIMITS.linesPerStanza.max;

export type CheerStructure = {
  stanzas: number;
  linesPerStanza: number;
};

export type SchoolColorNames = {
  primary: string;
  secondary: string;
};

export type ChantSource = 'ai' | 'template';

export type ChantResult = {
  chant: string;
  source: ChantSource;
};

type AiRequest = {
  sport: string;
  schoolMascot: string;
  competitorMascot: string;
  stanzas: number;
  linesPerStanza: number;
  colors: SchoolColorNames;
};

// ---------------------------------------------------------------------------
// Sport-specific terminology for richer, more varied template output
// ---------------------------------------------------------------------------
const SPORT_TERMS: Record<string, string[]> = {
  Football: ['touchdown', 'endzone', 'tackle', 'gridiron', 'blitz', 'first down', 'quarterback', 'run it back', 'fourth quarter', 'sack'],
  Basketball: ['shoot the ball', 'rebound', 'defense', 'fast break', 'swish', 'three point', 'full court', 'slam dunk', 'steal the ball', 'block'],
  Baseball: ['home run', 'grand slam', 'curve ball', 'strike out', 'steal the base', 'center field', 'pitch it hard', 'round the horn', 'big hit', 'at bat'],
  Softball: ['home run', 'grand slam', 'fast pitch', 'strike out', 'steal the base', 'center field', 'line drive', 'double play', 'big hit', 'at bat'],
  Soccer: ['goal', 'kick it in', 'strike hard', 'net the ball', 'corner kick', 'penalty', 'midfield', 'cross the field', 'header shot', 'top of the box'],
  Volleyball: ['spike it down', 'block it out', 'set it up', 'ace the serve', 'dig it deep', 'kill shot', 'over the net', 'jump serve', 'back row', 'match point'],
  Wrestling: ['pin them down', 'take them down', 'mat warriors', 'body slam', 'suplex', 'round one', 'championship', 'grapple hard', 'on the mat', 'takedown'],
  'Track & Field': ['sprint to win', 'hurdle high', 'finish line', 'pass the baton', 'break the record', 'fastest feet', 'cross the line', 'leave them behind', 'run it out', 'top speed'],
  Cheerleading: ['hit it hard', 'stunt it high', 'tumble down', 'fly so high', 'spirit loud', 'pom poms up', 'jump so high', 'form the pyramid', 'cheer it out', 'bring the noise'],
  Tennis: ['ace the serve', 'volley back', 'match point', 'baseline strong', 'net game sharp', 'rally hard', 'break their serve', 'game set match', 'cross court', 'drop shot'],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getTerms(sport: string): string[] {
  return SPORT_TERMS[sport] || SPORT_TERMS.Football;
}

function colorPhrase(names: SchoolColorNames): string {
  const p = names.primary.trim();
  const s = names.secondary.trim();
  if (p && s) return `${capitalize(p)} and ${capitalize(s)}`;
  if (p) return capitalize(p);
  if (s) return capitalize(s);
  return 'our colors';
}

function primaryColor(names: SchoolColorNames): string {
  const p = names.primary.trim();
  if (p) return capitalize(p);
  const s = names.secondary.trim();
  if (s) return capitalize(s);
  return 'pride';
}

function clampStructure(raw: CheerStructure): CheerStructure {
  const st = Math.min(
    Math.max(Math.round(raw.stanzas), STRUCTURE_LIMITS.stanzas.min),
    STRUCTURE_LIMITS.stanzas.max,
  );
  const lps = Math.min(
    Math.max(Math.round(raw.linesPerStanza), STRUCTURE_LIMITS.linesPerStanza.min),
    STRUCTURE_LIMITS.linesPerStanza.max,
  );
  const total = st * lps;
  if (total <= MAX_TOTAL_LINES) {
    return { stanzas: st, linesPerStanza: lps };
  }
  const cappedStanzas = Math.max(1, Math.floor(MAX_TOTAL_LINES / lps));
  return { stanzas: Math.min(st, cappedStanzas), linesPerStanza: lps };
}

// ---------------------------------------------------------------------------
// Template engine — generates chant lines using sport terms + team context
// ---------------------------------------------------------------------------

type LineGenerator = (
  school: string,
  competitor: string,
  colors: SchoolColorNames,
  terms: string[],
) => string[];

/**
 * Standard AABB-style chant templates.
 * Each generator returns 4 lines that rhyme and flow for crowd chanting.
 */
const STANDARD_TEMPLATES: LineGenerator[] = [
  (school, competitor, colors, terms) => {
    const t1 = capitalize(pickRandom(terms));
    const col = colorPhrase(colors);
    return [
      `Go ${school}, fight tonight!`,
      `${col}, bring the fight!`,
      `${t1}, take control,`,
      `Win this game, heart and soul!`,
    ];
  },
  (school, competitor, colors, terms) => {
    const t1 = capitalize(pickRandom(terms));
    const t2 = capitalize(pickRandom(terms));
    return [
      `${school} rise, claim the prize!`,
      `Watch us soar, touch the skies!`,
      `${t1} hard, ${t2} fast,`,
      `${school} is here to dominate at last!`,
    ];
  },
  (school, competitor, colors, terms) => {
    const col = primaryColor(colors);
    const t1 = capitalize(pickRandom(terms));
    return [
      `Decked in ${col}, hear us roar!`,
      `${school} wins, we want more!`,
      `${t1} strong, play it right,`,
      `${school} owns the game tonight!`,
    ];
  },
  (school, competitor, colors, terms) => {
    const t1 = capitalize(pickRandom(terms));
    const t2 = capitalize(pickRandom(terms));
    return [
      `Hear the crowd, feel the beat!`,
      `${school} cannot be beat!`,
      `${t1}, ${t2}, make the play!`,
      `${school} dominates, seize the day!`,
    ];
  },
  (school, competitor, colors, terms) => {
    const col = primaryColor(colors);
    return [
      `${school}! ${school}! Let's go!`,
      `Bring the fire, bring the show!`,
      `${col} and proud, stand up tall!`,
      `${school} wins, we want it all!`,
    ];
  },
  (school, competitor, colors, terms) => {
    const t1 = capitalize(pickRandom(terms));
    return competitor ? [
      `Step aside, ${competitor}, move out the way!`,
      `${school} is coming, it's our day!`,
      `${t1} hard, we own the floor,`,
      `${school} wins, now give us more!`,
    ] : [
      `Nobody's stopping, we're here to win!`,
      `${school} energy, let's begin!`,
      `${t1} strong, we set the pace,`,
      `${school} dominates this whole place!`,
    ];
  },
  (school, _competitor, colors, terms) => {
    const t1 = capitalize(pickRandom(terms));
    const t2 = capitalize(pickRandom(terms));
    return [
      `Stand up, shout out, make some noise!`,
      `${school} is here, hear our voice!`,
      `${t1} ready, ${t2} set,`,
      `Best game that you've ever met!`,
    ];
  },
  (school, _competitor, colors, terms) => {
    const t1 = capitalize(pickRandom(terms));
    const t2 = capitalize(pickRandom(terms));
    return [
      `Marching forward, strong and proud!`,
      `${school} stands above the crowd!`,
      `${t1}, ${t2}, we run this town,`,
      `${school} spirit, never back down!`,
    ];
  },
  (school, _competitor, colors) => {
    const col = colorPhrase(colors);
    return [
      `${school}! ${school}! Hear the roar!`,
      `${col} spirit, we want more!`,
      `Step on the field, we take the crown,`,
      `Nobody's bringing ${school} down!`,
    ];
  },
  (school, competitor, colors, terms) => {
    const t1 = capitalize(pickRandom(terms));
    const col = colorPhrase(colors);
    return [
      `Feel the power, feel the might,`,
      `${school} is coming for the fight!`,
      `${col} pride runs deep and strong,`,
      `Champions all, all day long!`,
    ];
  },
  (school, competitor, colors, terms) => {
    const t1 = capitalize(pickRandom(terms));
    const col = primaryColor(colors);
    return [
      `Go ${school}, go ${school}, go!`,
      `Watch the ${school} steal the show!`,
      `${t1} hard, ${col} fast,`,
      `${school} power, built to last!`,
    ];
  },
  (school, competitor, colors) => {
    const col = colorPhrase(colors);
    return competitor ? [
      `${competitor} better watch their back!`,
      `${school} is on the attack!`,
      `${col}, fierce and loud,`,
      `${school} makes the whole crowd proud!`,
    ] : [
      `Victory is what we seek!`,
      `${school} power at its peak!`,
      `${col}, fierce and loud,`,
      `${school} makes the whole crowd proud!`,
    ];
  },
];

/**
 * Call-and-response templates (LEADER / CROWD format).
 */
const CALL_RESPONSE_TEMPLATES: LineGenerator[] = [
  (school, competitor, colors) => {
    const col = colorPhrase(colors);
    return [
      `Who's the best? ${school}! ${school}!`,
      `Who's next? We're next! We're next!`,
      `${col} pride! Take it nationwide!`,
      `Let me hear you! ${school} wins!`,
    ];
  },
  (school, _competitor, colors, terms) => {
    const col = primaryColor(colors);
    const t = capitalize(pickRandom(terms));
    return [
      `I say ${school}! You say GO!`,
      `${school}! GO GO GO!`,
      `${col} on the field! We will never yield!`,
      `${t}! ${school} in the house!`,
    ];
  },
  (school, competitor, colors, terms) => {
    const t = capitalize(pickRandom(terms));
    return [
      `What team? ${school}!`,
      `What time? Game time!`,
      `Who's got the power? ${school}! This is our hour!`,
      `${t}! ${t}! We score more!`,
    ];
  },
  (school, competitor, colors) => {
    const col = colorPhrase(colors);
    return competitor ? [
      `Who are we? ${school}!`,
      `Who's going down? ${competitor}!`,
      `What's the mission? Total domination!`,
      `Say it louder! ${school} nation!`,
    ] : [
      `Who are we? ${school}!`,
      `What's our goal? Take control!`,
      `${col} burning bright!`,
      `${school} power! Own the night!`,
    ];
  },
  (school, _competitor, colors) => {
    const col = primaryColor(colors);
    return [
      `When I say ${school}, you say FIGHT!`,
      `${school}! FIGHT! FIGHT! FIGHT!`,
      `${col} and bold! Step aside!`,
      `${school} pride! Nationwide!`,
    ];
  },
  (school, _competitor, colors, terms) => {
    const t = capitalize(pickRandom(terms));
    return [
      `Who runs this? We do! We do!`,
      `Who wants it? We do! We do!`,
      `${t}! Do it big!`,
      `${school}! Take the win!`,
    ];
  },
];

/**
 * Aggressive / intimidation-style templates.
 */
const AGGRESSIVE_TEMPLATES: LineGenerator[] = [
  (school, competitor, colors, terms) => {
    const t1 = capitalize(pickRandom(terms));
    const t2 = capitalize(pickRandom(terms));
    return [
      `BRING THE PAIN, BRING THE HEAT!`,
      `${school.toUpperCase()} NEVER ACCEPT DEFEAT!`,
      `${t1.toUpperCase()}! ${t2.toUpperCase()}! DOMINATE!`,
      `${school.toUpperCase()} IS HERE — IT'S TOO LATE!`,
    ];
  },
  (school, competitor, colors) => {
    const col = colorPhrase(colors).toUpperCase();
    return competitor ? [
      `${competitor.toUpperCase()} BETTER WATCH OUT!`,
      `${school.toUpperCase()} IS HERE, WITHOUT A DOUBT!`,
      `${col}, TAKE THE FLOOR!`,
      `${school.toUpperCase()} LEAVES 'EM WANTING MORE!`,
    ] : [
      `NO MERCY, NO FEAR, NO DOUBT!`,
      `${school.toUpperCase()} COMING, HEAR US SHOUT!`,
      `DOMINATE, DOMINATE, TAKE CONTROL!`,
      `${school.toUpperCase()} WINS WITH HEART AND SOUL!`,
    ];
  },
  (school, competitor, colors, terms) => {
    const t1 = capitalize(pickRandom(terms));
    const t2 = capitalize(pickRandom(terms));
    return [
      `WE DON'T LOSE, WE DON'T BACK DOWN!`,
      `${school.toUpperCase()} RUNS THIS WHOLE TOWN!`,
      `${t1.toUpperCase()}! ${t2.toUpperCase()}! HIT 'EM HARD!`,
      `LEAVE 'EM BROKEN ON THE YARD!`,
    ];
  },
  (school, _competitor, colors) => {
    const col = primaryColor(colors).toUpperCase();
    return [
      `UNSTOPPABLE! UNBREAKABLE!`,
      `${school.toUpperCase()} IS UNSTOPPABLE!`,
      `BLOOD, SWEAT, AND ${col}!`,
      `${school.toUpperCase()} WILL NEVER STOP!`,
    ];
  },
  (school, competitor, colors, terms) => {
    const t1 = capitalize(pickRandom(terms));
    return competitor ? [
      `${competitor.toUpperCase()}! YOU'RE GOING DOWN!`,
      `${school.toUpperCase()} COMING FOR THE CROWN!`,
      `${t1.toUpperCase()} LIKE THERE'S NO TOMORROW,`,
      `${school.toUpperCase()} DELIVERS VICTORY, NOT SORROW!`,
    ] : [
      `STEP UP! STEP OUT! STEP ASIDE!`,
      `${school.toUpperCase()} POWER, FULL OF PRIDE!`,
      `${t1.toUpperCase()} LIKE THERE'S NO TOMORROW,`,
      `${school.toUpperCase()} DELIVERS VICTORY, NOT SORROW!`,
    ];
  },
];

// ---------------------------------------------------------------------------
// Style types and template selection
// ---------------------------------------------------------------------------

export type ChantStyle = 'standard' | 'call_and_response' | 'aggressive';

function getTemplatesForStyle(style: ChantStyle): LineGenerator[] {
  switch (style) {
    case 'call_and_response':
      return CALL_RESPONSE_TEMPLATES;
    case 'aggressive':
      return AGGRESSIVE_TEMPLATES;
    case 'standard':
    default:
      return STANDARD_TEMPLATES;
  }
}

// ---------------------------------------------------------------------------
// Template generation — picks templates, assembles into stanzas
// ---------------------------------------------------------------------------

function generateTemplateLines(
  school: string,
  competitor: string,
  colors: SchoolColorNames,
  sport: string,
  totalLines: number,
  style: ChantStyle = 'standard',
): string[] {
  const terms = getTerms(sport);
  const primaryTemplates = getTemplatesForStyle(style);

  // Generate a pool of lines primarily from the selected style
  const pool: string[] = [];
  const usedIndices = new Set<number>();

  // First pass: use the selected style's templates
  while (pool.length < totalLines * 2 && usedIndices.size < primaryTemplates.length) {
    const idx = Math.floor(Math.random() * primaryTemplates.length);
    if (usedIndices.has(idx)) continue;
    usedIndices.add(idx);
    const lines = primaryTemplates[idx](school, competitor, colors, terms);
    pool.push(...lines);
  }

  // If we still need more, allow re-use with different random terms
  let safety = 0;
  while (pool.length < totalLines && safety < 50) {
    safety++;
    const template = pickRandom(primaryTemplates);
    pool.push(...template(school, competitor, colors, terms));
  }

  // Shuffle and pick the needed amount
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, totalLines);
}

async function generateTemplateChant(
  sport: string,
  school: string,
  competitor: string,
  structure: CheerStructure,
  colorNames: SchoolColorNames,
  style: ChantStyle = 'standard',
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const { stanzas, linesPerStanza } = clampStructure(structure);
  const totalLines = stanzas * linesPerStanza;

  const lines = generateTemplateLines(
    school.trim(),
    competitor.trim(),
    colorNames,
    sport,
    totalLines,
    style,
  );

  const stanzaChunks: string[] = [];
  for (let s = 0; s < stanzas; s++) {
    const slice = lines.slice(s * linesPerStanza, (s + 1) * linesPerStanza);
    stanzaChunks.push(slice.join('\n'));
  }

  return stanzaChunks.join('\n\n');
}

// ---------------------------------------------------------------------------
// AI integration — calls local Ocean82 backend, validates output looks like
// a chant (short lines, no prose), falls back to template if not.
// ---------------------------------------------------------------------------

const DEFAULT_AI_ENDPOINT = 'http://127.0.0.1:8000/generate-chant';

function sanitizeLine(line: string): string {
  return line
    .replace(/^\s*[-*•]+\s*/u, '')
    .replace(/^\s*\d+[.)]\s*/u, '')
    .replace(/^\s*\[[^\]]+\]\s*/u, '')
    .trim();
}

function looksLikeChantLine(line: string): boolean {
  const cleaned = sanitizeLine(line);
  if (!cleaned || cleaned.length < 4) return false;
  // Reject lines that are too long (prose/story) — chant lines are short
  if (cleaned.split(/\s+/).length > 16) return false;
  // Reject lines that look like narrative prose (starts with "Once upon", "The story", etc.)
  if (/^(once|the story|in a|there was|long ago|chapter)/i.test(cleaned)) return false;
  return true;
}

function parseAndValidateAiOutput(raw: string, structure: CheerStructure): string | null {
  const cleaned = raw.replace(/\r\n/g, '\n').trim();
  if (!cleaned) return null;

  const rawStanzas = cleaned
    .split(/\n\s*\n/g)
    .map((s) => s.trim())
    .filter(Boolean);
  if (rawStanzas.length !== structure.stanzas) return null;

  const normalizedStanzas: string[] = [];
  for (const stanza of rawStanzas) {
    const lines = stanza
      .split('\n')
      .map((l) => sanitizeLine(l))
      .filter(Boolean);
    if (lines.length !== structure.linesPerStanza) return null;
    // Validate all lines look like chant lines, not prose
    if (!lines.every(looksLikeChantLine)) return null;
    normalizedStanzas.push(lines.join('\n'));
  }
  return normalizedStanzas.join('\n\n');
}

async function generateAiChant(
  sport: string,
  school: string,
  competitor: string,
  structure: CheerStructure,
  colorNames: SchoolColorNames,
): Promise<string | null> {
  const endpoint = (import.meta.env.VITE_AI_API_URL as string | undefined)?.trim() || DEFAULT_AI_ENDPOINT;
  const enabled = (import.meta.env.VITE_USE_LOCAL_AI as string | undefined)?.toLowerCase() === 'true';
  if (!enabled) return null;

  const payload: AiRequest = {
    sport,
    schoolMascot: school.trim(),
    competitorMascot: competitor.trim(),
    stanzas: structure.stanzas,
    linesPerStanza: structure.linesPerStanza,
    colors: colorNames,
  };

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const data = (await response.json()) as { chant?: string };
    if (!data?.chant) return null;

    // Validate the AI output actually looks like a chant, not a story
    const validated = parseAndValidateAiOutput(data.chant, structure);
    if (!validated) {
      console.warn('AI output rejected: does not look like a chant. Falling back to template.');
      return null;
    }
    return validated;
  } catch (error) {
    console.warn('AI generation unavailable, falling back to template generation.', error);
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateChant(
  sport: string,
  school: string,
  competitor: string,
  structure: CheerStructure,
  colorNames: SchoolColorNames,
  style: ChantStyle = 'standard',
): Promise<ChantResult> {
  const safeStructure = clampStructure(structure);
  const aiChant = await generateAiChant(sport, school, competitor, safeStructure, colorNames);
  if (aiChant) return { chant: aiChant, source: 'ai' };
  const chant = await generateTemplateChant(sport, school, competitor, safeStructure, colorNames, style);
  return { chant, source: 'template' };
}

/**
 * Generate multiple unique chants at once for the user to pick from.
 */
export async function generateMultipleChants(
  sport: string,
  school: string,
  competitor: string,
  structure: CheerStructure,
  colorNames: SchoolColorNames,
  style: ChantStyle = 'standard',
  count: number = 3,
): Promise<ChantResult[]> {
  const results: ChantResult[] = [];
  const usedHashes = new Set<string>();

  for (let i = 0; i < count * 3 && results.length < count; i++) {
    const result = await generateChant(sport, school, competitor, structure, colorNames, style);
    const hash = result.chant.replace(/\s/g, '').toLowerCase();
    if (!usedHashes.has(hash)) {
      usedHashes.add(hash);
      results.push(result);
    }
  }

  return results;
}

/** Get the sport terms for display in the UI. */
export function getSportTerms(sport: string): string[] {
  return getTerms(sport);
}
