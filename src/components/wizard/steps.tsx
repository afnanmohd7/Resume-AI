import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Briefcase,
  Check,
  FolderGit2,
  GraduationCap,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import { useStore } from '../../store';
import type { StepId } from '../../lib/steps';
import type { BulletContext } from '../../lib/bullets';
import { canonicalSkill, detectDomain, skillLabel, suggestSkills } from '../../lib/taxonomy';
import { extractKeywords, resumeText } from '../../lib/ats';
import { generateSummaries } from '../../lib/summary';
import { formatRange } from '../../lib/dates';
import { wordCount } from '../../lib/text';
import { AutoTextArea, BulletCoach, BulletComposer, BulletScoreChip } from '../BulletWorkshop';
import { EmptyPrompt, FieldGrid, HelpNote, ItemCard, useSortable } from '../parts';
import { Button, Callout, Field, IconButton, Meter, TextArea } from '../ui';

export interface StepProps {
  /** True once the person has tried to continue past a step with gaps. */
  showErrors: boolean;
  onGoToStep: (id: StepId) => void;
  onGoToTab: (tab: 'tailor' | 'design' | 'letter') => void;
  onPrint: () => void;
}

const filled = (value: string | undefined) => Boolean(value && value.trim());

/* ------------------------------------------------------------------ *
 * 1. About you
 * ------------------------------------------------------------------ */

export function PersonalStep({ showErrors }: StepProps) {
  const contact = useStore((state) => state.present.resume.contact);
  const setContact = useStore((state) => state.setContact);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
  }, []);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.email.trim());

  return (
    <div className="space-y-4">
      <FieldGrid>
        <Field
          ref={firstField}
          label="Full name"
          value={contact.fullName}
          onChange={(event) => setContact({ fullName: event.target.value })}
          placeholder="Priya Raghunathan"
          autoComplete="off"
          error={showErrors && !filled(contact.fullName) ? 'Your name goes at the top of the page.' : undefined}
        />
        <Field
          label="Professional headline"
          value={contact.headline}
          onChange={(event) => setContact({ headline: event.target.value })}
          placeholder="Senior Product Designer"
          hint="Match this to the job title you are applying for."
          autoComplete="off"
        />
        <Field
          label="Email"
          type="email"
          value={contact.email}
          onChange={(event) => setContact({ email: event.target.value })}
          placeholder="you@example.com"
          autoComplete="off"
          error={
            showErrors && !emailValid
              ? contact.email.trim()
                ? 'That does not look like an email address.'
                : 'Screening software keys on the email field.'
              : undefined
          }
        />
        <Field
          label="Phone"
          value={contact.phone}
          onChange={(event) => setContact({ phone: event.target.value })}
          placeholder="+44 7700 900000"
          autoComplete="off"
        />
        <Field
          label="Location"
          value={contact.location}
          onChange={(event) => setContact({ location: event.target.value })}
          placeholder="Manchester, UK"
          hint="City and country is enough — never a street address."
          autoComplete="off"
        />
        <Field
          label="Website / portfolio"
          optional
          value={contact.website}
          onChange={(event) => setContact({ website: event.target.value })}
          placeholder="yoursite.com"
          autoComplete="off"
        />
        <Field
          label="LinkedIn"
          optional
          value={contact.linkedin}
          onChange={(event) => setContact({ linkedin: event.target.value })}
          placeholder="linkedin.com/in/you"
          autoComplete="off"
        />
        <Field
          label="GitHub"
          optional
          value={contact.github}
          onChange={(event) => setContact({ github: event.target.value })}
          placeholder="github.com/you"
          autoComplete="off"
        />
      </FieldGrid>

      <HelpNote title="What not to put here">
        Leave out your date of birth, marital status, nationality and photo. In the UK, US, Canada and
        most of the EU they are irrelevant to the decision, and including them invites bias you gain
        nothing from. A street address is unnecessary too — city and country covers location filters.
      </HelpNote>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 2. Experience
 * ------------------------------------------------------------------ */

export function ExperienceStep({ showErrors }: StepProps) {
  const experience = useStore((state) => state.present.resume.experience);
  const resume = useStore((state) => state.present.resume);
  const store = useStore();
  const sortable = useSortable(store.reorderExperience);

  const context = useMemo<BulletContext>(
    () => ({
      domain: detectDomain(
        [resume.contact.headline, ...resume.experience.map((role) => role.role)],
        resumeText(resume),
      ),
      present: true,
    }),
    [resume],
  );

  const real = experience.filter(
    (role) => filled(role.role) || filled(role.company) || role.bullets.some(filled),
  );
  const [openId, setOpenId] = useState<string | null>(experience[0]?.id ?? null);
  const [coachKey, setCoachKey] = useState<string | null>(null);

  const addRole = () => {
    store.addExperience();
    const created = useStore.getState().present.resume.experience[0];
    setOpenId(created?.id ?? null);
  };

  if (!real.length && experience.length <= 1) {
    const blank = experience[0];
    if (!blank || openId !== blank.id) {
      return (
        <div className="space-y-3">
          <EmptyPrompt
            icon={<Briefcase size={18} />}
            title="No roles yet"
            description="Start with your current or most recent job. Internships, freelance work and volunteering all count."
            actionLabel="Add your first role"
            onAction={() => (blank ? setOpenId(blank.id) : addRole())}
          />
          {showErrors ? (
            <Callout tone="poor">A resume needs at least one role before it is worth sending.</Callout>
          ) : null}
        </div>
      );
    }
  }

  return (
    <div className="space-y-3">
      {experience.map((role) => {
        const open = openId === role.id;
        const roleContext: BulletContext = { ...context, present: role.current };
        const bulletCount = role.bullets.filter(filled).length;
        const complete = filled(role.role) && filled(role.company) && bulletCount >= 2;

        return (
          <ItemCard
            key={role.id}
            title={role.role || 'New role'}
            subtitle={role.company}
            meta={
              open
                ? undefined
                : [formatRange(role.start, role.end, role.current), `${bulletCount} bullet${bulletCount === 1 ? '' : 's'}`]
                    .filter(Boolean)
                    .join(' · ')
            }
            status={complete ? 'ok' : 'incomplete'}
            open={open}
            onToggle={() => setOpenId(open ? null : role.id)}
            isOver={sortable.overId === role.id}
            handleProps={sortable.handleProps(role.id)}
            zoneProps={sortable.zoneProps(role.id)}
            onMoveUp={() => store.moveExperience(role.id, -1)}
            onMoveDown={() => store.moveExperience(role.id, 1)}
            onRemove={() => {
              store.removeExperience(role.id);
              setOpenId(null);
            }}
          >
            <FieldGrid>
              <Field
                label="Job title"
                value={role.role}
                onChange={(event) => store.updateExperience(role.id, { role: event.target.value })}
                placeholder="Senior Product Designer"
                error={showErrors && !filled(role.role) ? 'Required.' : undefined}
              />
              <Field
                label="Company"
                value={role.company}
                onChange={(event) => store.updateExperience(role.id, { company: event.target.value })}
                placeholder="Northwind Analytics"
                error={showErrors && !filled(role.company) ? 'Required.' : undefined}
              />
              <Field
                label="Location"
                optional
                value={role.location}
                onChange={(event) => store.updateExperience(role.id, { location: event.target.value })}
                placeholder="Manchester, UK"
              />
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="Start"
                  value={role.start}
                  onChange={(event) => store.updateExperience(role.id, { start: event.target.value })}
                  placeholder="Feb 2021"
                />
                <Field
                  label="End"
                  value={role.current ? 'Present' : role.end}
                  disabled={role.current}
                  onChange={(event) => store.updateExperience(role.id, { end: event.target.value })}
                  placeholder="Jan 2024"
                />
              </div>
            </FieldGrid>

            <label className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
              <input
                type="checkbox"
                checked={role.current}
                onChange={(event) => store.updateExperience(role.id, { current: event.target.checked })}
                className="accent-[var(--brand)]"
              />
              I currently work here
            </label>

            <div className="border-t border-[var(--border)] pt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium tracking-wide text-[var(--text-muted)]">
                  What did you achieve here?
                </span>
                <Button size="sm" variant="ghost" icon={<Plus size={13} />} onClick={() => store.addBullet(role.id)}>
                  Add bullet
                </Button>
              </div>

              <div className="space-y-2">
                {role.bullets.map((bullet, index) => {
                  const key = `${role.id}:${index}`;
                  return (
                    <div key={key}>
                      <div className="flex items-start gap-1.5">
                        <div className="min-w-0 flex-1">
                          <AutoTextArea
                            value={bullet}
                            onChange={(value) => store.setBullet(role.id, index, value)}
                            placeholder="Rebuilt the reporting suite used by 40,000 analysts, cutting time-to-insight by 38%"
                          />
                        </div>
                        <div className="flex shrink-0 flex-col items-center gap-0.5 pt-1">
                          <BulletScoreChip text={bullet} />
                          <IconButton
                            label="Improve this bullet"
                            onClick={() => setCoachKey(coachKey === key ? null : key)}
                            className={coachKey === key ? 'bg-[var(--brand-soft)] text-[var(--brand)]' : ''}
                          >
                            <Wand2 size={14} />
                          </IconButton>
                          <IconButton label="Delete bullet" onClick={() => store.removeBullet(role.id, index)}>
                            <Trash2 size={14} />
                          </IconButton>
                        </div>
                      </div>

                      {coachKey === key ? (
                        <BulletCoach
                          value={bullet}
                          context={roleContext}
                          onApply={(next) => store.setBullet(role.id, index, next)}
                          onClose={() => setCoachKey(null)}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3">
                <BulletComposer context={roleContext} onAdd={(text) => store.addBullet(role.id, text)} />
              </div>

              {bulletCount > 6 ? (
                <div className="mt-2">
                  <Callout tone="ok">
                    {bulletCount} bullets in one role. Keep the strongest five or six — the rest dilute them.
                  </Callout>
                </div>
              ) : null}
            </div>
          </ItemCard>
        );
      })}

      <Button icon={<Plus size={14} />} onClick={addRole} className="w-full justify-center py-2">
        Add another role
      </Button>

      <HelpNote title="How many jobs should I list?">
        Roughly the last ten years, or your last four or five roles. Older jobs can be compressed into a
        single "Earlier career" line. Anything you would not want to be asked about in an interview does
        not belong here.
      </HelpNote>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 3. Education
 * ------------------------------------------------------------------ */

export function EducationStep() {
  const education = useStore((state) => state.present.resume.education);
  const store = useStore();
  const sortable = useSortable(store.reorderEducation);
  const real = education.filter((entry) => filled(entry.degree) || filled(entry.school));
  const [openId, setOpenId] = useState<string | null>(null);

  const addEntry = () => {
    store.addEducation();
    const list = useStore.getState().present.resume.education;
    setOpenId(list[list.length - 1]?.id ?? null);
  };

  if (!real.length && (!education.length || !openId)) {
    return (
      <div className="space-y-3">
        <EmptyPrompt
          icon={<GraduationCap size={18} />}
          title="Nothing added yet"
          description="Add a degree, diploma or apprenticeship. If you have been working for years, one line is plenty — or skip this step entirely."
          actionLabel="Add education"
          onAction={() => (education[0] ? setOpenId(education[0].id) : addEntry())}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {education.map((entry) => {
        const open = openId === entry.id;
        return (
          <ItemCard
            key={entry.id}
            title={entry.degree || 'New qualification'}
            subtitle={entry.school}
            meta={open ? undefined : formatRange(entry.start, entry.end, false)}
            status={filled(entry.degree) && filled(entry.school) ? 'ok' : 'incomplete'}
            open={open}
            onToggle={() => setOpenId(open ? null : entry.id)}
            isOver={sortable.overId === entry.id}
            handleProps={sortable.handleProps(entry.id)}
            zoneProps={sortable.zoneProps(entry.id)}
            onMoveUp={() => store.moveEducation(entry.id, -1)}
            onMoveDown={() => store.moveEducation(entry.id, 1)}
            onRemove={() => {
              store.removeEducation(entry.id);
              setOpenId(null);
            }}
          >
            <FieldGrid>
              <Field
                label="Degree or qualification"
                value={entry.degree}
                onChange={(event) => store.updateEducation(entry.id, { degree: event.target.value })}
                placeholder="BSc Computer Science"
              />
              <Field
                label="Institution"
                value={entry.school}
                onChange={(event) => store.updateEducation(entry.id, { school: event.target.value })}
                placeholder="University of Manchester"
              />
              <Field
                label="Location"
                optional
                value={entry.location}
                onChange={(event) => store.updateEducation(entry.id, { location: event.target.value })}
                placeholder="Manchester, UK"
              />
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="Start"
                  value={entry.start}
                  onChange={(event) => store.updateEducation(entry.id, { start: event.target.value })}
                  placeholder="2014"
                />
                <Field
                  label="End"
                  value={entry.end}
                  onChange={(event) => store.updateEducation(entry.id, { end: event.target.value })}
                  placeholder="2017"
                />
              </div>
            </FieldGrid>
            <TextArea
              label="Detail"
              value={entry.detail}
              onChange={(event) => store.updateEducation(entry.id, { detail: event.target.value })}
              rows={2}
              placeholder="First-class honours · Dissertation on distributed systems"
              hint="Worth adding while you are early in your career. Drop it once you have a few years of work."
            />
          </ItemCard>
        );
      })}

      <Button icon={<Plus size={14} />} onClick={addEntry} className="w-full justify-center py-2">
        Add another qualification
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 4. Skills
 * ------------------------------------------------------------------ */

export function SkillsStep({ showErrors }: StepProps) {
  const skills = useStore((state) => state.present.resume.skills);
  const resume = useStore((state) => state.present.resume);
  const jobDescription = useStore((state) => state.present.jobDescription);
  const store = useStore();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const total = skills.reduce((sum, group) => sum + group.items.filter(filled).length, 0);
  const existing = useMemo(() => skills.flatMap((group) => group.items), [skills]);

  const domain = useMemo(
    () =>
      detectDomain(
        [resume.contact.headline, ...resume.experience.map((role) => role.role)],
        resumeText(resume),
      ),
    [resume],
  );

  // Both lists depend only on the posting and the detected field — never on
  // what has been added. A list that reshuffles under the cursor after every
  // click makes picking several skills unnecessarily fiddly.
  const fromJob = useMemo(() => {
    if (!jobDescription.trim()) return [];
    return extractKeywords(jobDescription)
      .filter((keyword) => keyword.isSkill)
      .slice(0, 12)
      .map((keyword) => keyword.display);
  }, [jobDescription]);

  const common = useMemo(() => suggestSkills(domain, [], 14), [domain]);

  const has = useMemo(() => {
    const set = new Set(existing.map(canonicalSkill));
    return (skill: string) => set.has(canonicalSkill(skill));
  }, [existing]);

  const addSkill = (groupId: string, value: string) => {
    const clean = value.trim().replace(/,$/, '');
    if (!clean) return;
    const group = skills.find((item) => item.id === groupId);
    if (!group || group.items.some((item) => item.toLowerCase() === clean.toLowerCase())) return;
    store.updateSkillGroup(groupId, { items: [...group.items, clean] });
  };

  const targetGroup = skills[0]?.id ?? '';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
        <div className="flex-1">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[12px] font-medium">
              {total} skill{total === 1 ? '' : 's'} added
            </span>
            <span className="text-[11px] text-[var(--text-faint)]">6–15 is a good range</span>
          </div>
          <Meter value={Math.min(100, (total / 10) * 100)} tone={total >= 6 ? 'good' : total >= 3 ? 'ok' : 'poor'} />
        </div>
      </div>

      {showErrors && total === 0 ? (
        <Callout tone="poor">Add at least a few skills — this block is the easiest part of a resume for software to read.</Callout>
      ) : null}

      <div className="space-y-3">
        {skills.map((group) => (
          <div key={group.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="mb-2 flex items-center gap-2">
              <input
                value={group.label}
                onChange={(event) => store.updateSkillGroup(group.id, { label: event.target.value })}
                placeholder="Group name"
                className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[12px] font-semibold text-[var(--text)] hover:border-[var(--border)] focus:border-[var(--brand)] focus:outline-none"
              />
              {skills.length > 1 ? (
                <IconButton label="Delete group" onClick={() => store.removeSkillGroup(group.id)}>
                  <Trash2 size={14} />
                </IconButton>
              ) : null}
            </div>

            {group.items.length ? (
              <div className="mb-2 flex flex-wrap gap-1">
                {group.items.map((item, index) => (
                  <span
                    key={`${item}-${index}`}
                    className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-2)] px-2 py-1 text-[12px]"
                  >
                    {item}
                    <button
                      aria-label={`Remove ${item}`}
                      onClick={() =>
                        store.updateSkillGroup(group.id, {
                          items: group.items.filter((_, position) => position !== index),
                        })
                      }
                      className="text-[var(--text-faint)] hover:text-[var(--bad)]"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : null}

            <input
              value={drafts[group.id] ?? ''}
              onChange={(event) => {
                const value = event.target.value;
                if (value.endsWith(',')) {
                  addSkill(group.id, value);
                  setDrafts((prev) => ({ ...prev, [group.id]: '' }));
                } else {
                  setDrafts((prev) => ({ ...prev, [group.id]: value }));
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addSkill(group.id, drafts[group.id] ?? '');
                  setDrafts((prev) => ({ ...prev, [group.id]: '' }));
                }
              }}
              placeholder="Type a skill, press Enter"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[13px] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>
        ))}
      </div>

      <Button icon={<Plus size={14} />} onClick={store.addSkillGroup} className="w-full justify-center py-2">
        Add a group
      </Button>

      {fromJob.length ? (
        <SuggestionBox
          title="Named in the job description you pasted"
          tone="ok"
          items={fromJob}
          has={has}
          onAdd={(skill) => addSkill(targetGroup, skill)}
          caveat="Only add what you have genuinely used. A keyword you cannot defend in an interview costs more than a missing one."
        />
      ) : null}

      {common.length ? (
        <SuggestionBox
          title="Common in your field"
          tone="neutral"
          items={common}
          has={has}
          onAdd={(skill) => addSkill(targetGroup, skill)}
          caveat="Suggested from the roles you listed. Pick only the ones that are true."
        />
      ) : null}
    </div>
  );
}

function SuggestionBox({
  title,
  items,
  tone,
  has,
  onAdd,
  caveat,
}: {
  title: string;
  items: string[];
  tone: 'ok' | 'neutral';
  has: (skill: string) => boolean;
  onAdd: (skill: string) => void;
  caveat: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border-strong)] p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[12px] font-medium">
        <Sparkles size={13} className="text-[var(--brand)]" />
        {title}
      </p>
      <div className="flex flex-wrap gap-1">
        {items.map((skill) => {
          const added = has(skill);
          return (
            <button
              key={skill}
              onClick={() => !added && onAdd(skill)}
              disabled={added}
              title={added ? 'Already on your resume' : 'Add to your first group'}
              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                added ? 'cursor-default' : 'cursor-pointer hover:brightness-95'
              }`}
              style={
                added
                  ? { color: 'var(--good)', background: 'var(--good-soft)' }
                  : tone === 'ok'
                    ? { color: 'var(--warn)', background: 'var(--warn-soft)' }
                    : { color: 'var(--text-muted)', background: 'var(--surface-2)' }
              }
            >
              {added ? <Check size={11} /> : <Plus size={11} />} {skillLabel(skill)}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-faint)]">{caveat}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 5. Extras
 * ------------------------------------------------------------------ */

export function ExtrasStep() {
  const projects = useStore((state) => state.present.resume.projects);
  const certifications = useStore((state) => state.present.resume.certifications);
  const resume = useStore((state) => state.present.resume);
  const store = useStore();
  const sortable = useSortable(store.reorderProject);
  const [openId, setOpenId] = useState<string | null>(null);

  const context = useMemo<BulletContext>(
    () => ({
      domain: detectDomain(
        [resume.contact.headline, ...resume.experience.map((role) => role.role)],
        resumeText(resume),
      ),
      present: false,
    }),
    [resume],
  );

  const addProject = () => {
    store.addProject();
    const list = useStore.getState().present.resume.projects;
    setOpenId(list[list.length - 1]?.id ?? null);
  };

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 text-[13px] font-semibold">Projects</h3>
        {projects.length ? (
          <div className="space-y-3">
            {projects.map((project) => {
              const open = openId === project.id;
              return (
                <ItemCard
                  key={project.id}
                  title={project.name || 'New project'}
                  subtitle={project.stack}
                  open={open}
                  onToggle={() => setOpenId(open ? null : project.id)}
                  isOver={sortable.overId === project.id}
                  handleProps={sortable.handleProps(project.id)}
                  zoneProps={sortable.zoneProps(project.id)}
                  onMoveUp={() => store.moveProject(project.id, -1)}
                  onMoveDown={() => store.moveProject(project.id, 1)}
                  onRemove={() => {
                    store.removeProject(project.id);
                    setOpenId(null);
                  }}
                >
                  <FieldGrid>
                    <Field
                      label="Project name"
                      value={project.name}
                      onChange={(event) => store.updateProject(project.id, { name: event.target.value })}
                      placeholder="Contrast Companion"
                    />
                    <Field
                      label="Link"
                      optional
                      value={project.link}
                      onChange={(event) => store.updateProject(project.id, { link: event.target.value })}
                      placeholder="github.com/you/project"
                    />
                  </FieldGrid>
                  <Field
                    label="Stack or tools"
                    optional
                    value={project.stack}
                    onChange={(event) => store.updateProject(project.id, { stack: event.target.value })}
                    placeholder="TypeScript, Figma Plugin API"
                  />
                  <div className="space-y-2">
                    {project.bullets.map((bullet, index) => (
                      <div key={index} className="flex items-start gap-1.5">
                        <div className="min-w-0 flex-1">
                          <AutoTextArea
                            value={bullet}
                            onChange={(value) => store.setProjectBullet(project.id, index, value)}
                            placeholder="What it does, who uses it, and any number that shows traction"
                          />
                        </div>
                        <div className="flex shrink-0 flex-col gap-0.5 pt-1">
                          <BulletScoreChip text={bullet} />
                          <IconButton
                            label="Delete bullet"
                            onClick={() => store.removeProjectBullet(project.id, index)}
                          >
                            <Trash2 size={14} />
                          </IconButton>
                        </div>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Plus size={13} />}
                      onClick={() => store.addProjectBullet(project.id)}
                    >
                      Add bullet
                    </Button>
                    <BulletComposer
                      context={context}
                      onAdd={(text) => {
                        store.addProjectBullet(project.id);
                        const current = useStore
                          .getState()
                          .present.resume.projects.find((item) => item.id === project.id);
                        if (current) store.setProjectBullet(project.id, current.bullets.length - 1, text);
                      }}
                    />
                  </div>
                </ItemCard>
              );
            })}
            <Button icon={<Plus size={14} />} onClick={addProject} className="w-full justify-center py-2">
              Add another project
            </Button>
          </div>
        ) : (
          <EmptyPrompt
            icon={<FolderGit2 size={18} />}
            title="No projects listed"
            description="Side projects, open source, freelance builds, a portfolio piece. Most valuable when your work history is short."
            actionLabel="Add a project"
            onAction={addProject}
          />
        )}
      </section>

      <section>
        <h3 className="mb-2 text-[13px] font-semibold">Certifications</h3>
        {certifications.length ? (
          <div className="space-y-2.5">
            {certifications.map((cert) => (
              <div key={cert.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <FieldGrid>
                  <Field
                    label="Certification"
                    value={cert.name}
                    onChange={(event) => store.updateCertification(cert.id, { name: event.target.value })}
                    placeholder="AWS Solutions Architect – Associate"
                  />
                  <Field
                    label="Issuer"
                    value={cert.issuer}
                    onChange={(event) => store.updateCertification(cert.id, { issuer: event.target.value })}
                    placeholder="Amazon Web Services"
                  />
                  <Field
                    label="Date"
                    value={cert.date}
                    onChange={(event) => store.updateCertification(cert.id, { date: event.target.value })}
                    placeholder="2024"
                  />
                  <Field
                    label="Credential ID"
                    optional
                    value={cert.credential}
                    onChange={(event) => store.updateCertification(cert.id, { credential: event.target.value })}
                  />
                </FieldGrid>
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="danger"
                    icon={<Trash2 size={13} />}
                    onClick={() => store.removeCertification(cert.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button icon={<Plus size={14} />} onClick={store.addCertification} className="w-full justify-center py-2">
              Add another certification
            </Button>
          </div>
        ) : (
          <EmptyPrompt
            icon={<Award size={18} />}
            title="No certifications listed"
            description="Licences, professional accreditations, or a course that is genuinely relevant to the job."
            actionLabel="Add a certification"
            onAction={store.addCertification}
          />
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 6. Summary
 * ------------------------------------------------------------------ */

export function SummaryStep() {
  const resume = useStore((state) => state.present.resume);
  const setSummary = useStore((state) => state.setSummary);
  const [showDrafts, setShowDrafts] = useState(false);
  const drafts = useMemo(() => (showDrafts ? generateSummaries(resume) : []), [showDrafts, resume]);
  const words = wordCount(resume.summary);

  return (
    <div className="space-y-3">
      <TextArea
        value={resume.summary}
        onChange={(event) => setSummary(event.target.value)}
        rows={5}
        placeholder="Three lines: who you are, what you have done that is measurable, and what you want next."
      />

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Meter
            value={Math.min(100, (words / 70) * 100)}
            tone={words === 0 ? 'neutral' : words >= 25 && words <= 90 ? 'good' : 'ok'}
          />
        </div>
        <span className="shrink-0 text-[11px] tabular-nums text-[var(--text-faint)]">
          {words} words {words > 90 ? '· too long' : words >= 25 ? '· good length' : '· aim for 25–90'}
        </span>
      </div>

      <Button
        variant={showDrafts ? 'secondary' : 'primary'}
        icon={<Sparkles size={13} />}
        onClick={() => setShowDrafts(!showDrafts)}
      >
        {showDrafts ? 'Hide drafts' : 'Draft one from what I have written'}
      </Button>

      {showDrafts ? (
        <div className="space-y-2">
          {drafts.length ? (
            drafts.map((draft) => (
              <div key={draft.style} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-[var(--brand)]">{draft.style}</span>
                  <Button size="sm" variant="ghost" onClick={() => setSummary(draft.text)}>
                    Use this
                  </Button>
                </div>
                <p className="text-[13px] leading-relaxed">{draft.text}</p>
                <p className="mt-1 text-[11px] text-[var(--text-faint)]">{draft.note}</p>
              </div>
            ))
          ) : (
            <Callout tone="ok">
              Add a role or two with bullets first — the drafts are assembled from what is already in your
              resume.
            </Callout>
          )}
        </div>
      ) : null}

      <HelpNote title="Do I even need a summary?">
        No. An empty summary is better than a generic one — "hard-working team player with a passion for
        excellence" says nothing and costs you the most valuable inch of the page. Write one only if it
        carries a specific fact: years in the field, a headline number, or a deliberate change of
        direction you want to explain.
      </HelpNote>
    </div>
  );
}
