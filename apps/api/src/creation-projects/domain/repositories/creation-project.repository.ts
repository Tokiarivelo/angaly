import type { CreationProjectStage } from '@angaly/types';

import type { CreationProjectAssignee, CreationProjectEntity } from '../entities/creation-project.entity';

export const CREATION_PROJECT_REPOSITORY = Symbol('ICreationProjectRepository');

export interface CreateCreationProjectData {
  reference: string;
  customerId: string;
  title: string;
  description: string | null;
  quoteId: string | null;
  creationId: string | null;
}

export interface ICreationProjectRepository {
  findByCustomerId(customerId: string): Promise<CreationProjectEntity[]>;
  findById(id: string): Promise<CreationProjectEntity | null>;
  findByQuoteId(quoteId: string): Promise<CreationProjectEntity | null>;
  /** Back-office : tous les projets, filtrables par étape, plus récent d'abord. */
  findAll(stage?: CreationProjectStage): Promise<CreationProjectEntity[]>;
  create(data: CreateCreationProjectData): Promise<CreationProjectEntity>;
  /** Met à jour l'étape et consigne l'évènement d'historique (acteur = membre du staff connecté). */
  updateStage(
    id: string,
    stage: CreationProjectStage,
    completedAt: Date | null,
    changedById: string | null,
  ): Promise<CreationProjectEntity>;
  /** Projet avec son historique d'étapes (plus récent d'abord). */
  findDetailById(id: string): Promise<CreationProjectEntity | null>;
  /** `userId = null` retire l'assignation. */
  assign(id: string, userId: string | null): Promise<CreationProjectEntity>;
  /** Membres du staff actifs (COUTURIERE/MANAGER/ADMIN) assignables à un projet. */
  findAssignableStaff(): Promise<CreationProjectAssignee[]>;
  findAssignableStaffById(userId: string): Promise<CreationProjectAssignee | null>;
}
