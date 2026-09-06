// ANGALY — Shared TypeScript Types
// These types are shared between the frontend (apps/web) and backend (apps/api).
// Enums mirror packages/database/prisma/schema.prisma 1:1 — keep both in sync.

// ============================================================
// Enums
// ============================================================

export enum Role {
  CLIENT = 'CLIENT',
  COUTURIERE = 'COUTURIERE',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export enum CategoryKind {
  CREATION = 'CREATION',
  PRODUCT = 'PRODUCT',
  BLOG = 'BLOG',
}

export enum CreationAvailability {
  DISPONIBLE = 'DISPONIBLE',
  SUR_DEMANDE = 'SUR_DEMANDE',
  PIECE_UNIQUE = 'PIECE_UNIQUE',
}

export enum ProductAvailability {
  AVAILABLE = 'AVAILABLE',
  LAST_PIECE = 'LAST_PIECE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  ON_ORDER = 'ON_ORDER',
  RESERVED = 'RESERVED',
}

export enum AppointmentType {
  ROBE_MARIEE = 'ROBE_MARIEE',
  COSTUME = 'COSTUME',
  ROBE_SOIREE = 'ROBE_SOIREE',
  RETOUCHE = 'RETOUCHE',
  PATRON = 'PATRON',
  CONSULTATION = 'CONSULTATION',
  ESSAYAGE = 'ESSAYAGE',
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PAID = 'PAID',
  IN_PRODUCTION = 'IN_PRODUCTION',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  MOBILE_MONEY = 'MOBILE_MONEY',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum MeasurementUnit {
  CM = 'CM',
  INCH = 'INCH',
}

export enum PatternStatus {
  DRAFT = 'DRAFT',
  GENERATING = 'GENERATING',
  GENERATED = 'GENERATED',
  REVIEW_REQUIRED = 'REVIEW_REQUIRED',
  CORRECTION_REQUIRED = 'CORRECTION_REQUIRED',
  VALIDATED = 'VALIDATED',
  EXPORTED = 'EXPORTED',
  ARCHIVED = 'ARCHIVED',
}

export enum PatternExportFormat {
  PDF_A4 = 'PDF_A4',
  PDF_A3 = 'PDF_A3',
  PDF_A0 = 'PDF_A0',
  SVG = 'SVG',
  DXF = 'DXF',
}

export enum AIConversationRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
}

export enum FavoriteEntityType {
  CREATION = 'CREATION',
  PRODUCT = 'PRODUCT',
  COLLECTION = 'COLLECTION',
}

export enum MediaEntityType {
  CREATION = 'CREATION',
  PRODUCT = 'PRODUCT',
  COLLECTION = 'COLLECTION',
  ATELIER = 'ATELIER',
  CUSTOMER_AVATAR = 'CUSTOMER_AVATAR',
  PATTERN_EXPORT = 'PATTERN_EXPORT',
  BLOG_POST = 'BLOG_POST',
  PAGE_SECTION = 'PAGE_SECTION',
}

export enum NotificationType {
  APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  QUOTE_RECEIVED = 'QUOTE_RECEIVED',
  PATTERN_STATUS_CHANGED = 'PATTERN_STATUS_CHANGED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
}

export enum ContentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export enum Locale {
  FR = 'FR',
  MG = 'MG',
}

// ============================================================
// Base types
// ============================================================

export interface Timestamps {
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface MediaDto {
  id: string;
  url: string;
  altText: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  entityType: MediaEntityType;
  entityId: string | null;
  sortOrder: number;
}

// ============================================================
// Identity
// ============================================================

export interface UserDto extends Timestamps {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface CustomerDto extends Timestamps {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

// ============================================================
// Ateliers — typed shape for Atelier.openingHoursJson / servicesJson
// (Json columns in schema.prisma — never left as Record<string, unknown>,
// see docs/features/ateliers.md "Points d'attention")
// ============================================================

export const ATELIER_WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type AtelierWeekday = (typeof ATELIER_WEEKDAYS)[number];

export interface AtelierTimeSlot {
  open: string; // "HH:mm"
  close: string; // "HH:mm"
}

export interface AtelierDayHours {
  isOpen: boolean;
  slots: AtelierTimeSlot[];
}

export type AtelierOpeningHours = Record<AtelierWeekday, AtelierDayHours>;

export type AtelierServices = string[];

// ============================================================
// Angaly Pattern Studio — shared contracts with apps/ai-service
// ============================================================

/** Request payload the NestJS `pattern-engine` module sends to apps/ai-service. */
export interface PatternAiSuggestionRequest {
  garmentType: string;
  occasion: string | null;
  style: string | null;
  measurements: Record<string, number>;
  inspirationImageUrl: string | null;
}

/** Response contract from apps/ai-service — suggested parameters, never final geometry. */
export interface PatternAiSuggestionResponse {
  suggestedCutType: string;
  suggestedDetails: Record<string, string>;
  detectedInspirationFeatures: Record<string, string> | null;
  confidence: number; // 0..1 — surfaced to the couturière during REVIEW_REQUIRED
  modelVersion: string;
}
