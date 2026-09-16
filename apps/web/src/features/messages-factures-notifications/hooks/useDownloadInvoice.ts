/**
 * No PDF generation exists server-side for a `Payment` (no `invoiceNumber`,
 * no `Media` relation, no `MediaEntityType` value for a payment receipt —
 * see docs/pages/messages-factures-notifications.md "Points d'attention").
 * This hook intentionally never calls a backend endpoint: it exposes
 * `isAvailable: false` so the UI can render an explicit "à venir" state
 * rather than a fake download.
 */
export const useDownloadInvoice = () => {
  return { isAvailable: false as const };
};
