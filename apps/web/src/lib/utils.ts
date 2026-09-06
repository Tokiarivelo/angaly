import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes safely, resolving conflicts.
 * This is the standard utility used by shadcn/ui components.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a date the way the public site should (spec is French-first, §69). */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(new Date(date));
}

/** Format a price in Ariary — spec pricing examples use "890 000 Ar". */
export function formatPriceAriary(amount: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(amount)} Ar`;
}

/** Truncate a string to a max length with an ellipsis (card excerpts, previews). */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}
