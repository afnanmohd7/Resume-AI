/**
 * Small, dependency-free text utilities shared by the bullet, ATS and
 * cover-letter engines. Everything here is deterministic and runs offline.
 */

export const STOPWORDS = new Set([
  'a','about','above','across','after','again','against','all','also','am','an','and','any','are',
  'as','at','back','be','because','been','before','being','below','between','both','but','by','can',
  'cannot','could','did','do','does','doing','done','down','during','each','either','else','etc',
  'even','ever','every','few','for','from','further','get','gets','had','has','have','having','he',
  'her','here','hers','herself','him','himself','his','how','however','i','if','in','into','is','it',
  'its','itself','just','like','ll','made','make','many','may','me','might','more','most','much',
  'must','my','myself','need','no','nor','not','now','of','off','on','once','only','or','other',
  'others','ought','our','ours','ourselves','out','over','own','per','re','s','same','shall','she',
  'should','so','some','such','t','than','that','the','their','theirs','them','themselves','then',
  'there','these','they','this','those','through','to','too','under','until','up','upon','us','ve',
  'very','via','was','we','well','were','what','when','where','whether','which','while','who','whom',
  'why','will','with','within','without','would','you','your','yours','yourself','yourselves',
  // job-posting boilerplate that would otherwise dominate keyword extraction
  'ability','able','applicant','apply','candidate','candidates','company','experience','experienced',
  'excellent','good','great','job','join','looking','opportunity','plus','position','preferred',
  'proven','required','requirement','requirements','responsibilities','role','seeking','strong',
  'team','teams','things','work','working','years','year','including','include','includes','using',
  'use','used','new','best','high','help','helping','ensure','ensuring','etc','you’ll','we’re',
]);

/** Lowercases and strips punctuation, keeping intra-word +, #, . and - (c++, c#, node.js, ci-cd). */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[‘’“”]/g, "'")
    .replace(/[^a-z0-9+#.\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(input: string): string[] {
  const cleaned = normalize(input);
  if (!cleaned) return [];
  return cleaned
    .split(' ')
    .map((token) => token.replace(/^[.\-]+|[.\-]+$/g, ''))
    .filter(Boolean);
}

/** Conservative plural stripper — deliberately does not touch verb endings. */
export function singularize(word: string): string {
  if (word.length <= 3) return word;
  if (/(ss|us|is|os)$/.test(word)) return word;
  if (/ies$/.test(word)) return word.slice(0, -3) + 'y';
  if (/(ches|shes|xes|zes|ses)$/.test(word)) return word.slice(0, -2);
  if (/s$/.test(word)) return word.slice(0, -1);
  return word;
}

export function canonical(term: string): string {
  return tokenize(term).map(singularize).join(' ');
}

export function ngrams(tokens: string[], n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i + n <= tokens.length; i += 1) out.push(tokens.slice(i, i + n).join(' '));
  return out;
}

export function wordCount(input: string): number {
  return tokenize(input).length;
}

export function titleCase(input: string): string {
  return input.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1));
}

export function sentenceCase(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  return trimmed[0].toUpperCase() + trimmed.slice(1);
}

export function splitSentences(input: string): string[] {
  return input
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

/** Collapses whitespace and repairs the spacing artefacts our rewrites can leave. */
export function tidy(input: string): string {
  return input
    .replace(/\s+/g, ' ')
    .replace(/\s+([,;.])/g, '$1')
    .replace(/,\s*,/g, ',')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/^[,;\s]+/, '')
    .replace(/[,;\s]+$/, '')
    .trim();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

/** Jaccard-ish overlap of two strings' content words, 0..1. */
export function overlap(a: string, b: string): number {
  const setA = new Set(tokenize(a).map(singularize).filter((t) => !STOPWORDS.has(t)));
  const setB = new Set(tokenize(b).map(singularize).filter((t) => !STOPWORDS.has(t)));
  if (!setA.size || !setB.size) return 0;
  let shared = 0;
  setA.forEach((token) => {
    if (setB.has(token)) shared += 1;
  });
  return shared / Math.min(setA.size, setB.size);
}

/**
 * A bare year is not an achievement. "Managed the accounts since 2022" reads
 * as quantified to a naive digit match, which both inflates the bullet score
 * and suppresses the "add a number" prompt — so 19xx/20xx are excluded unless
 * they carry a unit or currency.
 */
export const METRIC_PATTERN =
  /(\d[\d,.]*\s*(%|percent|k\b|m\b|bn\b|x\b|hrs?\b|hours?\b|days?\b|weeks?\b|months?\b|users?\b|customers?\b|clients?\b|people\b|members?\b|records?\b|tickets?\b|accounts?\b|countries\b|sites?\b|stores?\b|projects?\b)|[$£€]\s?\d|\d+\s*(to|-|–)\s*\d+|\b(?!(?:19|20)\d{2}\b)\d{2,}\b|\bdoubled\b|\btripled\b|\bhalved\b)/i;

export function hasMetric(input: string): boolean {
  return METRIC_PATTERN.test(input);
}

export function stableId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${random}`;
}
