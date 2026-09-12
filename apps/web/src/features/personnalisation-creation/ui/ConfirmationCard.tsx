import React from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import type { CreationDto } from '@angaly/types';
import type { CustomizationOptions } from '../schemas/customization-options.schema';

interface ConfirmationCardProps {
  creation: CreationDto;
  options: CustomizationOptions;
  previews: { id: string; url: string; file: File }[];
  draftId?: string | undefined;
}

export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({ creation, options, previews, draftId }) => {
  const selectedKeys = Object.entries(options)
    .filter(([key, val]) => val && key !== 'notes' && key !== 'detailsDecoratifs')
    .map(([_, val]) => val as string);

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 md:p-12 border border-border shadow-sm rounded-lg text-center mt-10 mb-20">
      <div className="flex justify-center mb-6">
        <CheckCircle2 className="text-[#C5B190]" size={64} />
      </div>
      <h1 className="font-serif text-3xl text-primary-deep-navy mb-4">Votre dossier de conception a été créé</h1>
      <p className="text-slate mb-8 max-w-lg mx-auto">
        Votre configuration pour la <strong>{creation.name}</strong> a été enregistrée avec succès. Vous pouvez maintenant prendre rendez-vous pour affiner ces choix avec notre équipe.
      </p>

      <div className="bg-ivory p-6 rounded-md mb-8 text-left border border-border">
        <h3 className="font-serif text-xl text-primary-deep-navy mb-4">Récapitulatif</h3>
        
        {selectedKeys.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedKeys.map((tag) => (
              <span key={tag} className="text-xs bg-white border border-border px-3 py-1 rounded-full text-primary-deep-navy">
                {tag}
              </span>
            ))}
          </div>
        )}

        {previews.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-primary-deep-navy mb-2">Photos d'inspiration jointes :</p>
            <div className="flex gap-2">
              {previews.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p.id} src={p.url} alt="Inspiration" className="w-16 h-16 object-cover rounded border border-border" />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link
          href={`/creations`}
          className="px-6 py-3 border border-primary-deep-navy text-primary-deep-navy font-medium rounded-full hover:bg-primary-deep-navy hover:text-white transition-colors"
        >
          Retour à mes créations
        </Link>
        <Link
          href={`/prendre-rendez-vous${draftId ? `?designBriefId=${draftId}` : ''}`}
          className="px-8 py-3 bg-primary-deep-navy text-white font-medium rounded-full hover:bg-primary-dark transition-colors"
        >
          Prendre rendez-vous
        </Link>
      </div>
    </div>
  );
};
