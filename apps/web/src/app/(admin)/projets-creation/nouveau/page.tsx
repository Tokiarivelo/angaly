import type { Metadata } from 'next';
import { AdminNewCreationProjectPage } from '@/features/admin-projets-creation';

export const metadata: Metadata = {
  title: 'Nouveau projet sur mesure | Administration ANGALY',
  description: "Ouvrez un dossier de création pour une cliente et lancez le suivi de l'atelier.",
};

export default function Page() {
  return <AdminNewCreationProjectPage />;
}
