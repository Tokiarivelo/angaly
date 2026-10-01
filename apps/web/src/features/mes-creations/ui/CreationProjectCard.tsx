import Link from 'next/link';
import { CreationProjectStage, type CreationProjectDto } from '@angaly/types';
import { ROUTES } from '@/lib/routes';
import { CREATION_PROJECT_STATUS_BADGES } from '../consts/creation-project-stage-labels.const';
import { formatCreationDate } from '../hooks/useCreationProjectsFilter';
import { CreationProjectStepper } from './CreationProjectStepper';

export function CreationProjectCard({ project }: { project: CreationProjectDto }) {
  const isDone = project.stage === CreationProjectStage.TERMINEE;
  return (
    <article className="rounded-sm border border-angaly-border bg-white p-8 transition-colors hover:border-angaly-champagne">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-normal tracking-tight text-angaly-navy lg:text-3xl">{project.title}</h2>
          <p className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-angaly-slate">
            <span className="font-mono text-[11px] tracking-wider text-angaly-navy">Réf. {project.reference}</span>
            <span aria-hidden className="text-angaly-border">•</span>
            {isDone && project.completedAt ? (
              <span className="font-medium text-angaly-success">Terminée le {formatCreationDate(project.completedAt)}</span>
            ) : (
              <span>Ouvert le {formatCreationDate(project.createdAt)}</span>
            )}
          </p>
        </div>
        <span
          className={
            isDone
              ? 'inline-flex items-center rounded border border-angaly-success/30 px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-angaly-success'
              : 'inline-flex items-center rounded border border-angaly-gold/30 bg-angaly-navy px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-angaly-champagne'
          }
        >
          {CREATION_PROJECT_STATUS_BADGES[project.stage]}
        </span>
      </div>

      <div className="mb-8 mt-10">
        <CreationProjectStepper stage={project.stage} />
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-angaly-border pt-5">
        {project.quoteNumber && (
          <Link
            href={`/devis/${project.quoteNumber}`}
            className="rounded border border-angaly-navy px-4 py-2 text-xs font-medium uppercase tracking-wider text-angaly-navy transition-colors hover:bg-angaly-navy hover:text-white"
          >
            Voir le devis
          </Link>
        )}
        <Link href="/mes-messages" className="text-xs font-medium uppercase tracking-wider text-angaly-navy transition-colors hover:text-angaly-gold">
          Nous écrire
        </Link>
        {project.stage === CreationProjectStage.ESSAYAGE && (
          <Link
            href={ROUTES.reservationEssayage}
            className="ml-auto rounded bg-angaly-gold px-4 py-2 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-angaly-gold-light"
          >
            Planifier l&apos;essayage
          </Link>
        )}
      </div>
    </article>
  );
}
