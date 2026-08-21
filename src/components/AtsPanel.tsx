import { useMemo, useState } from 'react';
import { AlertCircle, Check, ClipboardPaste, Target, X } from 'lucide-react';
import { useStore } from '../store';
import { scoreBand, scoreResume, type Keyword } from '../lib/ats';
import { DOMAIN_LABELS } from '../lib/taxonomy';
import { SAMPLE_JOB_DESCRIPTION } from '../lib/defaults';
import { Button, Callout, Card, Chip, Meter, ScoreRing, SectionHeading, TextArea, TONE_STYLES } from './ui';

export function AtsPanel({ measuredPages }: { measuredPages: number | null }) {
  const resume = useStore((state) => state.present.resume);
  const jobDescription = useStore((state) => state.present.jobDescription);
  const setJobDescription = useStore((state) => state.setJobDescription);
  const [showAllKeywords, setShowAllKeywords] = useState(false);

  const report = useMemo(
    () => scoreResume(resume, jobDescription, { measuredPages }),
    [resume, jobDescription, measuredPages],
  );
  const band = scoreBand(report.overall);
  const failing = report.checks.filter((check) => !check.passed);
  const passing = report.checks.filter((check) => check.passed);

  return (
    <div className="space-y-3">
      <SectionHeading
        title="Match & checks"
        description="Paste the posting you are applying to. Scoring runs on this device against a keyword and structure model — it is a rehearsal, not a verdict from a real employer's system."
      />

      <Card className="p-3">
        <div className="flex items-start gap-3">
          <ScoreRing score={report.overall} size={76} label={report.hasJD ? 'match' : 'quality'} />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold" style={{ color: TONE_STYLES[band.tone].fg }}>
              {band.label}
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text-muted)]">
              {report.hasJD
                ? `${report.matched.length} of ${report.keywords.length} key terms from the posting appear in your resume.`
                : 'No job description yet — this score reflects structure and writing quality alone.'}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-faint)]">
              Detected field: {DOMAIN_LABELS[report.domain]}
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(report.hasJD
            ? ([
                ['Keyword coverage', report.keywordScore],
                ['Hard skills', report.skillScore],
                ['Structure', report.structureScore],
                ['Writing quality', report.qualityScore],
              ] as const)
            : ([
                ['Structure', report.structureScore],
                ['Writing quality', report.qualityScore],
              ] as const)
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
      </Card>

      <Card className="p-3">
        <TextArea
          label="Job description"
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          rows={7}
          placeholder="Paste the full posting here — responsibilities, requirements, everything."
          hint={`${jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0} words pasted`}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {!jobDescription.trim() ? (
            <Button
              size="sm"
              variant="ghost"
              icon={<ClipboardPaste size={13} />}
              onClick={() => setJobDescription(SAMPLE_JOB_DESCRIPTION)}
            >
              Try an example posting
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setJobDescription('')}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      {report.hasJD ? (
        <Card className="p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold">
            <Target size={13} className="text-[var(--brand)]" />
            Terms from the posting
          </p>

          <div className="mb-2 flex flex-wrap gap-1">
            {report.missing.slice(0, showAllKeywords ? undefined : 14).map((keyword) => (
              <KeywordChip key={keyword.term} keyword={keyword} />
            ))}
          </div>
          {report.missing.length > 14 ? (
            <Button size="sm" variant="ghost" onClick={() => setShowAllKeywords(!showAllKeywords)}>
              {showAllKeywords ? 'Show fewer' : `Show all ${report.missing.length} missing`}
            </Button>
          ) : null}

          {report.matched.length ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-[12px] text-[var(--text-muted)]">
                {report.matched.length} already covered
              </summary>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {report.matched.map((keyword) => (
                  <Chip key={keyword.term} tone="good">
                    <Check size={11} /> {keyword.display}
                  </Chip>
                ))}
              </div>
            </details>
          ) : null}

          {report.suggestions.length ? (
            <div className="mt-3 space-y-1.5 border-t border-[var(--border)] pt-2.5">
              <p className="text-[12px] font-semibold">Where to put the gaps</p>
              {report.suggestions.slice(0, 6).map((suggestion) => (
                <div key={suggestion.keyword} className="text-[12px] leading-relaxed">
                  <span className="font-medium text-[var(--text)]">{suggestion.keyword}</span>
                  <span className="text-[var(--text-faint)]"> → {suggestion.where}</span>
                  <p className="text-[var(--text-muted)]">{suggestion.hint}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-3">
            <Callout tone="ok">
              Keyword stuffing is the fastest way to fail a human read. Add a term only where it is true, and
              put it in a sentence that shows how you used it.
            </Callout>
          </div>
        </Card>
      ) : null}

      <Card className="p-3">
        <p className="mb-2 text-[12px] font-semibold">Resume checks</p>
        <div className="space-y-1.5">
          {failing.map((check) => (
            <div key={check.id} className="flex gap-2">
              <AlertCircle
                size={14}
                className="mt-[2px] shrink-0"
                style={{ color: TONE_STYLES[check.level === 'error' ? 'poor' : check.level === 'warn' ? 'ok' : 'neutral'].fg }}
              />
              <p className="text-[12px] leading-relaxed">
                <span className="font-medium text-[var(--text)]">{check.label}. </span>
                <span className="text-[var(--text-muted)]">{check.detail}</span>
              </p>
            </div>
          ))}
          {!failing.length ? (
            <Callout tone="good">Every structural check passes. That is the boring half done properly.</Callout>
          ) : null}
        </div>

        <details className="mt-2">
          <summary className="cursor-pointer text-[12px] text-[var(--text-muted)]">
            {passing.length} checks passing
          </summary>
          <div className="mt-1.5 space-y-1">
            {passing.map((check) => (
              <div key={check.id} className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
                <Check size={12} style={{ color: 'var(--good)' }} />
                {check.label}
              </div>
            ))}
          </div>
        </details>
      </Card>

      <p className="px-1 pb-2 text-[11px] leading-relaxed text-[var(--text-faint)]">
        Real applicant tracking systems vary widely and none of them publish their scoring. Treat this panel
        as a checklist that catches the common, avoidable failures — missing contact fields, unquantified
        bullets, terminology that does not match the posting.
      </p>
    </div>
  );
}

function KeywordChip({ keyword }: { keyword: Keyword }) {
  return (
    <Chip tone={keyword.isSkill ? 'poor' : 'neutral'} title={keyword.isSkill ? 'Hard skill named in the posting' : 'Phrase from the posting'}>
      <X size={11} /> {keyword.display}
    </Chip>
  );
}
