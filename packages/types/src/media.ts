// ANGALY — Media upload constraints shared between admin-mediatheque (apps/web)
// and the `media` module (apps/api) — see docs/pages/admin-mediatheque.md.

/** 20 Mo, per the admin-mediatheque UI copy ("JPG, PNG, WebP, MP4 — 20 Mo max"). */
export const MAX_MEDIA_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;

export const ACCEPTED_MEDIA_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'] as const;

export type AcceptedMediaMimeType = (typeof ACCEPTED_MEDIA_MIME_TYPES)[number];
