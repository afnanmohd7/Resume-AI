import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Lightbulb, Sparkles, Wand2, X } from 'lucide-react';
import { analyzeBullet, generateBullets, rewriteBullet, type BulletContext } from '../lib/bullets';
import { METRIC_PROMPTS } from '../lib/verbs';
import type { BulletIssue } from '../types';
import { Button, Callout, Chip, ScoreRing, TONE_STYLES } from './ui';

/** Textarea that grows with its content so long bullets stay fully visible. */
export function AutoTextArea({
  value,
  onChange,
  placeholder,
  onFocus,
  minRows = 1,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  minRows?: number;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${Math.max(node.scrollHeight, minRows * 20 + 12)}px`;
  }, [value, minRows]);

  return (
    <textarea
      ref={ref}
      value={value}
      onFocus={onFocus}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={minRows}
      className={`w-full resize-none overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[13px] leading-relaxed text-[var(--text)] placeholder:text-[var(--text-faint)] transition-colors focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 ${className}`}
    />
  );
}

function issueTone(level: BulletIssue['level']) {
  return level === 'error' ? 'poor' : level === 'warn' ? 'ok' : 'neutral';
}

export function BulletScoreChip({ text }: { text: string }) {
  const analysis = useMemo(() => analyzeBullet(text), [text]);
  if (!text.trim()) return null;
  const tone = analysis.score >= 80 ? 'good' : analysis.score >= 55 ? 'ok' : 'poor';
  return (
    <Chip tone={tone} title={`Bullet strength ${analysis.score}/100`}>
      {analysis.score}
    </Chip>
  );
}

/**
 * Inline coach for one bullet: what is wrong, a concrete rewrite, and three
 * alternative shapes. Every suggestion is applied only on an explicit click —
 * the tool never edits someone's words behind their back.
 */
export function BulletCoach({
  value,
  context,
  onApply,
  onClose,
}: {
  value: string;
  context: BulletContext;
  onApply: (next: string) => void;
  onClose: () => void;
}) {
  const analysis = useMemo(() => analyzeBullet(value), [value]);
  const rewrite = useMemo(() => rewriteBullet(value, context), [value, context]);
  const drafts = useMemo(() => generateBullets(value, context), [value, context]);
  const [tab, setTab] = useState<'review' | 'rewrite' | 'variants'>('review');

  const rewriteChanged = rewrite.text.trim() && rewrite.text.trim() !== value.trim();

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-2 py-1.5">
        <div className="flex items-center gap-1">
          {(
            [
              ['review', 'Review'],
              ['rewrite', 'Rewrite'],
              ['variants', 'Variants'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-md px-2 py-1 text-[12px] font-medium transition-colors ${
                tab === key
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          aria-label="Close coach"
          className="rounded-md p-1 text-[var(--text-faint)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-3">
        {tab === 'review' ? (
          <div className="flex gap-3">
            <ScoreRing score={analysis.score} size={62} label="strength" />
            <div className="min-w-0 flex-1 space-y-2">
              {analysis.strengths.length ? (
                <div className="flex flex-wrap gap-1">
                  {analysis.strengths.map((strength) => (
                    <Chip key={strength} tone="good">
                      <Check size={11} /> {strength}
                    </Chip>
                  ))}
                </div>
              ) : null}

              {analysis.issues.length ? (
                <ul className="space-y-1.5">
                  {analysis.issues.map((issue) => (
                    <li key={issue.label} className="flex gap-2">
                      <span
                        className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: TONE_STYLES[issueTone(issue.level)].fg }}
                      />
                      <p className="text-[12px] leading-relaxed text-[var(--text-muted)]">
                        <span className="font-semibold text-[var(--text)]">{issue.label}. </span>
                        {issue.detail}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <Callout tone="good">Nothing to fix — this bullet is doing its job.</Callout>
              )}

              {!analysis.hasMetric ? (
                <div className="rounded-lg bg-[var(--surface)] px-2.5 py-2">
                  <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text)]">
                    <Lightbulb size={12} /> Numbers worth digging up
                  </p>
                  <ul className="grid gap-0.5 text-[11px] text-[var(--text-muted)]">
                    {METRIC_PROMPTS[context.domain].slice(0, 4).map((prompt) => (
                      <li key={prompt}>· {prompt}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {tab === 'rewrite' ? (
          <div className="space-y-2">
            {rewriteChanged ? (
              <>
                <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-[13px] leading-relaxed">
                  {rewrite.text}
                </p>
                {rewrite.changes.length ? (
                  <ul className="space-y-0.5">
                    {rewrite.changes.map((change) => (
                      <li key={change} className="text-[11px] text-[var(--text-muted)]">
                        · {change}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <Button variant="primary" size="sm" icon={<Wand2 size={13} />} onClick={() => onApply(rewrite.text)}>
                  Replace my bullet
                </Button>
              </>
            ) : (
              <Callout tone="good">
                This bullet already follows the rules the rewriter applies. Try the Variants tab for a
                different shape.
              </Callout>
            )}
          </div>
        ) : null}

        {tab === 'variants' ? (
          <div className="space-y-2">
            {drafts.length ? (
              drafts.map((draft) => (
                <div
                  key={draft.style}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[var(--brand)]">{draft.style}</span>
                    <Button size="sm" variant="ghost" onClick={() => onApply(draft.text)}>
                      Use this
                    </Button>
                  </div>
                  <p className="text-[13px] leading-relaxed">{draft.text}</p>
                  <p className="mt-1 text-[11px] text-[var(--text-faint)]">{draft.note}</p>
                </div>
              ))
            ) : (
              <Callout tone="ok">Write a few more words and the variants will have something to work with.</Callout>
            )}
            <p className="text-[11px] text-[var(--text-faint)]">
              Bracketed slots like [X]% are placeholders — replace them with your real numbers before exporting.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * "Describe what you did in plain words" → three publishable bullets.
 * The entry point for people who freeze at a blank bullet.
 */
export function BulletComposer({
  context,
  onAdd,
}: {
  context: BulletContext;
  onAdd: (text: string) => void;
}) {
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState('');
  const drafts = useMemo(() => (submitted ? generateBullets(submitted, context) : []), [submitted, context]);

  return (
    <div className="rounded-lg border border-dashed border-[var(--border-strong)] p-2.5">
      <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-[var(--text)]">
        <Sparkles size={13} className="text-[var(--brand)]" />
        Turn a plain note into a bullet
      </p>
      <AutoTextArea
        value={note}
        onChange={setNote}
        minRows={2}
        placeholder="e.g. i was responsible for the weekly sales reports and made them faster to produce"
      />
      <div className="mt-1.5 flex items-center gap-2">
        <Button
          size="sm"
          variant="primary"
          icon={<Wand2 size={13} />}
          disabled={note.trim().length < 8}
          onClick={() => setSubmitted(note)}
        >
          Draft bullets
        </Button>
        {submitted ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSubmitted('');
              setNote('');
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>

      {drafts.length ? (
        <div className="mt-2 space-y-2">
          {drafts.map((draft) => (
            <div key={draft.style} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[var(--brand)]">{draft.style}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onAdd(draft.text);
                    setSubmitted('');
                    setNote('');
                  }}
                >
                  Add to role
                </Button>
              </div>
              <p className="text-[13px] leading-relaxed">{draft.text}</p>
              <p className="mt-1 text-[11px] text-[var(--text-faint)]">{draft.note}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
