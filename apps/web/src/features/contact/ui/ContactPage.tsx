'use client';

import { useAteliersForMap } from '../hooks/useAteliersForMap';
import { useContactChannels } from '../hooks/useContactChannels';
import { useContactContent } from '../hooks/useContactContent';
import { ContactAteliersMiniList } from './ContactAteliersMiniList';
import { ContactChannelsColumn } from './ContactChannelsColumn';
import { ContactForm } from './ContactForm';
import { ContactHeader } from './ContactHeader';
import { ContactMap } from './ContactMap';

/**
 * Orchestrates the real Stitch "Contactez-nous" screen — JSX + hooks only. No floating
 * WhatsApp button: the real screen has no FAB at all, WhatsApp is a plain inline link in
 * "Nous joindre" — see docs/pages/contact.md "Points d'attention" for why the doc's
 * original `FloatingWhatsAppButton` plan doesn't apply to this page.
 */
export function ContactPage() {
  const { data: content } = useContactContent();
  const channels = useContactChannels();
  const { ateliers, isLoading } = useAteliersForMap();

  return (
    <>
      <ContactHeader content={content.header} />
      <main className="mx-auto w-full max-w-screen-2xl px-8 py-20">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-24">
          <div className="space-y-16 lg:col-span-5">
            <ContactChannelsColumn channels={channels} />
            {!isLoading && ateliers.length > 0 && <ContactAteliersMiniList ateliers={ateliers} />}
          </div>
          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      </main>
      <ContactMap />
    </>
  );
}
