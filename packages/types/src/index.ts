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
  PRODUCT_VARIANT = 'PRODUCT_VARIANT',
  COLLECTION = 'COLLECTION',
  ATELIER = 'ATELIER',
  CUSTOMER_AVATAR = 'CUSTOMER_AVATAR',
  PATTERN_EXPORT = 'PATTERN_EXPORT',
  BLOG_POST = 'BLOG_POST',
  PAGE_SECTION = 'PAGE_SECTION',
  QUOTE_DOCUMENT = 'QUOTE_DOCUMENT',
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
// Auth — POST /api/auth/register, /login, /refresh, /logout,
//        /forgot-password, /reset-password
// ============================================================

/** Never includes passwordHash — safe to send to the client as-is. */
export interface AuthUserDto {
  id: string;
  email: string;
  role: Role;
}

/**
 * The refresh token is never in this body — it's set as an httpOnly cookie
 * by the server directly (see docs/features/auth.md), so it's never
 * readable or storable from JavaScript.
 */
export interface AuthTokensDto {
  accessToken: string;
  user: AuthUserDto;
}

// ============================================================
// Categories — GET /api/categories
// ============================================================

/** Shared taxonomy row (`Category` model) — one `kind` per row, filter with `?kind=`. */
export interface CategoryDto {
  id: string;
  slug: string;
  name: string;
  kind: CategoryKind;
}

// ============================================================
// Creations — GET /api/creations, GET /api/creations/:slug
// ============================================================

export interface CreationMediaDto {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
}

export interface CreationCategoryDto {
  id: string;
  slug: string;
  name: string;
}

export interface CreationCollectionDto {
  id: string;
  slug: string;
  name: string;
}

export interface CreationDto extends Timestamps {
  id: string;
  slug: string;
  name: string;
  description: string;
  genre: string | null;
  type: string | null;
  color: string | null;
  style: string | null;
  materials: string | null;
  techniques: string | null;
  availability: CreationAvailability;
  reproducible: boolean;
  isFeatured: boolean;
  featuredFrom: string | null;
  featuredUntil: string | null;
  category: CreationCategoryDto;
  collection: CreationCollectionDto | null;
  media: CreationMediaDto[];
}

// ============================================================
// Ateliers — GET /api/ateliers, GET /api/ateliers/:slug
// ============================================================

export interface AtelierMediaDto {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
}

export interface AtelierDto extends Timestamps {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  openingHours: AtelierOpeningHours;
  services: AtelierServices;
  latitude: number | null;
  longitude: number | null;
  media: AtelierMediaDto[];
}

// ============================================================
// Blog — GET /api/blog-posts, GET /api/blog-posts/:slug
// ============================================================

export interface BlogPostMediaDto {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
}

export interface BlogPostCategoryDto {
  id: string;
  slug: string;
  name: string;
}

/** `User` is an identity model, not an editorial profile — see docs/pages/journal-article.md. */
export interface BlogPostAuthorDto {
  id: string;
  email: string;
}

/** Shape returned by GET /api/blog-posts and /api/blog-posts/:slug/related — no article body. */
export interface BlogPostDto extends Timestamps {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string | null;
  category: BlogPostCategoryDto;
  author: BlogPostAuthorDto;
  media: BlogPostMediaDto[];
}

/** Shape returned by GET /api/blog-posts/:slug — adds the full article body. */
export interface BlogPostDetailDto extends BlogPostDto {
  content: string;
}

// ============================================================
// Collections — GET /api/collections, GET /api/collections/:slug
// ============================================================

export interface CollectionMediaDto {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
}

export interface CollectionCreationDto {
  id: string;
  slug: string;
  name: string;
  coverImageUrl: string | null;
}

/** Shape returned by GET /api/collections — creationsCount only, never the full Creation[]. */
export interface CollectionDto extends Timestamps {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  story: string | null;
  seasonYear: number | null;
  publishedAt: string | null;
  media: CollectionMediaDto[];
  creationsCount: number;
}

/** Shape returned by GET /api/collections/:slug — adds the ordered Creation[]. */
export interface CollectionDetailDto extends CollectionDto {
  creations: CollectionCreationDto[];
}

// ============================================================
// Products — GET /api/products, GET /api/products/:slug
// ============================================================

export interface ProductMediaDto {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
}

export interface ProductCategoryDto {
  id: string;
  slug: string;
  name: string;
}

/** amount is a decimal string (never a float) — avoids float precision loss on money. */
export interface ProductPriceDto {
  amount: string;
  currency: string;
}

export interface ProductVariantDto {
  id: string;
  sku: string;
  size: string;
  color: string;
  material: string | null;
  priceOverride: ProductPriceDto | null;
  quantityAvailable: number;
  quantityReserved: number;
  /** Colorway-specific photos (e.g. the "Navy" swatch shows the navy photos). Empty when this variant has none — callers fall back to `ProductDto.media`. */
  media: ProductMediaDto[];
}

export interface ProductDto extends Timestamps {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string;
  price: ProductPriceDto;
  status: ProductAvailability;
  category: ProductCategoryDto;
  media: ProductMediaDto[];
  variants: ProductVariantDto[];
}

// ============================================================
// Appointments — GET/POST /api/appointments, GET /api/appointments/availability*
// ============================================================

export interface AppointmentDto extends Timestamps {
  id: string;
  reference: string;
  customerId: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  type: AppointmentType;
  atelierId: string;
  assignedToId: string | null;
  scheduledAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  message: string | null;
}

export type DayAvailabilityStatus = 'available' | 'full' | 'closed';

export interface MonthAvailabilityDayDto {
  /** YYYY-MM-DD */
  date: string;
  status: DayAvailabilityStatus;
}

export interface DaySlotsResponseDto {
  /** ISO datetime strings, one per free slot start time that day. */
  slots: string[];
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

export interface FavoriteDisplayDto {
  name: string;
  slug: string;
  imageUrl: string | null;
}

export interface FavoriteDto {
  id: string;
  entityType: FavoriteEntityType;
  entityId: string;
  createdAt: string;
  /**
   * null when the referenced entity no longer exists, or isn't hydratable
   * yet — PRODUCT favorites can't be hydrated until the `products` module
   * ships (see docs/features/customers.md "Points d'attention").
   */
  display: FavoriteDisplayDto | null;
}

// ============================================================
// Quotes — POST /api/quotes/requests, /design-briefs, GET/POST /api/quotes/:quoteNumber*
// ============================================================

/** unitPrice is a decimal string (e.g. "20.00"), never a float — see @angaly/database Decimal(12,2) columns. */
export interface QuoteLineItemDto {
  label: string;
  quantity: number;
  unitPrice: string;
}

/** subtotal/depositAmount/balanceAmount/total are decimal strings — same reasoning as ProductDto.price. */
export interface QuoteDto extends Timestamps {
  id: string;
  quoteNumber: string;
  customerId: string;
  creationId: string | null;
  description: string;
  lineItems: QuoteLineItemDto[];
  subtotal: string;
  depositAmount: string;
  balanceAmount: string;
  total: string;
  status: QuoteStatus;
  validUntil: string | null;
  estimatedDelayDays: number | null;
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
// Search — GET /api/search
// ============================================================

/** Normalized shape shared by all 5 source entities (see docs/features/search.md). */
export interface SearchResultDto {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string | null;
}

/** Results grouped by source entity type — an empty array means no matches for that type. */
export interface SearchResultsResponseDto {
  creations: SearchResultDto[];
  products: SearchResultDto[];
  collections: SearchResultDto[];
  blogPosts: SearchResultDto[];
  ateliers: SearchResultDto[];
}

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

export interface PatternPieceDto {
  id: string;
  versionId: string;
  name: string;
  dimensionsJson: {
    widthMm?: number;
    heightMm?: number;
    outlineMm?: Array<{ x: number; y: number }>;
  } | Record<string, unknown>;
  fabricRecommendation: string | null;
  quantity: number;
  grainlineJson: {
    angleDegrees: number;
    originX: number;
    originY: number;
  } | null;
  seamAllowanceCm: number | null;
  notchesJson: Array<{
    positionAlongEdge: number;
    edgeIndex: number;
  }> | null;
}

export interface PatternExportDto {
  id: string;
  versionId: string;
  format: PatternExportFormat;
  mediaId: string;
  mediaUrl?: string | null;
  createdAt: string;
}

export interface PatternVersionDto {
  id: string;
  projectId: string;
  versionNumber: number;
  changeLabel: string | null;
  parametersJson: Record<string, unknown>;
  generatedByAI: boolean;
  reviewedById: string | null;
  reviewNote: string | null;
  createdAt: string;
  pieces: PatternPieceDto[];
  exports?: PatternExportDto[];
}

export interface PatternProjectDto extends Timestamps {
  id: string;
  projectRef: string;
  customerId: string;
  measurementProfileId: string | null;
  garmentType: string;
  occasion: string | null;
  style: string | null;
  cutType: string | null;
  detailsJson: Record<string, string> | null;
  inspirationMediaId: string | null;
  inspirationMediaUrl?: string | null;
  status: PatternStatus;
  versions?: PatternVersionDto[];
  currentVersion?: PatternVersionDto | null;
  versionsCount?: number;
}

// ============================================================
// Reviews & Testimonials
// ============================================================

export interface ReviewDto extends Timestamps {
  id: string;
  customerId: string;
  productId: string | null;
  rating: number;
  comment: string | null;
  isVerified: boolean;
}

export interface TestimonialDto extends Timestamps {
  id: string;
  customerName: string;
  clientName?: string;
  creationLabel: string | null;
  quote: string;
  isVerified: boolean;
  verified?: boolean;
  mediaUrl: string | null;
  avatarUrl?: string | null;
}

// ============================================================
// Orders — POST /api/orders, GET /api/orders
// ============================================================

export interface OrderItemDto {
  id: string;
  orderId: string;
  productVariantId: string;
  quantity: number;
  unitPrice: string; // Decimal as string
}

export interface OrderDto extends Timestamps {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  subtotal: string; // Decimal as string
  shippingCost: string; // Decimal as string
  total: string; // Decimal as string
  currency: string;
  shippingAddressJson: unknown | null;
  items: OrderItemDto[];
}

export interface CreateOrderPayload {
  items: {
    productVariantId: string;
    quantity: number;
  }[];
  shippingAddressJson?: unknown;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
}

// ============================================================
// Payments — POST /api/payments, GET /api/payments
// ============================================================

/**
 * Does NOT extend `Timestamps` on purpose: `Payment` (schema.prisma) has no
 * `updatedAt` column, only `createdAt` — `paidAt` already tracks the one
 * meaningful "when did this change" moment for a payment.
 */
export interface PaymentDto {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: string;
  transactionRef: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface InitiatePaymentPayload {
  orderId: string;
  method: PaymentMethod;
}

// ============================================================
// Angaly Pattern Studio — tailles standard
// ============================================================

export * from './size-charts';
