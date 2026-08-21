import type { BulletAnalysis, BulletIssue } from '../types';
import { clamp, hasMetric, tidy, tokenize, uniq, wordCount } from './text';
import { extractSkills, type Domain } from './taxonomy';
import {
  CATEGORY_SCAFFOLDS,
  DOMAIN_VERB_PRIORITY,
  FILLER_PHRASES,
  FIRST_PERSON,
  IMPACT_MARKERS,
  IMPACT_SCAFFOLDS,
  NOUN_VERB_HINTS,
  PASSIVE_VOICE,
  RESULT_OPENERS,
  VERB_POOLS,
  WEAK_VERBS,
  isStrongVerb,
  type VerbCategory,
} from './verbs';

/**
 * Past tense -> base form. Kept as an explicit table rather than a suffix rule
 * because "developed" -> "develope" is the kind of error that makes a resume
 * look machine-written. Every verb this module can emit is listed.
 */
const BASE_FORM: Record<string, string> = {
  led: 'lead', directed: 'direct', spearheaded: 'spearhead', orchestrated: 'orchestrate',
  oversaw: 'oversee', chaired: 'chair', coordinated: 'coordinate', built: 'build',
  developed: 'develop', engineered: 'engineer', designed: 'design', architected: 'architect',
  implemented: 'implement', created: 'create', streamlined: 'streamline', optimized: 'optimize',
  overhauled: 'overhaul', refined: 'refine', modernized: 'modernize', accelerated: 'accelerate',
  simplified: 'simplify', grew: 'grow', scaled: 'scale', expanded: 'expand', drove: 'drive',
  increased: 'increase', boosted: 'boost', generated: 'generate', reduced: 'reduce', cut: 'cut',
  eliminated: 'eliminate', minimized: 'minimize', consolidated: 'consolidate', trimmed: 'trim',
  analyzed: 'analyze', evaluated: 'evaluate', investigated: 'investigate', modeled: 'model',
  forecasted: 'forecast', audited: 'audit', diagnosed: 'diagnose', delivered: 'deliver',
  launched: 'launch', shipped: 'ship', deployed: 'deploy', executed: 'execute', resolved: 'resolve',
  supported: 'support', advised: 'advise', troubleshot: 'troubleshoot', handled: 'handle',
  serviced: 'service', presented: 'present', authored: 'author', documented: 'document',
  negotiated: 'negotiate', facilitated: 'facilitate', briefed: 'brief', trained: 'train',
  mentored: 'mentor', coached: 'coach', onboarded: 'onboard', instructed: 'instruct',
  guided: 'guide', managed: 'manage', owned: 'own', administered: 'administer',
  maintained: 'maintain', governed: 'govern', prioritized: 'prioritize', enabled: 'enable',
  partnered: 'partner', collaborated: 'collaborate', joined: 'join', ensured: 'ensure',
  guaranteed: 'guarantee', verified: 'verify', operated: 'operate', performed: 'perform',
  completed: 'complete', produced: 'produce', secured: 'secure', obtained: 'obtain', won: 'win',
  provided: 'provide', leveraged: 'leverage', applied: 'apply', addressed: 'address',
  established: 'establish', configured: 'configure', assembled: 'assemble', compiled: 'compile',
  devised: 'devise', conceived: 'conceive', attended: 'attend', consulted: 'consult',
  engaged: 'engage', remediated: 'remediate', repaired: 'repair', reviewed: 'review',
  validated: 'validate', initiated: 'initiate', enhanced: 'enhance', strengthened: 'strengthen',
  improved: 'improve', saved: 'save', decreased: 'decrease', wrote: 'write', ran: 'run',
  started: 'start', fixed: 'fix', checked: 'check', helped: 'help', made: 'make', did: 'do',
  used: 'use', got: 'get', gave: 'give', worked: 'work', dealt: 'deal', achieved: 'achieve',
  exceeded: 'exceed', earned: 'earn', ranked: 'rank', awarded: 'award', tested: 'test',
  migrated: 'migrate', automated: 'automate', integrated: 'integrate', refactored: 'refactor',
  lowered: 'lower', raised: 'raise', shortened: 'shorten', aligned: 'align', informed: 'inform',
  lifted: 'lift', reached: 'reach', served: 'serve', halved: 'halve', doubled: 'double',
  tripled: 'triple', freed: 'free', unlocked: 'unlock', sustained: 'sustain', retained: 'retain',
  converted: 'convert', recovered: 'recover', surfaced: 'surface', uncovered: 'uncover',
  replaced: 'replace', overseen: 'oversee', kept: 'keep',
  // Irregulars people actually write on resumes. Without these the parser
  // treats the verb as a noun and prefixes a second one ("Trained taught...").
  taught: 'teach', brought: 'bring', sought: 'seek', spoke: 'speak', took: 'take',
  held: 'hold', sold: 'sell', told: 'tell', left: 'leave', met: 'meet', paid: 'pay',
  spent: 'spend', drew: 'draw', found: 'find', knew: 'know', saw: 'see', showed: 'show',
  sat: 'sit', stood: 'stand', thought: 'think', understood: 'understand', chose: 'choose',
  rebuilt: 'rebuild', put: 'put', set: 'set', hit: 'hit',
  processed: 'process', chased: 'chase', tracked: 'track', scheduled: 'schedule',
  ordered: 'order', packed: 'pack', assisted: 'assist', organized: 'organize',
  arranged: 'arrange', prepared: 'prepare', updated: 'update', monitored: 'monitor',
  recorded: 'record', greeted: 'greet', promoted: 'promote', planned: 'plan',
  hired: 'hire', recruited: 'recruit', interviewed: 'interview', budgeted: 'budget',
  invoiced: 'invoice', reconciled: 'reconcile', staffed: 'staff', stocked: 'stock',
};

/** True when the verb can be conjugated from the table rather than guessed. */
function canConjugate(verb: string): boolean {
  const lower = verb.toLowerCase();
  return Boolean(BASE_FORM[lower]) || KNOWN_BASES.has(lower);
}

/** base -> past, inverted from the table above so both directions stay in step. */
const PAST_FORM: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [past, base] of Object.entries(BASE_FORM)) {
    if (!map[base]) map[base] = past;
  }
  return map;
})();

const KNOWN_BASES = new Set(Object.values(BASE_FORM));

/** Base verbs that double their final consonant before -ing. */
const DOUBLING = new Set(['ship', 'cut', 'run', 'trim', 'plan', 'set', 'get', 'win', 'begin', 'refer']);

function toBase(verb: string): string {
  const lower = verb.toLowerCase();
  return BASE_FORM[lower] ?? lower;
}

function toGerund(verb: string): string {
  const base = toBase(verb);
  if (DOUBLING.has(base)) return `${base}${base.slice(-1)}ing`;
  if (base.endsWith('ie')) return `${base.slice(0, -2)}ying`;
  if (base.endsWith('e') && !base.endsWith('ee')) return `${base.slice(0, -1)}ing`;
  return `${base}ing`;
}

/** Third-person-free present tense, for roles the person still holds. */
function toPresent(verb: string): string {
  return toBase(verb);
}

/**
 * Resolves an -ing form back to its base by trying the three spellings English
 * uses: bare stem (support-ing), restored silent e (reduc-ing), and undoubled
 * consonant (cutt-ing). Returns null when none is a verb we know, which is the
 * signal to skip a rewrite rather than emit something like "cutted".
 */
function gerundToBase(word: string): string | null {
  const lower = word.toLowerCase();
  if (!lower.endsWith('ing') || lower.length < 5) return null;
  const stem = lower.slice(0, -3);
  const candidates = [stem, `${stem}e`];
  if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
    candidates.push(stem.slice(0, -1));
  }
  return candidates.find((candidate) => KNOWN_BASES.has(candidate)) ?? null;
}

function gerundToPast(word: string): string | null {
  const base = gerundToBase(word);
  if (!base) return null;
  return PAST_FORM[base] ?? null;
}

function capitalize(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  return trimmed[0].toUpperCase() + trimmed.slice(1);
}

function applyTense(verb: string, present: boolean): string {
  return capitalize(present ? toPresent(verb) : verb.toLowerCase() === verb ? verb : verb);
}

const VAGUE_WORDS = /\b(various|several|numerous|many|stuff|things|etc|some|multiple)\b/i;

const CLAUSE_SPLIT =
  /(?:,\s*)?\b(?:which|that)\s+(?=\w)|,\s*(?=(?:result|lead|increas|reduc|decreas|improv|sav|grow|cut|boost|driv|generat|enabl|allow|help)\w*\b)|\bresulting in\b|\bleading to\b|\bwhich led to\b|\bso that\b/i;

export interface BulletDraft {
  text: string;
  style: string;
  note: string;
}

export interface BulletContext {
  domain: Domain;
  present: boolean;
}

/* ------------------------------------------------------------------ *
 * Analysis
 * ------------------------------------------------------------------ */

export function analyzeBullet(raw: string): BulletAnalysis {
  const text = raw.trim();
  const issues: BulletIssue[] = [];
  const strengths: string[] = [];
  const words = wordCount(text);
  const metric = hasMetric(text);
  let score = 100;

  if (!text) {
    return { score: 0, issues: [{ level: 'error', label: 'Empty', detail: 'This bullet has no content.' }], strengths: [], wordCount: 0, hasMetric: false };
  }

  const firstWord = tokenize(text)[0] ?? '';
  const lower = ` ${text.toLowerCase()} `;

  const weakOpener = Object.keys(WEAK_VERBS)
    .sort((a, b) => b.length - a.length)
    .find((phrase) => text.toLowerCase().startsWith(phrase));

  if (weakOpener) {
    score -= 22;
    issues.push({
      level: 'error',
      label: 'Weak opener',
      detail: `Starts with “${weakOpener}”. Lead with an action verb such as ${WEAK_VERBS[weakOpener].slice(0, 3).join(', ')}.`,
    });
  } else if (isStrongVerb(firstWord) || BASE_FORM[firstWord]) {
    strengths.push('Opens with a strong action verb');
  } else {
    score -= 14;
    issues.push({
      level: 'warn',
      label: 'No action verb',
      detail: 'Recruiters scan the first two words. Start with a verb that shows what you did.',
    });
  }

  const pronouns = text.match(FIRST_PERSON);
  if (pronouns) {
    score -= 15;
    issues.push({
      level: 'error',
      label: 'First person',
      detail: `Resume bullets drop pronouns — remove “${uniq(pronouns.map((p) => p.toLowerCase())).join('”, “')}”.`,
    });
  }

  if (metric) {
    strengths.push('Quantified with a number');
  } else {
    score -= 18;
    issues.push({
      level: 'warn',
      label: 'Not quantified',
      detail: 'Add a number — %, $, volume, time saved, or people affected.',
    });
  }

  if (PASSIVE_VOICE.test(text)) {
    score -= 10;
    issues.push({
      level: 'warn',
      label: 'Passive voice',
      detail: 'Rewrite so you are the actor: “Reduced costs”, not “costs were reduced”.',
    });
  }

  const fillerFound = FILLER_PHRASES.filter((phrase) => lower.includes(` ${phrase} `));
  if (fillerFound.length) {
    score -= Math.min(12, fillerFound.length * 6);
    issues.push({
      level: 'info',
      label: 'Filler',
      detail: `Cut padding that adds no information: “${fillerFound.slice(0, 3).join('”, “')}”.`,
    });
  }

  if (VAGUE_WORDS.test(text)) {
    score -= 6;
    issues.push({
      level: 'info',
      label: 'Vague quantity',
      detail: '“Various” and “several” cost you a real number. Say how many.',
    });
  }

  if (words < 6) {
    score -= 12;
    issues.push({ level: 'warn', label: 'Too short', detail: 'Under 6 words rarely carries context or result. Aim for 12–28.' });
  } else if (words > 34) {
    score -= 10;
    issues.push({ level: 'warn', label: 'Too long', detail: `${words} words will wrap to three lines. Split it or trim to under 28.` });
  } else if (words >= 12 && words <= 28) {
    strengths.push('Well-sized for a single scan line');
  }

  const hasImpact = IMPACT_MARKERS.some((marker) => lower.includes(marker));
  if (hasImpact) {
    strengths.push('States an outcome, not just a duty');
  } else {
    score -= 8;
    issues.push({
      level: 'info',
      label: 'No outcome',
      detail: 'Close with the result: what changed because you did this?',
    });
  }

  const skills = extractSkills(text);
  if (skills.length) strengths.push(`Names concrete tools (${skills.slice(0, 3).join(', ')})`);

  return { score: clamp(Math.round(score), 0, 100), issues, strengths, wordCount: words, hasMetric: metric };
}

/* ------------------------------------------------------------------ *
 * Cleaning + parsing
 * ------------------------------------------------------------------ */

function stripNoise(input: string): string {
  let text = ` ${input.trim()} `;
  text = text.replace(FIRST_PERSON, ' ');
  for (const phrase of FILLER_PHRASES) {
    text = text.replace(new RegExp(`\\s${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s`, 'gi'), ' ');
  }
  text = text.replace(/^\s*(and|also|then|plus)\s+/i, ' ');
  // Removing "I" from "I was in charge of..." strands the auxiliary, which
  // then blocks the weak-phrase match and gets treated as the object.
  text = text.replace(/^\s*(was|were|am|is|are|be|been|being|have|has|had|did|do|does)\s+(?=\S)/i, ' ');
  text = text.replace(/\s*[.;]+\s*$/, ' ');
  return tidy(text);
}

interface ParsedBullet {
  verb: string;
  object: string;
  impact: string;
  method: string;
  /** The word that introduced the method clause — reused verbatim so
   *  "using React" never comes back as "by React". */
  methodPrep: string;
  category: VerbCategory;
  /** True when the writer supplied the verb themselves. Their word is then
   *  never swapped for a synonym: "Taught maths" must not become
   *  "Trained maths". */
  verbFromWriter: boolean;
}

/** Reverse index so an existing strong verb can be swapped for a sibling. */
const CATEGORY_OF_VERB: Map<string, VerbCategory> = (() => {
  const map = new Map<string, VerbCategory>();
  for (const [category, verbs] of Object.entries(VERB_POOLS) as [VerbCategory, readonly string[]][]) {
    for (const verb of verbs) {
      const base = toBase(verb);
      if (!map.has(base)) map.set(base, category);
    }
  }
  return map;
})();

function categoryOfVerb(verb: string): VerbCategory | null {
  return CATEGORY_OF_VERB.get(toBase(verb)) ?? null;
}

/** Turns "which reduced churn" into the participle form "reducing churn". */
function toParticiple(clause: string): string {
  const cleaned = tidy(clause.replace(/^(which|that|so that|resulting in|leading to)\s+/i, ''));
  if (!cleaned) return '';
  const [first, ...rest] = cleaned.split(' ');
  const lower = first.toLowerCase();
  if (lower.endsWith('ing')) return cleaned;
  if (BASE_FORM[lower] || /(ed|s)$/.test(lower)) {
    return tidy(`${toGerund(lower)} ${rest.join(' ')}`);
  }
  return cleaned;
}

function pickVerbCategory(text: string, domain: Domain): VerbCategory {
  for (const hint of NOUN_VERB_HINTS) {
    if (hint.match.test(text)) return hint.category;
  }
  return DOMAIN_VERB_PRIORITY[domain][0];
}

function parseBullet(raw: string, domain: Domain): ParsedBullet {
  const cleaned = stripNoise(raw);

  // Separate an outcome clause if the writer supplied one.
  let action = cleaned;
  let impact = '';
  const splitIndex = cleaned.search(CLAUSE_SPLIT);
  if (splitIndex > 8) {
    action = tidy(cleaned.slice(0, splitIndex));
    impact = toParticiple(cleaned.slice(splitIndex));
  }

  // Pull out an explicit method phrase so variants can reposition it.
  // "with" is deliberately excluded: "helped customers with their problems"
  // is an object, not a method, and treating it as one mangles the sentence.
  let method = '';
  let methodPrep = '';
  const methodMatch = action.match(/\b(by|through|via|using|leveraging)\s+([^,]{3,60})$/i);
  if (methodMatch) {
    methodPrep = methodMatch[1].toLowerCase();
    method = tidy(methodMatch[2]);
    action = tidy(action.slice(0, methodMatch.index));
  }

  // Identify the head verb.
  const lowerAction = action.toLowerCase();
  const weakKey = Object.keys(WEAK_VERBS)
    .sort((a, b) => b.length - a.length)
    .find((phrase) => lowerAction.startsWith(phrase));

  let verb = '';
  let object = action;
  let verbFromWriter = false;

  if (weakKey) {
    verb = WEAK_VERBS[weakKey][0];
    object = tidy(action.slice(weakKey.length));
    object = object.replace(/^(the|a|an|to|for|of|my|our)\s+/i, '');
  } else {
    const firstWord = action.split(' ')[0] ?? '';
    const bare = firstWord.toLowerCase().replace(/[^a-z]/g, '');
    // A regular -ed ending is enough to trust it as the verb; inventing a new
    // one on top would produce "Trained taught year 9 maths".
    const looksLikeVerb = isStrongVerb(bare) || Boolean(BASE_FORM[bare]) || /ed$/.test(bare);
    if (looksLikeVerb && bare.length > 2) {
      verb = capitalize(bare);
      object = tidy(action.slice(firstWord.length));
      verbFromWriter = true;
    } else {
      const inferred = pickVerbCategory(cleaned, domain);
      verb = VERB_POOLS[inferred][0];
      object = tidy(action.replace(/^(the|a|an)\s+/i, ''));
    }
  }

  const category = weakKey
    ? pickVerbCategory(cleaned, domain)
    : (categoryOfVerb(verb) ?? pickVerbCategory(cleaned, domain));
  return { verb, object, impact, method, methodPrep, category, verbFromWriter };
}

/* ------------------------------------------------------------------ *
 * Rewrite
 * ------------------------------------------------------------------ */

export function rewriteBullet(raw: string, ctx: BulletContext): { text: string; changes: string[] } {
  const changes: string[] = [];
  const original = raw.trim();
  if (!original) return { text: '', changes: [] };

  if (FIRST_PERSON.test(original)) changes.push('Removed first-person pronouns');
  FIRST_PERSON.lastIndex = 0;

  const lowerOriginal = original.toLowerCase();
  const weakKey = Object.keys(WEAK_VERBS)
    .sort((a, b) => b.length - a.length)
    .find((phrase) => lowerOriginal.startsWith(phrase));

  const parsed = parseBullet(original, ctx.domain);
  if (weakKey) changes.push(`Replaced “${weakKey}” with “${parsed.verb}”`);

  const fillerFound = FILLER_PHRASES.filter((phrase) => ` ${lowerOriginal} `.includes(` ${phrase} `));
  if (fillerFound.length) changes.push(`Cut filler: ${fillerFound.slice(0, 3).join(', ')}`);

  const parts = [applyTense(parsed.verb, ctx.present), parsed.object];
  if (parsed.method) {
    parts.push(`${parsed.methodPrep} ${parsed.method}`);
  }

  let text = tidy(parts.join(' '));
  if (parsed.impact) {
    text = tidy(`${text}, ${parsed.impact}`);
    changes.push('Reframed the outcome as a result clause');
  } else if (!hasMetric(original)) {
    const scaffold = CATEGORY_SCAFFOLDS[parsed.category][0] ?? IMPACT_SCAFFOLDS[ctx.domain][0];
    text = tidy(`${text}, ${scaffold}`);
    changes.push('Added a bracketed impact slot — replace it with your real number');
  }

  return { text: capitalize(text), changes: uniq(changes) };
}

/* ------------------------------------------------------------------ *
 * Generation
 * ------------------------------------------------------------------ */

export function generateBullets(raw: string, ctx: BulletContext): BulletDraft[] {
  const input = raw.trim();
  if (input.length < 3) return [];

  const parsed = parseBullet(input, ctx.domain);
  const category = parsed.category;
  const carriesMetric = hasMetric(input);

  // Scaffolds are chosen by the kind of action first and the person's field
  // second — an outcome that does not fit the verb reads worse than a generic one.
  const scaffolds = uniq([...CATEGORY_SCAFFOLDS[category], ...IMPACT_SCAFFOLDS[ctx.domain]]);
  const impact = parsed.impact || (carriesMetric ? '' : scaffolds[0]);

  // Alternates come from the same category, so the swap stays sensible:
  // "Owned" may become "Managed", never "Grew".
  const siblings = uniq([parsed.verb, ...VERB_POOLS[category]]).filter(Boolean);
  const methodTail = parsed.method ? `${parsed.methodPrep} ${parsed.method}` : '';

  const drafts: BulletDraft[] = [];

  // 1. Action then result — the shape most recruiters expect.
  {
    const head = [applyTense(siblings[0], ctx.present), parsed.object, methodTail]
      .filter(Boolean)
      .join(' ');
    drafts.push({
      text: capitalize(tidy(impact ? `${head}, ${impact}` : head)),
      style: 'Impact-led',
      note: 'Standard shape: what you did, then what changed.',
    });
  }

  // 2. Result first. Only offered when the outcome can be put into past tense
  //    safely — a mangled verb is worse than one fewer option.
  {
    const opener = parsed.impact
      ? (() => {
          const [first, ...rest] = parsed.impact.split(' ');
          const past = gerundToPast(first);
          return past ? capitalize(`${past} ${rest.join(' ')}`) : null;
        })()
      : (RESULT_OPENERS[category][0] ?? null);

    const gerund = toGerund(siblings[0]);
    const worthOffering = Boolean(parsed.impact) || !carriesMetric;
    if (opener && parsed.object && canConjugate(siblings[0]) && worthOffering) {
      drafts.push({
        text: capitalize(tidy(`${opener} by ${gerund} ${parsed.object} ${methodTail}`)),
        style: 'Result-first',
        note: 'Puts the number in the first three words — best for your strongest achievement.',
      });
    }
  }

  // 3. Scope and scale — breadth of ownership rather than depth.
  {
    // Neither the scope hint nor an invented outcome belongs on a bullet that
    // already carries its own numbers.
    const scopeHint =
      carriesMetric || /\b(across|for|team|client|region|store|market|department|customers?)\b/i.test(input)
        ? ''
        : ' across [N] teams/accounts';
    const scopeVerb = parsed.verbFromWriter ? siblings[0] : (siblings[1] ?? siblings[0]);
    const head = [applyTense(scopeVerb, ctx.present), parsed.object, methodTail]
      .filter(Boolean)
      .join(' ');
    const tail = parsed.impact || (carriesMetric ? '' : scaffolds[1] || scaffolds[0]);
    drafts.push({
      text: capitalize(tidy(tail ? `${head}${scopeHint}, ${tail}` : `${head}${scopeHint}`)),
      style: 'Scope & scale',
      note: 'Shows breadth of ownership — good for senior or cross-functional roles.',
    });
  }

  const seen = new Set<string>();
  return drafts.filter((draft) => {
    const key = draft.text.toLowerCase();
    if (seen.has(key) || draft.text.length < 12) return false;
    seen.add(key);
    return true;
  });
}

/** Verb variety check across a whole role — repetition is a common flaw. */
export function repeatedOpeners(bullets: string[]): string[] {
  const counts = new Map<string, number>();
  for (const bullet of bullets) {
    const first = (tokenize(bullet)[0] ?? '').toLowerCase();
    if (!first) continue;
    counts.set(first, (counts.get(first) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([verb]) => verb);
}
