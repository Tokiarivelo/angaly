import type { AtelierDto, BlogPostDto } from '@angaly/types';

/** Mocked via MSW until `reviews` exists (Phase 2) — see docs/pages/home.md. */
export interface Testimonial {
  id: string;
  clientName: string;
  creationLabel: string;
  quote: string;
  verified: boolean;
  avatarUrl?: string | null | undefined;
  customerName?: string | undefined;
  mediaUrl?: string | null | undefined;
  isVerified?: boolean | undefined;
}

export type AtelierSummary = AtelierDto;
export type BlogPostSummary = BlogPostDto;
