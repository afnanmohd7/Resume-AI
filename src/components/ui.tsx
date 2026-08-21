import { forwardRef, useId, type ReactNode } from 'react';

type Tone = 'good' | 'ok' | 'poor' | 'neutral';

export const TONE_STYLES: Record<Tone, { fg: string; bg: string }> = {
  good: { fg: 'var(--good)', bg: 'var(--good-soft)' },
  ok: { fg: 'var(--warn)', bg: 'var(--warn-soft)' },
  poor: { fg: 'var(--bad)', bg: 'var(--bad-soft)' },
  neutral: { fg: 'var(--text-muted)', bg: 'var(--surface-2)' },
};

/* ------------------------------------------------------------------ */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap';
  const sizing = size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3 py-1.5 text-[13px]';
  const variants: Record<string, string> = {
    primary:
      'bg-[var(--brand)] text-white hover:brightness-110 border border-transparent shadow-sm',
    secondary:
      'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-2)]',
    ghost: 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] border border-transparent',
    danger: 'text-[var(--bad)] border border-[var(--border)] hover:bg-[var(--bad-soft)]',
  };
  return (
    <button className={`${base} ${sizing} ${variants[variant]} ${className}`} {...rest}>
      {icon}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  children,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-faint)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:opacity-30 disabled:hover:bg-transparent ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */

const inputClass =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text-faint)] transition-colors focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20';

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  /** Marks the field red and swaps the hint for the error. Set only after the
   *  person has actually tried to move on — never while they are still typing. */
  error?: string;
  optional?: boolean;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, optional, className = '', ...rest },
  ref,
) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 flex items-baseline gap-1.5 text-[11px] font-medium tracking-wide text-[var(--text-muted)]">
        {label}
        {optional ? <span className="text-[10px] font-normal text-[var(--text-faint)]">optional</span> : null}
      </label>
      <input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={`${inputClass} ${error ? 'border-[var(--bad)] focus:border-[var(--bad)] focus:ring-[var(--bad)]/20' : ''}`}
        {...rest}
      />
      {error ? (
        <p className="mt-1 text-[11px]" style={{ color: 'var(--bad)' }}>
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-[var(--text-faint)]">{hint}</p>
      ) : null}
    </div>
  );
});

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: ReactNode;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, className = '', ...rest },
  ref,
) {
  const id = useId();
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={id} className="mb-1 block text-[11px] font-medium tracking-wide text-[var(--text-muted)]">
          {label}
        </label>
      ) : null}
      <textarea id={id} ref={ref} className={`${inputClass} resize-y leading-relaxed`} {...rest} />
      {hint ? <div className="mt-1 text-[11px] text-[var(--text-faint)]">{hint}</div> : null}
    </div>
  );
});

export function Select({
  label,
  className = '',
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-[11px] font-medium tracking-wide text-[var(--text-muted)]">
        {label}
      </label>
      <select id={id} className={inputClass} {...rest}>
        {children}
      </select>
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 py-1">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-[18px] w-8 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[var(--brand)]' : 'bg-[var(--border-strong)]'
        }`}
      >
        <span
          className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition-all ${
            checked ? 'left-[16px]' : 'left-[2px]'
          }`}
        />
      </button>
      <span>
        <span className="block text-[13px] text-[var(--text)]">{label}</span>
        {description ? (
          <span className="block text-[11px] text-[var(--text-faint)]">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  const id = useId();
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <label htmlFor={id} className="text-[11px] font-medium tracking-wide text-[var(--text-muted)]">
          {label}
        </label>
        <span className="text-[11px] tabular-nums text-[var(--text-faint)]">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--surface-2)] accent-[var(--brand)]"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Card({
  children,
  className = '',
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Chip({
  children,
  tone = 'neutral',
  onClick,
  title,
}: {
  children: ReactNode;
  tone?: Tone;
  onClick?: () => void;
  title?: string;
}) {
  const style = TONE_STYLES[tone];
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
        onClick ? 'cursor-pointer hover:brightness-95' : ''
      }`}
      style={{ color: style.fg, background: style.bg }}
    >
      {children}
    </Tag>
  );
}

export function Callout({
  tone = 'neutral',
  title,
  children,
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
}) {
  const style = TONE_STYLES[tone];
  return (
    <div
      className="rounded-lg px-3 py-2 text-[12px] leading-relaxed"
      style={{ background: style.bg, color: 'var(--text)' }}
    >
      {title ? (
        <p className="mb-0.5 font-semibold" style={{ color: style.fg }}>
          {title}
        </p>
      ) : null}
      {children}
    </div>
  );
}

/** Circular score dial used by the ATS panel and bullet coach. */
export function ScoreRing({
  score,
  size = 64,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const tone: Tone = score >= 80 ? 'good' : score >= 55 ? 'ok' : 'poor';
  const color = TONE_STYLES[tone].fg;
  const stroke = size >= 56 ? 6 : 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circumference;

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: 'stroke-dasharray 320ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-semibold tabular-nums" style={{ fontSize: size * 0.3, color }}>
          {Math.round(score)}
        </span>
        {label ? <span className="mt-0.5 text-[9px] text-[var(--text-faint)]">{label}</span> : null}
      </div>
    </div>
  );
}

export function Meter({ value, tone = 'neutral' }: { value: number; tone?: Tone }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: TONE_STYLES[tone].fg }}
      />
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-[var(--text)]">{title}</h2>
        {description ? (
          <p className="mt-0.5 max-w-prose text-[12px] leading-relaxed text-[var(--text-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border-strong)] px-4 py-6 text-center">
      <p className="text-[13px] font-medium text-[var(--text)]">{title}</p>
      {children ? <div className="mt-1 text-[12px] text-[var(--text-muted)]">{children}</div> : null}
    </div>
  );
}
