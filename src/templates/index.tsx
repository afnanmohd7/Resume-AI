import { Fragment, type CSSProperties, type ReactNode } from 'react';
import type { DesignSettings, ResumeData, SectionKey } from '../types';
import { SECTION_LABELS } from '../types';
import { formatRange } from '../lib/dates';
import { safeUrl } from '../lib/storage';

export const PAGE_SIZES = {
  a4: { width: 794, height: 1123, label: 'A4 · 210 × 297 mm' },
  letter: { width: 816, height: 1056, label: 'Letter · 8.5 × 11 in' },
} as const;

interface TemplateProps {
  resume: ResumeData;
  design: DesignSettings;
}

/* ------------------------------------------------------------------ *
 * Shared pieces
 * ------------------------------------------------------------------ */

function visibleSections(resume: ResumeData): SectionKey[] {
  return resume.sectionOrder.filter((key) => !resume.hidden.includes(key) && hasContent(resume, key));
}

function hasContent(resume: ResumeData, key: SectionKey): boolean {
  switch (key) {
    case 'summary':
      return resume.summary.trim().length > 0;
    case 'experience':
      return resume.experience.some((role) => role.role || role.company || role.bullets.some(Boolean));
    case 'education':
      return resume.education.some((entry) => entry.degree || entry.school);
    case 'skills':
      return resume.skills.some((group) => group.items.filter(Boolean).length > 0);
    case 'projects':
      return resume.projects.some((project) => project.name || project.bullets.some(Boolean));
    case 'certifications':
      return resume.certifications.some((cert) => cert.name);
    default:
      return false;
  }
}

function headingFor(resume: ResumeData, key: SectionKey): string {
  return resume.headings[key]?.trim() || SECTION_LABELS[key];
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="doc-section">
      <h2 className="doc-section-title">{title}</h2>
      {children}
    </section>
  );
}

function ContactLine({ resume, showIcons }: { resume: ResumeData; showIcons: boolean }) {
  const { contact } = resume;
  const entries: Array<{ text: string; href?: string }> = [];
  if (contact.location) entries.push({ text: contact.location });
  if (contact.email) entries.push({ text: contact.email, href: `mailto:${contact.email}` });
  if (contact.phone) entries.push({ text: contact.phone });
  if (contact.website) entries.push({ text: contact.website, href: contact.website });
  if (contact.linkedin) entries.push({ text: contact.linkedin, href: contact.linkedin });
  if (contact.github) entries.push({ text: contact.github, href: contact.github });

  if (!entries.length) return null;

  return (
    <div className="doc-contact">
      {entries.map((entry, index) => {
        const href = entry.href ? safeUrl(entry.href) : null;
        return (
          <Fragment key={`${entry.text}-${index}`}>
            {index > 0 ? <span className="sep" aria-hidden>·</span> : null}
            <span>
              {showIcons ? <span aria-hidden>{['📍', '✉', '☎', '🔗', 'in', '⌥'][index] ?? ''} </span> : null}
              {href ? (
                <a href={href} rel="noopener noreferrer nofollow">
                  {entry.text}
                </a>
              ) : (
                entry.text
              )}
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}

function Bullets({ items, periods }: { items: string[]; periods: boolean }) {
  const filled = items.filter((item) => item.trim());
  if (!filled.length) return null;
  return (
    <ul className="doc-bullets">
      {filled.map((item, index) => (
        <li key={index}>
          {item.trim().replace(/\.$/, '')}
          {periods ? '.' : ''}
        </li>
      ))}
    </ul>
  );
}

function ExperienceBlock({ resume, design }: TemplateProps) {
  return (
    <>
      {resume.experience.map((role) => (
        <div className="doc-entry" key={role.id}>
          <div className="doc-entry-head">
            <div>
              <span className="doc-role">{role.role}</span>
              {role.company ? (
                <>
                  {role.role ? <span className="doc-org"> — </span> : null}
                  <span className="doc-org">{role.company}</span>
                </>
              ) : null}
            </div>
            <div className="doc-meta">{formatRange(role.start, role.end, role.current)}</div>
          </div>
          {role.location ? <div className="doc-meta">{role.location}</div> : null}
          <Bullets items={role.bullets} periods={design.bulletPeriods} />
        </div>
      ))}
    </>
  );
}

function EducationBlock({ resume }: TemplateProps) {
  return (
    <>
      {resume.education.map((entry) => (
        <div className="doc-entry" key={entry.id}>
          <div className="doc-entry-head">
            <div>
              <span className="doc-role">{entry.degree}</span>
              {entry.school ? (
                <>
                  {entry.degree ? <span className="doc-org"> — </span> : null}
                  <span className="doc-org">{entry.school}</span>
                </>
              ) : null}
            </div>
            <div className="doc-meta">{formatRange(entry.start, entry.end, false)}</div>
          </div>
          {entry.detail ? <p style={{ marginTop: 2 }}>{entry.detail}</p> : null}
        </div>
      ))}
    </>
  );
}

function SkillsBlock({ resume, inline }: TemplateProps & { inline?: boolean }) {
  const groups = resume.skills.filter((group) => group.items.filter(Boolean).length);
  if (inline) {
    return (
      <>
        {groups.map((group) => (
          <div className="doc-skill-row" key={group.id}>
            <span className="doc-skill-label">{group.label}</span>
            <span>{group.items.filter(Boolean).join(' · ')}</span>
          </div>
        ))}
      </>
    );
  }
  return (
    <>
      {groups.map((group) => (
        <div key={group.id} style={{ marginBottom: 6 }}>
          <div className="doc-skill-label">{group.label}</div>
          <div>{group.items.filter(Boolean).join(' · ')}</div>
        </div>
      ))}
    </>
  );
}

function ProjectsBlock({ resume, design }: TemplateProps) {
  return (
    <>
      {resume.projects.map((project) => {
        const href = safeUrl(project.link);
        return (
          <div className="doc-entry" key={project.id}>
            <div className="doc-entry-head">
              <div>
                <span className="doc-role">
                  {href ? (
                    <a href={href} rel="noopener noreferrer nofollow">
                      {project.name}
                    </a>
                  ) : (
                    project.name
                  )}
                </span>
                {project.stack ? <span className="doc-org"> — {project.stack}</span> : null}
              </div>
            </div>
            <Bullets items={project.bullets} periods={design.bulletPeriods} />
          </div>
        );
      })}
    </>
  );
}

function CertificationsBlock({ resume }: TemplateProps) {
  return (
    <>
      {resume.certifications.map((cert) => (
        <div className="doc-entry" key={cert.id} style={{ marginBottom: 4 }}>
          <div className="doc-entry-head">
            <div>
              <span style={{ fontWeight: 600 }}>{cert.name}</span>
              {cert.issuer ? <span className="doc-org"> — {cert.issuer}</span> : null}
            </div>
            <div className="doc-meta">{cert.date}</div>
          </div>
          {cert.credential ? <div className="doc-meta">{cert.credential}</div> : null}
        </div>
      ))}
    </>
  );
}

function renderSection(key: SectionKey, props: TemplateProps, options: { inlineSkills?: boolean } = {}) {
  const { resume } = props;
  const title = headingFor(resume, key);
  switch (key) {
    case 'summary':
      return (
        <Section title={title} key={key}>
          <p>{resume.summary}</p>
        </Section>
      );
    case 'experience':
      return (
        <Section title={title} key={key}>
          <ExperienceBlock {...props} />
        </Section>
      );
    case 'education':
      return (
        <Section title={title} key={key}>
          <EducationBlock {...props} />
        </Section>
      );
    case 'skills':
      return (
        <Section title={title} key={key}>
          <SkillsBlock {...props} inline={options.inlineSkills ?? true} />
        </Section>
      );
    case 'projects':
      return (
        <Section title={title} key={key}>
          <ProjectsBlock {...props} />
        </Section>
      );
    case 'certifications':
      return (
        <Section title={title} key={key}>
          <CertificationsBlock {...props} />
        </Section>
      );
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ *
 * Templates
 * ------------------------------------------------------------------ */

function Classic(props: TemplateProps) {
  const { resume, design } = props;
  return (
    <>
      <header style={{ textAlign: 'center' }}>
        <h1 className="doc-name">{resume.contact.fullName}</h1>
        {resume.contact.headline ? <div className="doc-headline">{resume.contact.headline}</div> : null}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ContactLine resume={resume} showIcons={design.showIcons} />
        </div>
      </header>
      {visibleSections(resume).map((key) => renderSection(key, props))}
    </>
  );
}

function Modern(props: TemplateProps) {
  const { resume, design } = props;
  return (
    <>
      <header>
        <h1 className="doc-name">{resume.contact.fullName}</h1>
        {resume.contact.headline ? <div className="doc-headline">{resume.contact.headline}</div> : null}
        <ContactLine resume={resume} showIcons={design.showIcons} />
        <div className="doc-rule-accent" />
      </header>
      {visibleSections(resume).map((key) => renderSection(key, props))}
    </>
  );
}

/**
 * Two-column layout. Note the ATS caveat surfaced in the design panel: some
 * older parsers read multi-column PDFs in the wrong order.
 */
function Compact(props: TemplateProps) {
  const { resume, design } = props;
  const sections = visibleSections(resume);
  const sidebarKeys: SectionKey[] = ['skills', 'certifications', 'education'];
  const main = sections.filter((key) => !sidebarKeys.includes(key));
  const side = sections.filter((key) => sidebarKeys.includes(key));

  return (
    <>
      <header className="doc-banner">
        <h1 className="doc-name" style={{ color: '#fff' }}>
          {resume.contact.fullName}
        </h1>
        {resume.contact.headline ? <div className="doc-headline">{resume.contact.headline}</div> : null}
        <ContactLine resume={resume} showIcons={design.showIcons} />
      </header>
      <div className="doc-columns">
        <div>{main.map((key) => renderSection(key, props))}</div>
        <aside>{side.map((key) => renderSection(key, props, { inlineSkills: false }))}</aside>
      </div>
    </>
  );
}

function Minimal(props: TemplateProps) {
  const { resume, design } = props;
  return (
    <>
      <header style={{ marginBottom: 4 }}>
        <h1 className="doc-name" style={{ fontWeight: 600, letterSpacing: '0.01em' }}>
          {resume.contact.fullName}
        </h1>
        {resume.contact.headline ? (
          <div className="doc-headline" style={{ color: 'var(--doc-muted)', fontWeight: 400 }}>
            {resume.contact.headline}
          </div>
        ) : null}
        <ContactLine resume={resume} showIcons={design.showIcons} />
      </header>
      {visibleSections(resume).map((key) => renderSection(key, props))}
    </>
  );
}

const TEMPLATES = {
  classic: Classic,
  modern: Modern,
  compact: Compact,
  minimal: Minimal,
} as const;

export const TEMPLATE_META: Array<{
  id: keyof typeof TEMPLATES;
  name: string;
  blurb: string;
  atsNote?: string;
}> = [
  { id: 'modern', name: 'Modern', blurb: 'Left-aligned header with an accent rule. Safe default.' },
  { id: 'classic', name: 'Classic', blurb: 'Centred header, conservative. Good for law, finance, academia.' },
  {
    id: 'compact',
    name: 'Compact',
    blurb: 'Sidebar for skills and education. Fits more on one page.',
    atsNote: 'Two-column layouts can confuse older parsers — prefer a single column if the posting mentions an ATS.',
  },
  { id: 'minimal', name: 'Minimal', blurb: 'No rules, generous whitespace. Design and product roles.' },
];

/**
 * Renders the resume at true page width. The same component is used for the
 * on-screen preview and the print tree, so what is on paper is what was seen.
 */
export function ResumeDocument({
  resume,
  design,
  forPrint = false,
}: TemplateProps & { forPrint?: boolean }) {
  const Template = TEMPLATES[design.template] ?? Modern;
  const page = PAGE_SIZES[design.paper];

  const style: CSSProperties = {
    ['--doc-accent' as string]: design.accent,
    ['--doc-scale' as string]: String(design.fontScale),
    ['--doc-line' as string]: String(design.lineHeight),
    ['--doc-gap' as string]: `${design.sectionGap}px`,
    ['--doc-margin' as string]: `${design.margin}px`,
    ['--page-width' as string]: forPrint ? '100%' : `${page.width}px`,
    ['--page-height' as string]: forPrint ? 'auto' : `${page.height}px`,
  };

  return (
    <div
      className="doc"
      data-font={design.fontFamily}
      data-uppercase={String(design.uppercaseHeadings)}
      style={style}
    >
      <Template resume={resume} design={design} />
    </div>
  );
}
