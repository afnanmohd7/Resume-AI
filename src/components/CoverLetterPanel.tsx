import { useEffect, useMemo, useState } from 'react';
import { Copy, Printer, RefreshCw, Wand2 } from 'lucide-react';
import { useStore } from '../store';
import {
  TONE_LABELS,
  generateCoverLetter,
  guessJobMeta,
  type CoverLetterOptions,
  type LetterTone,
} from '../lib/coverLetter';
import { downloadFile } from '../lib/storage';
import { wordCount } from '../lib/text';
import { Button, Callout, Card, Field, SectionHeading, Select, Toggle } from './ui';

export function CoverLetterPanel({ onPrint }: { onPrint: () => void }) {
  const resume = useStore((state) => state.present.resume);
  const jobDescription = useStore((state) => state.present.jobDescription);
  const letter = useStore((state) => state.present.coverLetter);
  const setCoverLetter = useStore((state) => state.setCoverLetter);

  const guessed = useMemo(() => guessJobMeta(jobDescription), [jobDescription]);
  const [options, setOptions] = useState<CoverLetterOptions>({
    company: '',
    role: '',
    hiringManager: '',
    tone: 'professional',
    includeDate: true,
  });
  const [copied, setCopied] = useState(false);

  // Prefill from the posting once, without stamping over anything typed.
  useEffect(() => {
    setOptions((prev) => ({
      ...prev,
      company: prev.company || guessed.company,
      role: prev.role || guessed.role,
    }));
  }, [guessed.company, guessed.role]);

  const generate = () => setCoverLetter(generateCoverLetter(resume, jobDescription, options));
  const words = wordCount(letter);

  return (
    <div className="space-y-3">
      <SectionHeading
        title="Cover letter"
        description="Assembled from your resume and the pasted posting. Treat the output as a first draft — the paragraph that sounds most like you is the one you write yourself."
      />

      <Card className="space-y-2.5 p-3">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Field
            label="Company"
            value={options.company}
            onChange={(event) => setOptions({ ...options, company: event.target.value })}
            placeholder="Northwind Analytics"
          />
          <Field
            label="Role applying for"
            value={options.role}
            onChange={(event) => setOptions({ ...options, role: event.target.value })}
            placeholder="Senior Product Designer"
          />
          <Field
            label="Hiring manager (optional)"
            value={options.hiringManager}
            onChange={(event) => setOptions({ ...options, hiringManager: event.target.value })}
            placeholder="Dr Sam Okafor"
            hint="A name beats “Hiring Team” when you can find one."
          />
          <Select
            label="Tone"
            value={options.tone}
            onChange={(event) => setOptions({ ...options, tone: event.target.value as LetterTone })}
          >
            {(Object.keys(TONE_LABELS) as LetterTone[]).map((tone) => (
              <option key={tone} value={tone}>
                {TONE_LABELS[tone]}
              </option>
            ))}
          </Select>
        </div>

        <Toggle
          label="Include today's date"
          checked={options.includeDate}
          onChange={(includeDate) => setOptions({ ...options, includeDate })}
        />

        {!jobDescription.trim() ? (
          <Callout tone="ok">
            No job description pasted yet. Add one in the Match tab and the letter will pick your most
            relevant achievements instead of your most recent ones.
          </Callout>
        ) : null}

        <Button
          variant="primary"
          icon={letter ? <RefreshCw size={14} /> : <Wand2 size={14} />}
          onClick={generate}
          disabled={!resume.contact.fullName && !resume.experience.some((role) => role.bullets.some(Boolean))}
        >
          {letter ? 'Regenerate letter' : 'Write my letter'}
        </Button>
      </Card>

      {letter ? (
        <Card className="p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[11px] text-[var(--text-faint)]">
              {words} words · aim for 250–400
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                icon={<Copy size={13} />}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(letter);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1800);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  downloadFile(
                    `${(resume.contact.fullName || 'cover-letter').replace(/\s+/g, '-').toLowerCase()}-cover-letter.txt`,
                    letter,
                    'text/plain',
                  )
                }
              >
                .txt
              </Button>
              <Button size="sm" variant="secondary" icon={<Printer size={13} />} onClick={onPrint}>
                Print / PDF
              </Button>
            </div>
          </div>

          <textarea
            value={letter}
            onChange={(event) => setCoverLetter(event.target.value)}
            rows={20}
            spellCheck
            className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 font-serif text-[13px] leading-relaxed text-[var(--text)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
          />

          {words > 420 ? (
            <div className="mt-2">
              <Callout tone="ok">
                {words} words is long for a cover letter. Cut the paragraph that repeats your resume rather
                than adding to it.
              </Callout>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
