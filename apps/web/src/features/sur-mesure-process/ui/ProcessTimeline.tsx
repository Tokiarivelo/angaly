import { PROCESS_STEPS } from '../consts/process-steps.const';
import { ProcessStep } from './ProcessStep';

/**
 * Real screen: 8 columns in one row with a continuous connecting line on
 * desktop; a 2-column x 4-row grid with NO connecting line on mobile (not a
 * single-column vertical list — a real deviation from stitch-prompts/
 * 11-sur-mesure-process.md's "vertical with a left connecting line").
 */
export function ProcessTimeline() {
  return (
    <section className="bg-angaly-ivory px-6 py-24 md:px-12 lg:px-24">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-heading mb-16 text-center text-4xl tracking-wide text-angaly-navy md:text-5xl">
          Le parcours sur mesure
        </h2>
        <div className="relative">
          <div aria-hidden="true" className="bg-angaly-border absolute top-6 right-0 left-0 hidden h-px md:block" />
          <ol className="relative grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-8 md:gap-x-4">
            {PROCESS_STEPS.map((step) => (
              <ProcessStep key={step.number} step={step} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
