import type { CreationDto } from '@angaly/types';

import { AVAILABILITY_LABELS } from '../consts/availability-labels.const';
import { CreationActions } from './CreationActions';

/** Real Stitch screen's sticky right column (40%): pill badge, title, description, specs, actions. */
export function CreationInfoPanel({ creation }: { creation: CreationDto }) {
  const badge = creation.collection ? `${creation.collection.name} — ${creation.category.name}` : creation.category.name;

  return (
    <div className="w-full md:w-[40%]">
      <div className="flex flex-col gap-8 md:sticky md:top-32">
        <div>
          <span className="mb-4 inline-block rounded-sm bg-angaly-warm-ivory px-3 py-1 text-xs tracking-widest text-angaly-navy uppercase">
            {badge}
          </span>
          <h1 className="font-heading mb-6 text-5xl leading-tight tracking-wide text-angaly-navy md:text-6xl">
            {creation.name}
          </h1>
          <p className="text-sm leading-relaxed text-angaly-slate">{creation.description}</p>
        </div>

        <dl className="border-angaly-border space-y-4 border-t border-b py-6">
          {creation.materials && (
            <div className="grid grid-cols-3 gap-4">
              <dt className="text-xs tracking-widest text-angaly-warm-gray uppercase">Matière</dt>
              <dd className="col-span-2 text-sm text-angaly-navy">{creation.materials}</dd>
            </div>
          )}
          {creation.techniques && (
            <div className="grid grid-cols-3 gap-4">
              <dt className="text-xs tracking-widest text-angaly-warm-gray uppercase">Techniques</dt>
              <dd className="col-span-2 text-sm text-angaly-navy">{creation.techniques}</dd>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <dt className="text-xs tracking-widest text-angaly-warm-gray uppercase">Disponibilité</dt>
            <dd className="col-span-2 text-sm text-angaly-navy">{AVAILABILITY_LABELS[creation.availability]}</dd>
          </div>
        </dl>

        <CreationActions creation={creation} />
      </div>
    </div>
  );
}
