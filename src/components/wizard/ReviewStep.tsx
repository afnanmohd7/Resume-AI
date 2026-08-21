import { useMemo } from 'react';
import { AlertCircle, ArrowRight, Check, Download, Mail, Palette, Target } from 'lucide-react';
import { useStore } from '../../store';
import { scoreBand, scoreResume } from '../../lib/ats';
import { STEPS, stepState, type StepId } from '../../lib/steps';
import { Button, Callout, Card, Meter, ScoreRing, TONE_STYLES } from '../ui';

/**
 * The last step. Answers three questions in order: is this good enough, what
 * is still missing, and what do I do now.
 */
export function ReviewStep({
  measuredPages,
  onGoToStep,
  onGoToTab,
  onPrint,
}: {
  measuredPages: number | null;
  onGoToStep: (id: StepId) => void;
  onGoToTab: (tab: 'tailor' | 'design' | 'letter') => void;
  onPrint: () => void;
}) {
  const resume = useStore((state) => state.present.resume);
  const jobDescription = useStore((state) => state.present.jobDescription);

  const report = useMemo(
    () => scoreResume(resume, jobDescription, { measuredPages }),
    [resume, jobDescription, measuredPages],
  );
  const band = scoreBand(report.overall);

  const gaps = STEPS.filter((step) => step.id !== 'review')
    .map((step) => ({ step, state: stepState(resume, step.id) }))
    .filter(({ step, state }) => state.blocking.length || (!step.optional && state.advice.length));

  const failedChecks = report.checks.filter((check) => !check.passed);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-start gap-4">
          <ScoreRing score={report.overall} size={82} label={report.hasJD ? 'match' : 'quality'} />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold" style={{ color: TONE_STYLES[band.tone].fg }}>
              {band.label}
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text-muted)]">
              {report.hasJD
                ? `${report.matched.length} of ${report.keywords.length} terms from the posting you pasted appear in your resume.`
                : 'Scored on structure and writing quality. Paste a job description in Tailor to score the match too.'}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(
                [
                  ['Structure', report.structureScore],
                  ['Writing quality', report.qualityScore],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-[11px] text-[var(--text-muted)]">{label}</span>
                    <span className="text-[11px] tabular-nums text-[var(--text-faint)]">{value}</span>
                  </div>
                  <Meter value={value} tone={value >= 80 ? 'good' : value >= 55 ? 'ok' : 'poor'} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {gaps.length ? (
        <Card className="p-3">
          <p className="mb-2 text-[13px] font-semibold">Worth finishing first</p>
          <div className="space-y-1.5">
            {gaps.map(({ step, state }) => (
              <div
                key={step.id}
                className="flex items-start gap-2 rounded-lg px-1.5 py-1.5 hover:bg-[var(--surface-2)]"
              >
                <AlertCircle
                  size={14}
                  className="mt-[2px] shrink-0"
                  style={{ color: state.blocking.length ? 'var(--bad)' : 'var(--warn)' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium">{step.label}</p>
                  <ul className="text-[12px] leading-relaxed text-[var(--text-muted)]">
                    {[...state.blocking, ...state.advice].slice(0, 3).map((item) => (
                      <li key={item}>· {item}</li>
                    ))}
                  </ul>
                </div>
                <Button size="sm" variant="ghost" onClick={() => onGoToStep(step.id)}>
                  Fix
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Callout tone="good" title="Every step is done">
          Nothing is missing. Give it one read out loud before you send it — that catches what no checker
          can.
        </Callout>
      )}

      {failedChecks.length ? (
        <Card className="p-3">
          <p className="mb-2 text-[13px] font-semibold">Detailed checks</p>
          <div className="space-y-1.5">
            {failedChecks.map((check) => (
              <div key={check.id} className="flex gap-2">
                <AlertCircle
                  size={14}
                  className="mt-[2px] shrink-0"
                  style={{
                    color:
                      check.level === 'error'
                        ? 'var(--bad)'
                        : check.level === 'warn'
                          ? 'var(--warn)'
                          : 'var(--text-faint)',
                  }}
                />
                <p className="text-[12px] leading-relaxed">
                  <span className="font-medium text-[var(--text)]">{check.label}. </span>
                  <span className="text-[var(--text-muted)]">{check.detail}</span>
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Callout tone="good">
          <span className="inline-flex items-center gap-1.5">
            <Check size={13} /> All {report.checks.length} structural checks pass.
          </span>
        </Callout>
      )}

      <Card className="p-4">
        <p className="text-[14px] font-semibold">Download your resume</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text-muted)]">
          Opens your browser's print dialog. Choose <strong>Save as PDF</strong> and switch headers and
          footers off. The file contains real, selectable text — not a picture of text — which is what
          screening software needs.
        </p>
        <Button variant="primary" icon={<Download size={14} />} onClick={onPrint} className="mt-3 w-full justify-center py-2">
          Download PDF
        </Button>
      </Card>

      <div>
        <p className="mb-2 text-[12px] font-medium text-[var(--text-muted)]">Then what?</p>
        <div className="grid gap-2">
          <NextCard
            icon={<Target size={15} />}
            title="Tailor it to a specific job"
            description="Paste the posting and see which of its terms you are missing, and where to add them."
            onClick={() => onGoToTab('tailor')}
          />
          <NextCard
            icon={<Mail size={15} />}
            title="Write a matching cover letter"
            description="Built from your strongest relevant achievements and the posting you pasted."
            onClick={() => onGoToTab('letter')}
          />
          <NextCard
            icon={<Palette size={15} />}
            title="Change the look"
            description="Four templates, accent colour, spacing, and A4 or US Letter."
            onClick={() => onGoToTab('design')}
          />
        </div>
      </div>
    </div>
  );
}

function NextCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]/40"
    >
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--surface-2)] text-[var(--brand)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium">{title}</span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-[var(--text-muted)]">{description}</span>
      </span>
      <ArrowRight
        size={15}
        className="mt-1 shrink-0 text-[var(--text-faint)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--brand)]"
      />
    </button>
  );
}
