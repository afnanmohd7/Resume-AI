import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import type { ResumeData } from '../../types';
import { STEPS, stepIndex, stepState, type StepId } from '../../lib/steps';

/**
 * The spine of the builder: shows how far along you are, what is done, and
 * lets you jump anywhere. Never locks a step — people arrive with half their
 * details in their head and fill things in out of order.
 */
export function StepRail({
  resume,
  current,
  onSelect,
}: {
  resume: ResumeData;
  current: StepId;
  onSelect: (id: StepId) => void;
}) {
  const currentIndex = stepIndex(current);
  const railRef = useRef<HTMLOListElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);

  // With seven steps the rail scrolls on narrower panes; keep the step you are
  // actually on in view rather than letting it slide off the edge.
  useEffect(() => {
    const rail = railRef.current;
    const active = activeRef.current;
    if (!rail || !active) return;
    const railBox = rail.getBoundingClientRect();
    const activeBox = active.getBoundingClientRect();
    if (activeBox.left < railBox.left || activeBox.right > railBox.right) {
      rail.scrollTo({
        left: active.offsetLeft - rail.clientWidth / 2 + active.clientWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [current]);

  return (
    <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-3 pb-2 pt-2.5">
      <ol ref={railRef} className="scroll-slim flex items-center gap-0 overflow-x-auto pb-1">
        {STEPS.map((step, index) => {
          const state = stepState(resume, step.id);
          const isCurrent = step.id === current;
          const isDone = step.id === 'review' ? false : step.optional ? state.started : state.complete;
          const isPast = index < currentIndex;
          const needsWork = isPast && !isDone && !step.optional;

          return (
            <li
              key={step.id}
              ref={isCurrent ? activeRef : undefined}
              className="flex shrink-0 items-center"
            >
              {index > 0 ? (
                <span
                  aria-hidden
                  className="mx-1 h-px w-4 shrink-0 sm:w-6"
                  style={{ background: index <= currentIndex ? 'var(--brand)' : 'var(--border)' }}
                />
              ) : null}

              <button
                onClick={() => onSelect(step.id)}
                aria-current={isCurrent ? 'step' : undefined}
                title={`${step.label}${step.optional ? ' (optional)' : ''}`}
                className={`flex items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors ${
                  isCurrent ? 'bg-[var(--brand-soft)]' : 'hover:bg-[var(--surface-2)]'
                }`}
              >
                <span
                  className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full text-[11px] font-semibold transition-colors ${
                    isCurrent ? 'ring-2 ring-[var(--brand)] ring-offset-1 ring-offset-[var(--surface)]' : ''
                  }`}
                  style={
                    isDone
                      ? { background: 'var(--good)', color: '#fff' }
                      : needsWork
                        ? { background: 'var(--warn-soft)', color: 'var(--warn)' }
                        : isCurrent
                          ? { background: 'var(--brand)', color: '#fff' }
                          : { background: 'var(--surface-2)', color: 'var(--text-faint)' }
                  }
                >
                  {isDone ? <Check size={12} strokeWidth={3} /> : index + 1}
                </span>
                <span
                  className={`whitespace-nowrap text-[12px] ${
                    isCurrent
                      ? 'font-semibold text-[var(--text)]'
                      : 'font-medium text-[var(--text-muted)]'
                  } ${isCurrent ? '' : 'hidden sm:inline'}`}
                >
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
