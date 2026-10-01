import React from 'react';
import { FolderOpen } from 'lucide-react';

interface EmptyCreationProjectsStateProps {
  message?: string;
  subtitle?: string;
}

export const EmptyCreationProjectsState: React.FC<EmptyCreationProjectsStateProps> = ({
  message = 'Aucun projet de création pour cette étape.',
  subtitle = 'Veuillez sélectionner un autre filtre ou créer un nouveau projet sur mesure.',
}) => {
  return (
    <div className="p-16 text-center">
      <div className="flex justify-center mb-3">
        <FolderOpen size={40} className="text-[#8A877F] stroke-[1.5]" />
      </div>
      <p className="font-headline text-[#061938] text-base mb-1 font-semibold">{message}</p>
      <p className="text-xs text-[#5C697A]">{subtitle}</p>
    </div>
  );
};
