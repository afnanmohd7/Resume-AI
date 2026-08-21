import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, SkipForward } from 'lucide-react';
import { useStore } from '../../store';
import { STEPS, STEP_IDS, stepIndex, stepState, type StepId } from '../../lib/steps';
import { Button } from '../ui';
import {
  EducationStep,
  ExperienceStep,
  ExtrasStep,
  PersonalStep,
  SkillsStep,
  SummaryStep,
  type StepProps,
} from './steps';
import { ReviewStep } from './ReviewStep';
import { StepRail } from './StepRail';

export function Wizard({
  step,
  onStepChange,
  measuredPages,
  onGoToTab,
  onPrint,
}: {
  step: StepId;
  onStepChange: (id: StepId) => void;
  measuredPages: number | null;
  onGoToTab: (tab: 'tailor' | 'design' | 'letter') => void;
  onPrint: () => void;
}) {
  const resume = useStore((state) => state.present.resume);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** Which steps have been nudged about already. */
  const [nudged, setNudged] = useState<Set<StepId>>(new Set());

  const index = stepIndex(step);
  const def = STEPS[index];
  const state = stepState(resume, step);
  const isLast = index === STEPS.length - 1;
  const showErrors = nudged.has(step);

  // A new step starts at the top; carrying the old scroll position over makes
  // the page feel like it did not change.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [step]);

  const goTo = useCallback(
    (id: StepId) => {
      onStepChange(id);
    },
    [onStepChange],
  );

  /**
   * Continue never hard-blocks. The first attempt with gaps marks the fields
   * and explains what is missing; a second press moves on regardless. People
   * arrive without their exact start dates to hand, and a builder that traps
   * them is worse than one that lets them come back.
   */
  const handleNext = () => {
    if (state.blocking.length && !nudged.has(step)) {
      setNudged((prev) => new Set(prev).add(step));
      return;
    }
    const next = STEP_IDS[Math.min(STEP_IDS.length - 1, index + 1)];
    goTo(next);
  };

  const handleBack = () => goTo(STEP_IDS[Math.max(0, index - 1)]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const stepProps: StepProps = {
    showErrors,
    onGoToStep: goTo,
    onGoToTab,
    onPrint,
  };

  const blocked = state.blocking.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <StepRail resume={resume} current={step} onSelect={goTo} />

      <div ref={scrollRef} className="scroll-slim min-h-0 flex-1 overflow-y-auto">
        <div key={step} className="step-enter px-4 pb-6 pt-4">
          <header className="mb-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-faint)]">
              Step {index + 1} of {STEPS.length}
              {def.optional ? ' · optional' : ''}
            </p>
            <h2 className="mt-1 text-[19px] font-semibold tracking-tight">{def.title}</h2>
            <p className="mt-1 max-w-prose text-[13px] leading-relaxed text-[var(--text-muted)]">
              {def.blurb}
            </p>
          </header>

          {step === 'personal' ? <PersonalStep {...stepProps} /> : null}
          {step === 'experience' ? <ExperienceStep {...stepProps} /> : null}
          {step === 'education' ? <EducationStep /> : null}
          {step === 'skills' ? <SkillsStep {...stepProps} /> : null}
          {step === 'extras' ? <ExtrasStep /> : null}
          {step === 'summary' ? <SummaryStep /> : null}
          {step === 'review' ? (
            <ReviewStep
              measuredPages={measuredPages}
              onGoToStep={goTo}
              onGoToTab={onGoToTab}
              onPrint={onPrint}
            />
          ) : null}
        </div>
      </div>

      {!isLast ? (
        <footer className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
          {showErrors && blocked ? (
            <p className="mb-2 text-[12px] leading-relaxed" style={{ color: 'var(--bad)' }}>
              Still missing: {state.blocking.join(', ').toLowerCase()}. You can come back to this later.
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              icon={<ArrowLeft size={14} />}
              onClick={handleBack}
              disabled={index === 0}
            >
              Back
            </Button>

            <span className="flex-1" />

            {def.optional && !state.started ? (
              <Button variant="ghost" icon={<SkipForward size={13} />} onClick={handleNext}>
                Skip
              </Button>
            ) : null}

            <Button
              variant="primary"
              onClick={handleNext}
              className="min-w-[7.5rem] justify-center py-1.5"
            >
              {showErrors && blocked ? 'Continue anyway' : 'Continue'}
              {showErrors && blocked ? null : <ArrowRight size={14} />}
            </Button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-[var(--text-faint)]">
            Saved automatically · Ctrl/Cmd + Enter to continue
          </p>
        </footer>
      ) : (
        <footer className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Button variant="ghost" icon={<ArrowLeft size={14} />} onClick={handleBack}>
              Back
            </Button>
            <span className="flex-1" />
            <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
              <Check size={13} style={{ color: 'var(--good)' }} /> All steps visited
            </span>
          </div>
        </footer>
      )}
    </div>
  );
}
