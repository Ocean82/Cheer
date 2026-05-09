/** Bounds for chant structure (UI dropdowns mirror these). */
export const STRUCTURE_LIMITS = {
  stanzas: { min: 1, max: 14 },
  linesPerStanza: { min: 2, max: 14 },
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

/** Internal lyric grammar for color wording (capitalization / articles / fallbacks). */
type LyricPalette = {
  /** User typed at least one named color */
  named: boolean;
  /** Title-styled pigment phrase: "Navy and Gold". */
  noun: string;
  /** Works after "in …", "wears …": uses named phrase or lowercase "our colors". */
  wearPhrase: string;
  /** Opens a clause or stanza sentence ("Our colors …" | "Navy and Gold …"). */
  lead: string;
  /** Object of "Victory belongs to …". */
  belongTo: string;
  /** Formal beat: "the Navy and Gold" when named; softer generic phrasing otherwise. */
  withDefiniteArticle: string;
};

function titleChunk(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
}

function capitalizeSentence(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function buildLyricPalette(names: SchoolColorNames): LyricPalette {
  const primary = names.primary.trim();
  const secondary = names.secondary.trim();
  const named = !!(primary || secondary);

  let noun: string;
  if (primary && secondary) noun = `${titleChunk(primary)} and ${titleChunk(secondary)}`;
  else if (primary) noun = titleChunk(primary);
  else if (secondary) noun = titleChunk(secondary);
  else noun = 'our colors';

  const wearPhrase = named ? noun : 'our colors';
  const lead = capitalizeSentence(wearPhrase);
  const belongTo = wearPhrase;
  const withDefiniteArticle = named ? `the ${noun}` : 'these colors';

  return { named, noun, wearPhrase, lead, belongTo, withDefiniteArticle };
}

/** Public helper: mid-sentence color wording (backward compatible intent). */
export function formatColorPhrase(primary: string, secondary: string): string {
  return buildLyricPalette({ primary, secondary }).wearPhrase;
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
  let total = st * lps;
  if (total <= MAX_TOTAL_LINES) {
    return { stanzas: st, linesPerStanza: lps };
  }
  const cappedStanzas = Math.max(1, Math.floor(MAX_TOTAL_LINES / lps));
  return { stanzas: Math.min(st, cappedStanzas), linesPerStanza: lps };
}

function sanitizeLine(line: string): string {
  return line
    .replace(/^\s*[-*•]+\s*/u, '')
    .replace(/^\s*\d+[.)]\s*/u, '')
    .replace(/^\s*\[[^\]]+\]\s*/u, '')
    .trim();
}

function normalizeAiText(text: string): string {
  return text.replace(/\r\n/g, '\n').trim();
}

function parseAndValidateAiOutput(raw: string, structure: CheerStructure): string | null {
  const cleaned = normalizeAiText(raw);
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
    normalizedStanzas.push(lines.join('\n'));
  }
  return normalizedStanzas.join('\n\n');
}

type TemplateLines = (
  school: string,
  competitor: string,
  c: LyricPalette,
) => string[];

/** Preserves authoring order; callers walk consecutively with wrap + random rotation. */
const CHANT_TEMPLATES: Record<string, TemplateLines> = {
  Football: (school, competitor, c) => [
    `${school} team, moving down the field,`,
    `Defense is strong, we've got the shield!`,
    `First down, second down, go go go!`,
    `The ${competitor} can't stand our might,`,
    `We're charging hard with all our might!`,
    `Touchdown ${school}, we're taking the crown,`,
    `Your defense crumbles when we come to town!`,
    `Go ${school}, unstoppable force,`,
    `The ${competitor} have no choice,`,
    `We dominate the gridiron today,`,
    `Victory's ours, hip hip hooray!`,
    `${school} pride, standing tall in ${c.wearPhrase}!`,
    `The ${competitor} wish they wore ${c.wearPhrase}!`,
    `Every play—we shine bright in ${c.wearPhrase}!`,
  ],

  Basketball: (school, competitor, c) => [
    `${school} players on the court tonight,`,
    `We're shooting hoops with all our might!`,
    `Fast breaks and dunks, watch us fly,`,
    `The ${competitor} can only watch us glide!`,
    `Swish goes the net, two points for us,`,
    `${school} ball, creating all this fuss!`,
    `Dribble down the court, passing strong,`,
    `Defending like we can't go wrong!`,
    `Fast-paced action, beautiful game,`,
    `The ${competitor} can't handle our fame!`,
    `${school} wears ${c.wearPhrase} with pride!`,
    `We'll win the game and many more!`,
    `Teamwork and heart, that's our way,`,
    `Victory's ours at the end of the day!`,
    `Bleachers thunder for ${c.belongTo}!`,
  ],

  Volleyball: (school, competitor, c) => [
    `${school} on the net, we're locked in tight,`,
    `Serving up power with all of our might!`,
    `Bump, set, spike, watch us soar,`,
    `The ${competitor} can't even score!`,
    `Block at the net, point for us,`,
    `${school} volleyball, raising the dust!`,
    `Spirit shining bright in ${c.wearPhrase},`,
    `Setting up winners all match long!`,
    `Ace after ace, we're on fire today,`,
    `The ${competitor} can't stand our play!`,
    `Rotation perfect, every position set,`,
    `${school} stands strong, we're the best yet!`,
    `Dig that ball and turn it around,`,
    `Victory's ours for ${c.belongTo}!`,
  ],

  Soccer: (school, competitor, c) => [
    `${school} soccer, flowing down the field,`,
    `Passing and moving, we've got the deal!`,
    `Possession moving with skill and with grace,`,
    `The ${competitor} can't keep up our pace!`,
    `Goal! Net bulges, our score goes up,`,
    `${school} soccer lifts the trophy cup!`,
    `Fast feet and hearts beating strong,`,
    `We dominate the field all day long!`,
    `Defensive pressure, winning the ball,`,
    `The ${competitor} feel our call!`,
    `${c.lead} racing side by side,`,
    `Victory belongs to ${c.belongTo}!`,
    `We bleed ${c.withDefiniteArticle}—that's how we glide!`,
  ],

  Cheerleading: (school, competitor, c) => [
    `${school} cheerleaders, pyramids high,`,
    `Stunting and tumbling, reaching the sky!`,
    `Synchronized motion, shining in ${c.wearPhrase},`,
    `The ${competitor} can't match our might!`,
    `Jumps and flips, shaking those poms,`,
    `${school} cheer, leading the songs!`,
    `Energy pumping through every routine,`,
    `The best cheerleading ever seen!`,
    `Building pyramids, so strong and so tall,`,
    `The ${competitor} watch while we stand proud and tall!`,
    `${c.lead}, loud and bold,`,
    `Let the winning begin!`,
    `${school} takes it all, competition complete,`,
    `Our cheer rides on ${c.belongTo}!`,
  ],

  'Track & Field': (school, competitor, c) => [
    `${school} runners flying down the track,`,
    `Speed and strength, we've got the knack!`,
    `Sprint to the finish, give it all you got,`,
    `The ${competitor} haven't got what we've got!`,
    `Hurdlers jumping, clearing every bar,`,
    `${school} athletes shining like a star!`,
    `${c.lead}, faster every lap,`,
    `The ${competitor} simply cannot compete!`,
    `Field events showing strength and grace,`,
    `We're winning every single race!`,
    `Training hard, pushing to the limit,`,
    `${school} spirit runs in ${c.wearPhrase}!`,
    `Together we're champions, breaking through,`,
    `${c.named ? `Tonight we soar for ${c.withDefiniteArticle}!` : `Tonight we soar—the crowd feels ${c.lead}!`}`,
    `We cross that stripe—we seal it for ${c.belongTo}!`,
  ],

  Wrestling: (school, competitor, c) => [
    `${school} wrestlers stepping on the mat,`,
    `Strength and technique, imagine that!`,
    `Take down the opponent, pin and win,`,
    `The ${competitor} can't stop our hustle!`,
    `Grappling together, pure athletic art,`,
    `${school} wrestling, fierce at heart!`,
    `${c.lead}, tough on the mat,`,
    `The ${competitor} have nowhere to hide!`,
    `Discipline and power in every move,`,
    `We've got the skills that prove!`,
    `${school} dominates every round,`,
    `Victory's ours for ${c.belongTo}!`,
    `Champions rising, breaking through,`,
    `We're wearing ${c.wearPhrase} when we slam the door on you!`,
  ],

  Baseball: (school, competitor, c) => {
    const jerseyLine = c.named
      ? `${c.noun} on our jerseys, fierce and loud!`
      : `Our pride burns fierce and loud!`;
    return [
      `${school} baseball, stepping up to bat,`,
      `Crack goes the ball, imagine that!`,
      `Rounding the bases, scoring runs,`,
      `The ${competitor} know we're having fun!`,
      `Defense is ready, standing so tall,`,
      `${school} baseball answers the call!`,
      jerseyLine,
      `The ${competitor} can't slow our way!`,
      `Pitcher striking out batter by batter,`,
      `Our victories make the scoreboard shatter!`,
      `${school} takes the lead, running strong,`,
      `We'll win this game all day long!`,
      `${c.named ? `We hustle for ${c.withDefiniteArticle}!` : `We're one team—we're chanting now!`}`,
      `Victory's roaring loud!`,
    ];
  },

  Softball: (school, competitor, c) => [
    `${school} softball players, diamonds bright,`,
    `${c.lead} blazing with all our might!`,
    `Running the bases, scoring with speed,`,
    `The ${competitor} know what we need!`,
    `Fielding with precision, every play,`,
    `${school} softball leading the way!`,
    `Pitcher throwing heat, batter beware,`,
    `The ${competitor} simply can't compare!`,
    `Teamwork and talent on full display,`,
    `We're dominating every play!`,
    `${school} rises above the rest,`,
    `Swinging loud for ${c.belongTo}!`,
    `Championships waiting, taking them all,`,
    `${school} owns the softball!`,
  ],

  Tennis: (school, competitor, c) => [
    `${school} tennis players on the court,`,
    `Serving and volleying, giving support!`,
    `${c.lead} slicing through the air,`,
    `The ${competitor} can never compare!`,
    `Rallying back and forth with pride,`,
    `${school} tennis standing far and wide!`,
    `Net game sharp, baseline strong,`,
    `We're winning matches all day long!`,
    `Competitive fire burning bright,`,
    `${school} shining with ${c.wearPhrase} tonight!`,
    `Victory after victory, breaking through,`,
    `${c.named ? `We play for ${c.withDefiniteArticle}!` : `Every point—we fight for ${c.wearPhrase}!`}`,
    `${school} champions, the champions we'll be,`,
    `Watch us dominate, come and see!`,
  ],
};

/** Walk template order forwards, wrapping—random start keeps variety across runs. */
function takeConsecutiveWithWrap(lines: string[], startIndex: number, count: number): string[] {
  const n = lines.length;
  if (n === 0) return [];
  const start = ((startIndex % n) + n) % n;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(lines[(start + i) % n]);
  }
  return out;
}

async function generateTemplateChant(
  sport: string,
  school: string,
  competitor: string,
  structure: CheerStructure,
  colorNames: SchoolColorNames,
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const template = CHANT_TEMPLATES[sport];
  if (!template) {
    throw new Error(`Sport "${sport}" not supported`);
  }

  const { stanzas, linesPerStanza } = clampStructure(structure);
  const totalLines = stanzas * linesPerStanza;

  const palette = buildLyricPalette(colorNames);
  const lyricLines = template(school.trim(), competitor.trim(), palette);
  const startOffset = lyricLines.length > 0 ? Math.floor(Math.random() * lyricLines.length) : 0;
  const selectedLines = takeConsecutiveWithWrap(lyricLines, startOffset, totalLines);

  const stanzaChunks: string[] = [];
  for (let s = 0; s < stanzas; s++) {
    const slice = selectedLines.slice(s * linesPerStanza, (s + 1) * linesPerStanza);
    stanzaChunks.push(slice.join('\n'));
  }

  return stanzaChunks.join('\n\n');
}

const DEFAULT_AI_ENDPOINT = 'http://127.0.0.1:8000/generate-chant';

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
    return parseAndValidateAiOutput(data.chant, structure);
  } catch (error) {
    console.warn('AI generation unavailable, falling back to template generation.', error);
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function generateChant(
  sport: string,
  school: string,
  competitor: string,
  structure: CheerStructure,
  colorNames: SchoolColorNames,
): Promise<ChantResult> {
  const safeStructure = clampStructure(structure);
  const aiChant = await generateAiChant(sport, school, competitor, safeStructure, colorNames);
  if (aiChant) return { chant: aiChant, source: 'ai' };
  const chant = await generateTemplateChant(sport, school, competitor, safeStructure, colorNames);
  return { chant, source: 'template' };
}
