import { CheckCircle2 } from 'lucide-react';

/** Real screen's "Services Disponibles": 2-col checklist, a lone trailing item spans both columns. */
export function AtelierServicesList({ services }: { services: string[] }) {
  if (services.length === 0) return null;

  return (
    <div>
      <h3 className="font-heading mb-4 text-2xl text-angaly-navy">Services Disponibles</h3>
      <ul className="grid grid-cols-1 gap-4 text-sm text-angaly-navy sm:grid-cols-2">
        {services.map((service, index) => (
          <li
            key={service}
            className={`flex items-center gap-3 ${
              index === services.length - 1 && services.length % 2 !== 0 ? 'sm:col-span-2' : ''
            }`}
          >
            <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-angaly-champagne" strokeWidth={1.5} aria-hidden="true" />
            <span>{service}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
