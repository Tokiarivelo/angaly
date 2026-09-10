import type { ProcessStep as ProcessStepData } from '../consts/process-steps.const';

/** One 48x48 numbered circle + uppercase label — real screen has no per-step description, hover inverts to navy fill/champagne halo. */
export function ProcessStep({ step }: { step: ProcessStepData }) {
  return (
    <li className="group relative flex flex-row items-center gap-4 md:flex-col md:text-center">
      <div className="border-angaly-navy text-angaly-navy group-hover:bg-angaly-navy group-hover:ring-angaly-champagne relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-angaly-ivory font-heading text-lg transition-colors duration-300 group-hover:text-white group-hover:ring-2">
        {step.number}
      </div>
      <span className="text-xs font-medium tracking-wide text-angaly-navy uppercase md:mt-4">{step.title}</span>
    </li>
  );
}
