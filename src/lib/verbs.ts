import type { Domain } from './taxonomy';

/** Strong action verbs grouped by the kind of work they describe. */
export const VERB_POOLS = {
  lead: ['Led', 'Directed', 'Spearheaded', 'Orchestrated', 'Oversaw', 'Chaired', 'Coordinated'],
  build: ['Built', 'Developed', 'Engineered', 'Designed', 'Architected', 'Implemented', 'Created'],
  improve: ['Streamlined', 'Optimized', 'Overhauled', 'Refined', 'Modernized', 'Accelerated', 'Simplified'],
  grow: ['Grew', 'Scaled', 'Expanded', 'Drove', 'Increased', 'Boosted', 'Generated'],
  reduce: ['Reduced', 'Cut', 'Eliminated', 'Minimized', 'Consolidated', 'Trimmed'],
  analyze: ['Analyzed', 'Evaluated', 'Investigated', 'Modeled', 'Forecasted', 'Audited', 'Diagnosed'],
  deliver: ['Delivered', 'Launched', 'Shipped', 'Deployed', 'Rolled out', 'Executed'],
  support: ['Resolved', 'Supported', 'Advised', 'Troubleshot', 'Handled', 'Serviced'],
  communicate: ['Presented', 'Authored', 'Documented', 'Negotiated', 'Facilitated', 'Briefed'],
  teach: ['Trained', 'Mentored', 'Coached', 'Onboarded', 'Instructed', 'Guided'],
  manage: ['Managed', 'Owned', 'Administered', 'Maintained', 'Governed', 'Prioritized'],
} as const;

export type VerbCategory = keyof typeof VERB_POOLS;

/** Preferred verb flavour per domain, most idiomatic first. */
export const DOMAIN_VERB_PRIORITY: Record<Domain, VerbCategory[]> = {
  engineering: ['build', 'deliver', 'improve', 'analyze', 'lead'],
  data: ['analyze', 'build', 'improve', 'communicate', 'deliver'],
  design: ['build', 'improve', 'communicate', 'deliver', 'lead'],
  product: ['lead', 'deliver', 'improve', 'analyze', 'communicate'],
  marketing: ['grow', 'deliver', 'build', 'analyze', 'communicate'],
  sales: ['grow', 'lead', 'communicate', 'manage', 'deliver'],
  finance: ['analyze', 'manage', 'reduce', 'communicate', 'improve'],
  operations: ['improve', 'manage', 'reduce', 'lead', 'deliver'],
  support: ['support', 'improve', 'teach', 'manage', 'communicate'],
  healthcare: ['support', 'manage', 'improve', 'teach', 'communicate'],
  education: ['teach', 'build', 'improve', 'communicate', 'lead'],
  general: ['lead', 'build', 'improve', 'manage', 'communicate'],
};

/**
 * Weak or over-used openers mapped to stronger alternatives. Keys are matched
 * case-insensitively against the start of a bullet, longest key first.
 */
export const WEAK_VERBS: Record<string, string[]> = {
  'was responsible for': ['Owned', 'Led', 'Managed', 'Directed'],
  'were responsible for': ['Owned', 'Led', 'Managed', 'Directed'],
  'responsible for': ['Owned', 'Led', 'Managed', 'Directed'],
  'duties included': ['Managed', 'Owned', 'Handled'],
  'tasked with': ['Owned', 'Led', 'Drove'],
  'in charge of': ['Directed', 'Led', 'Managed'],
  'helped to': ['Supported', 'Enabled', 'Contributed to'],
  'helped with': ['Supported', 'Enabled', 'Partnered on'],
  'worked with': ['Partnered with', 'Collaborated with', 'Advised'],
  'worked on': ['Built', 'Developed', 'Delivered'],
  'assisted with': ['Supported', 'Facilitated', 'Contributed to'],
  'participated in': ['Contributed to', 'Drove', 'Joined'],
  'involved in': ['Contributed to', 'Drove'],
  'took part in': ['Contributed to', 'Drove'],
  'made sure': ['Ensured', 'Guaranteed', 'Verified'],
  helped: ['Supported', 'Enabled', 'Advised'],
  worked: ['Delivered', 'Operated', 'Performed'],
  did: ['Executed', 'Performed', 'Completed'],
  made: ['Created', 'Produced', 'Built'],
  got: ['Secured', 'Obtained', 'Won'],
  gave: ['Delivered', 'Presented', 'Provided'],
  used: ['Leveraged', 'Applied', 'Deployed'],
  handled: ['Managed', 'Resolved', 'Administered'],
  dealt: ['Resolved', 'Handled', 'Addressed'],
  'looked after': ['Managed', 'Maintained', 'Oversaw'],
  'set up': ['Established', 'Configured', 'Launched'],
  'put together': ['Assembled', 'Produced', 'Compiled'],
  'came up with': ['Devised', 'Conceived', 'Designed'],
  'went to': ['Attended', 'Represented the team at'],
  'talked to': ['Consulted', 'Engaged', 'Advised'],
  'wrote': ['Authored', 'Produced', 'Documented'],
  'fixed': ['Resolved', 'Remediated', 'Repaired'],
  'checked': ['Reviewed', 'Audited', 'Validated'],
  'ran': ['Operated', 'Directed', 'Executed'],
  'started': ['Launched', 'Initiated', 'Established'],
  'improved': ['Enhanced', 'Optimized', 'Strengthened'],
  'a part of': ['Contributed to'],
  'part of': ['Contributed to'],
};

/** Padding that carries no information — removed before any rewrite. */
export const FILLER_PHRASES = [
  'as needed',
  'as required',
  'on a daily basis',
  'on a regular basis',
  'in order to',
  'various',
  'several',
  'a number of',
  'successfully',
  'effectively',
  'efficiently',
  'basically',
  'actually',
  'really',
  'very',
  'a lot of',
  'lots of',
  'etc.',
  'and so on',
  'day to day',
  'day-to-day',
  'hard working',
  'hard-working',
  'team player',
  'go-getter',
  'think outside the box',
  'results-oriented',
  'detail-oriented individual',
  'proven track record of',
];

export const FIRST_PERSON = /\b(i|i'm|i've|i'd|my|me|myself|we|our|us|ours)\b/gi;

/** "was reviewed", "were implemented", "is managed by" … */
export const PASSIVE_VOICE = /\b(am|is|are|was|were|be|been|being)\s+(\w+(ed|en))\b/i;

/** Signals that a bullet states an outcome rather than just a duty. */
export const IMPACT_MARKERS = [
  'result',
  'resulting in',
  'leading to',
  'which',
  'increas',
  'decreas',
  'reduc',
  'improv',
  'sav',
  'grew',
  'growth',
  'boost',
  'cut',
  'accelerat',
  'enabl',
  'drov',
  'generat',
  'deliver',
  'achiev',
  'exceed',
  'won',
  'earn',
  'rank',
  'award',
];

const VERB_LOOKUP: Set<string> = new Set(
  Object.values(VERB_POOLS)
    .flat()
    .map((verb) => verb.toLowerCase()),
);

export function isStrongVerb(word: string): boolean {
  return VERB_LOOKUP.has(word.toLowerCase());
}

/** Object nouns that imply a natural verb when the user writes none. */
export const NOUN_VERB_HINTS: Array<{ match: RegExp; category: VerbCategory }> = [
  { match: /\b(team|squad|staff|volunteers?|crew|committee|direct reports?)\b/i, category: 'lead' },
  { match: /\b(app|application|feature|website|site|platform|api|tool|dashboard|system|prototype|component|pipeline)\b/i, category: 'build' },
  { match: /\b(process|workflow|procedure|operation|efficiency|turnaround|latency|performance)\b/i, category: 'improve' },
  { match: /\b(data|report\w*|analys\w*|metric\w*|model\w*|forecast\w*|trend\w*|research|audit\w*)\b/i, category: 'analyze' },
  { match: /\b(presentation|documentation|proposal|contract|deck|article|content|newsletter)\b/i, category: 'communicate' },
  { match: /\b(revenue|sales|traffic|signups?|subscribers?|followers?|leads?|pipeline|conversion|arr|mrr)\b/i, category: 'grow' },
  { match: /\b(cost|costs|spend|waste|churn|downtime|errors?|defects?|backlog|overhead)\b/i, category: 'reduce' },
  { match: /\b(release|launch|campaign|rollout|deployment|migration|project|deliverable)\b/i, category: 'deliver' },
  { match: /\b(tickets?|issues?|complaints?|requests?|customers?|clients?|patients?|calls?)\b/i, category: 'support' },
  { match: /\b(training|onboarding|students?|pupils?|interns?|juniors?|mentees?|curriculum|workshop|class(es)?|lesson\w*|maths?|teaching)\b/i, category: 'teach' },
  { match: /\b(budget|inventory|schedule|accounts?|vendors?|portfolio|roadmap|records?)\b/i, category: 'manage' },
];

/**
 * Outcome scaffolds keyed by the kind of action, not the industry. Semantics
 * beat flavour here: "reducing X" after a cost bullet reads naturally, while a
 * domain-flavoured scaffold on the wrong kind of action reads like a machine
 * wrote it. Domain scaffolds below are used as secondary options.
 */
export const CATEGORY_SCAFFOLDS: Record<VerbCategory, string[]> = {
  lead: ['delivering [outcome] [N] weeks ahead of schedule', 'growing the team from [N] to [N]', 'raising delivery predictability by [X]%'],
  build: ['cutting [metric] by [X]%', 'serving [N] users at launch', 'replacing [N] hours of manual work each week'],
  improve: ['reducing [metric] by [X]%', 'saving [N] hours per week', 'lifting throughput by [X]%'],
  grow: ['increasing [metric] by [X]%', 'adding [N] new customers', 'generating $[X] in incremental revenue'],
  reduce: ['saving $[X] annually', 'cutting [metric] from [N] to [N]', 'eliminating [N] hours of rework per week'],
  analyze: ['informing a [decision] worth $[X]', 'improving forecast accuracy by [X]%', 'surfacing [N] issues that had gone unnoticed'],
  deliver: ['shipping [N] weeks ahead of plan', 'reaching [N] users in the first month', 'closing [N] open requests'],
  support: ['resolving [N]+ cases per week', 'raising satisfaction from [X] to [X]', 'cutting response time by [X]%'],
  communicate: ['aligning [N] stakeholders on a single plan', 'securing sign-off on a $[X] proposal', 'reaching an audience of [N]'],
  teach: ['lifting [metric] by [X]% across the group', 'training [N] people', 'shortening ramp-up time by [X]%'],
  manage: ['keeping [N] projects on schedule', 'reducing [metric] by [X]%', 'overseeing a $[X] budget'],
};

/**
 * Past-tense, outcome-first openers for the "Result-first" variant. Written
 * out rather than derived, so no conjugation rule can mangle them.
 */
export const RESULT_OPENERS: Record<VerbCategory, string[]> = {
  lead: ['Delivered [outcome] [N] weeks ahead of schedule', 'Grew the team from [N] to [N]'],
  build: ['Cut [metric] by [X]%', 'Shipped a system now serving [N] users'],
  improve: ['Reduced [metric] by [X]%', 'Saved [N] hours per week'],
  grow: ['Increased [metric] by [X]%', 'Generated $[X] in new revenue'],
  reduce: ['Saved $[X] annually', 'Cut [metric] from [N] to [N]'],
  analyze: ['Improved forecast accuracy by [X]%', 'Uncovered [N] issues worth $[X]'],
  deliver: ['Launched [N] weeks ahead of plan', 'Reached [N] users in the first month'],
  support: ['Raised satisfaction from [X] to [X]', 'Cut response time by [X]%'],
  communicate: ['Aligned [N] stakeholders on a single plan', 'Won sign-off on a $[X] proposal'],
  teach: ['Trained [N] people', 'Shortened ramp-up time by [X]%'],
  manage: ['Kept [N] projects on schedule', 'Reduced [metric] by [X]%'],
};

/** Quantification prompts, tuned per domain, shown when a bullet has no metric. */
export const METRIC_PROMPTS: Record<Domain, string[]> = {
  engineering: ['latency or load time reduced (ms / %)', 'users or requests served', 'deploy frequency or build time', 'bugs or incidents prevented', 'test coverage %'],
  data: ['model accuracy or lift %', 'rows / datasets processed', 'hours of manual reporting saved', 'decisions or teams influenced', 'forecast error reduced'],
  design: ['conversion or task-completion lift %', 'screens or components shipped', 'usability test participants', 'design-system adoption across N teams', 'support tickets reduced'],
  product: ['revenue or adoption impact', 'features shipped per quarter', 'cycle time reduced', 'size of team / stakeholders aligned', 'NPS or retention change'],
  marketing: ['CTR / conversion rate change', 'traffic or impressions', 'CAC or ROAS', 'leads generated', 'audience growth %'],
  sales: ['quota attainment %', 'revenue or ARR closed', 'deals or accounts won', 'pipeline generated', 'churn reduced %'],
  finance: ['dollars saved or recovered', 'budget size managed', 'close time reduced (days)', 'variance or error rate', 'audit findings resolved'],
  operations: ['cost per unit reduced', 'throughput or volume handled', 'on-time delivery %', 'downtime or waste reduced', 'headcount coordinated'],
  support: ['tickets resolved per week', 'CSAT / NPS score', 'first-response or resolution time', 'escalation rate reduced', 'knowledge articles written'],
  healthcare: ['patients cared for per shift', 'wait or turnaround time reduced', 'compliance or audit score', 'readmission rate', 'staff trained'],
  education: ['students taught', 'score or pass-rate improvement', 'programmes or courses built', 'attendance or engagement lift', 'staff trained'],
  general: ['%, $, or time saved', 'volume handled (per day / week)', 'people or teams affected', 'before-and-after comparison', 'rank or award earned'],
};

/** Impact scaffolds offered when the user has not supplied an outcome. */
export const IMPACT_SCAFFOLDS: Record<Domain, string[]> = {
  engineering: ['cutting {metric} by [X]%', 'supporting [N] daily active users', 'reducing incident volume by [X]%'],
  data: ['improving forecast accuracy by [X]%', 'saving [N] hours of manual reporting each week', 'informing [N] product decisions'],
  design: ['lifting task completion by [X]%', 'reducing support tickets by [X]%', 'adopted by [N] product teams'],
  product: ['delivering [X]% growth in [metric]', 'shortening release cycles by [X]%', 'aligning [N] cross-functional stakeholders'],
  marketing: ['growing [metric] by [X]%', 'generating [N] qualified leads per month', 'lowering cost per acquisition by [X]%'],
  sales: ['closing $[X] in new revenue', 'exceeding quota by [X]%', 'expanding the account base by [N] clients'],
  finance: ['saving $[X] annually', 'cutting close time from [N] to [N] days', 'reducing reporting errors by [X]%'],
  operations: ['reducing cost per unit by [X]%', 'raising on-time delivery to [X]%', 'eliminating [N] hours of rework per week'],
  support: ['raising CSAT from [X] to [X]', 'cutting first-response time by [X]%', 'resolving [N]+ tickets per week'],
  healthcare: ['improving patient throughput by [X]%', 'maintaining [X]% compliance across audits', 'reducing wait times by [N] minutes'],
  education: ['raising average scores by [X]%', 'increasing engagement by [X]%', 'reaching [N] students each term'],
  general: ['improving [metric] by [X]%', 'saving [N] hours per week', 'serving [N] people'],
};
