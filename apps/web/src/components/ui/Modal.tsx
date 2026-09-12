'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

export function Modal({ children }: { children: ReactNode }) {
  const router = useRouter();

  function handleOpenChange(open: boolean) {
    if (!open) {
      router.back();
    }
  }

  return (
    <DialogPrimitive.Root open onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-angaly-navy/80 backdrop-blur-sm transition-all" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-angaly-border bg-angaly-ivory p-6 shadow-xl duration-200 sm:rounded-lg sm:p-10">
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-angaly-navy focus:ring-offset-2 disabled:pointer-events-none text-angaly-slate hover:text-angaly-navy">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
