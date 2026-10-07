import type { CreationProjectStage } from '@angaly/types';

import type {
  CreationProjectAssignee,
  CreationProjectEntity,
  CreationProjectStageMedia,
  CreationProjectStageNote,
} from '../entities/creation-project.entity';

export const CREATION_PROJECT_REPOSITORY = Symbol('ICreationProjectRepository');

export interface CreateCreationProjectData {
  reference: string;
  customerId: string;
  title: string;
  description: string | null;
  quoteId: string | null;
  creationId: string | null;
}

export interface CustomerLookupItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

export interface QuoteLookupItem {
  id: string;
  quoteNumber: string;
  total: string;
  customerName?: string | null;
}

export interface CreateAdminCreationProjectData {
  customerId?: string;
  newCustomer?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
  title: string;
  description?: string | null;
  stage?: CreationProjectStage;
  quoteId?: string | null;
  assignedToId?: string | null;
  creatorUserId?: string | null;
}

export interface ICreationProjectRepository {
  findByCustomerId(customerId: string): Promise<CreationProjectEntity[]>;
  findById(id: string): Promise<CreationProjectEntity | null>;
  findByQuoteId(quoteId: string): Promise<CreationProjectEntity | null>;
  /** Back-office : tous les projets, filtrables par étape, plus récent d'abord. */
  findAll(stage?: CreationProjectStage): Promise<CreationProjectEntity[]>;
  create(data: CreateCreationProjectData): Promise<CreationProjectEntity>;
  /** Création manuelle d'un projet depuis le back-office avec résolution ou création de cliente. */
  createAdminProject(data: CreateAdminCreationProjectData): Promise<CreationProjectEntity>;
  /** Recherche / liste de clientes pour sélection dans le formulaire back-office. */
  findCustomers(query?: string): Promise<CustomerLookupItem[]>;
  /** Devis récents rattachables à un nouveau projet. */
  findQuotes(): Promise<QuoteLookupItem[]>;
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
  /** Ajoute une note d'atelier pour une étape donnée. */
  addStageNote(
    projectId: string,
    stage: CreationProjectStage,
    content: string,
    authorId?: string | null,
  ): Promise<CreationProjectStageNote>;
  /** Supprime une note d'atelier par ID. */
  deleteStageNote(projectId: string, noteId: string): Promise<void>;
  /** Ajoute un média ou document rattaché à une étape donnée. */
  addStageMedia(
    projectId: string,
    stage: CreationProjectStage,
    data: {
      url: string;
      title?: string | null;
      fileName?: string | null;
      mimeType?: string | null;
      sizeBytes?: number | null;
    },
    uploadedById?: string | null,
  ): Promise<CreationProjectStageMedia>;
  /** Supprime un média d'étape par ID. */
  deleteStageMedia(projectId: string, mediaId: string): Promise<void>;
}
