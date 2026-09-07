import { Facebook, Instagram, Mail, MessageCircle, Phone } from 'lucide-react';

import type { ContactChannels } from '../hooks/useContactChannels';


/** Real screen's "Nous joindre" / "Réseaux" / "Nos horaires" sections. */
export function ContactChannelsColumn({ channels }: { channels: ContactChannels }) {
  return (
    <div className="space-y-16">
      <section>
        <h2 className="font-heading mb-8 border-b border-angaly-border pb-4 text-2xl tracking-widest text-angaly-royal-navy uppercase">
          Nous joindre
        </h2>
        <ul className="space-y-8">
          <li className="group flex items-start">
            <Phone className="mt-1 mr-4 h-5 w-5 text-angaly-soft-navy transition-colors group-hover:text-angaly-gold" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <p className="mb-1 text-sm tracking-wider text-angaly-slate uppercase">Téléphone</p>
              <a href={channels.phone.href} className="font-heading text-xl text-angaly-navy transition-colors hover:text-angaly-gold">
                {channels.phone.label}
              </a>
            </div>
          </li>
          <li className="group flex items-start">
            <MessageCircle className="mt-1 mr-4 h-5 w-5 text-angaly-soft-navy transition-colors group-hover:text-angaly-gold" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <p className="mb-1 text-sm tracking-wider text-angaly-slate uppercase">WhatsApp</p>
              <a
                href={channels.whatsapp.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center justify-center border border-angaly-navy px-4 py-1 text-sm tracking-widest text-angaly-navy uppercase transition-all duration-300 hover:bg-angaly-navy hover:text-white"
              >
                Message WhatsApp
              </a>
            </div>
          </li>
          <li className="group flex items-start">
            <Mail className="mt-1 mr-4 h-5 w-5 text-angaly-soft-navy transition-colors group-hover:text-angaly-gold" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <p className="mb-1 text-sm tracking-wider text-angaly-slate uppercase">Email</p>
              <a href={channels.email.href} className="text-lg text-angaly-navy transition-colors hover:text-angaly-gold">
                {channels.email.label}
              </a>
            </div>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading mb-8 border-b border-angaly-border pb-4 text-2xl tracking-widest text-angaly-royal-navy uppercase">
          Réseaux
        </h2>
        <div className="flex space-x-8">
          {channels.socials.map((social) => {
            const Icon = social.label === 'Instagram' ? Instagram : Facebook;
            return (
              <a key={social.label} href={social.href} className="group flex flex-col items-center">
                <Icon className="h-7 w-7 text-angaly-soft-navy transition-colors group-hover:text-angaly-gold" strokeWidth={1.5} aria-hidden="true" />
                <span className="mt-2 text-xs tracking-widest text-angaly-slate uppercase transition-colors group-hover:text-angaly-navy">
                  {social.label}
                </span>
              </a>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-heading mb-6 border-b border-angaly-border pb-4 text-2xl tracking-widest text-angaly-royal-navy uppercase">
          Nos horaires
        </h2>
        <ul className="space-y-2 text-sm text-angaly-slate">
          {channels.hours.map((row, index) => (
            <li
              key={row.label}
              className={`flex justify-between py-2 ${index < channels.hours.length - 1 ? 'border-b border-angaly-border/30' : ''} ${
                row.isClosed ? 'text-angaly-warm-gray italic' : ''
              }`}
            >
              <span>{row.label}</span>
              <span>{row.value}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
