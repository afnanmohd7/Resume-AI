import { canonical, uniq } from './text';

export type Domain =
  | 'engineering'
  | 'data'
  | 'design'
  | 'product'
  | 'marketing'
  | 'sales'
  | 'finance'
  | 'operations'
  | 'support'
  | 'healthcare'
  | 'education'
  | 'general';

export const DOMAIN_LABELS: Record<Domain, string> = {
  engineering: 'Software & Engineering',
  data: 'Data & Analytics',
  design: 'Design & Creative',
  product: 'Product & Programme',
  marketing: 'Marketing & Growth',
  sales: 'Sales & Business Development',
  finance: 'Finance & Accounting',
  operations: 'Operations & Supply Chain',
  support: 'Customer Support & Success',
  healthcare: 'Healthcare & Clinical',
  education: 'Education & Training',
  general: 'General',
};

/**
 * Hard-skill dictionary. Membership here does three jobs: it boosts a term's
 * weight during job-description keyword extraction, it lets the ATS panel tell
 * "missing hard skill" from "missing nice-to-have phrase", and it drives
 * domain detection for verb selection.
 */
export const SKILLS: Record<Domain, string[]> = {
  engineering: [
    'javascript','typescript','python','java','c++','c#','go','golang','rust','ruby','php','swift',
    'kotlin','scala','perl','bash','shell scripting','html','css','sass','tailwind','react','angular',
    'vue','svelte','next.js','node.js','express','django','flask','fastapi','spring boot','rails',
    'laravel','.net','asp.net','graphql','rest api','grpc','microservices','websockets','redux',
    'react native','flutter','ios','android','xcode','unit testing','integration testing','jest',
    'cypress','playwright','selenium','pytest','junit','tdd','git','github','gitlab','bitbucket',
    'ci/cd','jenkins','github actions','circleci','docker','kubernetes','terraform','ansible',
    'helm','aws','azure','google cloud','gcp','lambda','s3','ec2','cloudformation','serverless',
    'linux','unix','nginx','apache','redis','rabbitmq','kafka','elasticsearch','postgresql','mysql',
    'mongodb','sqlite','dynamodb','oracle','sql','nosql','system design','api design','oauth',
    'authentication','encryption','penetration testing','owasp','siem','soc','incident response',
    'vulnerability assessment','network security','firewall','devops','sre','observability',
    'prometheus','grafana','datadog','sentry','agile','scrum','code review','refactoring','webpack',
    'vite','npm','monorepo','accessibility','wcag','performance optimization','caching',
  ],
  data: [
    'sql','python','r','pandas','numpy','scikit-learn','tensorflow','pytorch','keras','xgboost',
    'machine learning','deep learning','nlp','computer vision','llm','data modeling','data pipeline',
    'etl','elt','airflow','dbt','spark','hadoop','hive','databricks','snowflake','bigquery','redshift',
    'tableau','power bi','looker','qlik','excel','google sheets','statistics','regression',
    'hypothesis testing','a/b testing','experimentation','forecasting','time series','clustering',
    'segmentation','data visualization','dashboards','kpi','data governance','data quality',
    'jupyter','matplotlib','feature engineering','model deployment','mlops','recommendation systems',
  ],
  design: [
    'figma','sketch','adobe xd','photoshop','illustrator','indesign','after effects','premiere pro',
    'canva','framer','webflow','invision','prototyping','wireframing','user research','usability testing',
    'design systems','ui design','ux design','interaction design','visual design','typography',
    'color theory','branding','brand identity','motion graphics','3d modeling','blender','information architecture',
    'accessibility','wcag','responsive design','design thinking','user personas','journey mapping',
    'style guide','iconography','layout design','print design','packaging design',
  ],
  product: [
    'product roadmap','roadmapping','product strategy','backlog grooming','user stories','prd',
    'requirements gathering','stakeholder management','agile','scrum','kanban','jira','confluence',
    'asana','trello','linear','notion','sprint planning','okrs','kpi','go-to-market','competitive analysis',
    'market research','product analytics','amplitude','mixpanel','a/b testing','user research',
    'prioritization','risk management','release management','cross-functional leadership','roi analysis',
    'project management','pmp','waterfall','gantt','budget management','vendor management',
  ],
  marketing: [
    'seo','sem','google ads','facebook ads','meta ads','linkedin ads','tiktok ads','ppc',
    'content marketing','copywriting','content strategy','email marketing','mailchimp','klaviyo',
    'hubspot','marketo','salesforce marketing cloud','marketing automation','crm','social media',
    'community management','influencer marketing','brand strategy','campaign management',
    'google analytics','ga4','google tag manager','conversion rate optimization','cro','landing pages',
    'a/b testing','wordpress','webflow','hootsuite','buffer','canva','video editing','event marketing',
    'public relations','press releases','lead generation','demand generation','funnel optimization',
    'customer acquisition','retention marketing','newsletter','affiliate marketing','product marketing',
  ],
  sales: [
    'salesforce','hubspot crm','pipedrive','zoho','outreach','salesloft','cold calling','cold outreach',
    'prospecting','lead qualification','bant','meddic','solution selling','consultative selling',
    'negotiation','contract negotiation','account management','key account management','upselling',
    'cross-selling','pipeline management','forecasting','quota attainment','territory management',
    'b2b sales','b2c sales','saas sales','inside sales','field sales','channel partnerships',
    'business development','client relationship management','proposal writing','rfp','demo delivery',
    'customer onboarding','renewals','churn reduction',
  ],
  finance: [
    'financial modeling','financial analysis','forecasting','budgeting','variance analysis','fp&a',
    'accounts payable','accounts receivable','general ledger','reconciliation','month-end close',
    'quickbooks','xero','sap','netsuite','oracle financials','excel','vlookup','pivot tables','vba',
    'gaap','ifrs','audit','internal controls','sox','tax preparation','payroll','cost accounting',
    'valuation','dcf','due diligence','risk assessment','treasury','cash flow management','p&l',
    'balance sheet','invoicing','procurement','financial reporting','bloomberg','anti-money laundering',
  ],
  operations: [
    'supply chain','logistics','inventory management','procurement','vendor management','warehouse management',
    'demand planning','erp','sap','oracle','netsuite','lean','six sigma','kaizen','5s','process improvement',
    'standard operating procedures','sop','quality assurance','quality control','iso 9001','compliance',
    'health and safety','osha','scheduling','capacity planning','cost reduction','fleet management',
    'shipping','customs','distribution','order fulfillment','kpi tracking','workflow automation',
  ],
  support: [
    'zendesk','freshdesk','intercom','servicenow','jira service desk','salesforce service cloud',
    'live chat','ticketing','sla management','troubleshooting','escalation management','root cause analysis',
    'knowledge base','technical support','help desk','customer success','onboarding','account retention',
    'csat','nps','customer satisfaction','call center','de-escalation','remote support','active directory',
    'itil','hardware troubleshooting','software troubleshooting','crm',
  ],
  healthcare: [
    'patient care','clinical documentation','emr','ehr','epic','cerner','meditech','hipaa','icd-10',
    'cpt coding','medical billing','medical terminology','vital signs','phlebotomy','triage','bls','acls',
    'cpr','infection control','medication administration','care planning','case management','telehealth',
    'nursing','pharmacy','radiology','laboratory','quality improvement','patient education',
    'discharge planning','wound care','clinical trials','regulatory compliance',
  ],
  education: [
    'curriculum development','lesson planning','classroom management','differentiated instruction',
    'assessment design','formative assessment','iep','special education','esl','tesol','blended learning',
    'e-learning','instructional design','learning management system','lms','canvas','moodle','blackboard',
    'google classroom','student engagement','tutoring','mentoring','training delivery','workshop facilitation',
    'educational technology','data-driven instruction','parent communication','accreditation',
  ],
  general: [
    'communication','leadership','teamwork','problem solving','critical thinking','time management',
    'attention to detail','adaptability','collaboration','presentation','public speaking','documentation',
    'research','analytical skills','decision making','conflict resolution','mentoring','coaching',
    'multitasking','organization','microsoft office','word','powerpoint','outlook','slack','zoom',
    'google workspace','bilingual','spanish','french','german','mandarin','arabic','hindi',
  ],
};

/** Terms that read as soft skills — kept out of "missing hard skill" alerts. */
export const SOFT_SKILLS = new Set(SKILLS.general.slice(0, 20).map(canonical));

/**
 * Two-way alias table. Written one-directional (variant -> canonical) and
 * expanded at module load, so a resume saying "k8s" matches a JD saying
 * "Kubernetes" and vice-versa.
 */
const ALIAS_SOURCE: Record<string, string[]> = {
  javascript: ['js', 'ecmascript', 'es6', 'vanilla js'],
  typescript: ['ts'],
  'node.js': ['node', 'nodejs'],
  'next.js': ['next', 'nextjs'],
  react: ['react.js', 'reactjs'],
  vue: ['vue.js', 'vuejs'],
  angular: ['angular.js', 'angularjs'],
  kubernetes: ['k8s'],
  docker: ['containerization', 'containers'],
  'ci/cd': ['ci cd', 'cicd', 'continuous integration', 'continuous delivery', 'continuous deployment'],
  postgresql: ['postgres'],
  mongodb: ['mongo'],
  'machine learning': ['ml'],
  'deep learning': ['dl', 'neural networks'],
  nlp: ['natural language processing'],
  llm: ['large language model', 'large language models', 'genai', 'generative ai'],
  'computer vision': ['cv'],
  'google cloud': ['gcp', 'google cloud platform'],
  aws: ['amazon web services'],
  azure: ['microsoft azure'],
  'power bi': ['powerbi'],
  'a/b testing': ['ab testing', 'split testing'],
  'conversion rate optimization': ['cro'],
  seo: ['search engine optimization'],
  sem: ['search engine marketing'],
  ppc: ['pay per click'],
  'google analytics': ['ga', 'ga4'],
  crm: ['customer relationship management'],
  'ux design': ['user experience design', 'ux'],
  'ui design': ['user interface design', 'ui'],
  figma: ['figma design'],
  'qa': ['quality assurance'],
  'fp&a': ['financial planning and analysis', 'fpa'],
  'p&l': ['profit and loss', 'pnl'],
  'accounts payable': ['ap'],
  'accounts receivable': ['ar'],
  'six sigma': ['lean six sigma'],
  'project management': ['programme management', 'program management'],
  'stakeholder management': ['stakeholder engagement'],
  emr: ['electronic medical records'],
  ehr: ['electronic health records'],
  hipaa: ['health insurance portability'],
  lms: ['learning management system'],
  'rest api': ['rest', 'restful', 'restful api', 'restful apis', 'api development'],
  sql: ['structured query language'],
  'unit testing': ['unit tests'],
  agile: ['agile methodology', 'agile methodologies'],
  scrum: ['scrum framework'],
  okrs: ['okr', 'objectives and key results'],
  kpi: ['kpis', 'key performance indicators'],
  'customer success': ['client success'],
  'business development': ['bizdev', 'bd'],
  'microsoft office': ['ms office', 'office suite'],
  'google workspace': ['g suite', 'gsuite'],
};

export const ALIAS_MAP: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const [target, variants] of Object.entries(ALIAS_SOURCE)) {
    const canonicalTarget = canonical(target);
    map.set(canonicalTarget, canonicalTarget);
    for (const variant of variants) map.set(canonical(variant), canonicalTarget);
  }
  return map;
})();

/** Every known skill, canonicalised, for O(1) membership tests. */
export const ALL_SKILLS: Map<string, Domain> = (() => {
  const map = new Map<string, Domain>();
  for (const [domain, list] of Object.entries(SKILLS) as [Domain, string[]][]) {
    for (const skill of list) {
      const key = canonical(skill);
      if (!map.has(key)) map.set(key, domain);
    }
  }
  return map;
})();

/** canonical key -> the spelling it was authored with, for display. */
const SKILL_SOURCE: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const list of Object.values(SKILLS)) {
    for (const skill of list) {
      const key = canonical(skill);
      if (!map.has(key)) map.set(key, skill);
    }
  }
  return map;
})();

/** Words that must be shouted, not capitalised. */
const ACRONYMS = new Set([
  'ai','ml','nlp','llm','cv','ui','ux','api','apis','rest','crud','sql','nosql','html','css',
  'sass','php','aws','gcp','ec2','s3','sre','ci','cd','qa','tdd','bdd','ios','crm','cms','erp',
  'seo','sem','ppc','cro','roi','roas','cac','kpi','kpis','okr','okrs','arr','mrr','b2b','b2c',
  'saas','pmp','gaap','ifrs','sox','fp&a','p&l','ap','ar','sop','iso','osha','itil','sla','csat',
  'nps','emr','ehr','hipaa','icd-10','cpt','bls','acls','cpr','esl','tesol','lms','iep','wcag',
  'owasp','siem','soc','sdr','bdr','rfp','w-9','vba','dcf','5s','ga4','etl','elt','mlops','prd',
  'sap','bant','meddic','xd','3d','qbr','cpr','iso','vlookup','pmo','ada','eeo',
]);

/** Casing fixes the tokeniser cannot recover on its own. */
const DISPLAY_OVERRIDES: Record<string, string> = {
  'a b testing': 'A/B testing',
  'ci cd': 'CI/CD',
  'node.js': 'Node.js',
  'next.js': 'Next.js',
  'vue.js': 'Vue.js',
  'react native': 'React Native',
  'rest api': 'REST APIs',
  '.net': '.NET',
  'c++': 'C++',
  'c#': 'C#',
  'power bi': 'Power BI',
  'google cloud': 'Google Cloud',
  'jira service desk': 'Jira Service Desk',
  'salesforce service cloud': 'Salesforce Service Cloud',
  'google workspace': 'Google Workspace',
  'microsoft office': 'Microsoft Office',
  'github actions': 'GitHub Actions',
  jira: 'Jira',
  figma: 'Figma',
  // Brand spellings people notice when they are wrong.
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  github: 'GitHub',
  gitlab: 'GitLab',
  bitbucket: 'Bitbucket',
  graphql: 'GraphQL',
  mysql: 'MySQL',
  postgresql: 'PostgreSQL',
  mongodb: 'MongoDB',
  dynamodb: 'DynamoDB',
  sqlite: 'SQLite',
  netsuite: 'NetSuite',
  quickbooks: 'QuickBooks',
  wordpress: 'WordPress',
  hubspot: 'HubSpot',
  'hubspot crm': 'HubSpot CRM',
  salesloft: 'SalesLoft',
  servicenow: 'ServiceNow',
  freshdesk: 'Freshdesk',
  meditech: 'MEDITECH',
  tensorflow: 'TensorFlow',
  pytorch: 'PyTorch',
  xgboost: 'XGBoost',
  'scikit-learn': 'scikit-learn',
  bigquery: 'BigQuery',
  powerpoint: 'PowerPoint',
  indesign: 'InDesign',
  invision: 'InVision',
  'adobe xd': 'Adobe XD',
  'after effects': 'After Effects',
  'premiere pro': 'Premiere Pro',
  'linkedin ads': 'LinkedIn Ads',
  'tiktok ads': 'TikTok Ads',
  'meta ads': 'Meta Ads',
  'google ads': 'Google Ads',
  'google analytics': 'Google Analytics',
  'google sheets': 'Google Sheets',
  'google classroom': 'Google Classroom',
  'google tag manager': 'Google Tag Manager',
  'spring boot': 'Spring Boot',
  'asp.net': 'ASP.NET',
  'six sigma': 'Six Sigma',
  'lean six sigma': 'Lean Six Sigma',
  dbt: 'dbt',
  npm: 'npm',
  ios: 'iOS',
  'iso 9001': 'ISO 9001',
  'month-end close': 'Month-end close',
};

/** Brand and product names that keep their capital inside a sentence. */
const PROPER_SKILLS = new Set([
  'figma','sketch','photoshop','illustrator','indesign','canva','framer','webflow','invision',
  'blender','javascript','typescript','python','java','ruby','rust','swift','kotlin','scala','perl',
  'bash','react','angular','vue','svelte','express','django','flask','fastapi','rails','laravel',
  'graphql','flutter','xcode','jest','cypress','playwright','selenium','pytest','junit','git',
  'github','gitlab','bitbucket','jenkins','circleci','docker','kubernetes','terraform','ansible',
  'helm','azure','lambda','linux','unix','nginx','apache','redis','rabbitmq','kafka','elasticsearch',
  'postgresql','mysql','mongodb','sqlite','dynamodb','oracle','prometheus','grafana','datadog',
  'sentry','webpack','vite','npm','pandas','numpy','tensorflow','pytorch','keras','xgboost','airflow',
  'dbt','spark','hadoop','hive','databricks','snowflake','bigquery','redshift','tableau','looker',
  'qlik','excel','jupyter','matplotlib','jira','confluence','asana','trello','linear','notion',
  'amplitude','mixpanel','mailchimp','klaviyo','hubspot','marketo','salesforce','wordpress',
  'hootsuite','buffer','pipedrive','zoho','outreach','salesloft','quickbooks','xero','sap','netsuite',
  'bloomberg','zendesk','freshdesk','intercom','servicenow','epic','cerner','meditech','canvas',
  'moodle','blackboard','storybook','kaizen','agile','scrum','kanban','word','powerpoint','outlook',
  'zoom','slack','android','swift','golang','spanish','french','german','mandarin','arabic','hindi',
]);

/**
 * Presentable spelling of a canonical skill key.
 *
 * `prose` mode is for running sentences in the cover letter, where only
 * acronyms and brand names keep a capital — "working with design systems,
 * user research and Figma", not "Design Systems, User Research and Figma".
 */
export function skillLabel(term: string, prose = false): string {
  const key = canonicalSkill(term);
  const source = SKILL_SOURCE.get(key) ?? term;

  // Overrides are already written the way they should always appear.
  if (DISPLAY_OVERRIDES[key]) return DISPLAY_OVERRIDES[key];

  return source
    .split(' ')
    .map((word, index) => {
      if (ACRONYMS.has(word)) return word.toUpperCase();
      if (PROPER_SKILLS.has(word)) return word.charAt(0).toUpperCase() + word.slice(1);
      if (index === 0 && !prose) return word.charAt(0).toUpperCase() + word.slice(1);
      return word;
    })
    .join(' ');
}

/** Resolves aliases so "k8s" and "Kubernetes" collapse to one concept. */
export function canonicalSkill(term: string): string {
  const key = canonical(term);
  return ALIAS_MAP.get(key) ?? key;
}

export function isKnownSkill(term: string): boolean {
  return ALL_SKILLS.has(canonicalSkill(term));
}

export function isSoftSkill(term: string): boolean {
  return SOFT_SKILLS.has(canonicalSkill(term));
}

/** All surface forms a concept can appear as — used for resume/JD matching. */
export function surfaceForms(term: string): string[] {
  const target = canonicalSkill(term);
  const forms = [target, canonical(term)];
  for (const [variant, mapped] of ALIAS_MAP.entries()) {
    if (mapped === target) forms.push(variant);
  }
  return uniq(forms.filter(Boolean));
}

const DOMAIN_HINTS: Record<Domain, string[]> = {
  engineering: ['engineer','developer','programmer','software','backend','frontend','full stack','devops','sre','architect','security','qa'],
  data: ['data','analyst','analytics','scientist','machine learning','bi','statistician','research scientist'],
  design: ['designer','design','ux','ui','creative','art director','illustrator','brand'],
  product: ['product manager','product owner','program manager','project manager','scrum master','pmo','delivery'],
  marketing: ['marketing','growth','seo','content','social media','brand manager','communications','copywriter'],
  sales: ['sales','account executive','business development','account manager','sdr','bdr','partnerships'],
  finance: ['finance','accountant','accounting','financial','auditor','controller','bookkeeper','treasury','tax'],
  operations: ['operations','supply chain','logistics','warehouse','procurement','manufacturing','plant','fleet'],
  support: ['support','customer success','help desk','service desk','technical support','call center','client services'],
  healthcare: ['nurse','nursing','clinical','patient','medical','physician','therapist','pharmacy','healthcare','caregiver'],
  education: ['teacher','teaching','instructor','professor','tutor','education','curriculum','trainer','lecturer'],
  general: [],
};

/**
 * Infers a working domain from job titles and resume text. Title hints are
 * weighted heavily because they are the strongest signal available.
 */
export function detectDomain(titles: string[], body: string): Domain {
  const scores = new Map<Domain, number>();
  const bump = (domain: Domain, amount: number) =>
    scores.set(domain, (scores.get(domain) ?? 0) + amount);

  const titleText = ` ${canonical(titles.join(' '))} `;
  for (const [domain, hints] of Object.entries(DOMAIN_HINTS) as [Domain, string[]][]) {
    for (const hint of hints) {
      if (titleText.includes(` ${canonical(hint)} `) || titleText.includes(canonical(hint))) {
        bump(domain, 6);
      }
    }
  }

  const bodyText = ` ${canonical(body)} `;
  for (const [skill, domain] of ALL_SKILLS.entries()) {
    if (domain === 'general') continue;
    if (bodyText.includes(` ${skill} `)) bump(domain, 1);
  }

  let best: Domain = 'general';
  let bestScore = 0;
  scores.forEach((score, domain) => {
    if (score > bestScore) {
      bestScore = score;
      best = domain;
    }
  });
  return bestScore >= 3 ? best : 'general';
}

/** Finds every taxonomy skill present in a block of text. */
export function extractSkills(text: string): string[] {
  const haystack = ` ${canonical(text)} `;
  const found: string[] = [];
  for (const skill of ALL_SKILLS.keys()) {
    if (haystack.includes(` ${skill} `)) found.push(skill);
  }
  // Drop a skill fully contained in a longer match ("sql" inside "nosql" is
  // already excluded by the space padding; this catches "data" vs "data pipeline").
  return found.filter(
    (skill) => !found.some((other) => other !== skill && other.includes(skill) && other.length > skill.length),
  );
}

/**
 * Common skills for a field, minus what the person already listed. Gives the
 * skills step something helpful to offer before any job description exists.
 */
export function suggestSkills(domain: Domain, existing: string[], limit = 12): string[] {
  const have = new Set(existing.map(canonicalSkill));
  const pool = [...SKILLS[domain], ...SKILLS.general];
  const out: string[] = [];
  for (const skill of pool) {
    const key = canonicalSkill(skill);
    if (have.has(key) || out.some((item) => canonicalSkill(item) === key)) continue;
    out.push(skillLabel(skill));
    if (out.length >= limit) break;
  }
  return out;
}
