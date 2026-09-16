'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Red confirm button for destructive actions (e.g. delete) — default variant otherwise. */
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  isConfirming?: boolean;
}

/**
 * Generic confirm modal built on `@radix-ui/react-dialog` (already a
 * dependency, same primitive as MobileDrawer/MobileSearchOverlay) — gets
 * focus-trap + Escape-to-close + focus-restore-on-close for free, unlike a
 * plain `window.confirm()`. Used to gate destructive actions (media delete)
 * across the admin CMS.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Annuler',
  variant = 'default',
  onConfirm,
  isConfirming = false,
}: ConfirmDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-angaly-navy/30" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-[70] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-white p-6 shadow-xl"
          onOpenAutoFocus={(event) => {
            // Focus the confirm button by default rather than the first
            // focusable element (usually Cancel), so Enter confirms.
            event.preventDefault();
            document.getElementById('confirm-dialog-confirm-button')?.focus();
          }}
        >
          <DialogPrimitive.Title className="font-serif text-lg text-angaly-navy mb-2">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="text-sm text-angaly-slate mb-6">
            {description}
          </DialogPrimitive.Description>
          <div className="flex justify-end gap-3">
            <DialogPrimitive.Close asChild>
              <Button type="button" variant="secondary" size="sm">
                {cancelLabel}
              </Button>
            </DialogPrimitive.Close>
            <Button
              id="confirm-dialog-confirm-button"
              type="button"
              size="sm"
              disabled={isConfirming}
              onClick={onConfirm}
              className={
                variant === 'destructive' ? 'bg-angaly-error text-white hover:bg-angaly-error/90' : undefined
              }
            >
              {isConfirming ? 'En cours…' : confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
