import { ConfirmationRendezVousPage } from '@/features/confirmation-rendez-vous';

export default async function Page({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return <ConfirmationRendezVousPage reference={reference} />;
}
