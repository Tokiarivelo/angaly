import type { CustomizationOptions } from '../schemas/customization-options.schema';

export interface DesignBrief {
  id: string;
  creationSlug: string;
  options: CustomizationOptions;
  inspirationMediaIds: string[];
  status: 'DRAFT' | 'SUBMITTED';
  createdAt: string;
  updatedAt: string;
}

export interface DesignBriefPayload {
  creationSlug: string;
  options: CustomizationOptions;
  inspirationMediaIds: string[];
  status: 'DRAFT' | 'SUBMITTED';
}
